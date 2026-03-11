import {
  isValidEmail,
  normalizeOptionalText,
  normalizeText,
} from "@/lib/identity";
import type { User } from "@/types/identity";
import type {
  AlertPreference,
  CollaborationStyle,
  ExternalLink,
  Inquiry,
  Profile,
  QuietHours,
  Resume,
  ResumeCompleteness,
  ResumeExperience,
  ResumeProject,
  ResumeSectionKey,
  SubmitVerificationRequest,
  UpdateAlertPreferenceRequest,
  UpdateProfileRequest,
  UpdateResumeRequest,
  Verification,
  WeeklyHours,
} from "@/types/profile";
import {
  alertDigestFrequencyValues,
  collaborationStyleValues,
  externalLinkTypeValues,
  inquiryCategoryValues,
  resumeSectionKeyValues,
  resumeVisibilityValues,
  verificationMethodValues,
  weeklyHoursValues,
} from "@/types/profile";

const quietHoursPattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCollaborationStyle(
  value: unknown,
): value is CollaborationStyle {
  return (
    typeof value === "string" &&
    collaborationStyleValues.includes(value as CollaborationStyle)
  );
}

export function isWeeklyHours(value: unknown): value is WeeklyHours {
  return (
    typeof value === "string" &&
    weeklyHoursValues.includes(value as WeeklyHours)
  );
}

export function isExternalLink(value: unknown): value is ExternalLink {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.label === "string" &&
    value.label.trim().length > 0 &&
    typeof value.url === "string" &&
    isValidHttpUrl(value.url) &&
    typeof value.type === "string" &&
    externalLinkTypeValues.includes(value.type as ExternalLink["type"])
  );
}

export function isResumeExperience(value: unknown): value is ResumeExperience {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.organization === "string" &&
    typeof value.role === "string" &&
    typeof value.description === "string" &&
    (value.startDate === null || typeof value.startDate === "string") &&
    (value.endDate === null || typeof value.endDate === "string")
  );
}

export function isResumeProject(value: unknown): value is ResumeProject {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.techStack) &&
    value.techStack.every((item) => typeof item === "string") &&
    (value.linkUrl === null || typeof value.linkUrl === "string")
  );
}

export function isResumeVisibility(
  value: unknown,
): value is Resume["visibility"] {
  return (
    typeof value === "string" &&
    resumeVisibilityValues.includes(value as Resume["visibility"])
  );
}

export function isVerificationMethod(
  value: unknown,
): value is SubmitVerificationRequest["method"] {
  return (
    typeof value === "string" &&
    verificationMethodValues.includes(value as SubmitVerificationRequest["method"])
  );
}

export function isInquiryCategory(
  value: unknown,
): value is Inquiry["category"] {
  return (
    typeof value === "string" &&
    inquiryCategoryValues.includes(value as Inquiry["category"])
  );
}

export function isAlertDigestFrequency(
  value: unknown,
): value is AlertPreference["digestFrequency"] {
  return (
    typeof value === "string" &&
    alertDigestFrequencyValues.includes(value as AlertPreference["digestFrequency"])
  );
}

export function isQuietHours(value: unknown): value is QuietHours {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isQuietHoursTime(value.start) &&
    isQuietHoursTime(value.end) &&
    (value.timezone === null || typeof value.timezone === "string")
  );
}

export function normalizeStringList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function normalizeExternalLinks(values: ExternalLink[]) {
  const deduped = new Map<string, ExternalLink>();

  for (const value of values) {
    const label = normalizeText(value.label);
    const url = normalizeText(value.url);

    if (!label || !isValidHttpUrl(url)) {
      continue;
    }

    const key = `${value.type}:${url}`;
    deduped.set(key, {
      label,
      url,
      type: value.type,
    });
  }

  return [...deduped.values()];
}

export function normalizeResumeExperience(values: ResumeExperience[]) {
  return values
    .map((value) => ({
      organization: normalizeText(value.organization),
      role: normalizeText(value.role),
      description: normalizeText(value.description),
      startDate: normalizeOptionalText(value.startDate),
      endDate: normalizeOptionalText(value.endDate),
    }))
    .filter((value) => value.organization || value.role || value.description);
}

export function normalizeResumeProjects(values: ResumeProject[]) {
  return values
    .map((value) => ({
      title: normalizeText(value.title),
      description: normalizeText(value.description),
      techStack: normalizeStringList(value.techStack),
      linkUrl: normalizeOptionalHttpUrl(value.linkUrl),
    }))
    .filter((value) => value.title || value.description || value.techStack.length > 0);
}

export function sanitizeExternalLinks(value: unknown): ExternalLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeExternalLinks(value.filter(isExternalLink));
}

export function sanitizeResumeExperience(value: unknown): ResumeExperience[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeResumeExperience(value.filter(isResumeExperience));
}

export function sanitizeResumeProjects(value: unknown): ResumeProject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeResumeProjects(value.filter(isResumeProject));
}

export function sanitizeQuietHours(value: unknown): QuietHours {
  if (!isQuietHours(value)) {
    return {
      start: null,
      end: null,
      timezone: null,
    };
  }

  return {
    start: normalizeQuietHoursTime(value.start),
    end: normalizeQuietHoursTime(value.end),
    timezone: normalizeOptionalText(value.timezone),
  };
}

export function buildDefaultProfile(user: User): Profile {
  return {
    userId: user.id,
    headline: "",
    intro: "",
    collaborationStyle: null,
    weeklyHours: null,
    contactEmail: user.email,
    openToRoles: [],
    links: [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function applyProfilePatch(
  current: Profile,
  patch: UpdateProfileRequest,
) {
  return {
    ...current,
    headline:
      patch.headline === undefined ? current.headline : normalizeText(patch.headline),
    intro: patch.intro === undefined ? current.intro : normalizeText(patch.intro),
    collaborationStyle:
      patch.collaborationStyle === undefined
        ? current.collaborationStyle
        : patch.collaborationStyle,
    weeklyHours:
      patch.weeklyHours === undefined ? current.weeklyHours : patch.weeklyHours,
    contactEmail:
      patch.contactEmail === undefined
        ? current.contactEmail
        : normalizeOptionalText(patch.contactEmail),
    openToRoles:
      patch.openToRoles === undefined
        ? current.openToRoles
        : normalizeStringList(patch.openToRoles),
    links: patch.links === undefined ? current.links : normalizeExternalLinks(patch.links),
    updatedAt: new Date().toISOString(),
  };
}

export function buildDefaultResume(user: User): Resume {
  return {
    userId: user.id,
    title: `${user.displayName} Resume`,
    summary: "",
    skills: [],
    education: "",
    experience: [],
    projects: [],
    links: [],
    visibility: "private",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function applyResumePatch(current: Resume, patch: UpdateResumeRequest): Resume {
  return {
    ...current,
    title: patch.title === undefined ? current.title : normalizeText(patch.title),
    summary: patch.summary === undefined ? current.summary : normalizeText(patch.summary),
    skills:
      patch.skills === undefined ? current.skills : normalizeStringList(patch.skills),
    education:
      patch.education === undefined ? current.education : normalizeText(patch.education),
    experience:
      patch.experience === undefined
        ? current.experience
        : normalizeResumeExperience(patch.experience),
    projects:
      patch.projects === undefined
        ? current.projects
        : normalizeResumeProjects(patch.projects),
    links: patch.links === undefined ? current.links : normalizeExternalLinks(patch.links),
    visibility:
      patch.visibility === undefined ? current.visibility : patch.visibility,
    updatedAt: new Date().toISOString(),
  };
}

export function buildResumeCompleteness(resume: Resume): ResumeCompleteness {
  const checks: Record<ResumeSectionKey, boolean> = {
    summary: resume.summary.trim().length > 0,
    skills: resume.skills.length > 0,
    education: resume.education.trim().length > 0,
    experience: resume.experience.length > 0,
    projects: resume.projects.length > 0,
    links: resume.links.length > 0,
  };

  const completedSections = resumeSectionKeyValues.filter((key) => checks[key]);
  const missingSections = resumeSectionKeyValues.filter((key) => !checks[key]);

  return {
    score: Math.round((completedSections.length / resumeSectionKeyValues.length) * 100),
    completedSections,
    missingSections,
  };
}

export function buildDefaultVerification(
  userId: string,
  createdAt = new Date().toISOString(),
): Verification {
  return {
    userId,
    status: "unverified",
    badge: "none",
    method: null,
    evidenceLabel: null,
    evidenceUrl: null,
    note: null,
    submittedAt: null,
    reviewedAt: null,
    verifiedAt: null,
    rejectionReason: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function submitVerification(
  current: Verification,
  input: SubmitVerificationRequest,
):
  | { success: true; verification: Verification }
  | { success: false; errorCode: "VERIFICATION_ALREADY_PENDING" | "VERIFICATION_ALREADY_COMPLETED" } {
  if (current.status === "pending") {
    return {
      success: false,
      errorCode: "VERIFICATION_ALREADY_PENDING",
    };
  }

  if (current.status === "verified") {
    return {
      success: false,
      errorCode: "VERIFICATION_ALREADY_COMPLETED",
    };
  }

  const submittedAt = new Date().toISOString();

  return {
    success: true,
    verification: {
      ...current,
      status: "pending",
      badge: "pending",
      method: input.method,
      evidenceLabel: normalizeOptionalText(input.evidenceLabel),
      evidenceUrl: normalizeOptionalHttpUrl(input.evidenceUrl),
      note: normalizeOptionalText(input.note),
      submittedAt,
      reviewedAt: null,
      verifiedAt: null,
      rejectionReason: null,
      updatedAt: submittedAt,
    },
  };
}

export function buildDefaultAlertPreference(
  userId: string,
  createdAt = new Date().toISOString(),
): AlertPreference {
  return {
    userId,
    emailEnabled: true,
    inAppEnabled: true,
    applicationUpdates: true,
    verificationUpdates: true,
    inquiryReplies: true,
    marketingEnabled: false,
    digestFrequency: "weekly",
    quietHours: {
      start: null,
      end: null,
      timezone: null,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export function applyAlertPreferencePatch(
  current: AlertPreference,
  patch: UpdateAlertPreferenceRequest,
): AlertPreference {
  return {
    ...current,
    emailEnabled:
      patch.emailEnabled === undefined ? current.emailEnabled : patch.emailEnabled,
    inAppEnabled:
      patch.inAppEnabled === undefined ? current.inAppEnabled : patch.inAppEnabled,
    applicationUpdates:
      patch.applicationUpdates === undefined
        ? current.applicationUpdates
        : patch.applicationUpdates,
    verificationUpdates:
      patch.verificationUpdates === undefined
        ? current.verificationUpdates
        : patch.verificationUpdates,
    inquiryReplies:
      patch.inquiryReplies === undefined
        ? current.inquiryReplies
        : patch.inquiryReplies,
    marketingEnabled:
      patch.marketingEnabled === undefined
        ? current.marketingEnabled
        : patch.marketingEnabled,
    digestFrequency:
      patch.digestFrequency === undefined
        ? current.digestFrequency
        : patch.digestFrequency,
    quietHours:
      patch.quietHours === undefined
        ? current.quietHours
        : sanitizeQuietHours(patch.quietHours),
    updatedAt: new Date().toISOString(),
  };
}

export function createInquiryRecord(input: {
  id: string;
  userId: string;
  category: Inquiry["category"];
  subject: string;
  message: string;
  contactEmail: string;
}): Inquiry {
  const createdAt = new Date().toISOString();

  return {
    id: input.id,
    userId: input.userId,
    category: input.category,
    subject: normalizeText(input.subject),
    message: normalizeText(input.message),
    contactEmail: normalizeText(input.contactEmail),
    status: "open",
    resolutionSummary: null,
    createdAt,
    updatedAt: createdAt,
    resolvedAt: null,
  };
}

export function hasValidContactEmail(value: string | null | undefined) {
  return Boolean(value && isValidEmail(value));
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeOptionalHttpUrl(value?: string | null) {
  const normalized = normalizeOptionalText(value);

  if (!normalized || !isValidHttpUrl(normalized)) {
    return null;
  }

  return normalized;
}

function isQuietHoursTime(value: unknown) {
  return (
    value === null ||
    (typeof value === "string" &&
      value.trim().length > 0 &&
      quietHoursPattern.test(value.trim()))
  );
}

function normalizeQuietHoursTime(value: string | null) {
  const normalized = normalizeOptionalText(value);

  if (!normalized || !quietHoursPattern.test(normalized)) {
    return null;
  }

  return normalized;
}
