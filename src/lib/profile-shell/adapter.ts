import type { AuthContext, Role } from "@/types/identity";

export type ProfileShellRole = Role;

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
  modules: Array<{ title: string; description: string; state: string; href?: string }>;
  notes: string[];
};

export type ProfileEntryViewModel = {
  status: "guest" | "ready";
  title: string;
  subtitle: string;
  recommendedHref: string;
  recommendedLabel: string;
  summaryCards: Array<{ label: string; value: string }>;
  cards: Array<{
    href: string;
    eyebrow: string;
    title: string;
    description: string;
    state: string;
  }>;
  notes: string[];
};

function getRoleRoute(role: ProfileShellRole) {
  return role === "admin" ? "/admin/profile" : "/profile";
}

function getRoleLabel(role: ProfileShellRole) {
  return role === "admin" ? "admin" : "student";
}

export function buildProfileShellViewModel(input: {
  authContext: AuthContext;
  role: ProfileShellRole;
}): ProfileShellViewModel {
  const { authContext, role } = input;

  if (!authContext.authenticated) {
    return {
      role,
      status: "guest",
      title:
        role === "admin"
          ? "관리자 프로필 셸 미리보기"
          : "사용자 프로필 셸 미리보기",
      subtitle:
        "Phase 1 A 계약이 연결되는 전제를 유지하면서, 현재 브랜치에서는 역할별 기본 프로필 화면 구조만 먼저 고정합니다.",
      badge: "Guest Preview",
      ctaHref: "/entry",
      ctaLabel: "역할별 진입 구조 보기",
      summaryCards: [
        { label: "현재 상태", value: "게스트" },
        { label: "대상 셸", value: role === "admin" ? "관리자" : "사용자" },
        { label: "계약 연결", value: "branch-local adapter" },
      ],
      checklist: [
        "로그인 세션 연결 슬롯 유지",
        "기본 프로필 요약 카드 자리 확보",
        "후속 프로필 / 인증 / 운영 모듈 브리지 유지",
      ],
      modules: [
        {
          title: "Identity Summary",
          description:
            "feature/p1-identity-contracts의 AuthContext를 연결하면 실제 사용자 값으로 교체됩니다.",
          state: "placeholder",
        },
        {
          title: role === "admin" ? "Operations Bridge" : "Profile Bridge",
          description:
            role === "admin"
              ? "Phase 4 운영 화면 진입점이 이 셸에서 이어집니다."
              : "Phase 2 프로필, 인증, 이력서 흐름이 이 셸에서 이어집니다.",
          state: "future-bridge",
        },
        ...(role === "student"
          ? [
              {
                title: "Communication Center",
                description:
                  "문의하기, 알림 설정, 사용자 커뮤니케이션 로그가 연결될 Phase 2 D 슬롯",
                state: "phase-2-track",
                href: "/profile/communication",
              },
            ]
          : []),
      ],
      notes: [
        "현재 셸은 branch-local adapter가 게스트/역할 분기만 담당합니다.",
        "실제 role source of truth와 상세 profile shape는 A 트랙 머지 후 교체합니다.",
      ],
    };
  }

  const actualRole = authContext.user.role;
  const isAdminShell = role === "admin";
  const roleMismatch = actualRole !== role;

  return {
    role,
    status: "ready",
    title: isAdminShell ? "관리자 기본 프로필 셸" : "사용자 기본 프로필 셸",
    subtitle: isAdminShell
      ? "운영 역할, 관리자 기본 정보, 후속 운영 도구 진입점을 담는 Phase 1 D 셸입니다."
      : "개인 소개, 관심 키워드, 후속 인증 및 이력서 작업을 연결하는 Phase 1 D 셸입니다.",
    badge: isAdminShell ? "Admin Shell" : "User Shell",
    ctaHref: getRoleRoute(actualRole),
    ctaLabel: roleMismatch
      ? `${actualRole === "admin" ? "관리자" : "사용자"} 기본 셸로 이동`
      : isAdminShell
        ? "관리자 셸 열기"
        : "내 프로필 셸 열기",
    summaryCards: [
      { label: "로그인 이메일", value: authContext.user.email },
      { label: "표시 이름", value: authContext.user.displayName },
      { label: "현재 역할", value: getRoleLabel(actualRole) },
    ],
    checklist: isAdminShell
      ? [
          "관리자 역할 배지 유지",
          "운영 화면 진입 슬롯 유지",
          "문의 / 알림 / 검수 큐 브리지 유지",
        ]
      : [
          "기본 소개 영역 유지",
          "인증 배지 / 이력서 브리지 유지",
          "관심 키워드와 온보딩 상태 연결 유지",
        ],
    modules: isAdminShell
      ? [
          {
            title: "Admin Identity",
            description: "관리자 역할, 소속, 운영 책임 범위를 표시할 상단 요약 영역",
            state: "phase-1-shell",
          },
          {
            title: "Operations Entry",
            description: "콘텐츠 운영, 검수, 문의 처리 화면이 후속 Phase에서 연결될 진입 카드",
            state: "future-bridge",
          },
        ]
      : [
          {
            title: "Profile Summary",
            description: "기본 소개, 캠퍼스, 관심 키워드, 완료율을 연결할 상단 요약 영역",
            state: "phase-1-shell",
          },
          {
            title: "Growth Modules",
            description: "추가 인증, 이력서, GitHub, 알림 설정이 이어질 모듈 그리드",
            state: "future-bridge",
          },
          {
            title: "Communication Center",
            description:
              "문의 제출 흐름, 최근 메시지 로그, 사용자 알림 설정을 연결하는 Phase 2 D 진입 모듈",
            state: "phase-2-track",
            href: "/profile/communication",
          },
        ],
    notes: [
      `현재 인증 컨텍스트의 role source는 ${actualRole}입니다.`,
      roleMismatch
        ? "이 페이지는 다른 역할 셸 미리보기이므로, 기본 CTA는 실제 세션 역할 셸로 되돌립니다."
        : "현재 페이지는 세션 역할과 동일한 기본 셸입니다.",
      "실제 profile detail contract는 Phase 2 프로필 계약 브랜치에서 이 셸 안으로 연결합니다.",
      "Phase 2 D 커뮤니케이션 센터는 /profile/communication 경로에서 branch-local adapter로 먼저 연결됩니다.",
    ],
  };
}

export function buildProfileEntryViewModel(
  authContext: AuthContext,
): ProfileEntryViewModel {
  const recommendedRole = authContext.authenticated ? authContext.user.role : null;

  return {
    status: authContext.authenticated ? "ready" : "guest",
    title: "역할별 프로필 진입 구조",
    subtitle: authContext.authenticated
      ? "현재 세션의 role을 기준으로 기본 셸 진입점을 우선 안내하고, 다른 역할 셸은 preview 경로로 남겨둡니다."
      : "A 트랙 계약이 아직 완전히 고정되지 않은 상황을 감안해, 게스트 상태에서도 사용자/관리자 셸 구조를 함께 미리 볼 수 있습니다.",
    recommendedHref: recommendedRole ? getRoleRoute(recommendedRole) : "/profile",
    recommendedLabel: recommendedRole
      ? `${recommendedRole === "admin" ? "관리자" : "사용자"} 기본 셸 열기`
      : "사용자 셸 미리보기 열기",
    summaryCards: [
      {
        label: "Session",
        value: authContext.authenticated ? "로그인됨" : "게스트",
      },
      {
        label: "Current Identity",
        value: authContext.authenticated ? authContext.user.email : "없음",
      },
      {
        label: "Recommended Role",
        value: recommendedRole ? getRoleLabel(recommendedRole) : "student preview",
      },
    ],
    cards: [
      {
        href: "/profile",
        eyebrow: "User Entry",
        title: "사용자 기본 프로필 셸",
        description:
          "자기소개, 관심 키워드, 추가 인증, 이력서 모듈이 연결될 사용자용 기본 셸입니다.",
        state: recommendedRole === "student" ? "recommended" : "preview",
      },
      {
        href: "/admin/profile",
        eyebrow: "Admin Entry",
        title: "관리자 기본 프로필 셸",
        description:
          "관리자 역할 요약, 운영 진입점, 후속 검수 도구가 연결될 관리자용 기본 셸입니다.",
        state: recommendedRole === "admin" ? "recommended" : "preview",
      },
    ],
    notes: [
      "role-based entry 판정은 현재 세션의 shared AuthContext를 그대로 사용합니다.",
      "세부 profile shape는 이 브랜치에서 고정하지 않고 셸 내부 슬롯만 확보합니다.",
      "후속 브랜치는 이 entry에서 추천 경로와 각 셸의 placeholder 영역을 교체하면 됩니다.",
    ],
  };
}
