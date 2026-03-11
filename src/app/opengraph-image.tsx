import { ImageResponse } from "next/og";
import { siteDescription, siteName } from "@/lib/site-config";

export const alt = "Campus Link 공유 미리보기 이미지";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #fff7ef 0%, #f5efe6 54%, #efe4d6 100%)",
          color: "#10233a",
          padding: "56px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 18%, rgba(255, 111, 60, 0.22), transparent 28%), radial-gradient(circle at 82% 14%, rgba(17, 140, 128, 0.18), transparent 24%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(16, 35, 58, 0.08)",
            borderRadius: "36px",
            padding: "44px",
            background: "rgba(255, 255, 255, 0.76)",
            boxShadow: "0 24px 80px rgba(16, 35, 58, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "84px",
                  height: "84px",
                  borderRadius: "24px",
                  background: "#10233a",
                  color: "#ffffff",
                  fontSize: "34px",
                  fontWeight: 700,
                }}
              >
                CL
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#5f6b7a",
                  }}
                >
                  Study / Project Matching
                </div>
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    letterSpacing: "-0.06em",
                  }}
                >
                  {siteName}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "999px",
                background: "rgba(255, 111, 60, 0.14)",
                padding: "14px 22px",
                color: "#e55724",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              Campus Demo
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "880px",
            }}
          >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "76px",
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: "-0.08em",
            }}
          >
            <span>Build crews,</span>
            <span>not chaos.</span>
          </div>
            <div
              style={{
                fontSize: "30px",
                lineHeight: 1.5,
                color: "#5f6b7a",
              }}
            >
              {siteDescription}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            {[
              "메인 → 목록 → 상세 → 지원",
              "모집글 작성과 프로필 흐름 연결",
              "배포 링크 공유용 메타 준비",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "999px",
                  border: "1px solid rgba(16, 35, 58, 0.12)",
                  background: "rgba(255, 255, 255, 0.82)",
                  padding: "14px 22px",
                  fontSize: "22px",
                  color: "#10233a",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
