export type RecruitCategory = "study" | "project" | "hackathon";
export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

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
  updatedAt?: string;
  highlight: boolean;
  ownerId?: string | null;
  deletedAt?: string | null;
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
  ownerId?: string | null;
};

export type RecruitApplication = {
  id: string;
  postSlug: string;
  applicantId?: string | null;
  name: string;
  contact: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
};

export type CreateRecruitApplicationInput = {
  postSlug: string;
  applicantId?: string | null;
  name: string;
  contact: string;
  message: string;
};
