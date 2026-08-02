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
  bg: "#0c0906", // Rich coal-dark
  accentOrange: "#ff5e00", // Vibrant flame orange
  accentGold: "#ffb700", // Warm gold
  text: "#FFFFFF",
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const FPS = 30;
const END_PADDING_SECONDS = 1.2;

export type RestaurantVideoProps = {
  imageUrl: string;
  audioUrl: string;
  backgroundMusicUrl: string;
  text: string;
  prompt?: string;
  hookText?: string;
  bodyText?: string;
  themeColor?: string;
};

export const restaurantVideoDefaultProps: RestaurantVideoProps = {
  imageUrl: "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
  audioUrl: staticFile("voiceover/pos-video.mp3"),
  backgroundMusicUrl: staticFile("background-music.mp3"),
  text: "Restaurant billing me deri? [pause] U POS lagayein aur orders ko super-fast kitchen tak pahunchayein!",
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

export const calculateRestaurantVideoMetadata: CalculateMetadataFunction<
  RestaurantVideoProps
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
  } catch (_) {
    return { durationInFrames: 360 };
  }
};

const Background: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.15], {
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
          filter: "brightness(0.2) contrast(1.1)",
          scale,
        }} />
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(12,9,6,0.5) 0%, rgba(12,9,6,0.9) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Ember: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  const frame = useCurrentFrame();
  const random = (seed: number) => {
    const x = Math.sin(index * 323.4 + seed * 45.2) * 8721;
    return x - Math.floor(x);
  };

  const size = Math.round(random(1) * 10 + 4); // 4 to 14px
  const startX = random(2) * 1080;
  const speed = random(3) * 2.2 + 1.2; // float speed
  const swayRange = random(4) * 60 + 30;
  const swaySpeed = random(5) * 0.035 + 0.015;

  const startY = 1920 + (index * 120);
  const currentY = startY - (frame * speed);
  const y = ((currentY + 100) % (1920 + 200)) - 100;
  const x = startX + Math.sin(frame * swaySpeed) * swayRange;

  const opacity = interpolate(y, [0, 300, 1600, 1920], [0, 0.7, 0.7, 0], {
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
        backgroundColor: color,
        opacity,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
        filter: "blur(0.8px)",
        pointerEvents: "none",
      }}
    />
  );
};

const BrandHeader: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  
  // Sweep shine effect
  const shineTranslate = interpolate(frame % 90, [0, 30], [-150, 150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="Brand header"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        opacity: interpolate(frame, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          boxShadow: `0 10px 25px rgba(0,0,0,0.5), 0 0 15px ${accentColor}33`,
          border: `2px solid ${accentColor}`,
        }}
      >
        <Img
          src={staticFile("UPOS logo.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Shine Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 40,
            height: "100%",
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
            transform: `skewX(-25deg) translateX(${shineTranslate}px)`,
          }}
        />
      </div>
      <Interactive.Div
        name="UPOS label"
        style={{
          color: COLORS.text,
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: 2,
        }}
      >
        UPOS
      </Interactive.Div>
    </Interactive.Div>
  );
};

const RestaurantHero: React.FC<{ imageUrl: string; accentColor: string }> = ({ imageUrl, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.14], {
    extrapolateRight: "clamp",
  });
  
  // Rotating border effect
  const borderRotate = frame * 1.8;
  const floatY = Math.sin(frame * 0.05) * 15;
  const swayX = Math.cos(frame * 0.04) * 8;

  return (
    <Interactive.Div
      name="Hero container"
      style={{
        position: "relative",
        width: 860,
        height: 860,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${swayX}px, ${floatY}px)`,
      }}
    >
      {/* Neon/Gold Ring Background */}
      <div
        style={{
          position: "absolute",
          width: 840,
          height: 840,
          borderRadius: "50%",
          border: "4px dashed transparent",
          backgroundImage: `linear-gradient(${accentColor}, ${COLORS.accentGold}, ${accentColor})`,
          backgroundOrigin: "border-box",
          boxShadow: `0 0 40px ${accentColor}55, inset 0 0 40px ${accentColor}22`,
          transform: `rotate(${borderRotate}deg)`,
          opacity: 0.85,
        }}
      />
      
      {/* Circle Crop Image Container */}
      <div
        style={{
          width: 800,
          height: 800,
          borderRadius: "50%",
          overflow: "hidden",
          border: `6px solid #14110e`,
          boxShadow: "0 25px 55px rgba(0,0,0,0.7)",
          zIndex: 2,
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            scale,
          }}
        />
      </div>
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
        <span key={index} style={{ color: accentColor, fontWeight: 900, textShadow: `0 0 10px ${accentColor}44` }}>
          {content}
        </span>
      );
    }
    return part;
  });
};

const Subtitles: React.FC<{ lines: string[]; accentColor: string }> = ({ lines, accentColor }) => {
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

  timed[timed.length - 1].end = usableFrames;

  const active = timed.find((item) => frame >= item.start && frame < item.end);
  if (!active) return null;

  const local = frame - active.start;
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const scale = interpolate(local, [0, 8], [0.94, 1], {
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
        background: "rgba(20, 16, 12, 0.85)", // Solid dark wood color for high-speed render
        border: `2px solid ${isHook ? accentColor : "rgba(255, 255, 255, 0.12)"}`,
        borderRadius: 28,
        padding: "30px 40px",
        color: isHook ? COLORS.accentGold : COLORS.text,
        fontSize: isHook ? 46 : 38,
        fontWeight: 800,
        lineHeight: 1.4,
        textAlign: "center",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
        opacity,
        transform: `scale(${scale})`,
        translate: interpolate(local, [0, 8], ["0px 15px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
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
        color: COLORS.accentGold,
        fontSize: 32,
        fontWeight: 800,
        textAlign: "center",
        opacity: interpolate(frame, [20, 40], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        textShadow: "0 2px 10px rgba(0,0,0,0.8)",
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
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${accentColor} 0%, ${COLORS.accentGold} 100%)`,
          boxShadow: `0 0 15px ${accentColor}`,
        }}
      />
    </div>
  );
};

export const RestaurantVideo: React.FC<RestaurantVideoProps> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  hookText,
  bodyText,
  themeColor,
}) => {
  const accentColor = themeColor || COLORS.accentOrange;
  const lines = (hookText || bodyText)
    ? [hookText, bodyText].filter(Boolean) as string[]
    : cleanDisplayLines(text);

  const embers = Array.from({ length: 15 });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily, overflow: "hidden" }}>
      <Sequence name="Background">
        <Background imageUrl={imageUrl} />
      </Sequence>

      {/* Floating hot embers/steam */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 1 }}>
        {embers.map((_, i) => (
          <Ember key={i} index={i} color={i % 2 === 0 ? accentColor : COLORS.accentGold} />
        ))}
      </AbsoluteFill>

      {audioUrl ? (
        <Sequence name="Voiceover">
          <Audio src={audioUrl} />
        </Sequence>
      ) : null}

      {backgroundMusicUrl ? (
        <Sequence name="Background music">
          <Audio src={backgroundMusicUrl} volume={0.12} loop />
        </Sequence>
      ) : null}

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "90px 80px",
          gap: 30,
          zIndex: 3,
        }}
      >
        <BrandHeader accentColor={accentColor} />
        <RestaurantHero imageUrl={imageUrl} accentColor={accentColor} />
        <Subtitles lines={lines} accentColor={accentColor} />
        <Footer accentColor={accentColor} />
      </AbsoluteFill>

      <ProgressBar accentColor={accentColor} />
    </AbsoluteFill>
  );
};
