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
import { loadFont } from "@remotion/google-fonts/Inter";
import { getAudioDuration } from "./get-audio-duration";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

const COLORS = {
  bg: "#0B1F2A",
  bgMid: "#123447",
  accent: "#2DD4A8",
  text: "#FFFFFF",
  muted: "rgba(255, 255, 255, 0.78)",
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const FPS = 30;
const END_PADDING_SECONDS = 1.2;

export type PosVideoProps = {
  imageUrl: string;
  audioUrl: string;
  backgroundMusicUrl: string;
  text: string;
  /** Flux/image prompt — metadata only. Remotion does not generate visuals from this. */
  prompt?: string;
};

export const posVideoDefaultProps: PosVideoProps = {
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

export const calculatePosVideoMetadata: CalculateMetadataFunction<
  PosVideoProps
> = async ({ props }) => {
  if (!props.audioUrl) {
    return { durationInFrames: 360 };
  }

  const durationInSeconds = await getAudioDuration(props.audioUrl);
  return {
    durationInFrames: Math.max(
      90,
      Math.ceil((durationInSeconds + END_PADDING_SECONDS) * FPS)
    ),
  };
};

const Background: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.18], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(28px) brightness(0.35)",
          scale,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(11,31,42,0.55) 0%, rgba(11,31,42,0.78) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const BrandHeader: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Brand header"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity: interpolate(frame, [0, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        translate: interpolate(frame, [0, 18], ["0px -20px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      <Img
        src={staticFile("final uvision icon.jpg")}
        style={{
          width: 96,
          height: 96,
          borderRadius: 22,
          objectFit: "cover",
          boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        }}
      />
      <Interactive.Div
        name="UPOS label"
        style={{
          color: COLORS.text,
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: 1,
        }}
      >
        UPOS
      </Interactive.Div>
    </Interactive.Div>
  );
};

const HeroImage: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.12], {
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="Hero image"
      style={{
        width: 860,
        height: 860,
        borderRadius: 36,
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.14)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
        opacity: interpolate(frame, [8, 28], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        scale: interpolate(frame, [8, 28], [0.94, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale,
          translate: "-36.9px -138.5px"
        }}
      />
    </Interactive.Div>
  );
};

const Subtitles: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (lines.length === 0) return null;

  const usableFrames = Math.max(1, durationInFrames - Math.round(END_PADDING_SECONDS * FPS));
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0) || 1;

  let cursor = 0;
  const timed = lines.map((line) => {
    const share = line.length / totalChars;
    const duration = Math.max(45, Math.round(share * usableFrames));
    const start = cursor;
    const end = Math.min(usableFrames, start + duration);
    cursor = end;
    return { line, start, end };
  });

  // Stretch last line to fill usable voice window
  timed[timed.length - 1].end = usableFrames;

  const active = timed.find((item) => frame >= item.start && frame < item.end);
  if (!active) return null;

  const local = frame - active.start;
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <Interactive.Div
      name="Subtitle"
      style={{
        width: 860,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 24,
        padding: "28px 32px",
        color: COLORS.text,
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 1.35,
        textAlign: "center",
        opacity,
        translate: interpolate(local, [0, 10], ["0px 18px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      {active.line}
    </Interactive.Div>
  );
};

const Footer: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Footer CTA"
      style={{
        color: COLORS.accent,
        fontSize: 30,
        fontWeight: 700,
        textAlign: "center",
        opacity: interpolate(frame, [20, 40], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      uvisionpk.com  ·  +92 304 9301811
    </Interactive.Div>
  );
};

export const PosVideo: React.FC<PosVideoProps> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  prompt: _prompt,
}) => {
  const lines = cleanDisplayLines(text);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
      <Sequence name="Background">
        <Background imageUrl={imageUrl} />
      </Sequence>

      {audioUrl ? (
        <Sequence name="Voiceover">
          <Audio src={audioUrl} />
        </Sequence>
      ) : null}

      {backgroundMusicUrl ? (
        <Sequence name="Background music">
          <Audio src={backgroundMusicUrl} volume={0.1} loop />
        </Sequence>
      ) : null}

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "100px 80px",
          gap: 36,
        }}
      >
        <BrandHeader />
        <HeroImage imageUrl={imageUrl} />
        <Subtitles lines={lines} />
        <Footer />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
