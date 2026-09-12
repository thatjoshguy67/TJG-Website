import { useId } from 'react';

const layers = [
  { theme: 'light', position: 'left', width: 1637, height: 1603, rx: 318.5, ry: 301.5, color: '#C6E0FF', blur: 250 },
  { theme: 'light', position: 'center', width: 1637, height: 1603, rx: 318.5, ry: 301.5, color: '#C6F4FF', blur: 250 },
  { theme: 'light', position: 'right', width: 1624, height: 1716, rx: 312, ry: 358, color: '#9EE1F8', blur: 250 },
  { theme: 'dark', position: 'left', width: 1777, height: 1743, rx: 318.5, ry: 301.5, color: '#184172', blur: 285 },
  { theme: 'dark', position: 'center', width: 1777, height: 1743, rx: 318.5, ry: 301.5, color: '#095060', blur: 285 },
  { theme: 'dark', position: 'right', width: 1764, height: 1856, rx: 312, ry: 358, color: '#1E4958', blur: 285 },
];

/** The original mesh geometry, inline so its reveal never waits for image requests. */
export default function HomeMesh() {
  const id = useId();
  return (
    <div className="hero-mesh" aria-hidden="true">
      {layers.map(layer => {
        const filterId = `${id}-${layer.theme}-${layer.position}`;
        return (
          <svg key={filterId} className={`hero-mesh-layer hero-mesh-${layer.theme} hero-mesh-${layer.theme}-${layer.position}`}
            width={layer.width} height={layer.height} viewBox={`0 0 ${layer.width} ${layer.height}`}
            preserveAspectRatio="none" overflow="visible" fill="none" focusable="false">
            <ellipse cx={layer.width / 2} cy={layer.height / 2} rx={layer.rx} ry={layer.ry} fill={layer.color} filter={`url(#${filterId})`} />
            <defs>
              <filter id={filterId} x="0" y="0" width={layer.width} height={layer.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation={layer.blur} />
              </filter>
            </defs>
          </svg>
        );
      })}
    </div>
  );
}
