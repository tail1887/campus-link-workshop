import { recruitPosts } from "@/data/recruit-posts";
import { mergePosts } from "@/lib/recruit";
import type { RecruitApplication, RecruitPost } from "@/types/recruit";

const runtimePosts: RecruitPost[] = [];
const runtimeApplications: RecruitApplication[] = [];

export function listMockPosts() {
  return mergePosts(runtimePosts, recruitPosts);
}

export function findMockPost(slug: string) {
  return listMockPosts().find((post) => post.slug === slug);
}

export function createMockPost(post: RecruitPost) {
  runtimePosts.unshift(post);
  return post;
}

export function listMockApplicationsByApplicant(applicantId: string) {
  return runtimeApplications.filter(
    (application) => application.applicantId === applicantId,
  );
}

export function hasMockDuplicateApplication(postSlug: string, contact: string) {
  const normalizedContact = contact.trim().toLowerCase();
  return runtimeApplications.some(
    (item) =>
      item.postSlug === postSlug &&
      item.contact.trim().toLowerCase() === normalizedContact,
  );
}

export function createMockApplication(application: RecruitApplication) {
  runtimeApplications.unshift(application);
  return application;
}
