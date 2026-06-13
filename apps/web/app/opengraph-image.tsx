import { ImageResponse } from "next/og";

import { COMPANY } from "@/lib/company";

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
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(165deg, #1f3330 0%, #2f5f57 52%, #1a2b28 100%)",
          color: "#f8fcfb",
          padding: "72px",
          fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              border: "1px solid rgba(248,252,251,0.25)",
              background: "rgba(248,252,251,0.08)",
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.5L4 6.25V12.5C4 16.64 7.58 20.35 12 21.5C16.42 20.35 20 16.64 20 12.5V6.25L12 2.5Z"
                stroke="#f8fcfb"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.25L11 14.25L15.5 9.75"
                stroke="#f8fcfb"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {COMPANY.name}
            </div>
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(248,252,251,0.72)",
              }}
            >
              Integrity screening
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            Prevent the costly mistake of hiring a proxy candidate.
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.45,
              color: "rgba(248,252,251,0.82)",
              maxWidth: "920px",
            }}
          >
            EU-sovereign hiring integrity screening for senior technical hires.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
