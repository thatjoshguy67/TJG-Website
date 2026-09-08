"use client";

import useKeyboardHints from "./useKeyboardHints";

import { useEffect, useState } from "react";

export default function SearchShortcutChip({ focused = false }: { focused?: boolean }) {
  const showHints = useKeyboardHints();
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);
  if (!showHints) return null;
  // Anchor the smooth border to the chip, even when sibling controls move it.
  return <span className="search-shortcut-anchor"><kbd className="keyboard-shortcut-chip" title={focused ? "Exit search focus" : "Focus search"} aria-label={focused ? "Escape to exit search focus" : mac ? "Command K to search" : "Control K to search"}>{focused ? "Esc" : mac ? "⌘ K" : "Ctrl K"}</kbd></span>;
}
