"use client";

import { More, Selected, Copy, Edit } from "@thatjoshguy/oneui-icons";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PostActions.css";
import ForceRefreshButton from "./[slug]/ForceRefreshButton";

import { useReadingPreferences, useFmpCombinedView } from "./useReadingPreferences";
import { FMP_SLUG } from "../../lib/fmpSections";
import { localPreferences } from "../../lib/browserStorage";
import { useTheme } from "../components/ThemeProvider";
import { usePathname, useRouter } from "next/navigation";

export default function PostActions({ slug, postId, preview = false }: { slug: string; postId?: string; preview?: boolean }) {
  const { preferences: savedPreferences, setPreferences: savePreferences, ready } = useReadingPreferences();
  const [previewPreferences, setPreviewPreferences] = useState({ compact: false, focus: false, search: true });
  const preferences = preview ? previewPreferences : savedPreferences;
  const setPreferences = preview ? setPreviewPreferences : savePreferences;
  const { combined, setCombined } = useFmpCombinedView();
  const { fmpSeparatedViewAvailable } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const showingCombined = pathname === `/blog/${slug}` && combined;
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [notice, setNotice] = useState("");
  const [devOptionsEnabled, setDevOptionsEnabled] = useState(false);
  const [position, setPosition] = useState({ top: 80, right: 20 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const checkDevOptions = () => {
      setDevOptionsEnabled(localPreferences.getItem("developer-options-enabled") === "true");
    };
    checkDevOptions();
    window.addEventListener("developer-options-changed", checkDevOptions);
    window.addEventListener("storage", checkDevOptions);
    return () => {
      window.removeEventListener("developer-options-changed", checkDevOptions);
      window.removeEventListener("storage", checkDevOptions);
    };
  }, []);

  useEffect(() => {
    if (open || !present) return;
    // Fallback if the exit animation is interrupted or disabled by the browser.
    const timeout = window.setTimeout(() => setPresent(false), 220);
    return () => window.clearTimeout(timeout);
  }, [open, present]);

  useEffect(() => {
    if (preview) return;
    return () => {
      document.body.classList.remove("post-reading-active", "post-reading-compact", "post-reading-focus", "post-reading-hide-search");
    };
  }, [preview]);

  useEffect(() => {
    if (!ready || preview) return;
    document.body.classList.add("post-reading-active");
    document.body.classList.toggle("post-reading-compact", preferences.compact);
    const desktop = window.matchMedia('(min-width: 700px)');
    const updateFocus = () => document.body.classList.toggle("post-reading-focus", preferences.focus && desktop.matches);
    updateFocus();
    desktop.addEventListener('change', updateFocus);
    document.body.classList.toggle("post-reading-hide-search", !preferences.search);
    window.dispatchEvent(new Event("resize"));
    return () => desktop.removeEventListener('change', updateFocus);
  }, [preferences, ready, preview]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (rect) setPosition({
        top: Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - (menu.current?.offsetHeight ?? 0) - 12)),
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };
    reposition();
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition);
    };
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("Link copied");
    } catch { setNotice("Couldn’t copy the link. Copy the address from your browser."); }
  };

  return (
    <div className="top-app-bar-action-group" role="group" aria-label="Post actions">
      {!preview && <ForceRefreshButton slug={slug} />}
      <button ref={trigger} type="button" className="top-app-bar-icon" aria-label="More post options" title="More post options" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { setNotice(""); setPresent(true); setOpen(!open); }}>
        <More color="var(--primary)" />
      </button>
      {present && createPortal(
        <div ref={menu} id={id} className="post-options-menu" data-state={open ? "open" : "closed"} inert={!open} aria-hidden={!open} onAnimationEnd={event => {
          if (event.target === event.currentTarget && !open) setPresent(false);
        }} role="menu" aria-label="Post options" style={position} onKeyDown={event => {
          const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('button, a[role="menuitem"]') || []).filter(item => item.getClientRects().length > 0);
          const index = items.indexOf(document.activeElement as HTMLElement);
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
          if (event.key === "Tab") setOpen(false);
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
          }
        }}>
          <div className="post-options-label" role="presentation">Reading layout</div>
          <div role="group" aria-label="Reading layout">
            <button role="menuitemradio" aria-checked={!preferences.compact} onClick={() => setPreferences(p => ({ ...p, compact: false }))}>Comfortable <span aria-hidden="true">{!preferences.compact && <Selected size={20} color="var(--primary)" />}</span></button>
            <button role="menuitemradio" aria-checked={preferences.compact} onClick={() => setPreferences(p => ({ ...p, compact: true }))}>Compact <span aria-hidden="true">{preferences.compact && <Selected size={20} color="var(--primary)" />}</span></button>
          </div>
          <div className="post-options-separator" role="separator" />
          <button className="desktop-focus-option" role="menuitemcheckbox" aria-checked={preferences.focus} onClick={() => setPreferences(p => ({ ...p, focus: !p.focus }))}>Focus mode <span className="post-options-switch" aria-hidden="true" data-on={preferences.focus} /></button>
          <button role="menuitemcheckbox" aria-checked={preferences.search} onClick={() => setPreferences(p => ({ ...p, search: !p.search }))}>Show search bar <span className="post-options-switch" aria-hidden="true" data-on={preferences.search} /></button>
          <div className="post-options-separator" role="separator" />
          {!preview && slug === FMP_SLUG && fmpSeparatedViewAvailable && (
            <>
              <button role="menuitemcheckbox" aria-checked={showingCombined} onClick={() => {
                setCombined(!showingCombined);
                if (pathname !== `/blog/${slug}`) router.push(`/blog/${slug}`);
              }}>Combined view <span className="post-options-switch" aria-hidden="true" data-on={showingCombined} /></button>
              <div className="post-options-separator" role="separator" />
            </>
          )}
          <button role="menuitem" onClick={copyLink}><span className="post-options-action-label"><Copy size={20} color="var(--primary)" aria-hidden="true" />Copy link</span></button>
          {!preview && devOptionsEnabled && postId && (
            <a role="menuitem" href={`https://admin.tjg.gg/content/posts/${encodeURIComponent(postId)}`} onClick={() => setOpen(false)}>
              <span className="post-options-action-label"><Edit size={20} color="var(--primary)" aria-hidden="true" />Edit</span>
            </a>
          )}
          <div role="status" className="post-options-status">{notice}</div>
        </div>, document.body,
      )}
    </div>
  );
}
