'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import useKeyboardHints from './useKeyboardHints';
import { createPortal } from 'react-dom';

const SURFACE_INSET = 8;
const CORNER_RADIUS = 20;
const TIP_SIZE = 7;

function surfacePath(width: number, height: number, arrow: number, placement: 'top' | 'right') {
  const x = SURFACE_INSET;
  const right = x + width;
  const bottom = x + height;
  const radius = Math.min(CORNER_RADIUS, width / 2, height / 2);
  const tip = x + arrow;
  return [
    `M ${x + radius} ${x} H ${right - radius} A ${radius} ${radius} 0 0 1 ${right} ${x + radius}`,
    `V ${bottom - radius} A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    placement === 'top' ? `H ${tip + TIP_SIZE} L ${tip} ${bottom + TIP_SIZE} L ${tip - TIP_SIZE} ${bottom}` : '',
    `H ${x + radius} A ${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
    placement === 'right' ? `V ${tip + TIP_SIZE} L ${x - TIP_SIZE} ${tip} L ${x} ${tip - TIP_SIZE}` : '',
    `V ${x + radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${x} Z`,
  ].join(' ');
}

export default function ShortcutPopover({ title, content, placement = 'top', keyboardOnly = true, children }: {
  title: ReactNode;
  content: ReactNode;
  placement?: 'top' | 'right';
  keyboardOnly?: boolean;
  children: (descriptionId: string | undefined) => ReactNode;
}) {
  const showHints = useKeyboardHints();
  const enabled = !keyboardOnly || showHints;
  const id = useId();
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; arrow: number; width: number; height: number } | null>(null);
  const cancelClose = () => { if (timer.current) clearTimeout(timer.current); };
  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    setClosing(true);
    exitTimer.current = setTimeout(() => setOpen(false), 140);
  }, []);
  const show = () => {
    cancelClose();
    if (exitTimer.current) clearTimeout(exitTimer.current);
    if (enabled) { setClosing(false); setOpen(true); }
  };
  const close = () => { cancelClose(); timer.current = setTimeout(dismiss, 120); };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);
  useLayoutEffect(() => {
    if (!open || !enabled) return;
    const update = () => {
      const trigger = anchor.current?.firstElementChild;
      if (!trigger || !panel.current) return;
      const rect = trigger.getBoundingClientRect();
      const box = panel.current.getBoundingClientRect();
      const left = Math.max(12, Math.min(window.innerWidth - box.width - 12,
        placement === 'right' ? rect.right + 12 : rect.left + rect.width / 2 - box.width / 2));
      const top = Math.max(12, Math.min(window.innerHeight - box.height - 12,
        placement === 'right' ? rect.top + rect.height / 2 - box.height / 2 : rect.top - box.height - 12));
      const edgeInset = CORNER_RADIUS + TIP_SIZE;
      setPosition({ left, top, width: box.width, height: box.height, arrow: placement === 'right'
        ? Math.max(edgeInset, Math.min(box.height - edgeInset, rect.top + rect.height / 2 - top))
        : Math.max(edgeInset, Math.min(box.width - edgeInset, rect.left + rect.width / 2 - left)) });
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    update();
    const resize = new ResizeObserver(update);
    if (panel.current) resize.observe(panel.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, placement, enabled, dismiss]);

  const outline = position ? surfacePath(position.width, position.height, position.arrow, placement) : '';

  return <div ref={anchor} className="shortcut-popover-anchor"
    onMouseEnter={show} onMouseLeave={close} onFocus={show} onBlur={close}
    onClickCapture={dismiss}>
    {children(open && enabled && !closing ? id : undefined)}
    {open && enabled && createPortal(<div ref={panel} id={id} role="tooltip"
      aria-hidden={closing || undefined}
      className={`shortcut-popover shortcut-popover--${placement}${closing ? ' shortcut-popover--closing' : ''}`}
      style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}
      onMouseEnter={show} onMouseLeave={close}>
      {position && <div className="shortcut-popover-surface" aria-hidden="true">
        <div className="shortcut-popover-fill" style={{ clipPath: `path('${outline}')` }} />
        <svg width="100%" height="100%" className="shortcut-popover-outline">
          <path d={outline} />
        </svg>
      </div>}
      <strong className="shortcut-popover-title">{title}</strong>
      <div className="shortcut-popover-content">{content}</div>
    </div>, document.body)}
  </div>;
}
