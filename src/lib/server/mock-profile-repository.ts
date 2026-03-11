import { randomUUID } from "node:crypto";
import {
  applyAlertPreferencePatch,
  applyProfilePatch,
  applyResumePatch,
  buildDefaultAlertPreference,
  buildDefaultProfile,
  buildDefaultResume,
  buildDefaultVerification,
  buildResumeCompleteness,
  createInquiryRecord,
  submitVerification,
} from "@/lib/profile";
import type { OnboardingState, User } from "@/types/identity";
import type {
  AlertPreference,
  CreateInquiryRequest,
  Inquiry,
  Profile,
  Resume,
  SubmitVerificationRequest,
  UpdateAlertPreferenceRequest,
  UpdateProfileRequest,
  UpdateResumeRequest,
  Verification,
} from "@/types/profile";

type ProfileContextRecord = {
  user: User;
  onboarding: OnboardingState;
  profile: Profile;
};

const seedCreatedAt = new Date("2026-03-11T00:00:00.000Z").toISOString();

const mockProfiles = new Map<string, Profile>([
  [
    "user_demo_student",
    {
      userId: "user_demo_student",
      headline: "Frontend builder for sprint-paced campus projects",
      intro: "I like turning rough ideas into polished demo flows with steady async follow-through.",
      collaborationStyle: "hybrid",
      weeklyHours: "six_to_ten",
      contactEmail: "student@campus-link.demo",
      openToRoles: ["frontend", "product"],
      links: [
        {
          label: "GitHub",
          url: "https://github.com/campus-link-demo",
          type: "github",
        },
      ],
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
  ],
  [
    "user_demo_admin",
    {
      userId: "user_demo_admin",
      headline: "Operations owner for the Campus Link demo service",
      intro: "I keep the mock ops, moderation, and support queues tidy for workshop demos.",
      collaborationStyle: "async_first",
      weeklyHours: "ten_plus",
      contactEmail: "admin@campus-link.demo",
      openToRoles: ["operations"],
      links: [],
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
  ],
]);

const mockResumes = new Map<string, Resume>([
  [
    "user_demo_student",
    {
      userId: "user_demo_student",
      title: "Kim Jungle Resume",
      summary: "Frontend-focused collaborator for product demos and hackathon prototypes.",
      skills: ["Next.js", "TypeScript", "UI Prototyping"],
      education: "Krafton Jungle",
      experience: [
        {
          organization: "Campus Sprint Team",
          role: "Frontend Lead",
          description: "Built landing, detail, and application flows for workshop demos.",
          startDate: "2025-12",
          endDate: null,
        },
      ],
      projects: [
        {
          title: "Campus Link",
          description: "Recruiting demo platform for campus teams.",
          techStack: ["Next.js", "Prisma"],
          linkUrl: "https://example.com/campus-link",
        },
      ],
      links: [
        {
          label: "Portfolio",
          url: "https://example.com/portfolio",
          type: "portfolio",
        },
      ],
      visibility: "shared",
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
  ],
]);

const mockVerifications = new Map<string, Verification>([
  [
    "user_demo_admin",
    {
      userId: "user_demo_admin",
      status: "verified",
      badge: "verified",
      method: "manual_review",
      evidenceLabel: "Campus Link ops account",
      evidenceUrl: null,
      note: "Verified during Phase 2 contract seeding.",
      submittedAt: seedCreatedAt,
      reviewedAt: seedCreatedAt,
      verifiedAt: seedCreatedAt,
      rejectionReason: null,
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
  ],
]);

const mockAlertPreferences = new Map<string, AlertPreference>([
  [
    "user_demo_student",
    {
      userId: "user_demo_student",
      emailEnabled: true,
      inAppEnabled: true,
      applicationUpdates: true,
      verificationUpdates: true,
      inquiryReplies: true,
      marketingEnabled: false,
      digestFrequency: "weekly",
      quietHours: {
        start: "23:00",
        end: "08:00",
        timezone: "Asia/Seoul",
      },
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
  ],
]);

const mockInquiries = new Map<string, Inquiry[]>([
  [
    "user_demo_student",
    [
      {
        id: "inq_demo_student_1",
        userId: "user_demo_student",
        category: "general",
        subject: "Demo support timeline",
        message: "When will support replies show up in the communication center?",
        contactEmail: "student@campus-link.demo",
        status: "resolved",
        resolutionSummary: "Replies will appear after the Phase 4 operations inbox lands.",
        createdAt: seedCreatedAt,
        updatedAt: seedCreatedAt,
        resolvedAt: seedCreatedAt,
      },
    ],
  ],
]);

function ensureProfile(user: User) {
  const existing = mockProfiles.get(user.id);

  if (existing) {
    return existing;
  }

  const created = buildDefaultProfile(user);
  mockProfiles.set(user.id, created);
  return created;
}

function ensureResume(user: User) {
  const existing = mockResumes.get(user.id);

  if (existing) {
    return existing;
  }

  const created = buildDefaultResume(user);
  mockResumes.set(user.id, created);
  return created;
}

function ensureVerification(user: User) {
  const existing = mockVerifications.get(user.id);

  if (existing) {
    return existing;
  }

  const created = buildDefaultVerification(user.id, user.createdAt);
  mockVerifications.set(user.id, created);
  return created;
}

function ensureAlertPreference(user: User) {
  const existing = mockAlertPreferences.get(user.id);

  if (existing) {
    return existing;
  }

  const created = buildDefaultAlertPreference(user.id, user.createdAt);
  mockAlertPreferences.set(user.id, created);
  return created;
}

export function getMockProfileContext(input: {
  user: User;
  onboarding: OnboardingState;
}): ProfileContextRecord {
  return {
    user: input.user,
    onboarding: input.onboarding,
    profile: ensureProfile(input.user),
  };
}

export function updateMockProfileContext(input: {
  user: User;
  onboarding: OnboardingState;
  patch: UpdateProfileRequest;
}): ProfileContextRecord {
  const nextProfile = applyProfilePatch(ensureProfile(input.user), input.patch);
  mockProfiles.set(input.user.id, nextProfile);

  return {
    user: input.user,
    onboarding: input.onboarding,
    profile: nextProfile,
  };
}

export function getMockResumeRecord(user: User) {
  const resume = ensureResume(user);

  return {
    resume,
    completeness: buildResumeCompleteness(resume),
  };
}

export function updateMockResumeRecord(user: User, patch: UpdateResumeRequest) {
  const nextResume = applyResumePatch(ensureResume(user), patch);
  mockResumes.set(user.id, nextResume);

  return {
    resume: nextResume,
    completeness: buildResumeCompleteness(nextResume),
  };
}

export function getMockVerificationRecord(user: User) {
  return ensureVerification(user);
}

export function submitMockVerificationRequest(
  user: User,
  input: SubmitVerificationRequest,
) {
  const result = submitVerification(ensureVerification(user), input);

  if (!result.success) {
    return result;
  }

  mockVerifications.set(user.id, result.verification);
  return result;
}

export function listMockInquiries(user: User) {
  return [...(mockInquiries.get(user.id) ?? [])].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function createMockInquiry(user: User, input: CreateInquiryRequest) {
  const inquiry = createInquiryRecord({
    id: randomUUID(),
    userId: user.id,
    category: input.category,
    subject: input.subject,
    message: input.message,
    contactEmail: input.contactEmail ?? user.email,
  });

  const current = mockInquiries.get(user.id) ?? [];
  mockInquiries.set(user.id, [inquiry, ...current]);

  return inquiry;
}

export function getMockAlertPreferenceRecord(user: User) {
  return ensureAlertPreference(user);
}

export function updateMockAlertPreferenceRecord(
  user: User,
  patch: UpdateAlertPreferenceRequest,
) {
  const nextPreference = applyAlertPreferencePatch(
    ensureAlertPreference(user),
    patch,
  );
  mockAlertPreferences.set(user.id, nextPreference);
  return nextPreference;
}
