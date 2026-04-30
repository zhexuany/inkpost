import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Node, Data } from 'mdast';

interface HasPosition {
  position?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
  };
}

const BLOCK_NODES = new Set([
  'heading',
  'paragraph',
  'blockquote',
  'list',
  'listItem',
  'code',
  'thematicBreak',
  'table',
  'tableRow',
  'tableCell',
  'html',
  'definition',
  'footnoteDefinition',
]);

function isBlockNode(node: Node): node is Node & HasPosition {
  return BLOCK_NODES.has(node.type);
}

const remarkSourcePosition: Plugin<[], Node> = function () {
  return (tree) => {
    visit(tree, (node: Node) => {
      if (!isBlockNode(node)) return;
      const pos = (node as Node & HasPosition).position;
      if (!pos) return;

      const data = (node.data || (node.data = {} as Data)) as Record<string, unknown>;
      data.hProperties = {
        ...((data.hProperties as Record<string, unknown>) || {}),
        'data-source-start': pos.start.line,
        'data-source-end': pos.end.line,
        'data-source-start-offset': pos.start.offset,
        'data-source-end-offset': pos.end.offset,
      };
    });
  };
};

export default remarkSourcePosition;
