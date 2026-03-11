import { Prisma } from "@prisma/client";
import { normalizeText } from "@/lib/identity";
import {
  applyAlertPreferencePatch,
  applyProfilePatch,
  applyResumePatch,
  buildDefaultAlertPreference,
  buildDefaultProfile,
  buildDefaultResume,
  buildDefaultVerification,
  buildResumeCompleteness,
  sanitizeExternalLinks,
  sanitizeQuietHours,
  sanitizeResumeExperience,
  sanitizeResumeProjects,
  submitVerification,
} from "@/lib/profile";
import { prisma } from "@/lib/server/prisma";
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

const phase2Prisma = prisma as typeof prisma & {
  profile: {
    findUnique: (args: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  resume: {
    findUnique: (args: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  verification: {
    findUnique: (args: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  inquiry: {
    findMany: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
  alertPreference: {
    findUnique: (args: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  };
};

function jsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function mapProfile(record: {
  userId: string;
  headline: string;
  intro: string;
  collaborationStyle: Profile["collaborationStyle"];
  weeklyHours: Profile["weeklyHours"];
  contactEmail: string | null;
  openToRoles: string[];
  links: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): Profile {
  return {
    userId: record.userId,
    headline: record.headline,
    intro: record.intro,
    collaborationStyle: record.collaborationStyle,
    weeklyHours: record.weeklyHours,
    contactEmail: record.contactEmail,
    openToRoles: record.openToRoles,
    links: sanitizeExternalLinks(record.links),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapResume(record: {
  userId: string;
  title: string;
  summary: string;
  skills: string[];
  education: string;
  experience: Prisma.JsonValue;
  projects: Prisma.JsonValue;
  links: Prisma.JsonValue;
  visibility: Resume["visibility"];
  createdAt: Date;
  updatedAt: Date;
}): Resume {
  return {
    userId: record.userId,
    title: record.title,
    summary: record.summary,
    skills: record.skills,
    education: record.education,
    experience: sanitizeResumeExperience(record.experience),
    projects: sanitizeResumeProjects(record.projects),
    links: sanitizeExternalLinks(record.links),
    visibility: record.visibility,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapVerification(record: {
  userId: string;
  status: Verification["status"];
  badge: Verification["badge"];
  method: Verification["method"];
  evidenceLabel: string | null;
  evidenceUrl: string | null;
  note: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Verification {
  return {
    userId: record.userId,
    status: record.status,
    badge: record.badge,
    method: record.method,
    evidenceLabel: record.evidenceLabel,
    evidenceUrl: record.evidenceUrl,
    note: record.note,
    submittedAt: record.submittedAt?.toISOString() ?? null,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    rejectionReason: record.rejectionReason,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapInquiry(record: {
  id: string;
  userId: string;
  category: Inquiry["category"];
  subject: string;
  message: string;
  contactEmail: string;
  status: Inquiry["status"];
  resolutionSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}): Inquiry {
  return {
    id: record.id,
    userId: record.userId,
    category: record.category,
    subject: record.subject,
    message: record.message,
    contactEmail: record.contactEmail,
    status: record.status,
    resolutionSummary: record.resolutionSummary,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    resolvedAt: record.resolvedAt?.toISOString() ?? null,
  };
}

function mapAlertPreference(record: {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  applicationUpdates: boolean;
  verificationUpdates: boolean;
  inquiryReplies: boolean;
  marketingEnabled: boolean;
  digestFrequency: AlertPreference["digestFrequency"];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AlertPreference {
  return {
    userId: record.userId,
    emailEnabled: record.emailEnabled,
    inAppEnabled: record.inAppEnabled,
    applicationUpdates: record.applicationUpdates,
    verificationUpdates: record.verificationUpdates,
    inquiryReplies: record.inquiryReplies,
    marketingEnabled: record.marketingEnabled,
    digestFrequency: record.digestFrequency,
    quietHours: sanitizeQuietHours({
      start: record.quietHoursStart,
      end: record.quietHoursEnd,
      timezone: record.quietHoursTimezone,
    }),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getPrismaProfileContext(input: {
  user: User;
  onboarding: OnboardingState;
}): Promise<ProfileContextRecord> {
  const record = (await phase2Prisma.profile.findUnique({
    where: {
      userId: input.user.id,
    },
  })) as Parameters<typeof mapProfile>[0] | null;

  return {
    user: input.user,
    onboarding: input.onboarding,
    profile: record ? mapProfile(record) : buildDefaultProfile(input.user),
  };
}

export async function updatePrismaProfileContext(input: {
  user: User;
  onboarding: OnboardingState;
  patch: UpdateProfileRequest;
}): Promise<ProfileContextRecord> {
  const current = await getPrismaProfileContext({
    user: input.user,
    onboarding: input.onboarding,
  });
  const nextProfile = applyProfilePatch(current.profile, input.patch);

  const record = (await phase2Prisma.profile.upsert({
    where: {
      userId: input.user.id,
    },
    create: {
      userId: input.user.id,
      headline: nextProfile.headline,
      intro: nextProfile.intro,
      collaborationStyle: nextProfile.collaborationStyle,
      weeklyHours: nextProfile.weeklyHours,
      contactEmail: nextProfile.contactEmail,
      openToRoles: nextProfile.openToRoles,
      links: jsonValue(nextProfile.links),
      createdAt: new Date(nextProfile.createdAt),
    },
    update: {
      headline: nextProfile.headline,
      intro: nextProfile.intro,
      collaborationStyle: nextProfile.collaborationStyle,
      weeklyHours: nextProfile.weeklyHours,
      contactEmail: nextProfile.contactEmail,
      openToRoles: nextProfile.openToRoles,
      links: jsonValue(nextProfile.links),
    },
  })) as Parameters<typeof mapProfile>[0];

  return {
    user: input.user,
    onboarding: input.onboarding,
    profile: mapProfile(record),
  };
}

export async function getPrismaResumeRecord(user: User) {
  const record = (await phase2Prisma.resume.findUnique({
    where: {
      userId: user.id,
    },
  })) as Parameters<typeof mapResume>[0] | null;

  const resume = record ? mapResume(record) : buildDefaultResume(user);

  return {
    resume,
    completeness: buildResumeCompleteness(resume),
  };
}

export async function updatePrismaResumeRecord(
  user: User,
  patch: UpdateResumeRequest,
) {
  const current = await getPrismaResumeRecord(user);
  const nextResume = applyResumePatch(current.resume, patch);

  const record = (await phase2Prisma.resume.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      title: nextResume.title,
      summary: nextResume.summary,
      skills: nextResume.skills,
      education: nextResume.education,
      experience: jsonValue(nextResume.experience),
      projects: jsonValue(nextResume.projects),
      links: jsonValue(nextResume.links),
      visibility: nextResume.visibility,
      createdAt: new Date(nextResume.createdAt),
    },
    update: {
      title: nextResume.title,
      summary: nextResume.summary,
      skills: nextResume.skills,
      education: nextResume.education,
      experience: jsonValue(nextResume.experience),
      projects: jsonValue(nextResume.projects),
      links: jsonValue(nextResume.links),
      visibility: nextResume.visibility,
    },
  })) as Parameters<typeof mapResume>[0];
  const resume = mapResume(record);

  return {
    resume,
    completeness: buildResumeCompleteness(resume),
  };
}

export async function getPrismaVerificationRecord(user: User) {
  const record = (await phase2Prisma.verification.findUnique({
    where: {
      userId: user.id,
    },
  })) as Parameters<typeof mapVerification>[0] | null;

  return record
    ? mapVerification(record)
    : buildDefaultVerification(user.id, user.createdAt);
}

export async function submitPrismaVerificationRequest(
  user: User,
  input: SubmitVerificationRequest,
) {
  const current = await getPrismaVerificationRecord(user);
  const result = submitVerification(current, input);

  if (!result.success) {
    return result;
  }

  const record = (await phase2Prisma.verification.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      status: result.verification.status,
      badge: result.verification.badge,
      method: result.verification.method,
      evidenceLabel: result.verification.evidenceLabel,
      evidenceUrl: result.verification.evidenceUrl,
      note: result.verification.note,
      submittedAt: result.verification.submittedAt
        ? new Date(result.verification.submittedAt)
        : null,
      reviewedAt: null,
      verifiedAt: null,
      rejectionReason: null,
      createdAt: new Date(result.verification.createdAt),
    },
    update: {
      status: result.verification.status,
      badge: result.verification.badge,
      method: result.verification.method,
      evidenceLabel: result.verification.evidenceLabel,
      evidenceUrl: result.verification.evidenceUrl,
      note: result.verification.note,
      submittedAt: result.verification.submittedAt
        ? new Date(result.verification.submittedAt)
        : null,
      reviewedAt: null,
      verifiedAt: null,
      rejectionReason: null,
    },
  })) as Parameters<typeof mapVerification>[0];

  return {
    success: true as const,
    verification: mapVerification(record),
  };
}

export async function listPrismaInquiries(user: User) {
  const records = (await phase2Prisma.inquiry.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as Array<Parameters<typeof mapInquiry>[0]>;

  return records.map(mapInquiry);
}

export async function createPrismaInquiry(
  user: User,
  input: CreateInquiryRequest,
) {
  const record = (await phase2Prisma.inquiry.create({
    data: {
      userId: user.id,
      category: input.category,
      subject: normalizeText(input.subject),
      message: normalizeText(input.message),
      contactEmail: normalizeText(input.contactEmail ?? user.email),
    },
  })) as Parameters<typeof mapInquiry>[0];

  return mapInquiry(record);
}

export async function getPrismaAlertPreferenceRecord(user: User) {
  const record = (await phase2Prisma.alertPreference.findUnique({
    where: {
      userId: user.id,
    },
  })) as Parameters<typeof mapAlertPreference>[0] | null;

  return record
    ? mapAlertPreference(record)
    : buildDefaultAlertPreference(user.id, user.createdAt);
}

export async function updatePrismaAlertPreferenceRecord(
  user: User,
  patch: UpdateAlertPreferenceRequest,
) {
  const current = await getPrismaAlertPreferenceRecord(user);
  const nextPreference = applyAlertPreferencePatch(current, patch);

  const record = (await phase2Prisma.alertPreference.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      emailEnabled: nextPreference.emailEnabled,
      inAppEnabled: nextPreference.inAppEnabled,
      applicationUpdates: nextPreference.applicationUpdates,
      verificationUpdates: nextPreference.verificationUpdates,
      inquiryReplies: nextPreference.inquiryReplies,
      marketingEnabled: nextPreference.marketingEnabled,
      digestFrequency: nextPreference.digestFrequency,
      quietHoursStart: nextPreference.quietHours.start,
      quietHoursEnd: nextPreference.quietHours.end,
      quietHoursTimezone: nextPreference.quietHours.timezone,
      createdAt: new Date(nextPreference.createdAt),
    },
    update: {
      emailEnabled: nextPreference.emailEnabled,
      inAppEnabled: nextPreference.inAppEnabled,
      applicationUpdates: nextPreference.applicationUpdates,
      verificationUpdates: nextPreference.verificationUpdates,
      inquiryReplies: nextPreference.inquiryReplies,
      marketingEnabled: nextPreference.marketingEnabled,
      digestFrequency: nextPreference.digestFrequency,
      quietHoursStart: nextPreference.quietHours.start,
      quietHoursEnd: nextPreference.quietHours.end,
      quietHoursTimezone: nextPreference.quietHours.timezone,
    },
  })) as Parameters<typeof mapAlertPreference>[0];

  return mapAlertPreference(record);
}
