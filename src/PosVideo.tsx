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

export type CaptionCue = {
  text: string;
  startFrame: number;
  endFrame: number;
};

export type PosVideoProps = {
  imageUrl: string;
  audioUrl: string;
  backgroundMusicUrl: string;
  text: string;
  subtitles?: string;
  captions?: CaptionCue[];
  /** Flux/image prompt — metadata only. Remotion does not generate visuals from this. */
  prompt?: string;
  hookText?: string;
  bodyText?: string;
  themeColor?: string;
};

export const posVideoDefaultProps: PosVideoProps = {
  imageUrl:
    "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
  audioUrl: staticFile("voiceover/pos-video.mp3"),
  backgroundMusicUrl: staticFile("background-music.mp3"),
  text: "Kya aap thak chuke hain manual billing se?\nUPOS offers automated invoicing that saves you hours of stock tallying time every day at closing time!",
  subtitles: "",
  captions: [],
  prompt: "",
  hookText: "",
  bodyText: "",
  themeColor: "",
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

const BrandHeader: React.FC<{ accentColor: string }> = ({ accentColor }) => {
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
          border: `2px solid ${accentColor}`,
          rotate: "8.1deg"
        }}
      />
      <Interactive.Div
        name="UPOS label"
        style={{
          color: COLORS.text,
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: 1,
        }}>
        UPOS
      </Interactive.Div>
    </Interactive.Div>
  );
};

const GlowOrb: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.05) * 0.08 + 1.0; // scales from 0.92 to 1.08
  const opacity = Math.sin(frame * 0.04) * 0.08 + 0.32; // opacity fluctuates slightly
  
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        width: 900,
        height: 900,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor} 0%, rgba(0,0,0,0) 70%)`,
        opacity,
        filter: "blur(60px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

const Particle: React.FC<{ index: number; accentColor: string }> = ({ index, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Deterministic values based on particle index
  const random = (seed: number) => {
    const x = Math.sin(index * 432.12 + seed * 97.45) * 8543;
    return x - Math.floor(x);
  };
  
  const size = Math.round(random(1) * 12 + 6); // 6 to 18px
  const startX = random(2) * 1080; // horizontal layout bounds
  const speed = random(3) * 1.6 + 0.8; // speed of float
  const swayRange = random(4) * 50 + 20; 
  const swaySpeed = random(5) * 0.04 + 0.015;
  
  // Floating up animation
  const startY = 1920 + (index * 130);
  const currentY = startY - (frame * speed);
  const y = ((currentY + 100) % (1920 + 200)) - 100;
  const x = startX + Math.sin(frame * swaySpeed) * swayRange;
  
  const opacity = interpolate(y, [0, 200, 1720, 1920], [0, 0.45, 0.45, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: accentColor,
        opacity,
        filter: "blur(1.5px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

const HeroImage: React.FC<{ imageUrl: string; accentColor: string }> = ({ imageUrl, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.12], {
    extrapolateRight: "clamp",
  });
  
  // Gentle sways (3D perspective floating effect)
  const rotateX = Math.sin(frame * 0.045) * 4.0;
  const rotateY = Math.cos(frame * 0.035) * 5.0;
  const translateY = Math.sin(frame * 0.05) * 12;
  
  return (
    <Interactive.Div
      name="Hero image container"
      style={{
        position: "relative",
        perspective: 1200,
        zIndex: 2,
      }}
    >
      <Interactive.Div
        name="Hero image 3D"
        style={{
          width: 860,
          height: 860,
          borderRadius: 36,
          overflow: "hidden",
          border: `3px solid ${accentColor}66`,
          boxShadow: `0 35px 80px rgba(0,0,0,0.65), 0 0 50px ${accentColor}22`,
          opacity: interpolate(frame, [8, 28], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
          transform: `translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
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
    </Interactive.Div>
  );
};

const parseRichText = (text: string, accentColor: string) => {
  if (!text) return "";
  const parts = text.split(/(\[strong\].*?\[\/strong\])/gi);
  return parts.map((part, index) => {
    if (part.startsWith("[strong]") && part.endsWith("[/strong]")) {
      const content = part.slice(8, -9);
      return (
        <span key={index} style={{ color: accentColor, fontWeight: 900 }}>
          {content}
        </span>
      );
    }
    return part;
  });
};

const Subtitles: React.FC<{
  lines: string[];
  captions?: CaptionCue[];
  accentColor: string;
}> = ({ lines, captions, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 1. Frame-accurate timed captions from Edge-TTS timestamps
  if (captions && captions.length > 0) {
    const active = captions.find(
      (item) => frame >= item.startFrame && frame < item.endFrame
    );
    if (!active) return null;

    const local = frame - active.startFrame;
    const opacity = interpolate(local, [0, 6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });
    const scale = interpolate(local, [0, 6], [0.93, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.5)),
    });

    const isHook = captions.indexOf(active) === 0;

    return (
      <Interactive.Div
        name="Subtitle"
        style={{
          width: 860,
          background: "rgba(10, 25, 35, 0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `2.5px solid ${isHook ? accentColor : "rgba(255,255,255,0.15)"}`,
          borderRadius: 24,
          padding: "28px 36px",
          color: isHook ? "#ffffff" : COLORS.text,
          fontSize: isHook ? 45 : 38,
          fontWeight: isHook ? 900 : 700,
          lineHeight: 1.45,
          textAlign: "center",
          boxShadow: isHook
            ? `0 12px 36px ${accentColor}33, inset 0 1px 0 rgba(255,255,255,0.2)`
            : "0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {parseRichText(active.text, accentColor)}
      </Interactive.Div>
    );
  }

  // 2. Zero-drift proportional fallback for lines
  if (lines.length === 0) return null;
  
  const usableFrames = Math.max(1, durationInFrames - Math.round(END_PADDING_SECONDS * FPS));
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0) || 1;
  
  let charAcc = 0;
  const timed = lines.map((line) => {
    const start = Math.round((charAcc / totalChars) * usableFrames);
    charAcc += line.length;
    const end = Math.round((charAcc / totalChars) * usableFrames);
    return { line, start, end };
  });
  
  if (timed.length > 0) {
    timed[timed.length - 1].end = usableFrames;
  }
  
  const active = timed.find((item) => frame >= item.start && frame < item.end);
  if (!active) return null;
  
  const local = frame - active.start;
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  
  // Nice bounce pop-in scale effect
  const scale = interpolate(local, [0, 8], [0.93, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });
  
  const isHook = lines.indexOf(active.line) === 0;
  
  return (
    <Interactive.Div
      name="Subtitle"
      style={{
        width: 860,
        background: "rgba(10, 25, 35, 0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `2.5px solid ${isHook ? accentColor : "rgba(255,255,255,0.15)"}`,
        borderRadius: 24,
        padding: "28px 36px",
        color: isHook ? "#ffffff" : COLORS.text,
        fontSize: isHook ? 45 : 38,
        fontWeight: 700,
        lineHeight: 1.4,
        textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        opacity,
        transform: `scale(${scale})`,
        translate: interpolate(local, [0, 8], ["0px 15px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        zIndex: 3,
      }}
    >
      {parseRichText(active.line, accentColor)}
    </Interactive.Div>
  );
};

const Footer: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  
  return (
    <Interactive.Div
      name="Footer CTA"
      style={{
        color: accentColor,
        fontSize: 30,
        fontWeight: 700,
        textAlign: "center",
        opacity: interpolate(frame, [20, 40], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        zIndex: 3,
      }}
    >
      uvisionpk.com  ·  +92 304 9301811
    </Interactive.Div>
  );
};

const ProgressBar: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], {
    extrapolateRight: "clamp",
  });
  
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 12,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${accentColor} 0%, #ffffff 100%)`,
          boxShadow: `0 0 10px ${accentColor}`,
        }}
      />
    </div>
  );
};

export const PosVideo: React.FC<PosVideoProps> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  subtitles,
  captions,
  prompt: _prompt,
  hookText,
  bodyText,
  themeColor,
}) => {
  const accentColor = themeColor || COLORS.accent;
  
  // If hookText and bodyText are provided, use them as display subtitles.
  const lines = (hookText || bodyText)
    ? [hookText, bodyText].filter(Boolean) as string[]
    : cleanDisplayLines(subtitles || text);

  // Generate 15 background particle keys
  const particles = Array.from({ length: 15 });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily, overflow: "hidden" }}>
      <Sequence name="Background">
        <Background imageUrl={imageUrl} />
      </Sequence>

      {/* Floating dust particles */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 1 }}>
        {particles.map((_, i) => (
          <Particle key={i} index={i} accentColor={accentColor} />
        ))}
      </AbsoluteFill>

      {/* Dynamic Ambient Backlight Glow behind the Hero Image */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 1 }}>
        <GlowOrb accentColor={accentColor} />
      </AbsoluteFill>

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
          zIndex: 3,
        }}
      >
        <BrandHeader accentColor={accentColor} />
        <HeroImage imageUrl={imageUrl} accentColor={accentColor} />
        <Subtitles lines={lines} captions={captions} accentColor={accentColor} />
        <Footer accentColor={accentColor} />
      </AbsoluteFill>

      {/* Video Progress Bar */}
      <ProgressBar accentColor={accentColor} />
    </AbsoluteFill>
  );
};
