import { ImageResponse } from "next/og";

export const alt = "RetireWhere — Find your retirement number";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "white",
          padding: "60px",
        }}
      >
        <p
          style={{
            fontSize: 28,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.7,
            margin: 0,
          }}
        >
          RetireWhere
        </p>
        <p
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: "center",
            margin: "24px 0 0",
          }}
        >
          How much do you need to retire anywhere?
        </p>
        <p
          style={{
            fontSize: 26,
            opacity: 0.65,
            marginTop: 28,
            textAlign: "center",
          }}
        >
          Cost-of-living · 4% rule · Tax-adjusted nest egg
        </p>
      </div>
    ),
    size
  );
}
