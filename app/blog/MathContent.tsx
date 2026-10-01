'use client';

import { useRef, type ReactNode } from 'react';
import { useBlogMath } from './useBlogMath';

export default function MathContent({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useBlogMath(ref, children);
  return <div ref={ref} className="body-text portable-text">{children}</div>;
}
