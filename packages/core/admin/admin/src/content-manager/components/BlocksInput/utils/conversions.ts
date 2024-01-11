import * as React from 'react';

import { type Element, type Path, Editor, Transforms } from 'slate';

/**
 * Extracts some logic that is common to most blocks' handleConvert functions.
 * @returns The path of the converted block
 */
const baseHandleConvert = <T extends Element>(
  editor: Editor,
  attributesToSet: Partial<T> & { type: T['type'] }
): void | Path => {
  // Make sure we get a block node, not an inline node
  const entry = Editor.above(editor, {
    match: (node) => !Editor.isEditor(node) && node.type !== 'text' && node.type !== 'link',
  });

  if (!entry || Editor.isEditor(entry[0])) {
    return;
  }

  const [element, elementPath] = entry;

  Transforms.setNodes(
    editor,
    {
      ...getAttributesToClear(element),
      ...attributesToSet,
    } as Partial<Element>,
    { at: elementPath }
  );

  return elementPath;
};

/**
 * Set all attributes except type and children to null so that Slate deletes them
 */
const getAttributesToClear = (element: Element) => {
  const { children: _children, type: _type, ...extra } = element;

  const attributesToClear = Object.keys(extra).reduce(
    (currentAttributes, key) => ({ ...currentAttributes, [key]: null }),
    {}
  );

  return attributesToClear as Record<string, null>;
};

export { baseHandleConvert, getAttributesToClear };
