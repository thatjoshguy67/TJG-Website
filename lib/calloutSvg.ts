// SVG icons may contain geometry, never scripts, external resources, or animation.
export const iconTags = ['svg', 'g', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'clipPath', 'mask'];
const shapeAttributes = ['fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity', 'stroke-opacity', 'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'id', 'clip-path', 'mask', 'width', 'height'];
export const iconAttributes = Object.fromEntries(iconTags.map(tag => [tag, tag === 'svg'
  ? [...shapeAttributes, 'xmlns', 'viewBox', 'aria-hidden', 'focusable']
  : [...shapeAttributes, 'clipPathUnits', 'maskUnits']]));

export function filterIconAttributes(tagName: string, attributes: Record<string, string>): Record<string, string> {
  const safe = Object.fromEntries(Object.entries(attributes).filter(([name, value]) =>
    iconAttributes[tagName]?.includes(name)
    && (name === 'xmlns' || !/(?:javascript|data|https?|file):/i.test(value))
    && (!/url\s*\(/i.test(value) || /^url\(#[\w-]+\)$/.test(value))));
  return tagName === 'svg' ? { ...safe, width: '24', height: '24', 'aria-hidden': 'true', focusable: 'false' } : safe;
}
