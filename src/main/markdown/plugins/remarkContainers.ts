import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Node } from 'mdast';

const CONTAINER_TYPES = new Set([
  'block-1', 'block-2', 'block-3',
  'info', 'tip', 'warning', 'danger',
  'card-left', 'card-right',
]);

function getClassName(name: string): string {
  if (name.startsWith('card-')) return `card ${name}`;
  return name;
}

const remarkContainers: Plugin<[], Node> = function () {
  return (tree) => {
    visit(tree, (node: any) => {
      if (node.type !== 'containerDirective') return;
      if (!CONTAINER_TYPES.has(node.name)) return;

      node.data.hName = 'section';
      node.data.hProperties = {
        ...((node.data.hProperties as Record<string, unknown>) || {}),
        className: getClassName(node.name),
      };
    });
  };
};

export default remarkContainers;
