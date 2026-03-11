export type RecruitCategory = "study" | "project" | "hackathon";

export type RecruitPost = {
  id: string;
  slug: string;
  title: string;
  category: RecruitCategory;
  campus: string;
  summary: string;
  description: string;
  roles: string[];
  techStack: string[];
  capacity: number;
  currentMembers: number;
  stage: string;
  deadline: string;
  createdAt: string;
  highlight: boolean;
  ownerName: string;
  ownerRole: string;
  meetingStyle: string;
  schedule: string;
  goal: string;
  expectations: string[];
  perks: string[];
};

export type CreateRecruitPostInput = {
  category: RecruitCategory;
  title: string;
  campus: string;
  summary: string;
  description: string;
  roles: string[];
  techStack: string[];
  capacity: number;
  stage: string;
  deadline: string;
  ownerName: string;
  ownerRole: string;
  meetingStyle: string;
  schedule: string;
  goal: string;
};

export type RecruitApplication = {
  id: string;
  postSlug: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
};

export type CreateRecruitApplicationInput = {
  postSlug: string;
  name: string;
  contact: string;
  message: string;
};
