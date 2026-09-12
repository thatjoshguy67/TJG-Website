"use client";
import { localPreferences } from '../../lib/browserStorage';
import { getSettingsReturnPath, rememberSettingsReturnPath } from '../../lib/settingsNavigation';

import { useTheme, ACCENT_COLORS, ACCENT_LIGHT_BACKGROUNDS, ACCENT_LIGHT_CONTAINER_BACKGROUNDS, ACCENT_DARK_BACKGROUNDS, ACCENT_DARK_CONTAINER_BACKGROUNDS, AccentColor } from '../components/ThemeProvider';
import { useEffect, useState, Suspense, type KeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, Education, Labs, SecurityOutline, Selected } from '@thatjoshguy/oneui-icons';
import { LoadingDots } from '../components/LoadingAnim';
import TopAppBar from '../components/TopAppBar';
import ReadingLayoutMenu from './ReadingLayoutMenu';
import Switch from '../components/Switch';
import { useReadingPreferences } from '../blog/useReadingPreferences';

const THEME_OPTIONS = ['auto', 'light', 'dark'] as const;
type ThemeOption = (typeof THEME_OPTIONS)[number];

type DeveloperSiteLink = {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: typeof Labs;
};

const DEVELOPER_SITE_GROUPS: Record<'sites' | 'admin', DeveloperSiteLink[]> = {
  sites: [
    { label: 'Main site', href: 'https://tjg.gg', icon: Home },
    { label: 'College site', href: 'https://college.tjg.gg', icon: Education },
    { label: 'Beta site', href: 'https://beta.tjg.gg', icon: Labs },
    { label: 'College beta site', href: 'https://college.beta.tjg.gg', icon: Education, badge: Labs },
  ],
  admin: [{ label: 'Admin site', href: 'https://admin.tjg.gg', icon: SecurityOutline }],
};

function SiteLinkGroup({ links, currentHostname }: { links: DeveloperSiteLink[]; currentHostname: string }) {
  return (
    <>
      <div className="section-header" />
      <div className="list-group">
        {links.map(({ label, href, icon: Icon, badge: Badge }) => {
          const hostname = new URL(href).hostname;
          const isCurrentSite = currentHostname === hostname;
          return (
            <a key={href} href={href} className="list" aria-current={isCurrentSite ? 'true' : undefined}>
              <div className="list-item-icon" style={{ flexShrink: 0 }} aria-hidden="true">
                <Icon size={24} color="currentColor" />
                {Badge && (
                  <Badge size={14} color="currentColor" style={{
                    position: 'absolute', right: -5, bottom: -5,
                    background: 'var(--container-background)', borderRadius: 4,
                    padding: 2, boxSizing: 'content-box',
                  }} />
                )}
              </div>
              <div className="list-item-content">
                <div className="body-text">{label}</div>
                <div className="information-wrapper">
                  <div className="information">{hostname}</div>
                </div>
              </div>
              {isCurrentSite && (
                <Selected size={24} color="var(--accent)" style={{ flexShrink: 0 }} aria-hidden="true" />
              )}
            </a>
          );
        })}
      </div>
    </>
  );
}


function ThemePreviewLight({ accent }: { accent: AccentColor }) {
  const bg = ACCENT_LIGHT_BACKGROUNDS[accent];
  const panel = ACCENT_LIGHT_CONTAINER_BACKGROUNDS[accent];
  const dot = ACCENT_COLORS[accent];
  return (
    <svg viewBox="0 0 160 112" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="112" rx="16" fill={bg}/>
      <rect x="14" y="14" width="132" height="84" rx="12" fill={panel}/>
      <circle cx="34" cy="42" r="7" fill={dot}/>
      <rect x="50" y="37" width="78" height="10" rx="5" fill="#CCCCD0"/>
      <circle cx="34" cy="66" r="7" fill={dot}/>
      <rect x="50" y="61" width="58" height="10" rx="5" fill="#CCCCD0"/>
    </svg>
  );
}

function ThemePreviewDark({ accent }: { accent: AccentColor }) {
  const bg = ACCENT_DARK_BACKGROUNDS[accent];
  const panel = ACCENT_DARK_CONTAINER_BACKGROUNDS[accent];
  const dot = ACCENT_COLORS[accent];
  return (
    <svg viewBox="0 0 160 112" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="112" rx="16" fill={bg}/>
      <rect x="14" y="14" width="132" height="84" rx="12" fill={panel}/>
      <circle cx="34" cy="42" r="7" fill={dot}/>
      <rect x="50" y="37" width="78" height="10" rx="5" fill="#3A3A3E"/>
      <circle cx="34" cy="66" r="7" fill={dot}/>
      <rect x="50" y="61" width="58" height="10" rx="5" fill="#3A3A3E"/>
    </svg>
  );
}

function ThemePreviewAuto({ accent }: { accent: AccentColor }) {
  const lightBg = ACCENT_LIGHT_BACKGROUNDS[accent];
  const lightContainer = ACCENT_LIGHT_CONTAINER_BACKGROUNDS[accent];
  const darkBg = ACCENT_DARK_BACKGROUNDS[accent];
  const darkContainer = ACCENT_DARK_CONTAINER_BACKGROUNDS[accent];
  const dot = ACCENT_COLORS[accent];
  return (
    <svg viewBox="0 0 160 112" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="autoLeft"><polygon points="0,0 100,0 60,112 0,112"/></clipPath>
        <clipPath id="autoRight"><polygon points="100,0 160,0 160,112 60,112"/></clipPath>
      </defs>
      <g clipPath="url(#autoLeft)">
        <rect width="160" height="112" rx="16" fill={lightBg}/>
        <rect x="14" y="14" width="132" height="84" rx="12" fill={lightContainer}/>
        <circle cx="34" cy="42" r="7" fill={dot}/>
        <rect x="50" y="37" width="78" height="10" rx="5" fill="#CCCCD0"/>
        <circle cx="34" cy="66" r="7" fill={dot}/>
        <rect x="50" y="61" width="58" height="10" rx="5" fill="#CCCCD0"/>
      </g>
      <g clipPath="url(#autoRight)">
        <rect width="160" height="112" rx="16" fill={darkBg}/>
        <rect x="14" y="14" width="132" height="84" rx="12" fill={darkContainer}/>
        <circle cx="34" cy="42" r="7" fill={dot}/>
        <rect x="50" y="37" width="78" height="10" rx="5" fill="#3A3A3E"/>
        <circle cx="34" cy="66" r="7" fill={dot}/>
        <rect x="50" y="61" width="58" height="10" rx="5" fill="#3A3A3E"/>
      </g>
    </svg>
  );
}

function SettingsContent() {
  const { theme, setTheme, accentColor, setAccentColor, blurEnabled, setBlurEnabled, cornerSmoothing, setCornerSmoothing, cornerSmoothingSupported, cornerSmoothingAvailable } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentHostname, setCurrentHostname] = useState('');
  const [devOptionsEnabled, setDevOptionsEnabled] = useState(false);
  const { preferences, setPreferences } = useReadingPreferences();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const [backHref, setBackHref] = useState('/');
  useEffect(() => {
    const returnPath = getSettingsReturnPath(from);
    rememberSettingsReturnPath(returnPath);
    setBackHref(returnPath);
  }, [from]);
  const handleThemeKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    currentTheme: ThemeOption,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setTheme(currentTheme);
      return;
    }

    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0;
    if (!direction) return;

    event.preventDefault();
    const currentIndex = THEME_OPTIONS.indexOf(currentTheme);
    const nextTheme = THEME_OPTIONS[
      (currentIndex + direction + THEME_OPTIONS.length) % THEME_OPTIONS.length
    ];
    setTheme(nextTheme);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-theme-option="${nextTheme}"]`)?.focus();
    });
  };

  useEffect(() => {
    setMounted(true);
    setCurrentHostname(window.location.hostname);
  }, []);

  useEffect(() => {
    const checkDevOptions = () => {
      setDevOptionsEnabled(localPreferences.getItem('developer-options-enabled') === 'true');
    };
    checkDevOptions();
    window.addEventListener('developer-options-changed', checkDevOptions);
    return () => window.removeEventListener('developer-options-changed', checkDevOptions);
  }, []);

  const handleDevOptionsChange = (enabled: boolean) => {
    localPreferences.setItem('developer-options-enabled', String(enabled));
    setDevOptionsEnabled(enabled);
    window.dispatchEvent(new Event('developer-options-changed'));
  };

  const blogSettings = (
    <>
      <div className="section-header"><h2 className="title">Blog</h2></div>
      <div className="list-group">
        <div className="list">
          <div className="list-item-content">
            <div className="body-text">Reading layout</div>
            <div className="information-wrapper"><div className="information">Text size, paragraph spacing, and image size</div></div>
          </div>
          <ReadingLayoutMenu compact={preferences.compact} onChange={compact => setPreferences(p => ({ ...p, compact }))} />
        </div>
        <label className="list desktop-focus-option" htmlFor="blog-focus-mode">
          <div className="list-item-content">
            <div className="body-text">Focus mode</div>
            <div className="information-wrapper"><div className="information">Fade navigation until hovered or focused, and hide the search bar while reading</div></div>
          </div>
          <Switch id="blog-focus-mode" checked={preferences.focus} onChange={value => setPreferences(p => ({ ...p, focus: value }))} />
        </label>
        <label className="list" htmlFor="blog-show-search">
          <div className="list-item-content">
            <div className="body-text">Show search bar</div>
            <div className="information-wrapper"><div className="information">Show search on supported posts; hidden while focus mode is on</div></div>
          </div>
          <Switch id="blog-show-search" checked={preferences.search} onChange={value => setPreferences(p => ({ ...p, search: value }))} />
        </label>
      </div>
    </>
  );

  return (
    <>
      <div className="main-content" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards', opacity: 0 }}>
        <TopAppBar
          title="Settings"
          backHref={backHref}
        />
        <div className="settings-layout">
          <div className="settings-column">
            <div className="section-header">
              <h2 className="title">Theme</h2>
            </div>
            <div className="panel" style={{ padding: 'var(--padding-xll)' }}>
              {mounted && (
                <div className="theme-cards" role="radiogroup" aria-label="Theme">
                  <div
                    className={`theme-card${theme === 'auto' ? ' selected' : ''}`}
                    data-theme-option="auto"
                    onClick={() => setTheme('auto')}
                    role="radio"
                    aria-checked={theme === 'auto'}
                    tabIndex={theme === 'auto' ? 0 : -1}
                    onKeyDown={(event) => handleThemeKeyDown(event, 'auto')}
                  >
                    <div className="theme-card-preview">
                      <ThemePreviewAuto accent={accentColor} />
                    </div>
                    <span className="theme-card-label">Auto</span>
                    <div className="theme-card-radio" />
                  </div>
                  <div
                    className={`theme-card${theme === 'light' ? ' selected' : ''}`}
                    data-theme-option="light"
                    onClick={() => setTheme('light')}
                    role="radio"
                    aria-checked={theme === 'light'}
                    tabIndex={theme === 'light' ? 0 : -1}
                    onKeyDown={(event) => handleThemeKeyDown(event, 'light')}
                  >
                    <div className="theme-card-preview">
                      <ThemePreviewLight accent={accentColor} />
                    </div>
                    <span className="theme-card-label">Light</span>
                    <div className="theme-card-radio" />
                  </div>
                  <div
                    className={`theme-card${theme === 'dark' ? ' selected' : ''}`}
                    data-theme-option="dark"
                    onClick={() => setTheme('dark')}
                    role="radio"
                    aria-checked={theme === 'dark'}
                    tabIndex={theme === 'dark' ? 0 : -1}
                    onKeyDown={(event) => handleThemeKeyDown(event, 'dark')}
                  >
                    <div className="theme-card-preview">
                      <ThemePreviewDark accent={accentColor} />
                    </div>
                    <span className="theme-card-label">Dark</span>
                    <div className="theme-card-radio" />
                  </div>
                </div>
              )}
            </div>

            <div className="section-header">
              <h2 className="title">Accent color</h2>
            </div>
            <div
              className="panel accent-color-scroll"
              style={{
                marginBottom: '10px',
                padding: 'var(--padding-xll)',
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none'
              }}
            >
              <style jsx>{`
                .accent-color-scroll {
                  scrollbar-width: none;
                }
                .accent-color-scroll::-webkit-scrollbar {
                  display: none;
                  height: 0;
                  width: 0;
                }
              `}</style>
              <div className="accent-color-selection">
                {mounted && (
                  <>
                    <label className={accentColor === 'blue' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="accentColor"
                        value="blue"
                        checked={accentColor === 'blue'}
                        onChange={() => setAccentColor('blue')}
                      />
                      <div className="accent-color-swatch" style={{ backgroundColor: ACCENT_COLORS.blue }}>
                        {accentColor === 'blue' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 6L11.2672 16.7381C10.9192 17.0873 10.35 17.0873 10.002 16.7381L3 9.73308" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span>Blue</span>
                    </label>
                    <label className={accentColor === 'coral' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="accentColor"
                        value="coral"
                        checked={accentColor === 'coral'}
                        onChange={() => setAccentColor('coral')}
                      />
                      <div className="accent-color-swatch" style={{ backgroundColor: ACCENT_COLORS.coral }}>
                        {accentColor === 'coral' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 6L11.2672 16.7381C10.9192 17.0873 10.35 17.0873 10.002 16.7381L3 9.73308" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span>Coral</span>
                    </label>
                    <label className={accentColor === 'mint' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="accentColor"
                        value="mint"
                        checked={accentColor === 'mint'}
                        onChange={() => setAccentColor('mint')}
                      />
                      <div className="accent-color-swatch" style={{ backgroundColor: ACCENT_COLORS.mint }}>
                        {accentColor === 'mint' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 6L11.2672 16.7381C10.9192 17.0873 10.35 17.0873 10.002 16.7381L3 9.73308" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span>Mint</span>
                    </label>
                    <label className={accentColor === 'lilac' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="accentColor"
                        value="lilac"
                        checked={accentColor === 'lilac'}
                        onChange={() => setAccentColor('lilac')}
                      />
                      <div className="accent-color-swatch" style={{ backgroundColor: ACCENT_COLORS.lilac }}>
                        {accentColor === 'lilac' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 6L11.2672 16.7381C10.9192 17.0873 10.35 17.0873 10.002 16.7381L3 9.73308" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span>Lilac</span>
                    </label>
                    <label className={accentColor === 'mono' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="accentColor"
                        value="mono"
                        checked={accentColor === 'mono'}
                        onChange={() => setAccentColor('mono')}
                      />
                      <div className="accent-color-swatch" style={{ backgroundColor: ACCENT_COLORS.mono }}>
                        {accentColor === 'mono' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 6L11.2672 16.7381C10.9192 17.0873 10.35 17.0873 10.002 16.7381L3 9.73308" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span>Mono</span>
                    </label>
                  </>
                )}
              </div>
            </div>
            <div className="list-group">
              <label htmlFor="progressive-blur-toggle" className="list" style={{ cursor: 'pointer' }}>
                <div className="list-item-content">
                  <div className="body-text">Blur effects</div>
                  <div className="information-wrapper">
                    <div className="information">Enable or disable the blur effects on scroll</div>
                  </div>
                </div>
                <Switch id="progressive-blur-toggle" checked={blurEnabled} onChange={setBlurEnabled} />
              </label>

              {cornerSmoothingAvailable && (
                <label
                  htmlFor="corner-smoothing-toggle"
                  className="list"
                  style={{
                    cursor: cornerSmoothingSupported ? 'pointer' : 'default',
                    opacity: cornerSmoothingSupported ? 1 : 0.45,
                    pointerEvents: cornerSmoothingSupported ? 'auto' : 'none',
                  }}
                >
                  <div className="list-item-content">
                    <div className="body-text">Corner smoothing</div>
                    <div className="information-wrapper">
                      <div className="information">
                        {cornerSmoothingSupported
                          ? 'Smooth the corners of cards, buttons, and other rounded elements'
                          : 'Not supported on this browser'}
                      </div>
                    </div>
                  </div>
                  <Switch id="corner-smoothing-toggle" checked={cornerSmoothing} onChange={setCornerSmoothing} disabled={!cornerSmoothingSupported} />
                </label>
              )}

            </div>

            {devOptionsEnabled && blogSettings}

          </div>
          <div className="settings-column">
            {!devOptionsEnabled && blogSettings}
            {devOptionsEnabled && (
              <>
                <div className="section-header">
                  <h2 className="title">Developer options</h2>
                </div>
                <div className="list-group">
                  <label htmlFor="developer-options-toggle" className="list" style={{ cursor: 'pointer' }}>
                    <div className="list-item-content">
                      <div className="body-text">Use developer options</div>
                    </div>
                    <Switch id="developer-options-toggle" checked={devOptionsEnabled} onChange={handleDevOptionsChange} />
                  </label>
                  <Link href="/settings/feature-flags" className="list">
                    <div className="list-item-content">
                      <div className="body-text">Feature Flags</div>
                      <div className="information-wrapper">
                        <div className="information">Override server side feature flags</div>
                      </div>
                    </div>
                    <div className="list-item-separator" />
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M1 1L7 7L1 13" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link href="/playground" className="list">
                    <div className="list-item-content">
                      <div className="body-text">Component Playground</div>
                      <div className="information-wrapper">
                        <div className="information">Browse and test UI components</div>
                      </div>
                    </div>
                    <div className="list-item-separator" />
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M1 1L7 7L1 13" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </>
            )}
            {devOptionsEnabled && <SiteLinkGroup links={DEVELOPER_SITE_GROUPS.sites} currentHostname={currentHostname} />}
            {devOptionsEnabled && <SiteLinkGroup links={DEVELOPER_SITE_GROUPS.admin} currentHostname={currentHostname} />}
            <div className="section-header" />
            <div className="list-group">
              <Link href="/settings/about" className="list">
                <div className="list-item-content">
                  <div className="body-text">About this site</div>
                </div>
                <div className="list-item-separator" />
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1L7 7L1 13" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        </div>
    </>
  );
}

export default function Settings() {
  return (
    <div className="page settings-page">
      <div className="page-body">
        <Suspense fallback={
          <div className="page-loading-spinner">
            <LoadingDots />
          </div>
        }>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  );
}
