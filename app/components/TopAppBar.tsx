"use client";

import { Back, Settings } from "@thatjoshguy/oneui-icons";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const SCROLL_RANGE = 530;
const PULL_EXPAND_DISTANCE = 130;
const COLLAPSED_HERO_HEIGHT = 48;
const EXPANDED_HERO_VIEWPORT_HEIGHT = 25;
const COLLAPSED_HERO_PADDING_TOP = 0;
const EXPANDED_HERO_PADDING_TOP = 0;

interface TopAppBarProps {
  /** Omit on Home, where the page hero already provides the identity. */
  title?: string;
  /** Adds the standard leading back button. */
  backHref?: string;
  /** Controls placed at the trailing edge, such as contents and refresh. */
  actions?: ReactNode;
  /** Start collapsed and allow a pull-down gesture to reveal the large title. */
  defaultCollapsed?: boolean;
  /** Use an existing hero as the expanded heading and reveal the bar title after it scrolls away. */
  collapseTarget?: string;
  /** Hide only the collapsed bar title on mobile while retaining the expanded page heading. */
  hideBarTitleOnMobile?: boolean;
  /** Restore the mobile-only Settings entry point without adding an empty desktop action. */
  mobileSettingsHref?: string;
}

function ScrollingBarTitle({ title, hidden, opacity, hideOnMobile }: {
  title: string; hidden: boolean; opacity: number; hideOnMobile: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    const update = () => {
      if (viewport.current && text.current) {
        setOverflow(Math.max(0, text.current.scrollWidth - viewport.current.clientWidth));
      }
    };
    const observer = new ResizeObserver(update);
    if (viewport.current) observer.observe(viewport.current);
    if (text.current) observer.observe(text.current);
    update();
    return () => observer.disconnect();
  }, [title]);
  return <div ref={viewport}
    className={`top-app-bar-title${hideOnMobile ? ' top-app-bar-title--mobile-hidden' : ''}`}
    aria-hidden={hidden} data-overflow={overflow > 1}
    style={{ opacity, '--title-travel': `${-overflow}px`, '--title-duration': `${Math.max(8, overflow / 22 + 4)}s` } as CSSProperties}>
    <span ref={text} className="top-app-bar-title-text" key={title}
      style={{ animationPlayState: hidden ? 'paused' : 'running' }}>{title}</span>
  </div>;
}

export default function TopAppBar({
  title,
  backHref,
  actions,
  defaultCollapsed = false,
  collapseTarget,
  hideBarTitleOnMobile = false,
  mobileSettingsHref,
}: TopAppBarProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const touchStartY = useRef(0);
  const pullProgressRef = useRef(0);
  const isPullingRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(defaultCollapsed ? 1 : 0);
  const [headingReveal, setHeadingReveal] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullExpanded, setPullExpanded] = useState(false);
  const [barLayout, setBarLayout] = useState({
    left: 20,
    right: 20,
    paddingLeft: 20,
    paddingRight: 20,
  });

  useLayoutEffect(() => {
    setMounted(true);

    const mainContent = anchorRef.current?.closest<HTMLElement>(".main-content");
    if (!mainContent) return;

    let frame = 0;
    const updateInsets = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = mainContent.getBoundingClientRect();
        const styles = window.getComputedStyle(mainContent);
        const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
        const overlaysPageHero = Boolean(collapseTarget && progress < 1);
        const left = rect.left + (overlaysPageHero ? paddingLeft : 0);
        const right = window.innerWidth - rect.right + (overlaysPageHero ? paddingRight : 0);

        const nextLayout = {
          left: Math.max(0, left),
          right: Math.max(0, right),
          paddingLeft: overlaysPageHero ? 10 : paddingLeft,
          paddingRight: overlaysPageHero ? 10 : paddingRight,
        };
        setBarLayout((current) => (
          Math.abs(current.left - nextLayout.left) < 0.5 &&
          Math.abs(current.right - nextLayout.right) < 0.5 &&
          Math.abs(current.paddingLeft - nextLayout.paddingLeft) < 0.5 &&
          Math.abs(current.paddingRight - nextLayout.paddingRight) < 0.5
            ? current
            : nextLayout
        ));
      });
    };

    const resizeObserver = new ResizeObserver(updateInsets);
    const bodyObserver = new MutationObserver(updateInsets);
    resizeObserver.observe(mainContent);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", updateInsets, { passive: true });
    updateInsets();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      bodyObserver.disconnect();
      window.removeEventListener("resize", updateInsets);
    };
  }, [collapseTarget, progress]);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (collapseTarget) {
          const target = document.querySelector(collapseTarget);
          setProgress(target && target.getBoundingClientRect().bottom > 0 ? 0 : 1);
          return;
        }

        const scrollProgress = Math.min(1, Math.max(0, window.scrollY / SCROLL_RANGE));
        setProgress(defaultCollapsed && !pullExpanded ? 1 : scrollProgress);

        if (!defaultCollapsed && heroTitleRef.current) {
          const heading = heroTitleRef.current.getBoundingClientRect();
          const blur = document.querySelector('.progressive-blur-overlay--top');
          const bar = document.querySelector('.top-app-bar');
          const boundary = blur && window.getComputedStyle(blur).display !== 'none'
            ? blur.getBoundingClientRect().bottom
            : bar?.getBoundingClientRect().bottom ?? 0;
          // Crossfade while the actual heading enters the top overlay, rather
          // than waiting for a fixed scroll distance on every viewport.
          setHeadingReveal(Math.min(1, Math.max(0,
            (boundary - heading.top) / Math.max(1, heading.height),
          )));
        }

        if (defaultCollapsed && window.scrollY > 8 && pullExpanded) {
          setPullExpanded(false);
        }
      });
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    const observer = new ResizeObserver(updateProgress);
    if (heroTitleRef.current) observer.observe(heroTitleRef.current);
    updateProgress();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      observer.disconnect();
    };
  }, [collapseTarget, defaultCollapsed, pullExpanded]);

  useEffect(() => {
    if (!defaultCollapsed || collapseTarget) return;

    function onTouchStart(event: TouchEvent) {
      if (window.scrollY > 0) return;
      touchStartY.current = event.touches[0]?.clientY ?? 0;
      pullProgressRef.current = 0;
      isPullingRef.current = true;
    }

    function onTouchMove(event: TouchEvent) {
      if (!isPullingRef.current || window.scrollY > 0) return;

      const currentY = event.touches[0]?.clientY ?? touchStartY.current;
      const deltaY = Math.max(0, currentY - touchStartY.current);
      if (deltaY <= 0) return;

      event.preventDefault();
      const nextPullProgress = Math.min(1, deltaY / PULL_EXPAND_DISTANCE);
      pullProgressRef.current = nextPullProgress;
      setPullProgress(nextPullProgress);
      setProgress(1 - nextPullProgress);
    }

    function onTouchEnd() {
      if (!isPullingRef.current) return;

      const shouldExpand = pullProgressRef.current >= 0.55;
      setPullExpanded(shouldExpand);
      setPullProgress(0);
      setProgress(shouldExpand ? 0 : 1);
      pullProgressRef.current = 0;
      isPullingRef.current = false;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [collapseTarget, defaultCollapsed]);

  const usesHeadingPosition = !defaultCollapsed && !collapseTarget;
  const heroOpacity = usesHeadingPosition ? 1 - headingReveal : Math.max(0, 1 - progress / 0.7);
  const titleOpacity = usesHeadingPosition ? headingReveal : Math.min(1, Math.max(0, (progress - 0.4) / 0.4));
  const titleHidden = titleOpacity < 0.1;
  const expandProgress = 1 - progress;
  const heroStyle: CSSProperties | undefined = defaultCollapsed
    ? {
        minHeight: `calc(${COLLAPSED_HERO_HEIGHT * progress}px + max(${EXPANDED_HERO_VIEWPORT_HEIGHT * expandProgress}vh, calc(var(--top-app-bar-expanded-min-height) * ${expandProgress})))`,
        paddingTop: COLLAPSED_HERO_PADDING_TOP + (EXPANDED_HERO_PADDING_TOP - COLLAPSED_HERO_PADDING_TOP) * expandProgress,
        transition: pullProgress > 0
          ? "none"
          : "min-height 0.26s cubic-bezier(0.2, 0.9, 0.3, 1), padding-top 0.26s cubic-bezier(0.2, 0.9, 0.3, 1)",
      }
    : undefined;

  const hasBarContent = Boolean(title || backHref || actions || mobileSettingsHref);
  const hasDesktopButtons = Boolean(backHref || actions);
  const hasMobileButtons = Boolean(backHref || actions || mobileSettingsHref);
  const hasDesktopHeading = Boolean(title);
  const hasMobileHeading = Boolean(title);

  return (
    <>
      <span
        ref={anchorRef}
        className="top-app-bar-anchor"
        data-desktop-buttons={hasDesktopButtons ? "" : undefined}
        data-mobile-buttons={hasMobileButtons ? "" : undefined}
        data-desktop-heading={hasDesktopHeading ? "" : undefined}
        data-mobile-heading={hasMobileHeading ? "" : undefined}
        aria-hidden="true"
      />

      {title && !collapseTarget && (
        <div className="top-app-bar-hero" style={heroStyle}>
          <h1 ref={heroTitleRef} className="top-app-bar-hero-title" style={{ opacity: heroOpacity }}>
            {title}
          </h1>
        </div>
      )}

      {mounted && hasBarContent && createPortal(
        <div
          className="top-app-bar"
          role="navigation"
          aria-label="Page controls"
          style={{
            "--top-app-bar-left": `${barLayout.left}px`,
            "--top-app-bar-right": `${barLayout.right}px`,
            "--top-app-bar-padding-left": `${barLayout.paddingLeft}px`,
            "--top-app-bar-padding-right": `${barLayout.paddingRight}px`,
          } as CSSProperties}
        >
          <div className="top-app-bar-container">
            {backHref && (
              <Link href={backHref} className="top-app-bar-icon" aria-label="Back" title="Back">
                <Back color="var(--primary)" />
              </Link>
            )}

            {title && (
              <ScrollingBarTitle title={title} hidden={titleHidden} opacity={titleOpacity}
                hideOnMobile={hideBarTitleOnMobile} />
            )}

            {(actions || mobileSettingsHref) && (
              <div className="top-app-bar-actions">
                {actions}
                {mobileSettingsHref && (
                  <Link
                    href={mobileSettingsHref}
                    className="top-app-bar-icon top-app-bar-settings"
                    aria-label="Settings"
                    title="Open settings"
                  >
                    <Settings size={24} color="var(--primary)" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
