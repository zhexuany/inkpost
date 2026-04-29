const UNSAFE_PROPERTIES: { prop: string; value?: string; reason: string }[] = [
  { prop: 'display', value: 'flex', reason: 'display:flex 在部分微信版本不支持' },
  { prop: 'display', value: 'grid', reason: 'display:grid 微信不支持' },
  { prop: 'display', value: 'inline-flex', reason: 'display:inline-flex 微信不支持' },
  { prop: 'display', value: 'inline-grid', reason: 'display:inline-grid 微信不支持' },
  { prop: 'position', value: 'fixed', reason: 'position:fixed 微信编辑器会忽略' },
  { prop: 'position', value: 'sticky', reason: 'position:sticky 微信编辑器会忽略' },
  { prop: 'animation', reason: 'animation 动画在微信中不生效' },
  { prop: 'transform', reason: 'transform 在微信中表现不稳定' },
  { prop: 'transition', reason: 'transition 在微信中不生效' },
  { prop: 'float', value: 'right', reason: 'float:right 在微信中布局容易错乱' },
  { prop: 'filter', reason: 'filter 滤镜在微信中不生效' },
  { prop: 'backdrop-filter', reason: 'backdrop-filter 在微信中不生效' },
  { prop: 'clip-path', reason: 'clip-path 在微信中不生效' },
  { prop: 'mask', reason: 'mask 遮罩在微信中不生效' },
  { prop: 'columns', reason: 'columns 多栏布局在微信中不支持' },
  { prop: 'object-fit', reason: 'object-fit 在微信中表现不稳定' },
  { prop: 'writing-mode', value: 'vertical', reason: '竖排文字在微信中不支持' },
];

export interface CSSWarning {
  line: number;
  prop: string;
  value?: string;
  reason: string;
}

export function scanCSS(css: string): CSSWarning[] {
  const warnings: CSSWarning[] = [];
  const lines = css.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;

    // Match property: value patterns
    const match = line.match(/^([\w-]+)\s*:\s*(.+?)(?:\s*;|\s*$)/);
    if (!match) continue;

    const [, prop, value] = match;
    const normalizedProp = prop.toLowerCase().trim();
    const normalizedValue = value.toLowerCase().trim();

    for (const unsafe of UNSAFE_PROPERTIES) {
      if (normalizedProp === unsafe.prop || normalizedProp.startsWith(unsafe.prop + '-')) {
        if (!unsafe.value || normalizedValue.includes(unsafe.value)) {
          warnings.push({
            line: i + 1,
            prop: normalizedProp,
            value: normalizedValue,
            reason: unsafe.reason,
          });
          break;
        }
      }
    }
  }

  return warnings;
}
