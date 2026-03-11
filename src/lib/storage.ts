import { mergePosts } from "@/lib/recruit";
import type { RecruitApplication, RecruitPost } from "@/types/recruit";

const POSTS_KEY = "campus-link.posts.v1";
const APPLICATIONS_KEY = "campus-link.applications.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readArray<T>(key: string): T[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, items: T[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(items));
}

function containsBrokenText(value: string) {
  return value.includes("??") || value.includes("�");
}

function isBrokenStoredPost(post: RecruitPost) {
  return [
    post.title,
    post.campus,
    post.summary,
    post.description,
    post.stage,
    post.ownerName,
    post.ownerRole,
    post.meetingStyle,
    post.schedule,
    post.goal,
    ...post.roles,
    ...post.techStack,
    ...post.expectations,
    ...post.perks,
  ].some(containsBrokenText);
}

export function getStoredPosts() {
  const storedPosts = readArray<RecruitPost>(POSTS_KEY);
  const cleanedPosts = storedPosts.filter((post) => !isBrokenStoredPost(post));

  if (cleanedPosts.length !== storedPosts.length) {
    writeArray(POSTS_KEY, cleanedPosts);
  }

  return cleanedPosts;
}

export function addStoredPost(post: RecruitPost) {
  const nextPosts = mergePosts([post], getStoredPosts());
  writeArray(POSTS_KEY, nextPosts);
}

export function getStoredApplications() {
  return readArray<RecruitApplication>(APPLICATIONS_KEY);
}

export function addStoredApplication(application: RecruitApplication) {
  const items = [application, ...getStoredApplications()];
  writeArray(APPLICATIONS_KEY, items);
}
