import { routeMetadata } from '../lib/routeMetadata';
import './styles/home.css';
import { getFeaturedStories } from "../lib/featured-stories";
import { getProjects } from "../lib/projects";
import { getPopularStoriesEnabled } from "../lib/getPopularStoriesFlag";
import { getProjectsEnabled } from "../lib/getProjectsEnabledFlag";
import { getMiscSectionEnabled } from "../lib/getMiscSectionFlag";
import { getRecentBlogPostsEnabled } from "../lib/getRecentBlogPostsFlag";
import { getRecentBlogPosts } from "../lib/recent-blog-posts";
import { getHomeProfileFacts } from "../lib/home-profile";
import { getSiteEdition, getSiteContext } from "../lib/siteEdition";
import HomeClient from "./components/HomeClient";
import HomeHero from "./components/HomeHero";
import TopAppBar from "./components/TopAppBar";
import { Suspense } from "react";

// Ensure flags are evaluated per-request (needed for toolbar overrides)
export const dynamic = "force-dynamic";

export default async function Home() {
  const site = await getSiteContext();
  const environmentLabel = site.environment === "development"
    ? "Dev"
    : site.environment === "preview" ? "Beta" : null;

  return (
    <div className="page home-page">
      <div className="page-body">
        <div className="main-content">
          <TopAppBar mobileSettingsHref="/settings?from=%2F" />
          <HomeHero environmentLabel={environmentLabel} isCollege={site.edition === "college"} />
          <Suspense fallback={<div className="home-content-loading" role="status">Loading more about Josh…</div>}>
            <HomeSections />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function HomeSections() {
  const [popularStoriesEnabled, projectsEnabled, miscSectionEnabled, recentBlogPostsEnabled] = await Promise.all([
    getPopularStoriesEnabled(), getProjectsEnabled(), getMiscSectionEnabled(), getRecentBlogPostsEnabled(),
  ]);
  const [featuredStories, projects, recentBlogPosts, profileFacts] = await Promise.all([
    popularStoriesEnabled ? getFeaturedStories() : Promise.resolve([]),
    projectsEnabled ? getProjects() : Promise.resolve([]),
    recentBlogPostsEnabled ? getRecentBlogPosts(6) : Promise.resolve([]),
    getHomeProfileFacts(),
  ]);
  return (
    <HomeClient
      featuredStories={featuredStories}
      projects={projects}
      popularStoriesEnabled={popularStoriesEnabled}
      projectsEnabled={projectsEnabled}
      miscSectionEnabled={miscSectionEnabled}
      recentBlogPostsEnabled={recentBlogPostsEnabled}
      recentBlogPosts={recentBlogPosts}
      profileFacts={profileFacts}
    />
  );
}

export async function generateMetadata() {
  const college = await getSiteEdition() === 'college';
  return routeMetadata('/', college ? 'College Portfolio' : 'That Josh Guy', college ? 'Josh Skinner’s college portfolio and development journals.' : 'Designer, tech journalist and Samsung/Android creator. Explore my articles and design projects.');
}
