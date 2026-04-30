import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

const SOURCE_ATTRS = new Set([
  'data-source-start',
  'data-source-end',
  'data-source-start-offset',
  'data-source-end-offset',
]);

/**
 * rehype plugin that ensures data-source-* attributes land on the correct
 * block-level HTML elements.
 *
 * remarkSourcePosition sets hProperties on mdast nodes, but after remarkRehype
 * conversion some attributes end up on inline descendants (e.g. <code> inside
 * <pre>).  This plugin lifts those attributes to the appropriate block wrapper.
 */
const rehypeSourcePosition: Plugin<[], Root> = function () {
  return (tree) => {
    visit(tree, 'element', (node: Element) => {
      // Lift data-source-* from <code> up to parent <pre> for code blocks
      if (node.tagName === 'pre' && node.children.length > 0) {
        const code = node.children.find(
          (c): c is Element => c.type === 'element' && c.tagName === 'code',
        );
        if (code?.properties) {
          for (const key of SOURCE_ATTRS) {
            if (key in code.properties) {
              node.properties ??= {};
              node.properties[key] = code.properties[key];
              delete code.properties[key];
            }
          }
        }
        return;
      }

      // Ensure <table> gets data-source-* (remarkRehype puts them on child elements)
      if (node.tagName === 'table' && node.properties) {
        visit(node, 'element', (child: Element) => {
          if (child === node) return;
          for (const key of SOURCE_ATTRS) {
            if (child.properties && key in child.properties) {
              node.properties ??= {};
              node.properties[key] = child.properties[key];
              delete child.properties[key];
            }
          }
        });
      }
    });
  };
};

export default rehypeSourcePosition;
