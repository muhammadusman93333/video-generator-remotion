import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  Interactive,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Outfit";
import { getAudioDuration } from "./get-audio-duration";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const COLORS = {
  bgGradient: "linear-gradient(145deg, #0b0f19 0%, #111827 40%, #1e1b4b 75%, #0f172a 100%)",
  glassBg: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.16)",
  subtitleBg: "rgba(15, 23, 42, 0.78)",
  accentCyan: "#38bdf8",
  accentPurple: "#a855f7",
  accentEmerald: "#34d399",
  textPrimary: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.8)",
};

const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
const FPS = 30;
const END_PADDING_SECONDS = 1.2;

export type SocialPromoVideoProps = {
  imageUrl: string;
  audioUrl: string;
  backgroundMusicUrl: string;
  text: string;
  prompt?: string;
};

export const socialPromoVideoDefaultProps: SocialPromoVideoProps = {
  imageUrl:
    "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
  audioUrl: staticFile("voiceover/pos-video.mp3"),
  backgroundMusicUrl: staticFile("background-music.mp3"),
  text: "Kya aap thak chuke hain manual billing se?\nUPOS offers automated invoicing that saves you hours of stock tallying time every day at closing time!",
  prompt: "",
};

const cleanDisplayLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (line.includes("http") || line.includes("www.")) return false;
      if (line.startsWith("#")) return false;
      if (line.includes("+92") || line.includes("📞")) return false;
      return true;
    });

export const calculateSocialPromoVideoMetadata: CalculateMetadataFunction<
  SocialPromoVideoProps
> = async ({ props }) => {
  if (!props.audioUrl) {
    return { durationInFrames: 360 };
  }

  try {
    const durationInSeconds = await getAudioDuration(props.audioUrl);
    return {
      durationInFrames: Math.max(
        90,
        Math.ceil((durationInSeconds + END_PADDING_SECONDS) * FPS)
      ),
    };
  } catch (_e) {
    return { durationInFrames: 360 };
  }
};

/* Dynamic Animated Background with Ambient Light Orbs & Blurred Image Overlay */
const DynamicBackground: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.05, 1.2], {
    extrapolateRight: "clamp",
  });

  const orb1Y = interpolate(frame, [0, durationInFrames], [0, 60]);
  const orb2Y = interpolate(frame, [0, durationInFrames], [0, -70]);

  return (
    <AbsoluteFill style={{ background: COLORS.bgGradient, overflow: "hidden" }}>
      {/* Blurred image layer for rich color reflections */}
      <AbsoluteFill>
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(45px) brightness(0.28) contrast(1.1)",
            scale: bgZoom,
          }}
        />
      </AbsoluteFill>

      {/* Ambient glowing light orbs */}
      <Interactive.Div
        name="Ambient Orb Top"
        style={{
          position: "absolute",
          top: -100 + orb1Y,
          right: -100,
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(60px)",
        }}
      />
      <Interactive.Div
        name="Ambient Orb Bottom"
        style={{
          position: "absolute",
          bottom: -120 + orb2Y,
          left: -120,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(65px)",
        }}
      />

      {/* Subtle vignette layer */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* Top Header: Brand Logo & Title Overlay */
const BrandHeader: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  const translateY = interpolate(frame, [0, 20], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  return (
    <Interactive.Div
      name="Brand Header Badge"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "14px 32px 14px 18px",
        borderRadius: 999,
        background: COLORS.glassBg,
        backdropFilter: "blur(18px)",
        border: `1px solid ${COLORS.glassBorder}`,
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <Img
        src={staticFile("final uvision icon.jpg")}
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          objectFit: "cover",
          boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Interactive.Div
          name="Brand Name"
          style={{
            color: COLORS.textPrimary,
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 1.2,
            lineHeight: 1.1,
          }}
        >
          UPOS
        </Interactive.Div>
        <Interactive.Div
          name="Brand Tagline"
          style={{
            color: COLORS.accentCyan,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Smart Business POS
        </Interactive.Div>
      </div>
    </Interactive.Div>
  );
};

/* Center Hero Visual Container with Ken Burns Zoom Effect */
const HeroImage: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Ken Burns Effect (Slow continuous scale & pan)
  const imageScale = interpolate(frame, [0, durationInFrames], [1, 1.16], {
    extrapolateRight: "clamp",
  });

  const imageTranslateY = interpolate(frame, [0, durationInFrames], [0, -18], {
    extrapolateRight: "clamp",
  });

  // Entry animation for hero container
  const containerOpacity = interpolate(frame, [6, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  const containerScale = interpolate(frame, [6, 26], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  return (
    <Interactive.Div
      name="Hero Image Glass Frame"
      style={{
        width: 880,
        height: 880,
        borderRadius: 40,
        overflow: "hidden",
        position: "relative",
        border: `1.5px solid ${COLORS.glassBorder}`,
        boxShadow:
          "0 32px 80px rgba(0, 0, 0, 0.65), 0 0 50px rgba(56, 189, 248, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
        opacity: containerOpacity,
        transform: `scale(${containerScale})`,
      }}
    >
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${imageScale}) translateY(${imageTranslateY}px)`,
        }}
      />
      {/* Sleek top-down gradient shadow on the frame */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />
    </Interactive.Div>
  );
};

/* Animated Subtitles with Smooth Fade & Slide Up per Line */
const Subtitles: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (lines.length === 0) return null;

  const usableFrames = Math.max(1, durationInFrames - Math.round(END_PADDING_SECONDS * FPS));
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0) || 1;

  let cursor = 0;
  const timedLines = lines.map((line) => {
    const share = line.length / totalChars;
    const duration = Math.max(45, Math.round(share * usableFrames));
    const start = cursor;
    const end = Math.min(usableFrames, start + duration);
    cursor = end;
    return { line, start, end };
  });

  timedLines[timedLines.length - 1].end = usableFrames;

  const activeItem = timedLines.find((item) => frame >= item.start && frame < item.end);
  if (!activeItem) return null;

  const relativeFrame = frame - activeItem.start;

  const opacity = interpolate(relativeFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  const translateY = interpolate(relativeFrame, [0, 10], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  return (
    <Interactive.Div
      name="Subtitle Glass Container"
      style={{
        width: 880,
        background: COLORS.subtitleBg,
        backdropFilter: "blur(24px)",
        border: `1px solid ${COLORS.glassBorder}`,
        borderRadius: 28,
        padding: "26px 36px",
        color: COLORS.textPrimary,
        fontSize: 38,
        fontWeight: 700,
        lineHeight: 1.4,
        textAlign: "center",
        boxShadow:
          "0 20px 60px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.18)",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {activeItem.line}
    </Interactive.Div>
  );
};

/* Modern Bottom Footer CTA Card */
const FooterCTA: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [18, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  const translateY = interpolate(frame, [18, 36], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });

  return (
    <Interactive.Div
      name="Footer CTA Glass Pill"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "16px 40px",
        borderRadius: 999,
        background: COLORS.glassBg,
        backdropFilter: "blur(16px)",
        border: `1px solid ${COLORS.glassBorder}`,
        boxShadow: "0 14px 36px rgba(0, 0, 0, 0.4)",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <span style={{ color: COLORS.accentEmerald, fontSize: 24 }}>🌐</span>
      <span
        style={{
          color: COLORS.textPrimary,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 0.8,
        }}
      >
        uvisionpk.com
      </span>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 22 }}>|</span>
      <span style={{ color: COLORS.accentCyan, fontSize: 24 }}>📞</span>
      <span
        style={{
          color: COLORS.textMuted,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        +92 304 9301811
      </span>
    </Interactive.Div>
  );
};

/* Main Export Component */
export const SocialPromoVideo: React.FC<SocialPromoVideoProps> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  prompt: _prompt,
}) => {
  const lines = cleanDisplayLines(text);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f19", fontFamily }}>
      {/* Background layer */}
      <Sequence name="Dynamic Background">
        <DynamicBackground imageUrl={imageUrl} />
      </Sequence>

      {/* Voiceover track */}
      {audioUrl ? (
        <Sequence name="Voiceover Audio">
          <Audio src={audioUrl} />
        </Sequence>
      ) : null}

      {/* Background Music track */}
      {backgroundMusicUrl ? (
        <Sequence name="Background Music">
          <Audio src={backgroundMusicUrl} volume={0.12} loop />
        </Sequence>
      ) : null}

      {/* Layout Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "90px 70px 80px 70px",
          gap: 28,
        }}
      >
        <BrandHeader />
        <HeroImage imageUrl={imageUrl} />
        <Subtitles lines={lines} />
        <FooterCTA />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
