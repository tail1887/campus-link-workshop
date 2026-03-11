export const siteName = "Campus Link";

export const siteDescription =
  "캠퍼스 스터디와 프로젝트 팀원을 빠르게 찾고 연결하는 팀 매칭 플랫폼";

const defaultSiteUrl = "https://campus-link-workshop.vercel.app";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!configuredUrl) {
    return new URL(defaultSiteUrl);
  }

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return new URL(configuredUrl);
  }

  return new URL(`https://${configuredUrl}`);
}

export function isPreviewDeployment() {
  return process.env.VERCEL_ENV === "preview";
}
