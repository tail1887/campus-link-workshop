import {
  resumeAiReplacementPoints,
  type ResumeAiReplacementPoint,
} from "@/lib/resume-workspace/integration-points";
import type {
  AuthContext,
  IdentityDataSource,
  OnboardingState,
  User,
} from "@/types/identity";
import type {
  Profile,
  Resume,
  ResumeCompleteness,
  ResumeSectionKey,
} from "@/types/profile";

type ResumeSectionDefinition = {
  key: ResumeSectionKey;
  label: string;
  description: string;
};

type ResumeWorkspaceGuestViewModel = {
  status: "guest";
  badge: string;
  title: string;
  subtitle: string;
  previewCards: Array<{ label: string; value: string }>;
  sectionDefinitions: ResumeSectionDefinition[];
  notes: string[];
  replacementPoints: ResumeAiReplacementPoint[];
};

type ResumeWorkspaceReadyViewModel = {
  status: "ready";
  badge: string;
  title: string;
  subtitle: string;
  dataSource: IdentityDataSource;
  sectionDefinitions: ResumeSectionDefinition[];
  notes: string[];
  replacementPoints: ResumeAiReplacementPoint[];
  user: User;
  onboarding: OnboardingState;
  profile: Profile;
  resume: Resume;
  completeness: ResumeCompleteness;
};

export type ResumeWorkspaceViewModel =
  | ResumeWorkspaceGuestViewModel
  | ResumeWorkspaceReadyViewModel;

const resumeSectionDefinitions: ResumeSectionDefinition[] = [
  {
    key: "summary",
    label: "Summary",
    description: "팀과 역할을 빠르게 이해할 수 있는 한 단락 소개",
  },
  {
    key: "skills",
    label: "Skills",
    description: "바로 기여 가능한 핵심 스킬과 도구 목록",
  },
  {
    key: "education",
    label: "Education",
    description: "캠퍼스, 과정, 전공 같은 기본 소속 정보",
  },
  {
    key: "experience",
    label: "Experience",
    description: "협업 경험과 맡았던 역할을 담는 섹션",
  },
  {
    key: "projects",
    label: "Projects",
    description: "성과를 보여줄 대표 작업과 기술 맥락",
  },
  {
    key: "links",
    label: "Links",
    description: "포트폴리오, GitHub, 블로그 같은 검증 가능한 연결",
  },
];

export function buildResumeWorkspaceViewModel(input: {
  authContext: AuthContext;
  dataSource?: IdentityDataSource;
  profileContext?: {
    user: User;
    onboarding: OnboardingState;
    profile: Profile;
  };
  resumeRecord?: {
    resume: Resume;
    completeness: ResumeCompleteness;
  };
}): ResumeWorkspaceViewModel {
  const { authContext, dataSource, profileContext, resumeRecord } = input;

  if (
    !authContext.authenticated ||
    !dataSource ||
    !profileContext ||
    !resumeRecord
  ) {
    return {
      status: "guest",
      badge: "Resume Preview",
      title: "이력서 워크스페이스 미리보기",
      subtitle:
        "로그인 전에는 Phase 2 C 범위의 편집 구조와 completeness 기준만 먼저 확인할 수 있습니다.",
      previewCards: [
        { label: "접근 상태", value: "로그인 필요" },
        { label: "완성도 기준", value: "6개 고정 섹션" },
        { label: "후속 연동", value: "Profile + AI Assist" },
      ],
      sectionDefinitions: resumeSectionDefinitions,
      notes: [
        "실제 저장은 /api/resume Phase 2 계약을 그대로 사용합니다.",
        "프로필 헤드라인, 관심 역할, 링크는 profile contract를 참고해 이력서 작성 맥락으로만 연결합니다.",
        "AI 자동 완성은 이 브랜치에서 구현하지 않고, 교체 지점만 명시적으로 남깁니다.",
      ],
      replacementPoints: resumeAiReplacementPoints,
    };
  }

  return {
    status: "ready",
    badge: authContext.user.role === "admin" ? "Resume Workspace" : "Student Resume",
    title:
      authContext.user.role === "admin"
        ? "관리자 세션용 이력서 워크스페이스"
        : "기본 이력서 워크스페이스",
    subtitle:
      authContext.user.role === "admin"
        ? "공통 Phase 2 계약을 유지한 채 own-record 편집 구조와 completeness 계산을 확인할 수 있습니다."
        : "프로필 정보와 연결된 기본 이력서를 편집하고, completeness를 실시간으로 확인할 수 있습니다.",
    dataSource,
    sectionDefinitions: resumeSectionDefinitions,
    notes: [
      "displayName, campus, role은 여전히 identity contract를 source of truth로 유지합니다.",
      "profile headline, openToRoles, contactEmail, links는 이력서 작성 보조 맥락으로만 노출하고 /api/profile에서 수정합니다.",
      "이력서 저장은 /api/resume PUT payload를 그대로 사용하므로 Phase 3 AI 브랜치가 같은 draft 경계를 재사용할 수 있습니다.",
    ],
    replacementPoints: resumeAiReplacementPoints,
    user: profileContext.user,
    onboarding: profileContext.onboarding,
    profile: profileContext.profile,
    resume: resumeRecord.resume,
    completeness: resumeRecord.completeness,
  };
}
