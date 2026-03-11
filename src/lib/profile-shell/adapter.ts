import {
  getVerificationBadgeLabel,
  getVerificationStatusLabel,
} from "@/lib/verification-ui";
import { buildAvatarDataUrl } from "@/lib/avatar";
import type { Profile } from "@/types/profile";
import type { AuthContext, Role } from "@/types/identity";
import type { Verification } from "@/types/profile";

export type ProfileShellRole = Role;

export type ProfileShellViewModel = {
  role: ProfileShellRole;
  status: "guest" | "ready";
  title: string;
  subtitle: string;
  badge: string;
  avatar: {
    src: string;
    alt: string;
  };
  identity: {
    name: string;
    roleLabel: string;
    headline: string;
    campus: string;
  };
  ctaHref: string;
  ctaLabel: string;
  verificationSummary: {
    label: string;
    state: string;
    status: Verification["status"];
    href: string;
  } | null;
  summaryCards: Array<{ label: string; value: string }>;
  managementLinks: Array<{
    title: string;
    description: string;
    href: string;
    value?: string;
  }>;
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
  eyebrow: string;
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
  verification?: Verification | null;
  profile?: Profile | null;
  managedPostCount?: number;
  applicationCount?: number;
}): ProfileShellViewModel {
  const {
    authContext,
    role,
    verification = null,
    profile = null,
    managedPostCount = 0,
    applicationCount = 0,
  } = input;

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
      avatar: {
        src: buildAvatarDataUrl(`guest:${role}`, role === "admin" ? "관리자" : "사용자"),
        alt: "게스트 프로필 이미지",
      },
      identity: {
        name: role === "admin" ? "관리자 미리보기" : "사용자 미리보기",
        roleLabel: role === "admin" ? "admin" : "student",
        headline: "로그인 후 실제 프로필 요약과 관리 메뉴가 채워집니다.",
        campus: "세션 없음",
      },
      ctaHref: "/entry",
      ctaLabel: "역할별 진입 구조 보기",
      verificationSummary: null,
      summaryCards: [
        { label: "현재 상태", value: "게스트" },
        { label: "대상 셸", value: role === "admin" ? "관리자" : "사용자" },
        { label: "계약 연결", value: "branch-local adapter" },
      ],
      managementLinks: role === "student"
        ? [
            {
              title: "내 모집 글 관리",
              description: "로그인 후 내가 작성한 모집글을 다시 열고 관리합니다.",
              href: "/profile/recruits",
            },
            {
              title: "내 참가 글 관리",
              description: "로그인 후 지원한 모집글과 접수 상태를 확인합니다.",
              href: "/profile/applications",
            },
          ]
        : [],
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
                title: "Resume Workspace",
                description:
                  "기본 이력서 편집, completeness 확인, profile-linked helper가 연결될 Phase 2 C 진입점",
                state: "phase-2-track",
                href: "/resume",
              },
              {
                title: "My Recruit Posts",
                description:
                  "현재 세션으로 작성한 모집글을 모아 보고 상세 화면으로 다시 진입하는 관리 화면",
                state: "management",
                href: "/profile/recruits",
              },
              {
                title: "My Applications",
                description:
                  "현재 세션으로 지원한 모집글과 접수 상태를 확인하는 참가 관리 화면",
                state: "management",
                href: "/profile/applications",
              },
              {
                title: "GitHub Analysis",
                description:
                  "GitHub 등록, 연결 상태 관리, AI 프로젝트 분석 결과 UI를 다루는 Phase 3 B 진입점",
                state: "phase-3-track",
                href: "/github-analysis",
              },
              {
                title: "Communication Center",
                description:
                  "문의하기, 알림 설정, 사용자 커뮤니케이션 로그가 연결될 Phase 2 D 슬롯",
                state: "phase-2-track",
                href: "/profile/communication",
              },
              {
                title: "Verification Center",
                description:
                  "추가 인증 제출, 상태 확인, badge preview가 연결될 Phase 2 B 슬롯",
                state: "phase-2-track",
                href: "/verification",
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
  const verificationSummary =
    verification && actualRole === "student"
      ? {
          label: getVerificationBadgeLabel(verification.badge),
          state: getVerificationStatusLabel(verification.status),
          status: verification.status,
          href: "/verification",
        }
      : null;

  return {
    role,
    status: "ready",
    title: isAdminShell ? "관리자 기본 프로필 셸" : "사용자 기본 프로필 셸",
    subtitle: isAdminShell
      ? "운영 역할, 관리자 기본 정보, 후속 운영 도구 진입점을 담는 Phase 1 D 셸입니다."
      : profile?.headline
        ? profile.headline
        : "개인 소개, 관심 키워드, 후속 인증 및 이력서 작업을 연결하는 Phase 1 D 셸입니다.",
    badge: isAdminShell ? "Admin Shell" : "User Shell",
    avatar: {
      src: buildAvatarDataUrl(authContext.user.id, authContext.user.displayName),
      alt: `${authContext.user.displayName} 프로필 이미지`,
    },
    identity: {
      name: authContext.user.displayName,
      roleLabel: actualRole === "admin" ? "admin" : "student",
      headline:
        profile?.intro ||
        (actualRole === "admin"
          ? "운영 표면과 검수 흐름을 관리하는 관리자 세션입니다."
          : "캠퍼스 프로젝트와 스터디 흐름을 관리하는 사용자 세션입니다."),
      campus: authContext.user.campus ?? "캠퍼스 미입력",
    },
    ctaHref: getRoleRoute(actualRole),
    ctaLabel: roleMismatch
      ? `${actualRole === "admin" ? "관리자" : "사용자"} 기본 셸로 이동`
      : isAdminShell
        ? "관리자 셸 열기"
        : "내 프로필 셸 열기",
    verificationSummary,
    summaryCards: [
      { label: "로그인 이메일", value: authContext.user.email },
      { label: "표시 이름", value: authContext.user.displayName },
      {
        label: actualRole === "student" ? "인증 상태" : "현재 역할",
        value:
          actualRole === "student" && verification
            ? getVerificationStatusLabel(verification.status)
            : getRoleLabel(actualRole),
      },
    ],
    managementLinks:
      actualRole === "student"
        ? [
            {
              title: "내 모집 글 관리",
              description: "작성한 모집글을 다시 열고 상세 화면으로 바로 이동합니다.",
              href: "/profile/recruits",
              value: `${managedPostCount}개`,
            },
            {
              title: "내 참가 글 관리",
              description: "지원한 모집글과 현재 접수 상태를 한 곳에서 확인합니다.",
              href: "/profile/applications",
              value: `${applicationCount}건`,
            },
          ]
        : [],
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
          {
            title: "GitHub Analysis Reuse",
            description:
              "학생 GitHub 연결 상태와 프로젝트 분석 요약을 운영 표면에서 재사용할 Phase 3 B handoff 진입점",
            state: "phase-3-track",
            href: "/github-analysis",
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
            title: "My Recruit Posts",
            description:
              "로그인한 학생이 현재 세션으로 작성한 모집글을 다시 열고 관리하는 화면",
            state: "management",
            href: "/profile/recruits",
          },
          {
            title: "My Applications",
            description:
              "로그인한 학생이 지원한 모집글과 접수 상태를 확인하는 화면",
            state: "management",
            href: "/profile/applications",
          },
          {
            title: "GitHub Analysis",
            description:
              "GitHub 등록, 연결 상태 관리, branch-local 프로젝트 분석 결과를 다루는 Phase 3 B 워크스페이스",
            state: "phase-3-track",
            href: "/github-analysis",
          },
          {
            title: "Resume Workspace",
            description:
              "기본 이력서 편집, completeness, profile-linked helper를 다루는 Phase 2 C 워크스페이스",
            state: "phase-2-track",
            href: "/resume",
          },
          {
            title: "Verification Center",
            description:
              "추가 인증 제출, 현재 검토 상태, badge display state를 보여주는 Phase 2 B 화면",
            state: verification ? getVerificationStatusLabel(verification.status) : "ready",
            href: "/verification",
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
      "Phase 3 B GitHub 분석 워크스페이스는 /github-analysis 경로에서 branch-local adapter와 canned analysis UI로 먼저 연결됩니다.",
    ],
  };
}

export function buildProfileEntryViewModel(
  authContext: AuthContext,
  verification?: Verification | null,
): ProfileEntryViewModel {
  const recommendedRole = authContext.authenticated ? authContext.user.role : null;
  const userProfileHref = authContext.authenticated ? "/profile" : "/login?next=%2Fprofile";
  const verificationHref = authContext.authenticated
    ? "/verification"
    : "/login?next=%2Fverification";
  const adminProfileHref = authContext.authenticated
    ? "/admin/profile"
    : "/login?next=%2Fadmin%2Fprofile";

  return {
    status: authContext.authenticated ? "ready" : "guest",
    title: "프로필 기능 둘러보기",
    subtitle: authContext.authenticated
      ? "현재 로그인 상태에 맞는 기본 프로필 화면과 주요 기능으로 바로 이동할 수 있습니다."
      : "로그인하면 내 모집글, 지원 현황, 인증, 이력서 같은 프로필 기능으로 자연스럽게 이어집니다.",
    recommendedHref: recommendedRole ? getRoleRoute(recommendedRole) : userProfileHref,
    recommendedLabel: recommendedRole
      ? `${recommendedRole === "admin" ? "운영자" : "내"} 프로필 열기`
      : "로그인하고 프로필 시작하기",
    eyebrow:
      recommendedRole === "student" && verification
        ? getVerificationBadgeLabel(verification.badge)
        : "Profile Entry",
    summaryCards: [
      {
        label: "세션 상태",
        value: authContext.authenticated ? "로그인됨" : "로그인 필요",
      },
      {
        label: "현재 계정",
        value: authContext.authenticated ? authContext.user.email : "게스트",
      },
      {
        label: recommendedRole === "student" ? "인증 상태" : "추천 경로",
        value:
          recommendedRole === "student" && verification
            ? getVerificationStatusLabel(verification.status)
            : recommendedRole
              ? recommendedRole === "admin"
                ? "운영자 프로필"
                : "내 프로필"
              : "프로필 시작",
      },
    ],
    cards: [
      {
        href: userProfileHref,
        eyebrow: "Profile",
        title: "내 프로필과 활동",
        description:
          "자기소개, 내 모집글, 지원 현황, 인증/이력서 기능으로 이어지는 기본 프로필 화면입니다.",
        state: recommendedRole === "student" ? "추천" : "로그인 후 사용",
      },
      {
        href: verificationHref,
        eyebrow: "Trust",
        title: "인증과 신뢰도 관리",
        description:
          "인증 상태를 확인하고 신뢰 배지와 제출 흐름을 관리하는 화면입니다.",
        state:
          recommendedRole === "student" && verification
            ? getVerificationStatusLabel(verification.status)
            : authContext.authenticated
              ? "바로 이동"
              : "로그인 후 사용",
      },
      {
        href: adminProfileHref,
        eyebrow: "Admin",
        title: "운영자 화면",
        description:
          "운영 계정에서 모집 관리와 운영 도구로 이어지는 관리자 전용 진입 화면입니다.",
        state: recommendedRole === "admin" ? "추천" : "운영자 전용",
      },
    ],
    notes: [
      "학생 계정은 내 프로필, 내 모집글, 지원 현황으로 바로 이어집니다.",
      "인증과 이력서 기능은 로그인 후 같은 프로필 흐름 안에서 계속 사용할 수 있습니다.",
      "운영자 화면은 관리자 권한이 있는 계정에서만 실제 관리 기능으로 연결됩니다.",
      "로그인하지 않은 상태에서는 기능 소개 중심으로 보여주고, 필요한 경로는 로그인 뒤 바로 이어집니다.",
    ],
  };
}
