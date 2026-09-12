"use client";

import Image from "next/image";
import { Education } from "@thatjoshguy/oneui-icons";
import { useLayoutEffect } from "react";
import HomeMesh from "./HomeMesh";
import AnimatedText from "./AnimatedText";

export default function HomeHero({ environmentLabel, isCollege = false }: {
  environmentLabel: "Beta" | "Dev" | null;
  isCollege?: boolean;
}) {
  useLayoutEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry?.type === "reload" && !window.location.hash && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="hero-role-wrapper">
      {environmentLabel && (
        <span className="beta-chip hero-environment-chip">{isCollege ? `College ${environmentLabel}` : environmentLabel}</span>
      )}
      {/* Hero Section */}
      <div className="hero-section">
        <HomeMesh />
        <div className="hero-intro">
          {isCollege && (
            <span className="hero-college-icon" role="img" aria-label="College portfolio">
              <Education size={64} color="currentColor" aria-hidden="true" />
            </span>
          )}
          <span className="hero-subtitle">Hey, I&apos;m</span>
          <h1 className="hero-name">
            <AnimatedText text="Josh Skinner" className="hero-name-entrance" inverse />
          </h1>
          <div className="hero-description">
            <span>aka</span>
            <span className="hero-brand-mark" aria-hidden="true">
              <Image src="/images/home/hero/brand-light.svg" alt="" width={37} height={25} className="hero-theme-asset hero-theme-asset-light" />
              <Image src="/images/home/hero/brand-dark.svg" alt="" width={37} height={25} className="hero-theme-asset hero-theme-asset-dark" />
            </span>
            <span className="hero-alias">That Josh Guy</span>
          </div>
        </div>
        <a href="#about" className="hero-scroll-indicator" aria-label="Scroll to About">
          <Image src="/images/home/hero/arrow-light.svg" alt="" width={76} height={40} className="hero-scroll-arrow hero-theme-asset hero-theme-asset-light" />
          <Image src="/images/home/hero/arrow-dark.svg" alt="" width={76} height={40} className="hero-scroll-arrow hero-theme-asset hero-theme-asset-dark" />
        </a>
      </div>
    </div>
  );
}
