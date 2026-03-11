"use client";

import { getAuthSession } from "@/lib/auth/storage";

export type ProfileShellRole = "student" | "admin";

export type ProfileShellViewModel = {
  role: ProfileShellRole;
  status: "guest" | "ready";
  title: string;
  subtitle: string;
  badge: string;
  ctaHref: string;
  ctaLabel: string;
  summaryCards: Array<{ label: string; value: string }>;
  checklist: string[];
  modules: Array<{ title: string; description: string; state: string }>;
  notes: string[];
};

export function buildProfileShellViewModel(
  role: ProfileShellRole,
): ProfileShellViewModel {
  const session = getAuthSession();

  if (!session) {
    return {
      role,
      status: "guest",
      title:
        role === "admin"
          ? "관리자 프로필 셸 미리보기"
          : "사용자 프로필 셸 미리보기",
      subtitle:
        "아직 Phase 1 A 계약이 고정되지 않아, 현재 브랜치에서는 로그인 이후 연결될 기본 화면 구조만 먼저 제공합니다.",
      badge: "Guest Preview",
      ctaHref: "/login",
      ctaLabel: "로그인하고 연결하기",
      summaryCards: [
        { label: "현재 상태", value: "게스트" },
        { label: "연결 대상", value: role === "admin" ? "관리자 셸" : "사용자 셸" },
        { label: "계약 상태", value: "A 트랙 대기" },
      ],
      checklist: [
        "로그인 세션과 연결될 자리 확보",
        "프로필 완료율 위젯 자리 확보",
        "추가 인증 / 이력서 / 운영 화면 연결 슬롯 확보",
      ],
      modules: [
        {
          title: "Identity Summary",
          description: "A 트랙의 User / Role / Session 계약이 머지되면 실제 값으로 교체됩니다.",
          state: "placeholder",
        },
        {
          title: "Profile Modules",
          description: "프로필, 인증, 이력서, 알림 설정 진입점이 이 셸 안으로 들어옵니다.",
          state: "scaffold",
        },
      ],
      notes: [
        "현재 페이지는 branch-local adapter 기반 임시 셸입니다.",
        "최종 role 판정은 feature/p1-identity-contracts 머지 후 연결합니다.",
      ],
    };
  }

  const isAdminPreview = role === "admin";

  return {
    role,
    status: "ready",
    title: isAdminPreview ? "관리자 기본 프로필 셸" : "사용자 기본 프로필 셸",
    subtitle: isAdminPreview
      ? "운영 역할과 관리자 기본 정보가 들어올 자리를 먼저 고정한 셸입니다."
      : "개인 소개, 관심사, 인증, 이력서 흐름이 연결될 사용자 기본 프로필 셸입니다.",
    badge: isAdminPreview ? "Admin Shell" : "User Shell",
    ctaHref: isAdminPreview ? "/admin/profile" : "/profile",
    ctaLabel: isAdminPreview ? "관리자 셸 열기" : "내 프로필 셸 열기",
    summaryCards: [
      { label: "로그인 ID", value: session.loginId },
      { label: "표시 이름", value: session.name || "이름 미입력" },
      { label: "활동 캠퍼스", value: session.campus || "캠퍼스 미정" },
    ],
    checklist: isAdminPreview
      ? [
          "관리자 역할 배지 자리",
          "콘텐츠 운영 진입 링크 자리",
          "문의 / 알림 운영 큐 연결 자리",
        ]
      : [
          "기본 소개와 관심 키워드 자리",
          "추가 인증 배지 자리",
          "이력서와 GitHub 연결 진입 자리",
        ],
    modules: isAdminPreview
      ? [
          {
            title: "Admin Identity",
            description: "관리자 역할, 소속, 검수 권한 표시 영역",
            state: "phase-1-shell",
          },
          {
            title: "Operations Entry",
            description: "게시글 관리와 운영 도구가 Phase 4에서 연결될 진입 카드",
            state: "future-bridge",
          },
        ]
      : [
          {
            title: "Profile Summary",
            description: "자기소개, 관심 키워드, 완료율이 들어올 상단 요약 영역",
            state: "phase-1-shell",
          },
          {
            title: "Growth Modules",
            description: "추가 인증, 이력서, GitHub, 알림이 연결될 모듈 그리드",
            state: "future-bridge",
          },
        ],
    notes: [
      "현재 role 값은 branch-local adapter 기준입니다.",
      "실제 profile shape와 role source of truth는 A 트랙 머지 후 교체합니다.",
    ],
  };
}
