import type {
  IdentityDataSource,
  OnboardingState,
  User,
} from "@/types/identity";

export const collaborationStyleValues = [
  "async_first",
  "hybrid",
  "live_sprint",
  "flexible",
] as const;

export type CollaborationStyle = (typeof collaborationStyleValues)[number];

export const weeklyHoursValues = [
  "under_3",
  "three_to_six",
  "six_to_ten",
  "ten_plus",
  "flexible",
] as const;

export type WeeklyHours = (typeof weeklyHoursValues)[number];

export const externalLinkTypeValues = [
  "portfolio",
  "github",
  "linkedin",
  "blog",
  "other",
] as const;

export type ExternalLinkType = (typeof externalLinkTypeValues)[number];

export type ExternalLink = {
  label: string;
  url: string;
  type: ExternalLinkType;
};

export type Profile = {
  userId: string;
  headline: string;
  intro: string;
  collaborationStyle: CollaborationStyle | null;
  weeklyHours: WeeklyHours | null;
  contactEmail: string | null;
  openToRoles: string[];
  links: ExternalLink[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileRequest = {
  headline?: string;
  intro?: string;
  collaborationStyle?: CollaborationStyle | null;
  weeklyHours?: WeeklyHours | null;
  contactEmail?: string | null;
  openToRoles?: string[];
  links?: ExternalLink[];
};

export const resumeVisibilityValues = ["private", "shared"] as const;

export type ResumeVisibility = (typeof resumeVisibilityValues)[number];

export type ResumeExperience = {
  organization: string;
  role: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
};

export type ResumeProject = {
  title: string;
  description: string;
  techStack: string[];
  linkUrl: string | null;
};

export type Resume = {
  userId: string;
  title: string;
  summary: string;
  skills: string[];
  education: string;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  links: ExternalLink[];
  visibility: ResumeVisibility;
  createdAt: string;
  updatedAt: string;
};

export const resumeSectionKeyValues = [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "links",
] as const;

export type ResumeSectionKey = (typeof resumeSectionKeyValues)[number];

export type ResumeCompleteness = {
  score: number;
  completedSections: ResumeSectionKey[];
  missingSections: ResumeSectionKey[];
};

export type UpdateResumeRequest = {
  title?: string;
  summary?: string;
  skills?: string[];
  education?: string;
  experience?: ResumeExperience[];
  projects?: ResumeProject[];
  links?: ExternalLink[];
  visibility?: ResumeVisibility;
};

export const verificationStatusValues = [
  "unverified",
  "pending",
  "verified",
  "rejected",
] as const;

export type VerificationStatus = (typeof verificationStatusValues)[number];

export const verificationBadgeValues = [
  "none",
  "pending",
  "verified",
] as const;

export type VerificationBadge = (typeof verificationBadgeValues)[number];

export const verificationMethodValues = [
  "campus_email",
  "student_card",
  "manual_review",
] as const;

export type VerificationMethod = (typeof verificationMethodValues)[number];

export type Verification = {
  userId: string;
  status: VerificationStatus;
  badge: VerificationBadge;
  method: VerificationMethod | null;
  evidenceLabel: string | null;
  evidenceUrl: string | null;
  note: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmitVerificationRequest = {
  method: VerificationMethod;
  evidenceLabel?: string | null;
  evidenceUrl?: string | null;
  note?: string | null;
};

export const inquiryCategoryValues = [
  "general",
  "account",
  "verification",
  "resume",
  "report",
] as const;

export type InquiryCategory = (typeof inquiryCategoryValues)[number];

export const inquiryStatusValues = [
  "open",
  "in_review",
  "resolved",
] as const;

export type InquiryStatus = (typeof inquiryStatusValues)[number];

export type Inquiry = {
  id: string;
  userId: string;
  category: InquiryCategory;
  subject: string;
  message: string;
  contactEmail: string;
  status: InquiryStatus;
  resolutionSummary: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type CreateInquiryRequest = {
  category: InquiryCategory;
  subject: string;
  message: string;
  contactEmail?: string | null;
};

export const alertDigestFrequencyValues = [
  "off",
  "daily",
  "weekly",
] as const;

export type AlertDigestFrequency = (typeof alertDigestFrequencyValues)[number];

export type QuietHours = {
  start: string | null;
  end: string | null;
  timezone: string | null;
};

export type AlertPreference = {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  applicationUpdates: boolean;
  verificationUpdates: boolean;
  inquiryReplies: boolean;
  marketingEnabled: boolean;
  digestFrequency: AlertDigestFrequency;
  quietHours: QuietHours;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAlertPreferenceRequest = {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  applicationUpdates?: boolean;
  verificationUpdates?: boolean;
  inquiryReplies?: boolean;
  marketingEnabled?: boolean;
  digestFrequency?: AlertDigestFrequency;
  quietHours?: QuietHours;
};

export type ProfileContextPayload = {
  user: User;
  onboarding: OnboardingState;
  profile: Profile;
  dataSource: IdentityDataSource;
};

export type ResumePayload = {
  resume: Resume;
  completeness: ResumeCompleteness;
  dataSource: IdentityDataSource;
};

export type VerificationPayload = {
  verification: Verification;
  dataSource: IdentityDataSource;
};

export type InquiryListPayload = {
  items: Inquiry[];
  dataSource: IdentityDataSource;
};

export type InquiryPayload = {
  inquiry: Inquiry;
  dataSource: IdentityDataSource;
};

export type AlertPreferencePayload = {
  alertPreference: AlertPreference;
  dataSource: IdentityDataSource;
};

export type ProfileErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "VERIFICATION_ALREADY_PENDING"
  | "VERIFICATION_ALREADY_COMPLETED";
