import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Node } from 'mdast';

export type MathRenderer = (latex: string, display: boolean) => Promise<string>;

const remarkMathToSvg: Plugin<[MathRenderer], Node> = function (renderMath: MathRenderer) {
  return async (tree: Node) => {
    const mathNodes: { node: any; index: number; parent: any }[] = [];

    visit(tree, (node: any, index: number | undefined, parent: any | undefined) => {
      if ((node.type === 'math' || node.type === 'inlineMath') && index !== undefined && parent) {
        mathNodes.push({ node, index, parent });
      }
    });

    mathNodes.reverse();
    for (const { node, index, parent } of mathNodes) {
      const isBlock = node.type === 'math';
      const latex: string = node.value || '';

      try {
        const svg = await renderMath(latex, isBlock);
        const escapedLatex = latex.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
        const pos = node.position;
        const dataAttrs = pos
          ? ` data-source-start="${pos.start.line}" data-source-end="${pos.end.line}"`
          : '';

        if (isBlock) {
          parent.children[index] = {
            type: 'html',
            value: `<span class="span-block-equation" style="cursor:pointer"${dataAttrs}><section class="block-equation" data-formula="${escapedLatex}" style="text-align:center;overflow-x:auto;overflow-y:auto;display:block;">${svg}</section></span>`,
          } as Node;
        } else {
          parent.children[index] = {
            type: 'html',
            value: `<span class="span-inline-equation" style="cursor:pointer" data-formula="${escapedLatex}"${dataAttrs}>${svg}</span>`,
          } as Node;
        }
      } catch {
        const escaped = latex.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        parent.children[index] = {
          type: 'html',
          value: isBlock ? `<pre>${escaped}</pre>` : `<code>${escaped}</code>`,
        } as Node;
      }
    }
  };
};

export default remarkMathToSvg;
