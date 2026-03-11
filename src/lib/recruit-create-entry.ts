export const RECRUIT_CREATE_PATH = "/recruit/new";

export const RECRUIT_CREATE_LOGIN_PATH = `/login?next=${encodeURIComponent(RECRUIT_CREATE_PATH)}`;

export type RecruitCreateEntry = {
  href: string;
  label: string;
  emptyStateLabel: string;
  hint: string;
  loginRequired: boolean;
};

export function getRecruitCreateEntry(
  authenticated: boolean,
): RecruitCreateEntry {
  if (authenticated) {
    return {
      href: RECRUIT_CREATE_PATH,
      label: "새 모집글 작성",
      emptyStateLabel: "모집글 직접 작성하기",
      hint: "현재 계정으로 바로 작성 화면에 들어갈 수 있습니다.",
      loginRequired: false,
    };
  }

  return {
    href: RECRUIT_CREATE_LOGIN_PATH,
    label: "로그인 후 모집글 작성",
    emptyStateLabel: "로그인하고 모집글 작성하기",
    hint: "로그인하면 작성 폼으로 바로 이동합니다.",
    loginRequired: true,
  };
}

export function isRecruitCreateNextPath(nextPath: string) {
  return nextPath === RECRUIT_CREATE_PATH;
}
