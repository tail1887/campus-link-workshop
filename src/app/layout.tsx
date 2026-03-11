import type { Metadata } from "next";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Campus Link",
  description:
    "캠퍼스 스터디와 프로젝트 팀원을 빠르게 찾고 연결하는 팀 매칭 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
      >
        <div className="relative min-h-screen">
          <SiteHeader />
          <main className="pb-16 pt-4">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
