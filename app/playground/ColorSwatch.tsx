'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ShortcutPopover from '../components/ShortcutPopover';
import Toast from '../components/Toast';

export default function ColorSwatch({ color, label, detail, active = false, secondaryColor }: {
  color: string;
  label: string;
  detail: string;
  active?: boolean;
  secondaryColor?: string;
}) {
  const surface = useRef<HTMLSpanElement>(null);
  const [hex, setHex] = useState('');
  const [notice, setNotice] = useState('');

  const resolveHex = () => {
    if (!surface.current) return '';
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { colorSpace: 'srgb' });
    if (!context) return '';
    context.fillStyle = getComputedStyle(surface.current).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    const channels = a === 255 ? [r, g, b] : [r, g, b, a];
    const value = `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    setHex(value);
    return value;
  };

  const copy = async () => {
    const value = resolveHex();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`Copied ${value}`);
    } catch {
      setNotice(`Couldn’t copy. Hex code: ${value}`);
    }
  };

  return (
    <>
      <ShortcutPopover keyboardOnly={false}
        title={hex ? <code className="palette-hex-chip">{hex}</code> : label}
        content="Click to copy the hex code">
        {descriptionId => (
          <button type="button" className="palette-swatch" aria-label={`Copy ${label} colour`} aria-describedby={descriptionId} onMouseEnter={resolveHex} onFocus={resolveHex} onClick={copy}>
            <span ref={surface} className="palette-swatch-color" data-active={active} style={{ backgroundColor: color }}>
              {secondaryColor && <span className="palette-swatch-secondary" style={{ backgroundColor: secondaryColor }} />}
            </span>
            <span className="palette-swatch-label">{label}</span>
            <span className="palette-swatch-detail">{detail}</span>
          </button>
        )}
      </ShortcutPopover>
      {notice && createPortal(<Toast message={notice} onClose={() => setNotice('')} />, document.body)}
    </>
  );
}
