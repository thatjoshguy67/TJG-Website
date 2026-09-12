"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AnimatedText from "../components/AnimatedText";
import { LoadingDots } from "../components/LoadingAnim";
import Toast from "../components/Toast";
import ProgressiveBlur from "../components/ProgressiveBlur";
import NativeSlideshow from "../blog/NativeSlideshow";
import { useTheme, ACCENT_COLORS, ACCENT_DARK_BACKGROUNDS, ACCENT_LIGHT_BACKGROUNDS, ACCENT_DARK_CONTAINER_BACKGROUNDS, ACCENT_LIGHT_CONTAINER_BACKGROUNDS, type AccentColor } from "../components/ThemeProvider";
import TopAppBar from "../components/TopAppBar";
import Switch from "../components/Switch";
import ColorSwatch from "./ColorSwatch";
import { ContentCardsDemo, MenusDemo, PopoverDemo, SkeletonDemo } from "./AdditionalDemos";
import { BlogSearchControl } from "../blog/FloatingSearchBar";
import { NotificationOutline, MessageOutline } from '@thatjoshguy/oneui-icons';

/* ------------------------------------------------------------------ */
/*  Section wrapper – keeps each demo visually grouped                */
/* ------------------------------------------------------------------ */
function Section({ title, description, bare, split, children }: { title: string; description?: string; bare?: boolean; split?: boolean; children: React.ReactNode }) {
  return (
    <div className={`playground-section${split ? ' playground-section--split' : ''}`}>
      <div className="section-header">
        <h2 className="title" style={{ fontSize: 'var(--subheading-size)' }}>{title}</h2>
        {description && (
          <div style={{ color: 'var(--secondary)', fontSize: 'var(--body-size)', fontFamily: 'One UI Sans' }}>
            {description}
          </div>
        )}
      </div>
      {bare ? children : (
        <div className="panel" style={{ padding: 'var(--padding-xll)', gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle row – reusable for all toggle demos                        */
/* ------------------------------------------------------------------ */
function ToggleRow({ id, label, description, checked, onChange, badge }: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <label htmlFor={id} className="list" style={{ cursor: "pointer" }}>
      <div className="list-item-content">
        <div className="body-text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {badge && <span className="beta-chip">{badge}</span>}
          {label}
        </div>
        {description && (
          <div className="information-wrapper">
            <div className="information">{description}</div>
          </div>
        )}
      </div>
      <Switch id={id} checked={checked} onChange={onChange} />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Chips demo (standalone, no router dependency)                      */
/* ------------------------------------------------------------------ */
function DemoChips() {
  const [selected, setSelected] = useState<string | null>(null);
  const chips = ["All", "Design", "Development", "Photography", "Music", "Tutorials"];

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "nowrap",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        width: "100%",
        padding: "4px",
        boxSizing: "border-box",
      }}
    >
      {chips.map((chip) => {
        const isSelected = selected === chip || (chip === "All" && selected === null);
        return (
          <button
            key={chip}
            onClick={() => setSelected(chip === "All" ? null : chip)}
            className="playground-chip"
            aria-pressed={isSelected}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Button showcase                                                    */
/* ------------------------------------------------------------------ */
function DemoButtons() {
  return (
    <div className="playground-demo-centered" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <button className="blog-button">Primary</button>
      <button className="blog-button blog-button--secondary">Secondary</button>
      <button className="blog-button" disabled>Disabled</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Radio group demo                                                   */
/* ------------------------------------------------------------------ */
function DemoRadioGroup() {
  const [value, setValue] = useState("option1");
  const options = [
    { value: "option1", label: "Option A" },
    { value: "option2", label: "Option B" },
    { value: "option3", label: "Option C" },
  ];

  return (
    <div className="list-group" role="radiogroup" aria-label="Example options">
      {options.map(opt => (
        <label key={opt.value} className="list playground-radio-row">
          <input
            type="radio"
            name="playground-example-option"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => setValue(opt.value)}
            className="playground-radio"
          />
          <span className="list-item-content body-text">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search input demo                                                  */
/* ------------------------------------------------------------------ */
function DemoSearchInput() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  return (
    <BlogSearchControl
      inline
      categories={[]}
      searchQuery={query}
      setSearchQuery={setQuery}
      activeCategory={category}
      setActiveCategory={setCategory}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */
function Dialog({ title, text, cancelLabel = "Cancel", confirmLabel = "Apply", onCancel, onConfirm }: {
  title: string;
  text: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="dialogue-overlay show" onClick={onCancel}>
      <div className="dialogue-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dialogue-content">
          <div className="dialogue-title">{title}</div>
          <div className="dialogue-body">{text}</div>
        </div>
        <div className="dialogue-buttons">
          <button className="dialogue-btn cancel-btn" onClick={onCancel}>{cancelLabel}</button>
          <div className="dialogue-btn-separator" />
          <button className="dialogue-btn confirm-btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Typography showcase                                                */
/* ------------------------------------------------------------------ */
function DemoTypography() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <span style={{ fontFamily: "One UI Sans", fontWeight: 700, fontSize: "var(--title-size)", color: "var(--primary)" }}>
        Title (40px / 700)
      </span>
      <span style={{ fontFamily: "One UI Sans", fontWeight: 600, fontSize: "var(--subtitle-size)", color: "var(--primary)" }}>
        Subtitle (20px / 600)
      </span>
      <span style={{ fontFamily: "One UI Sans", fontWeight: 500, fontSize: "var(--subheading-size)", color: "var(--primary)" }}>
        Subheading (18px / 500)
      </span>
      <span style={{ fontFamily: "One UI Sans", fontWeight: 400, fontSize: "var(--body-size)", color: "var(--primary)" }}>
        Body text (14px / 400) &mdash; The quick brown fox jumps over the lazy dog.
      </span>
      <span style={{ fontFamily: "One UI Sans", fontWeight: 400, fontSize: "var(--font-size-2xs)", color: "var(--secondary)" }}>
        Caption (11px / 400) &mdash; Secondary information and metadata
      </span>
      <code style={{ fontWeight: 400, fontSize: 'var(--body-size)', color: 'var(--primary)', overflowWrap: 'anywhere' }}>
        Google Sans Code (14px / 400) &mdash; const accent = &quot;#387AFF&quot;;
      </code>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge / chip variants                                              */
/* ------------------------------------------------------------------ */
function DemoBadges() {
  return (
    <div className="playground-demo-centered" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <span className="beta-chip">Beta</span>
      <span
        className="playground-badge"
        style={{
          padding: "4px 12px",
          borderRadius: 999,
          backgroundColor: "var(--accent)",
          color: "var(--on-accent)",
          fontSize: 12,
          fontFamily: "One UI Sans",
          fontWeight: 600,
        }}
      >
        New
      </span>
      <span
        className="playground-badge"
        style={{
          padding: "4px 12px",
          borderRadius: 999,
          backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
          color: "#1B5FCC",
          fontSize: 12,
          fontFamily: "One UI Sans",
          fontWeight: 600,
        }}
      >
        Info
      </span>
      <span
        className="playground-badge"
        style={{
          padding: "4px 12px",
          borderRadius: 999,
          backgroundColor: "color-mix(in srgb, #34C759 15%, transparent)",
          color: "#1E6B35",
          fontSize: 12,
          fontFamily: "One UI Sans",
          fontWeight: 600,
        }}
      >
        Success
      </span>
      <span
        className="playground-badge"
        style={{
          padding: "4px 12px",
          borderRadius: 999,
          backgroundColor: "color-mix(in srgb, #FF3B30 15%, transparent)",
          color: "#B3261E",
          fontSize: 12,
          fontFamily: "One UI Sans",
          fontWeight: 600,
        }}
      >
        Error
      </span>
      <span
        className="playground-badge"
        style={{
          padding: "4px 12px",
          borderRadius: 999,
          backgroundColor: "color-mix(in srgb, #FF9500 15%, transparent)",
          color: "#8A4B00",
          fontSize: 12,
          fontFamily: "One UI Sans",
          fontWeight: 600,
        }}
      >
        Warning
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List items demo                                                    */
/* ------------------------------------------------------------------ */
function DemoListItems() {
  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(true);
  const [nfcOn, setNfcOn] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      {/* Toggle group with subtext and vertical separators */}
      <div className="list-group">
        <label htmlFor="demo-wifi" className="list" style={{ cursor: "pointer" }}>
          <div className="list-item-content">
            <div className="body-text">Wi-Fi</div>
            <div className="information-wrapper">
              <div className="information">SammyGuru</div>
            </div>
          </div>
          <div className="list-item-separator" />
          <Switch id="demo-wifi" checked={wifiOn} onChange={setWifiOn} />
        </label>
        <label htmlFor="demo-bt" className="list" style={{ cursor: "pointer" }}>
          <div className="list-item-content">
            <div className="body-text">Bluetooth</div>
            <div className="information-wrapper">
              <div className="information">That Josh Guy</div>
            </div>
          </div>
          <div className="list-item-separator" />
          <Switch id="demo-bt" checked={btOn} onChange={setBtOn} />
        </label>
        <label htmlFor="demo-nfc" className="list" style={{ cursor: "pointer" }}>
          <div className="list-item-content">
            <div className="body-text">NFC &amp; contactless payments</div>
          </div>
          <Switch id="demo-nfc" checked={nfcOn} onChange={setNfcOn} />
        </label>
      </div>

      {/* Navigation group with chevrons */}
      <div className="list-group">
        {["Account settings", "Notifications", "Privacy", "Help & Support"].map((item) => (
          <div key={item} className="list" style={{ cursor: "pointer" }}>
            <div className="list-item-content">
              <div className="body-text">{item}</div>
            </div>
            <div className="list-item-separator" />
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Colour Palette Previewer                                           */
/* ------------------------------------------------------------------ */
function DemoColourPalette() {
  const { accentColor } = useTheme();
  const accentNames = Object.keys(ACCENT_COLORS) as AccentColor[];
  const tokenGroup = (title: string, tokens: string[]) => ({
    title,
    swatches: tokens.map(token => ({ label: token.replace(/^--/, '').replaceAll('-', ' '), color: `var(${token})`, detail: token })),
  });
  const groups = [
    tokenGroup('Current theme', [
      '--background', '--container-background', '--foreground', '--primary', '--secondary',
      '--selected', '--accent', '--on-accent', '--accent-control', '--accent-link',
      '--divider', '--button-divider', '--press-highlight',
      '--container-background-hover', '--container-background-active', '--navigation-hover', '--skeleton-base', '--skeleton-highlight',
    ]),
    ...(['light', 'dark'] as const).map(theme => tokenGroup(`${theme} theme base`, [
      `--${theme}-primary`, `--${theme}-secondary`, `--${theme}-selected`,
      `--${theme}-foreground`, `--${theme}-divider`, `--${theme}-button-divider`, `--${theme}-press-highlight`,
    ])),
    { title: 'Accent palette · decoration and dark-theme links', swatches: accentNames.map(name => ({
      label: name, color: ACCENT_COLORS[name], detail: ACCENT_COLORS[name], active: name === accentColor,
    })) },
    { title: 'Accent controls · white labels', swatches: accentNames.map(name => ({
      label: name, color: `var(--accent-control-${name})`, detail: `--accent-control-${name}`, active: name === accentColor,
    })) },
    { title: 'Light-theme links', swatches: accentNames.map(name => ({
      label: name, color: `var(--accent-link-${name})`, detail: `--accent-link-${name}`, active: name === accentColor,
    })) },
    ...([
      ['Light backgrounds', ACCENT_LIGHT_BACKGROUNDS],
      ['Light containers', ACCENT_LIGHT_CONTAINER_BACKGROUNDS],
      ['Dark backgrounds', ACCENT_DARK_BACKGROUNDS],
      ['Dark containers', ACCENT_DARK_CONTAINER_BACKGROUNDS],
    ] as const).map(([title, colors]) => ({
      title, swatches: accentNames.map(name => ({ label: name, color: colors[name], detail: colors[name], active: name === accentColor })),
    })),
  ];

  return (
    <div className="palette-groups">
      {groups.map(group => (
        <section key={group.title} aria-label={group.title} className="panel palette-group-card">
          <h3 className="palette-group-title">{group.title}</h3>
          <div className="palette-grid">
            {group.swatches.map(swatch => <ColorSwatch key={swatch.detail + swatch.label} {...swatch} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main playground content                                            */
/* ------------------------------------------------------------------ */
function PlaygroundContent() {
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);
  const [toggleC, setToggleC] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/settings";

  const fireToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  }, []);

  const demoSlides = [
    { src: "/images/projects/oneui-bento.png", alt: "One UI design showcase", caption: "First slide caption" },
    { src: "/images/projects/oneui-design-kit-cover-light.png", alt: "One UI design kit", caption: "Second slide caption" },
    { src: "/images/projects/oneui-devmode.png", alt: "One UI developer mode", caption: "Third slide caption" },
  ];

  return (
    <>
      <div className="main-content" style={{ animation: "fadeInUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards", opacity: 0 }}>
        <TopAppBar
          title="Component Playground"
          backHref={from}
        />

        <div className="card-columns-layout playground-columns">
          <div className="card-column">
            {/* ---- Colour Palette ---- */}
            <Section title="Colour Palette" description="Theme tokens and every accent, background, container, control and link variant" bare split>
              <DemoColourPalette />
            </Section>

            {/* ---- Typography ---- */}
            <Section title="Typography" description="Base typography tokens; individual components can override size and weight">
              <DemoTypography />
            </Section>

            {/* ---- Animated Text ---- */}
            <Section title="Animated Text" description="Hover or drag across the text to see font weight react to your cursor">
              <AnimatedText
                text="Interactive weight"
                style={{ fontSize: "var(--title-size)", letterSpacing: "-0.5px" }}
              />
              <div style={{ marginTop: 8 }}>
                <AnimatedText
                  text="Inverse mode"
                  inverse
                  style={{ fontSize: "var(--subtitle-size)", letterSpacing: "-0.3px" }}
                />
              </div>
            </Section>

            {/* ---- Toggle Switches ---- */}
            <Section title="Toggle Switches" description="Standard on/off controls" bare>
              <div className="list-group">
                <ToggleRow id="demo-toggle-a" label="Notifications" description="Receive push notifications" checked={toggleA} onChange={setToggleA} />
                <ToggleRow id="demo-toggle-b" label="Dark mode sync" description="Follow system appearance" checked={toggleB} onChange={setToggleB} />
                <ToggleRow id="demo-toggle-c" label="Experimental" description="Enable beta features" checked={toggleC} onChange={setToggleC} badge="Beta" />
              </div>
            </Section>

            {/* ---- Buttons ---- */}
            <Section title="Buttons" description="Primary, secondary, and disabled states">
              <DemoButtons />
            </Section>

            {/* ---- Badges ---- */}
            <Section title="Badges" description="Status indicators and labels">
              <DemoBadges />
            </Section>

            <Section title="Content Cards" description="Shop products, blog posts and home carousel variants" bare>
              <ContentCardsDemo />
            </Section>

            {/* ---- Chips ---- */}
            <Section title="Chips" description="Scrollable filter chips with selection state">
              <DemoChips />
            </Section>
          </div>
          <div className="card-column">
            {/* ---- Radio Group ---- */}
            <Section title="Radio Group" description="Single-selection radio buttons" bare>
              <DemoRadioGroup />
            </Section>

            {/* ---- Search Input ---- */}
            <Section title="Blog Search" description="The blog search control, including clear and category filter actions" bare>
              <DemoSearchInput />
            </Section>

            {/* ---- List Items ---- */}
            <Section title="List Items" description="Grouped rows with toggles, subtext, and navigation" bare>
              <DemoListItems />
            </Section>

            <Section title="Popovers" description="Hover or focus the buttons to preview keyboard hints on desktop">
              <PopoverDemo />
            </Section>

            <Section title="Expanding Menus" description="Selection and post-options menus; changes here stay in the preview">
              <MenusDemo />
            </Section>

            {/* ---- Toast Notification ---- */}
            <Section title="Toast Notification" description="Tap the button to show a toast">
              <button
                onClick={() => fireToast("This is a demo toast notification")}
                className="blog-button playground-action-button"
              >
                <NotificationOutline size={20} color="currentColor" aria-hidden="true" />
                Show Toast
              </button>
            </Section>

            {/* ---- Dialog ---- */}
            <Section title="Dialog" description="Confirmation prompt with cancel and apply actions">
              <button
                onClick={() => setShowDialog(true)}
                className="blog-button playground-action-button"
              >
                <MessageOutline size={20} color="currentColor" aria-hidden="true" />
                Show Dialog
              </button>
            </Section>

            {/* ---- Loading Animation ---- */}
            <Section title="Loading Animation" description="Samsung One UI four-dot spinner in different sizes">
              <div className="playground-demo-centered" style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <LoadingDots size={32} />
                  <div style={{ color: "var(--secondary)", fontSize: 12, fontFamily: "One UI Sans", marginTop: 8 }}>Small</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <LoadingDots />
                  <div style={{ color: "var(--secondary)", fontSize: 12, fontFamily: "One UI Sans", marginTop: 8 }}>Default</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <LoadingDots size={80} />
                  <div style={{ color: "var(--secondary)", fontSize: 12, fontFamily: "One UI Sans", marginTop: 8 }}>Large</div>
                </div>
              </div>
            </Section>

            <Section title="Skeleton Placeholders" description="Image and text placeholders used while articles load">
              <SkeletonDemo />
            </Section>

            {/* ---- Slideshow ---- */}
            <Section title="Slideshow" description="Drag or use arrows to navigate between slides">
              <div style={{ width: "100%" }}>
                <NativeSlideshow slides={demoSlides} />
              </div>
            </Section>

          </div>
        </div>

        {/* Bottom spacing */}
        <div style={{ height: 60 }} />
      </div>

      {/* Toast */}
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      {showDialog && (
        <Dialog
          title="This is a title"
          text="This is placeholder text for the dialog."
          onCancel={() => setShowDialog(false)}
          onConfirm={() => {
            setShowDialog(false);
            fireToast("Action confirmed");
          }}
        />
      )}

      {/* Progressive blur overlays */}
      <ProgressiveBlur position="top" />
      <ProgressiveBlur position="bottom" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export                                                        */
/* ------------------------------------------------------------------ */
export default function Playground() {
  return (
    <div className="page settings-page">
      <div className="page-body">
        <Suspense
          fallback={
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
              <LoadingDots />
            </div>
          }
        >
          <PlaygroundContent />
        </Suspense>
      </div>
    </div>
  );
}
