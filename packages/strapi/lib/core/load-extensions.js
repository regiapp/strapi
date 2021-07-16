'use strict';

const path = require('path');
const { existsSync } = require('fs-extra');
const fse = require('fs-extra');
const _ = require('lodash');
const loadConfig = require('../load/load-config-files');
const loadFiles = require('../load/load-files');
const glob = require('../load/glob');
const filePathToPath = require('../load/filepath-to-prop-path');
const getSupportedFileExtensions = require('../utils/getSupportedFileExtensions');

/**
 * Loads the extensions folder
 */
module.exports = async function({ appPath, ...config }) {
  const extensionsDir = path.resolve(appPath, 'extensions');
  const fileExtensions = getSupportedFileExtensions(config);
  if (!existsSync(extensionsDir)) {
    throw new Error(`Missing extensions folder. Please create one in your app root directory`);
  }

  const configs = await loadConfig(extensionsDir, `*/config/**/*.+(${fileExtensions})`);
  const controllersAndServices = await loadFiles(
    extensionsDir,
    `*/{controllers,services}/*.+(${fileExtensions})`
  );

  const overwrites = await loadOverwrites(extensionsDir);

  return {
    overwrites,
    merges: _.merge({}, configs, controllersAndServices),
  };
};

const OVERWRITABLE_FOLDERS_GLOB = 'models';
// returns a list of path and module to overwrite
const loadOverwrites = async (extensionsDir, fileExtensions) => {
  const files = await glob(`*/${OVERWRITABLE_FOLDERS_GLOB}/*.*(${fileExtensions})`, {
    cwd: extensionsDir,
  });

  const overwrites = {};
  files.forEach(file => {
    const absolutePath = path.resolve(extensionsDir, file);

    // load module
    delete require.cache[absolutePath];
    let mod;

    if (path.extname(absolutePath) === '.json') {
      mod = fse.readJsonSync(absolutePath);
    } else {
      mod = require(absolutePath);
    }

    const propPath = filePathToPath(file);
    const strPath = propPath.join('.');

    if (overwrites[strPath]) {
      _.merge(overwrites[strPath], mod);
    } else {
      overwrites[strPath] = mod;
    }
  });

  return Object.keys(overwrites).map(strPath => ({
    path: strPath.split('.'),
    mod: overwrites[strPath],
  }));
};
