import { isBrokenRecruitPost, mergePosts } from "@/lib/recruit";
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

export function getStoredPosts() {
  const storedPosts = readArray<RecruitPost>(POSTS_KEY);
  const cleanedPosts = storedPosts.filter((post) => !isBrokenRecruitPost(post));

  if (cleanedPosts.length !== storedPosts.length) {
    writeArray(POSTS_KEY, cleanedPosts);
  }

  return cleanedPosts;
}

export function addStoredPost(post: RecruitPost) {
  const nextPosts = mergePosts([post], getStoredPosts());
  writeArray(POSTS_KEY, nextPosts);
}

export function getStoredPostsByOwner(ownerId: string) {
  return getStoredPosts().filter((post) => post.ownerId === ownerId);
}

export function getStoredApplications() {
  return readArray<RecruitApplication>(APPLICATIONS_KEY);
}

export function addStoredApplication(application: RecruitApplication) {
  const items = [application, ...getStoredApplications()];
  writeArray(APPLICATIONS_KEY, items);
}

export function getStoredApplicationsByApplicant(applicantId: string) {
  return getStoredApplications().filter(
    (application) => application.applicantId === applicantId,
  );
}
