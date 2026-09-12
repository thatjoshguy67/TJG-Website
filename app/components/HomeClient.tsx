"use client";
import Image from "next/image";
import Link from "next/link";
import { Location } from '@thatjoshguy/oneui-icons';
import Footer from "./Footer";
import { CarouselContentCard } from "./ContentCards";
import { CSSProperties, ReactElement, ReactNode, RefObject, Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from './ThemeProvider';
import type { FeaturedStory } from "../../lib/featured-stories";
import type { Project } from "../../lib/projects";
import type { RecentBlogPost } from "../../lib/recent-blog-posts";
import type { ProfileFact } from "../../lib/home-profile";

interface StackTool {
  name: string;
  icon: string;
}

interface Publication {
  name: string;
  logo: string | ReactNode;
}

const PUBLICATION_URLS: Record<string, string> = {
  "9to5Google": "https://9to5google.com/",
  "The Verge": "https://www.theverge.com/",
  SammyGuru: "https://sammyguru.com/",
  "Android Authority": "https://www.androidauthority.com/",
  "XDA Developers": "https://www.xda-developers.com/",
  "Android Police": "https://www.androidpolice.com/",
  "Android Headlines": "https://www.androidheadlines.com/",
  SamMobile: "https://www.sammobile.com/",
  "Android Central": "https://www.androidcentral.com/",
  "Tom's Guide": "https://www.tomsguide.com/",
};

const PUBLICATION_SIZES: Record<string, { width: number; height: number }> = {
  "9to5Google": { width: 250, height: 50 },
  "The Verge": { width: 214, height: 50 },
  SammyGuru: { width: 245, height: 50 },
  "Android Authority": { width: 316, height: 40 },
  "XDA Developers": { width: 169, height: 50 },
  "Android Police": { width: 236, height: 50 },
  "Android Headlines": { width: 193, height: 50 },
  SamMobile: { width: 304, height: 50 },
  "Android Central": { width: 378, height: 40 },
  "Tom's Guide": { width: 283, height: 50 },
};

const SECONDARY_PUBLICATIONS: Publication[] = [
  { name: "Android Police", logo: "/images/home/svg/android_police.svg" },
  { name: "Android Headlines", logo: "/images/home/svg/android_headlines.svg" },
  { name: "SamMobile", logo: "/images/home/svg/sammobile.svg" },
  { name: "Android Central", logo: "/images/home/svg/android_central.svg" },
  { name: "Tom's Guide", logo: "/images/home/svg/toms_guide-figma.svg" },
];

const CARD_CORNERS = {
  radius: 20,
  curve: 'squircle' as const,
  smoothing: 0.6,
  preserveSmoothing: true,
};

const PROJECT_CARD_CORNERS = {
  ...CARD_CORNERS,
  radius: 28,
};

const PROJECT_ACTION_ICONS = {
  download: "/images/home/projects/action-download.svg",
  open: "/images/home/projects/action-open.svg",
  link: "/images/home/projects/action-link.svg",
} as const;

const CARD_SHADOW = {
  offsetX: 0,
  offsetY: 8,
  blur: 12,
  spread: 0,
  color: '#000000',
};

const LazySmoothCorners = lazy(() => import('@lisse/react').then((module) => ({
  default: module.SmoothCorners,
})));

function FoldIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.2252 6.37178C20.2252 5.26693 19.3295 4.37207 18.2255 4.37207H7.22576C6.1209 4.37207 5.22519 5.26693 5.22519 6.37178V12.4729C5.22519 12.6829 5.19262 12.8912 5.12747 13.0909L3.87262 16.9541C3.80747 17.1538 3.7749 17.3629 3.7749 17.5721C3.7749 18.6769 4.66976 19.5726 5.77462 19.5726H16.8446C17.7455 19.5726 18.5358 18.9692 18.7732 18.1001L20.1549 13.0489C20.2012 12.8766 20.2252 12.6992 20.2252 12.5209V6.37178ZM8.92976 8.97236C8.92976 9.52436 8.48233 9.97178 7.93033 9.97178C7.37747 9.97178 6.93005 9.52436 6.93005 8.97236C6.93005 8.4195 7.37747 7.97207 7.93033 7.97207C8.48233 7.97207 8.92976 8.4195 8.92976 8.97236Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.2531 4.39941H18.2528C19.3577 4.39941 20.2534 5.29513 20.2534 6.39913V12.5491C20.2534 12.7274 20.2294 12.9048 20.1822 13.0763L18.8014 18.1274C18.5631 18.9974 17.7737 19.6 16.872 19.6H5.80282C4.69796 19.6 3.80225 18.7043 3.80225 17.6003C3.80225 17.3903 3.83567 17.182 3.89996 16.9823L5.15482 13.1183C5.21996 12.9194 5.25339 12.7103 5.25339 12.5011V6.39913C5.25339 5.29513 6.14825 4.39941 7.2531 4.39941Z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function SmoothHoverCard({
  children,
  corners = CARD_CORNERS,
}: {
  children: ReactElement;
  corners?: typeof CARD_CORNERS;
}) {
  const { cornerSmoothing, cornerSmoothingAvailable, cornerSmoothingSupported, hydrated } = useTheme();
  // The provider may already be hydrated when this streamed card first arrives.
  // Its first client tree must still match the server's plain child element.
  const cardHydrated = useSyncExternalStore(subscribeToHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);

  if (!cardHydrated || !hydrated || !cornerSmoothingAvailable || !cornerSmoothingSupported || !cornerSmoothing) {
    return children;
  }

  return (
    <Suspense fallback={children}>
      <LazySmoothCorners
        asChild
        autoEffects={false}
        corners={corners}
        shadow={{ ...CARD_SHADOW, opacity: 0.12 }}
        data-no-smooth-corners=""
      >
        {children}
      </LazySmoothCorners>
    </Suspense>
  );
}

function StackIcon({ tool }: { tool: StackTool }) {
  return (
    <div
      className="stack-icon"
      title={tool.name}
      data-no-smooth-corners=""
    >
      <Image
        src={tool.icon}
        alt={tool.name}
        width={128}
        height={128}
        className="stack-icon-image"
      />
    </div>
  );
}

type MarqueeMotionTarget = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  trackSelector: string;
  itemSelector: string;
};

function useAdaptiveMarqueeMotion(targets: MarqueeMotionTarget[]) {
  useEffect(() => {
    const motionTargets = targets.flatMap(({ wrapperRef, trackSelector, itemSelector }) => {
      const wrapper = wrapperRef.current;
      const tracks = wrapper
        ? Array.from(wrapper.querySelectorAll<HTMLElement>(trackSelector))
        : [];

      return wrapper && tracks.length
        ? [{ wrapper, tracks, itemSelector, isVisible: false, isInteractingWithItem: false, currentRate: 1 }]
        : [];
    });

    if (!motionTargets.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let scrollVelocity = 0;
    let scrollDirection: 1 | -1 = 1;
    let appliedDirection: 1 | -1 = 1;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let lastFrameAt = lastScrollAt;
    let frameId = 0;

    const getAnimations = (tracks: HTMLElement[]) => tracks.flatMap((track) => (
      typeof track.getAnimations === "function" ? track.getAnimations() : []
    ));

    const moveAnimationsAwayFromStart = (animations: Animation[]) => {
      animations.forEach((animation) => {
        const currentTime = typeof animation.currentTime === "number" ? animation.currentTime : null;
        const duration = Number(animation.effect?.getComputedTiming().duration);

        if (currentTime !== null && Number.isFinite(duration) && duration > 0 && currentTime < duration * 4) {
          // Moving back through an infinite animation needs headroom before time zero.
          // Whole iterations preserve the exact visual position, so this remains seamless.
          animation.currentTime = currentTime + duration * 1000;
        }
      });
    };

    const requestTick = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => {
      frameId = 0;
      const delta = Math.min(64, now - lastFrameAt);
      lastFrameAt = now;

      const timeSinceScroll = now - lastScrollAt;
      const scrollBoost = timeSinceScroll < 180
        ? 1 + Math.min(2.25, scrollVelocity * 0.85)
        : 1;
      const directionChanged = scrollDirection !== appliedDirection;

      motionTargets.forEach((target) => {
        const targetRate = target.isInteractingWithItem ? 0.06 : (target.isVisible ? scrollBoost : 1);
        const easingTime = targetRate < target.currentRate ? 280 : 170;
        const easing = 1 - Math.exp(-delta / easingTime);
        target.currentRate += (targetRate - target.currentRate) * easing;

        const animations = getAnimations(target.tracks);
        if (directionChanged && scrollDirection < 0) {
          moveAnimationsAwayFromStart(animations);
        }

        const signedRate = target.currentRate * scrollDirection;
        animations.forEach((animation) => {
          if (typeof animation.updatePlaybackRate === "function") {
            animation.updatePlaybackRate(signedRate);
          } else {
            animation.playbackRate = signedRate;
          }
        });
      });

      appliedDirection = scrollDirection;

      if (
        motionTargets.some((target) => {
          const targetRate = target.isInteractingWithItem ? 0.06 : (target.isVisible ? scrollBoost : 1);
          return Math.abs(targetRate - target.currentRate) > 0.008;
        }) ||
        (motionTargets.some((target) => target.isVisible) && timeSinceScroll < 420)
      ) {
        requestTick();
      }
    };

    const handleScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(16, now - lastScrollAt);
      const scrollDelta = window.scrollY - lastScrollY;
      const instantaneousVelocity = Math.abs(scrollDelta) / elapsed;
      scrollVelocity = Math.max(instantaneousVelocity, scrollVelocity * 0.55);
      if (Math.abs(scrollDelta) >= 2) {
        scrollDirection = scrollDelta < 0 ? -1 : 1;
      }
      lastScrollY = window.scrollY;
      lastScrollAt = now;

      if (motionTargets.some((target) => target.isVisible) || scrollDirection !== appliedDirection) {
        requestTick();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = motionTargets.find(({ wrapper }) => wrapper === entry.target);
          if (target) target.isVisible = entry.isIntersecting;
        });
        requestTick();
      },
      { threshold: 0.08 },
    );

    const eventCleanups = motionTargets.map((target) => {
      const handlePointerOver = (event: PointerEvent) => {
        if ((event.target as Element | null)?.closest(target.itemSelector)) {
          target.isInteractingWithItem = true;
          requestTick();
        }
      };

      const handlePointerOut = (event: PointerEvent) => {
        const nextTarget = event.relatedTarget as Element | null;
        if (!nextTarget?.closest?.(target.itemSelector)) {
          target.isInteractingWithItem = false;
          requestTick();
        }
      };

      const handleFocusIn = (event: FocusEvent) => {
        if ((event.target as Element | null)?.closest(target.itemSelector)) {
          target.isInteractingWithItem = true;
          requestTick();
        }
      };

      const handleFocusOut = (event: FocusEvent) => {
        const nextTarget = event.relatedTarget as Element | null;
        if (!nextTarget?.closest?.(target.itemSelector)) {
          target.isInteractingWithItem = false;
          requestTick();
        }
      };

      observer.observe(target.wrapper);
      target.wrapper.addEventListener("pointerover", handlePointerOver);
      target.wrapper.addEventListener("pointerout", handlePointerOut);
      target.wrapper.addEventListener("focusin", handleFocusIn);
      target.wrapper.addEventListener("focusout", handleFocusOut);

      return () => {
        target.wrapper.removeEventListener("pointerover", handlePointerOver);
        target.wrapper.removeEventListener("pointerout", handlePointerOut);
        target.wrapper.removeEventListener("focusin", handleFocusIn);
        target.wrapper.removeEventListener("focusout", handleFocusOut);
      };
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    requestTick();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      eventCleanups.forEach((cleanup) => cleanup());
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [targets]);
}

function StackMarquee({
  tools,
  reverse = false,
  wrapperClassName = "",
}: {
  tools: StackTool[];
  reverse?: boolean;
  wrapperClassName?: string;
}) {
  return (
    <div className={`stack-marquee-wrapper ${wrapperClassName}`.trim()}>
      <div className={`stack-marquee${reverse ? " stack-marquee-reverse" : ""}`}>
        {[0, 1, 2, 3].map((copyIndex) => (
          <div
            key={copyIndex}
            className="stack-marquee-content"
            aria-hidden={copyIndex > 0 ? "true" : undefined}
          >
            {tools.map((tool) => (
              <StackIcon key={`${copyIndex}-${tool.name}`} tool={tool} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EdgeMaskedCarousel({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      onScroll={(event) => {
        event.currentTarget.classList.toggle(
          "has-left-overflow",
          event.currentTarget.scrollLeft > 4,
        );
      }}
    >
      {children}
    </div>
  );
}

function StoryCard({ story }: { story: FeaturedStory }) {
  return (
    <SmoothHoverCard>
      <a href={story.url} target="_blank" rel="noopener noreferrer" className="story-card">
        <div className="story-card-thumbnail">
          <Image
            src={story.thumbnail}
            alt={story.title}
            width={320}
            height={180}
            className="story-card-image"
          />
        </div>
        <div className="story-card-info">
          <span className="story-card-title">{story.title}</span>
          <span className="story-card-site">{story.site}</span>
        </div>
      </a>
    </SmoothHoverCard>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false);
  const actionLabel =
    project.action === "copy-current-url"
      ? copied
        ? "Page link copied"
        : "Copy this page link"
      : project.actionIcon === "download"
        ? `View ${project.title} releases`
        : `Open ${project.title}`;
  const actionIcon = (
    <Image
      src={PROJECT_ACTION_ICONS[project.actionIcon]}
      alt=""
      width={24}
      height={24}
      className="project-app-card-action-icon"
    />
  );

  const action = project.action === "copy-current-url" ? (
    <button
      type="button"
      className={`project-app-card-action${copied ? " is-copied" : ""}`}
      aria-label={actionLabel}
      title={actionLabel}
      onClick={async (event) => {
        event.stopPropagation();
        await navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {actionIcon}
    </button>
  ) : project.actionUrl?.startsWith("/") ? (
    <Link
      href={project.actionUrl}
      className="project-app-card-action"
      aria-label={actionLabel}
      title={actionLabel}
      onClick={(event) => event.stopPropagation()}
    >
      {actionIcon}
    </Link>
  ) : (
    <a
      href={project.actionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="project-app-card-action"
      aria-label={actionLabel}
      title={actionLabel}
      onClick={(event) => event.stopPropagation()}
    >
      {actionIcon}
    </a>
  );

  const bodyLink = project.bodyUrl?.startsWith("/") ? (
    <Link
      href={project.bodyUrl}
      className="project-app-card-body-link"
      aria-label={`Open ${project.title}`}
    />
  ) : project.bodyUrl ? (
    <a
      href={project.bodyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="project-app-card-body-link"
      aria-label={`Open ${project.title}`}
    />
  ) : null;

  return (
    <SmoothHoverCard corners={PROJECT_CARD_CORNERS}>
      <article
        className={`design-project-card project-app-card project-app-card--${project.tone}`}
      >
        <div className="design-project-thumbnail">
          <Image
            src={project.thumbnail}
            unoptimized={/^https:\/\//i.test(project.thumbnail)}
            alt=""
            width={852}
            height={604}
            sizes="(max-width: 699px) calc(100vw - 64px), 426px"
            className="design-project-image"
          />
        </div>
        {bodyLink}
        <div className="project-app-card-panel">
          <span className="project-app-card-progressive-blur" aria-hidden="true" />
          {project.icon && (
            <Image
              src={project.icon}
              unoptimized={/^https:\/\//i.test(project.icon)}
              alt=""
              width={80}
              height={80}
              className="project-app-card-icon"
            />
          )}
          <div className="project-app-card-copy">
            <h3 className="project-app-card-title">{project.title}</h3>
            <p className="project-app-card-description">{project.description}</p>
          </div>
          {action}
        </div>
      </article>
    </SmoothHoverCard>
  );
}

// Publication logo component that handles both string paths and SVG elements
function PublicationLogo({ logo, alt }: { logo: string | ReactNode; alt: string }) {
  const size = PUBLICATION_SIZES[alt] ?? { width: 200, height: 50 };
  const resolvedLogo = alt === "SammyGuru"
    ? "/images/home/svg/sammyguru-2026.svg"
    : logo;
  const style = {
    "--publication-width": `${size.width}px`,
    "--publication-height": `${size.height}px`,
  } as CSSProperties;

  if (typeof resolvedLogo === 'string') {
    return (
      <span
        role="img"
        aria-label={alt}
        className="publication-logo-image publication-logo-mask"
        style={{
          ...style,
          "--publication-mask": `url("${resolvedLogo}")`,
        } as CSSProperties}
      />
    );
  }
  return <span className="publication-logo-image publication-logo-svg-wrapper" style={style}>{resolvedLogo}</span>;
}

export default function HomeClient({
  featuredStories,
  projects = [],
  popularStoriesEnabled = true,
  projectsEnabled = true,
  miscSectionEnabled = true,
  recentBlogPostsEnabled = true,
  recentBlogPosts = [],
  profileFacts,
}: {
  featuredStories: FeaturedStory[];
  projects?: Project[];
  popularStoriesEnabled?: boolean;
  projectsEnabled?: boolean;
  miscSectionEnabled?: boolean;
  recentBlogPostsEnabled?: boolean;
  recentBlogPosts?: RecentBlogPost[];
  profileFacts: ProfileFact[];
}) {
  const stackTools: StackTool[] = [
    { name: 'Todoist', icon: '/images/stack/todoist.png' },
    { name: 'Figma', icon: '/images/stack/figma.png' },
    { name: 'Notion', icon: '/images/stack/notion.png' },
    { name: 'GitHub', icon: '/images/stack/github.png' },
    { name: 'Cursor', icon: '/images/stack/cursor.png' },
    { name: 'Claude', icon: '/images/stack/claude.png' },
    { name: 'ChatGPT', icon: '/images/stack/chatgpt.png' },
    { name: 'Helium', icon: '/images/stack/dia.png' },
    { name: 'Codex', icon: '/images/stack/warp.png' },
    { name: 'Slack', icon: '/images/stack/slack.png' },
    { name: 'Blip', icon: '/images/stack/framer.png' },
    { name: 'Calendar', icon: '/images/stack/calendar.png' },
    { name: '1Password', icon: '/images/stack/1password.png' },
    { name: 'X', icon: '/images/stack/x.png' },
    { name: 'Twidget', icon: '/images/stack/twidget.png' },
    { name: 'Codex Meter', icon: '/images/stack/termius.png' },
  ];
  const stackRows = [stackTools.slice(0, 8), stackTools.slice(8)];
  const publicationMarqueeRef = useRef<HTMLDivElement>(null);
  const stackMarqueeRef = useRef<HTMLDivElement>(null);
  const marqueeMotionTargets = useMemo<MarqueeMotionTarget[]>(() => [
    {
      wrapperRef: publicationMarqueeRef,
      trackSelector: ".publications-marquee",
      itemSelector: ".publication-item",
    },
    {
      wrapperRef: stackMarqueeRef,
      trackSelector: ".stack-marquee",
      itemSelector: ".stack-icon",
    },
  ], []);
  useAdaptiveMarqueeMotion(marqueeMotionTargets);

  useEffect(() => {
    // The target may arrive after the browser's initial fragment scroll attempt.
    // Do not pull someone back if they have already scrolled while data loads.
    if (!window.location.hash || window.scrollY > 0) return;
    let target: HTMLElement | null;
    try { target = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); }
    catch { return; }
    if (!target) return;
    const frame = requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-copy">
          <h2 className="about-headline">Hey,</h2>
          <p className="about-text">
            I&apos;m Josh, a designer, journalist and lifelong Samsung enthusiast based in the south of the UK. I follow everything Samsung, from their software updates, UX design, to even hardware leaks.
          </p>
          <p className="about-text">
            I work with <a href="https://sammyguru.com/author/josh_skinner/" target="_blank" rel="noopener noreferrer">SammyGuru</a>, and contribute to publications like <a href="https://9to5google.com/" target="_blank" rel="noopener noreferrer">9to5Google</a>, <a href="https://www.sammobile.com/" target="_blank" rel="noopener noreferrer">SamMobile</a> and <a href="https://www.androidauthority.com/" target="_blank" rel="noopener noreferrer">Android Authority</a>.
          </p>
          <p className="about-text">
            I&apos;ve recreated One UI&apos;s design system in Figma with the <Link href="/blog/oneui-design-kit">One UI Design Kit</Link>, letting enthusiasts and developers create native looking interfaces.
          </p>
          <p className="about-text">
            In early 2026, I leaked animations on how the <a href="https://sammyguru.com/galaxy-s26-ultra-privacy-display-animation/" target="_blank" rel="noopener noreferrer">Galaxy S26 Ultra&apos;s Privacy Display</a> worked, showed off <a href="https://sammyguru.com/exclusive-samsung-internet-gets-massive-redesign-in-one-ui-8-0/" target="_blank" rel="noopener noreferrer">Samsung Internet&apos;s redesign</a> in Nov 2025, and was first to share the update artwork for <a href="https://x.com/thatjoshguy69" target="_blank" rel="noopener noreferrer">One UI 9.5</a>.
          </p>
          <p className="about-text">
            I also review the latest and greatest Samsung tech for <a href="https://sammyguru.com/author/josh_skinner/" target="_blank" rel="noopener noreferrer">SammyGuru</a>, and dig through Samsung&apos;s applications for signs of unreleased hardware and new features.
          </p>
          <p className="about-text">
            I also overhauled <a href="https://sammyguru.com/" target="_blank" rel="noopener noreferrer">SammyGuru&apos;s brand identity</a>, bringing a cohesive colour system with a new logo and social media branding.
          </p>
        </div>

        <aside className="about-aside" aria-label="Profile details">
          <figure className="about-portrait">
            <Image
              src="/images/home/about/london.jpg"
              alt="Josh Skinner beside the River Thames in London, with Tower Bridge behind him"
              fill
              sizes="(max-width: 699px) calc(100vw - 40px), 414px"
              className="about-portrait-image"
            />
            <figcaption className="about-location">
              <Location size={28} color="currentColor" />
              <span>London</span>
            </figcaption>
          </figure>

          <ul className="list-group home-facts-list" aria-label="A few facts about Josh">
            {profileFacts.map((fact) => (
              <li className="list home-fact-item" key={fact.icon}>
                <span className={`home-fact-icon home-fact-icon-${fact.icon}`} aria-hidden="true">
                  {fact.icon === "phone" && <FoldIcon size={24} color="currentColor" />}
                  {fact.icon === "game" && (
                    <Image src="/images/home/about/persona-3-reload.png" alt="" width={24} height={29} />
                  )}
                  {fact.icon === "f1" && (
                    <Image src="/images/home/about/lewis-hamilton.svg" alt="" width={28} height={16} />
                  )}
                </span>
                <span className="home-fact-copy">
                  <span className="home-fact-label">{fact.label}</span>
                  <span className="home-fact-value">{fact.value}</span>
                </span>
              </li>
            ))}
          </ul>

        </aside>
      </section>

      {/* Journalist Section */}
      <div className="journalist-section">
        <h2 className="journalist-headline">Featured In</h2>
        <div ref={publicationMarqueeRef} className="publications-marquee-wrapper">
          <div className="publications-marquee publications-marquee-forward">
            {[0, 1].map((copy) => (
            <div
              className="publications-marquee-content"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {[
                { name: 'SammyGuru', logo: '/images/home/svg/sammyguru-2026.svg' },
                { name: 'XDA Developers', logo: '/images/home/svg/xda-developers.svg' },
                { name: 'Android Authority', logo: '/images/home/svg/android-authority.svg' },
                { name: '9to5Google', logo: '/images/home/svg/9to5google.svg' },

              ].map((pub, index) => (
                <a
                  key={`${copy}-${index}`}
                  className="publication-item"
                  href={PUBLICATION_URLS[pub.name]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={pub.name}
                  data-publication={pub.name}
                  tabIndex={copy === 1 ? -1 : undefined}
                >
                  <PublicationLogo logo={pub.logo} alt={pub.name} />
                </a>
              ))}
            </div>
            ))}
          </div>
          <div className="publications-marquee publications-marquee-reverse">
            {[0, 1].map((copy) => (
              <div
                className="publications-marquee-content"
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
              >
                {SECONDARY_PUBLICATIONS.map((pub, index) => (
                  <a
                    key={`${copy}-${index}`}
                    className="publication-item"
                    href={PUBLICATION_URLS[pub.name]}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={pub.name}
                    data-publication={pub.name}
                    tabIndex={copy === 1 ? -1 : undefined}
                  >
                    <PublicationLogo logo={pub.logo} alt={pub.name} />
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {popularStoriesEnabled && featuredStories.length > 0 && (
        <div className="featured-stories-section">
          <h2 className="featured-stories-headline">Popular articles</h2>
          <div className="featured-stories-scroll-wrapper">
            <EdgeMaskedCarousel className="featured-stories-scroll">
              <div className="featured-stories-scroll-inner">
                {featuredStories.map((story, index) => (
                  <StoryCard key={index} story={story} />
                ))}
              </div>
            </EdgeMaskedCarousel>
          </div>
        </div>
      )}

      {/* Projects Preview */}
      {projectsEnabled && projects.length > 0 && (
        <section className="design-projects-section projects-showcase-section" id="design-work">
          <h2 className="design-projects-headline">Projects</h2>
          <div className="design-projects-scroll-wrapper">
            <EdgeMaskedCarousel className="design-projects-scroll">
              <div className="design-projects-scroll-inner">
                {projects.map((project, index) => (
                  <ProjectCard key={index} project={project} />
                ))}
              </div>
            </EdgeMaskedCarousel>
          </div>
        </section>
      )}

      {/* Tools */}
      <div className="stack-section">
        <div className="stack-text">
          <h2 className="stack-headline">Tools I use</h2>
        </div>
        <div className="stack-icon-grid">
          {stackTools.map((tool, index) => (
            <StackIcon key={index} tool={tool} />
          ))}
        </div>
        <div ref={stackMarqueeRef} className="stack-marquee-rows">
          <StackMarquee tools={stackRows[0]} />
          <StackMarquee tools={stackRows[1]} reverse />
        </div>
        <div className="stack-marquee-wrapper stack-marquee-wide-wrapper">
          <div className="stack-marquee-wide-content">
            {stackTools.map((tool) => (
              <StackIcon key={`wide-${tool.name}`} tool={tool} />
            ))}
          </div>
        </div>
      </div>

      {recentBlogPostsEnabled && recentBlogPosts.length > 0 && (
        <div className="design-projects-section">
          <h2 className="design-projects-headline">Recent Blog Posts</h2>
          <div className="design-projects-scroll-wrapper">
            <EdgeMaskedCarousel className="design-projects-scroll">
              <div className="design-projects-scroll-inner">
                {recentBlogPosts.map((post) => (
                  <SmoothHoverCard key={post.id}>
                    <CarouselContentCard post={post} />
                  </SmoothHoverCard>
                ))}
              </div>
            </EdgeMaskedCarousel>
          </div>
        </div>
      )}

      {miscSectionEnabled && (
        <div className="section">
          <div className="section-header">
            <h2 className="title">Misc</h2>
          </div>

          <div className="list-group">
            <a href="https://legacy.tjg.gg" className="list">
              <div className="list-item-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_misc_home" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                    <rect width="24" height="24" fill="#D9D9D9" />
                  </mask>
                  <g mask="url(#mask0_misc_home)">
                    <path
                      d="M4.825 12.025L8.7 15.9C8.88334 16.0833 8.975 16.3167 8.975 16.6C8.975 16.8833 8.88334 17.1167 8.7 17.3C8.51667 17.4833 8.28334 17.575 8 17.575C7.71667 17.575 7.48334 17.4833 7.3 17.3L2.7 12.7C2.6 12.6 2.52917 12.4917 2.4875 12.375C2.44584 12.2583 2.425 12.1333 2.425 12C2.425 11.8667 2.44584 11.7417 2.4875 11.625C2.52917 11.5083 2.6 11.4 2.7 11.3L7.3 6.7C7.5 6.5 7.7375 6.4 8.0125 6.4C8.2875 6.4 8.525 6.5 8.725 6.7C8.925 6.9 9.025 7.1375 9.025 7.4125C9.025 7.6875 8.925 7.925 8.725 8.125L4.825 12.025ZM19.175 11.975L15.3 8.1C15.1167 7.91667 15.025 7.68333 15.025 7.4C15.025 7.11667 15.1167 6.88333 15.3 6.7C15.4833 6.51667 15.7167 6.425 16 6.425C16.2833 6.425 16.5167 6.51667 16.7 6.7L21.3 11.3C21.4 11.4 21.4708 11.5083 21.5125 11.625C21.5542 11.7417 21.575 11.8667 21.575 12C21.575 12.1333 21.5542 12.2583 21.5125 12.375C21.4708 12.4917 21.4 12.6 21.3 12.7L16.7 17.3C16.5 17.5 16.2667 17.5958 16 17.5875C15.7333 17.5792 15.5 17.475 15.3 17.275C15.1 17.075 15 16.8375 15 16.5625C15 16.2875 15.1 16.05 15.3 15.85L19.175 11.975Z"
                      fill="var(--accent)"
                    />
                  </g>
                </svg>
              </div>
              <div className="list-item-content">
                <div className="body-text">My old site</div>
                <div className="information-wrapper">
                  <div className="information">legacy.tjg.gg, made in conjunction with Dhiren Vasnani</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
