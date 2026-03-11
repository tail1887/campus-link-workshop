import type {
  BranchLocalAlertToggle,
  BranchLocalCommunicationThread,
  BranchLocalInquiryStatus,
} from "@/lib/communication-center/adapter";

const INQUIRIES_KEY = "campus-link.branch-local.inquiries.v1";
const ALERTS_KEY = "campus-link.branch-local.alerts.v1";

type BranchLocalInquiryRecord = {
  id: string;
  userId: string;
  title: string;
  categoryLabel: string;
  summary: string;
  status: BranchLocalInquiryStatus;
  statusLabel: string;
  preferredReplyChannel: string;
  createdAt: string;
  lastUpdateAt: string;
};

type BranchLocalAlertRecord = {
  userId: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  toggles: BranchLocalAlertToggle[];
  updatedAt: string;
};

export type BranchLocalCommunicationState = {
  threads: BranchLocalCommunicationThread[];
  toggles: BranchLocalAlertToggle[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export type CreateBranchLocalInquiryInput = {
  userId: string;
  title: string;
  categoryLabel: string;
  message: string;
  preferredReplyChannel: string;
};

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

function writeValue<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value: string) {
  return value.trim();
}

function toThread(record: BranchLocalInquiryRecord): BranchLocalCommunicationThread {
  return {
    id: record.id,
    title: record.title,
    categoryLabel: record.categoryLabel,
    status: record.status,
    statusLabel: record.statusLabel,
    summary: record.summary,
    createdAt: record.createdAt,
    lastUpdateAt: record.lastUpdateAt,
  };
}

export function getBranchLocalCommunicationState(input: {
  userId: string;
  seededThreads: BranchLocalCommunicationThread[];
  seededAlertToggles: BranchLocalAlertToggle[];
}): BranchLocalCommunicationState {
  const inquiryRecords = readArray<BranchLocalInquiryRecord>(INQUIRIES_KEY).filter(
    (item) => item.userId === input.userId,
  );
  const alertRecords = readArray<BranchLocalAlertRecord>(ALERTS_KEY);
  const alertRecord = alertRecords.find((item) => item.userId === input.userId);

  return {
    threads: [...inquiryRecords.map(toThread), ...input.seededThreads].sort((left, right) =>
      right.lastUpdateAt.localeCompare(left.lastUpdateAt),
    ),
    toggles: alertRecord?.toggles ?? input.seededAlertToggles,
    quietHoursEnabled: alertRecord?.quietHoursEnabled ?? false,
    quietHoursStart: alertRecord?.quietHoursStart ?? "22:00",
    quietHoursEnd: alertRecord?.quietHoursEnd ?? "08:00",
  };
}

export function createBranchLocalInquiry(input: CreateBranchLocalInquiryInput) {
  const title = normalizeText(input.title);
  const message = normalizeText(input.message);
  const categoryLabel = normalizeText(input.categoryLabel);
  const preferredReplyChannel = normalizeText(input.preferredReplyChannel);

  if (!title || !message || !categoryLabel || !preferredReplyChannel) {
    return {
      success: false as const,
      error: "문의 제목, 유형, 답변 채널, 내용을 모두 입력해주세요.",
    };
  }

  const createdAt = new Date().toISOString();
  const nextRecord: BranchLocalInquiryRecord = {
    id: `branch-local-inquiry-${Date.now()}`,
    userId: input.userId,
    title,
    categoryLabel,
    summary: message,
    status: "submitted",
    statusLabel: "접수됨",
    preferredReplyChannel,
    createdAt,
    lastUpdateAt: createdAt,
  };

  const records = [nextRecord, ...readArray<BranchLocalInquiryRecord>(INQUIRIES_KEY)];
  writeValue(INQUIRIES_KEY, records);

  return {
    success: true as const,
    thread: toThread(nextRecord),
  };
}

export function saveBranchLocalAlertPreferences(input: {
  userId: string;
  toggles: BranchLocalAlertToggle[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}) {
  const records = readArray<BranchLocalAlertRecord>(ALERTS_KEY);
  const nextRecord: BranchLocalAlertRecord = {
    userId: input.userId,
    quietHoursEnabled: input.quietHoursEnabled,
    quietHoursStart: input.quietHoursStart,
    quietHoursEnd: input.quietHoursEnd,
    toggles: input.toggles,
    updatedAt: new Date().toISOString(),
  };

  const filteredRecords = records.filter((item) => item.userId !== input.userId);
  writeValue(ALERTS_KEY, [nextRecord, ...filteredRecords]);

  return nextRecord;
}
