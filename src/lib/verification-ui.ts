import type { Verification } from "@/types/profile";

export type VerificationBadgeTone = "neutral" | "warning" | "success" | "danger";

export type VerificationUiState = {
  eyebrow: string;
  badgeLabel: string;
  badgeTone: VerificationBadgeTone;
  title: string;
  description: string;
  actionLabel: string;
  actionEnabled: boolean;
};

export function getVerificationUiState(
  verification: Verification | null,
): VerificationUiState {
  if (!verification) {
    return {
      eyebrow: "Verification Preview",
      badgeLabel: "로그인 필요",
      badgeTone: "neutral",
      title: "추가 인증 흐름 미리보기",
      description:
        "학생 세션으로 로그인하면 현재 인증 상태와 제출 폼이 연결됩니다.",
      actionLabel: "로그인 후 인증 시작",
      actionEnabled: false,
    };
  }

  switch (verification.status) {
    case "pending":
      return {
        eyebrow: "Verification Pending",
        badgeLabel: "검토 중",
        badgeTone: "warning",
        title: "제출한 인증 자료를 검토 중입니다.",
        description:
          "현재 요청이 처리될 때까지 같은 계정으로는 새 인증 요청을 보낼 수 없습니다.",
        actionLabel: "검토 중",
        actionEnabled: false,
      };
    case "verified":
      return {
        eyebrow: "Verification Complete",
        badgeLabel: "인증 완료",
        badgeTone: "success",
        title: "프로필 인증이 완료되었습니다.",
        description:
          "프로필과 후속 운영 화면에서 verified badge를 재사용할 수 있는 상태입니다.",
        actionLabel: "인증 완료",
        actionEnabled: false,
      };
    case "rejected":
      return {
        eyebrow: "Verification Retry",
        badgeLabel: "재제출 가능",
        badgeTone: "danger",
        title: "이전 인증 요청이 반려되었습니다.",
        description:
          "반려 사유를 확인한 뒤 수정된 증빙으로 재제출할 수 있습니다.",
        actionLabel: "수정 후 재제출",
        actionEnabled: true,
      };
    case "unverified":
    default:
      return {
        eyebrow: "Verification Setup",
        badgeLabel: "미인증",
        badgeTone: "neutral",
        title: "추가 인증으로 프로필 신뢰도를 높이세요.",
        description:
          "학교 이메일, 학생증, 수동 검토 중 한 방식으로 인증 요청을 제출할 수 있습니다.",
        actionLabel: "인증 요청 제출",
        actionEnabled: true,
      };
  }
}

export function getVerificationMethodLabel(method: Verification["method"]) {
  switch (method) {
    case "campus_email":
      return "학교 이메일";
    case "student_card":
      return "학생증";
    case "manual_review":
      return "수동 검토";
    default:
      return "미제출";
  }
}

export function getVerificationStatusLabel(status: Verification["status"]) {
  switch (status) {
    case "pending":
      return "검토 중";
    case "verified":
      return "인증 완료";
    case "rejected":
      return "반려";
    case "unverified":
    default:
      return "미인증";
  }
}

export function getVerificationBadgeLabel(badge: Verification["badge"]) {
  switch (badge) {
    case "pending":
      return "Pending Badge";
    case "verified":
      return "Verified Badge";
    case "none":
    default:
      return "No Badge";
  }
}

export function getVerificationStatusTone(
  status: Verification["status"] | null,
): VerificationBadgeTone {
  switch (status) {
    case "pending":
      return "warning";
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "unverified":
    default:
      return "neutral";
  }
}
