import chalk from 'chalk';
import path from 'path';
import ts from 'typescript';

import { Logger } from '../../core/logger';

const printDiagnostic = (
  diagnostic: ts.Diagnostic,
  { logger, cwd }: { logger: Logger; cwd: string }
) => {
  if (diagnostic.file && diagnostic.start) {
    const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine);

    const file = path.relative(cwd, diagnostic.file.fileName);

    const output = [
      `${chalk.cyan(file)}:${chalk.cyan(line + 1)}:${chalk.cyan(character + 1)} - `,
      `${chalk.gray(`TS${diagnostic.code}:`)} ${message}`,
    ].join('');

    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      logger.error(output);
    }

    if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      logger.warn(output);
    }

    if (diagnostic.category === ts.DiagnosticCategory.Message) {
      logger.info(output);
    }

    if (diagnostic.category === ts.DiagnosticCategory.Suggestion) {
      logger.info(output);
    }
  } else {
    logger.info(ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine));
  }
};

export { printDiagnostic };
