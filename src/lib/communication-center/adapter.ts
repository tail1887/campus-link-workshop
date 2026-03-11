import type { AuthContext } from "@/types/identity";

export type BranchLocalInquiryStatus =
  | "draft_adapter"
  | "submitted"
  | "queued_for_ops"
  | "response_ready";

export type BranchLocalAlertToggle = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type BranchLocalCommunicationThread = {
  id: string;
  title: string;
  categoryLabel: string;
  status: BranchLocalInquiryStatus;
  statusLabel: string;
  summary: string;
  createdAt: string;
  lastUpdateAt: string;
};

export type CommunicationCenterViewModel = {
  status: "guest" | "ready";
  title: string;
  subtitle: string;
  badge: string;
  summaryCards: Array<{ label: string; value: string }>;
  highlights: string[];
  seededThreads: BranchLocalCommunicationThread[];
  seededAlertToggles: BranchLocalAlertToggle[];
  notes: string[];
  authUser:
    | {
        id: string;
        email: string;
        displayName: string;
      }
    | null;
};

function formatDateLabel(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSeededThreads(displayName: string): BranchLocalCommunicationThread[] {
  return [
    {
      id: "branch-local-thread-onboarding",
      title: "프로필 완성도 안내",
      categoryLabel: "안내 메시지",
      status: "response_ready",
      statusLabel: "확인 가능",
      summary: `${displayName}님, 이력서와 인증 배지는 아직 다른 브랜치에서 연결될 예정입니다. 현재는 문의와 알림 흐름만 우선 점검할 수 있어요.`,
      createdAt: "2026-03-10T09:00:00.000Z",
      lastUpdateAt: "2026-03-10T09:15:00.000Z",
    },
    {
      id: "branch-local-thread-alerts",
      title: "알림 채널 임시 연결 상태",
      categoryLabel: "설정 브리지",
      status: "queued_for_ops",
      statusLabel: "후속 연동 대기",
      summary:
        "현재 브랜치에서는 alert preference를 branch-local adapter와 localStorage에만 보관하고, 실제 발송 엔진 연결은 Phase 4로 넘깁니다.",
      createdAt: "2026-03-10T13:20:00.000Z",
      lastUpdateAt: "2026-03-10T13:45:00.000Z",
    },
  ];
}

function getSeededAlertToggles(): BranchLocalAlertToggle[] {
  return [
    {
      id: "application-status",
      label: "지원 상태 업데이트",
      description: "지원 결과나 후속 확인 요청이 생기면 가장 먼저 보여줄 임시 토글입니다.",
      enabled: true,
    },
    {
      id: "team-activity",
      label: "팀 활동 리마인더",
      description: "모집 마감, 일정 변경, 공지 메시지를 위한 자리만 먼저 확보합니다.",
      enabled: true,
    },
    {
      id: "platform-news",
      label: "서비스 소식",
      description: "출시 안내나 운영 공지를 나중에 붙일 수 있도록 느슨하게 유지합니다.",
      enabled: false,
    },
  ];
}

export function buildCommunicationCenterViewModel(
  authContext: AuthContext,
): CommunicationCenterViewModel {
  if (!authContext.authenticated) {
    return {
      status: "guest",
      title: "커뮤니케이션 센터 미리보기",
      subtitle:
        "문의하기와 알림 설정은 로그인 세션 위에서 동작합니다. 현재는 Phase 2 A 계약이 없으므로 branch-local adapter로 화면 구조와 임시 저장만 제공합니다.",
      badge: "Phase 2 D Preview",
      summaryCards: [
        { label: "세션 상태", value: "게스트" },
        { label: "문의 저장", value: "localStorage" },
        { label: "계약 연결", value: "branch-local adapter" },
      ],
      highlights: [
        "문의 제출 폼과 최근 메시지 타임라인 구조",
        "사용자별 알림 토글과 요약 카드",
        "Phase 4 운영 inbox로 넘길 교체 포인트 정리",
      ],
      seededThreads: getSeededThreads("게스트"),
      seededAlertToggles: getSeededAlertToggles(),
      notes: [
        "최종 Inquiry / AlertPreference shape는 이 브랜치에서 확정하지 않습니다.",
        "로그인 뒤에는 세션 사용자 id를 기준으로 브라우저 저장을 분리합니다.",
      ],
      authUser: null,
    };
  }

  const { user, onboarding } = authContext;

  return {
    status: "ready",
    title: "문의 및 알림 커뮤니케이션 센터",
    subtitle:
      "사용자 문의 제출, 최근 커뮤니케이션 기록 확인, 개인 알림 설정을 한 화면에서 다루는 Phase 2 D 임시 통합 화면입니다.",
    badge: "Communication Center",
    summaryCards: [
      { label: "현재 사용자", value: user.displayName },
      { label: "응답 채널", value: user.email },
      {
        label: "온보딩 상태",
        value: `${onboarding.status} / ${onboarding.currentStep}`,
      },
    ],
    highlights: [
      `최근 커뮤니케이션 로그는 ${formatDateLabel(new Date().toISOString())} 기준 브라우저 저장과 합쳐서 보여줍니다.`,
      "문의 상태는 임시 배지로만 표현하고 실제 운영 상태 enum은 비워둡니다.",
      "알림 토글은 사용자용 제어면만 만들고, 실제 발송/구독 엔진은 연결하지 않습니다.",
    ],
    seededThreads: getSeededThreads(user.displayName),
    seededAlertToggles: getSeededAlertToggles(),
    notes: [
      "이 화면은 Phase 2 A가 머지되면 branch-local inquiry storage와 alert toggle mapping만 교체하면 됩니다.",
      "Phase 4에서는 여기서 생성한 문의 항목을 운영 inbox thread와 notification event로 연결하면 됩니다.",
    ],
    authUser: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };
}
