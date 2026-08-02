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
import { loadFont as loadLilita } from "@remotion/google-fonts/LilitaOne";
import { getAudioDuration } from "./get-audio-duration";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const { fontFamily: subtitleFont } = loadLilita("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const COLORS = {
  bg: "#080a0f",
  accentDefault: "#a855f7",
  text: "#FFFFFF",
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const FPS = 30;
const END_PADDING_SECONDS = 1.2;

export type IndustryVideoV6Props = {
  imageUrl: string;
  audioUrl: string;
  backgroundMusicUrl: string;
  text: string;
  prompt?: string;
  hookText?: string;
  bodyText?: string;
  themeColor?: string;
  industry?: string;
};

export const industryVideoV6DefaultProps: IndustryVideoV6Props = {
  imageUrl: "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
  audioUrl: staticFile("voiceover/pos-video.mp3"),
  backgroundMusicUrl: staticFile("background-music.mp3"),
  text: "Restaurant billing me deri? [pause] U POS lagayein aur orders ko super-fast kitchen tak pahunchayein!",
  prompt: "",
  hookText: "INTEGRATED INVENTORY REPORT",
  bodyText: "",
  themeColor: "",
  industry: "Restaurant",
};

const getIndustryCategory = (industry: string = "") => {
  const norm = industry.toLowerCase().trim();
  if (norm.includes("grocery")) return "grocery";
  if (norm.includes("pharmacy")) return "pharmacy";
  if (norm.includes("restaurant")) return "restaurant";
  if (norm.includes("fashion")) return "fashion";
  if (norm.includes("coffee")) return "coffee";
  if (norm.includes("shoe")) return "shoe";
  if (norm.includes("ice cream")) return "icecream";
  if (norm.includes("cosmetics")) return "cosmetics";
  if (norm.includes("mobile")) return "mobile";
  if (norm.includes("bakery")) return "bakery";
  if (norm.includes("hardware")) return "hardware";
  if (norm.includes("toy")) return "toy";
  if (norm.includes("electronics")) return "electronics";
  if (norm.includes("book")) return "book";
  if (norm.includes("auto")) return "autoparts";
  if (norm.includes("gym") || norm.includes("fitness")) return "gym";
  return "default";
};

const getParticleContent = (category: string, index: number, color: string) => {
  if (index % 2 === 1) {
    const posIcons = ["🖨️", "🧾", "💳", "🏷️", "🪙"];
    return <div style={{ fontSize: 26, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.35))" }}>{posIcons[(index >> 1) % posIcons.length]}</div>;
  }
  const emojis: Record<string, string[]> = {
    grocery: ["🛒", "🍏", "🛍️"],
    fashion: ["✨", "🛍️", "👗"],
    restaurant: ["🍕", "🍔", "☕"],
    gym: ["💪", "🏋️‍♂️", "⚡"],
  };
  const pool = emojis[category] || ["✨", "⭐"];
  return <div style={{ fontSize: 36, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))" }}>{pool[(index >> 1) % pool.length]}</div>;
};

const Background: React.FC<{ imageUrl: string; category: string }> = ({ imageUrl, category }) => {
  const frame = useCurrentFrame();
  let bannerImg = staticFile("upos_banner_retail.png");
  if (category === "restaurant") bannerImg = staticFile("upos_banner_restaurant.png");
  else if (category === "pharmacy") bannerImg = staticFile("upos_banner_pharmacy.png");
  else if (category === "grocery") bannerImg = staticFile("upos_banner_grocery.png");

  const zoom = interpolate(Math.sin(frame * 0.035), [-1, 1], [1.25, 1.33]);
  const driftX = Math.sin(frame * 0.022) * 20;
  const driftY = Math.cos(frame * 0.026) * 12;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={imageUrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.3) contrast(1.1) blur(4px)",
          transform: `scale(${zoom}) translate(${driftX}px, ${driftY}px)`,
        }}
      />
      <Img
        src={bannerImg}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.72,
          filter: "brightness(0.55) contrast(1.05) blur(3px)",
          transform: `scale(${zoom}) translate(${driftX}px, ${driftY}px)`,
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,11,17,0.25) 0%, rgba(8,11,17,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const DynamicParticle: React.FC<{ index: number; category: string; color: string }> = ({ index, category, color }) => {
  const frame = useCurrentFrame();
  const random = (seed: number) => {
    const x = Math.sin(index * 453.7 + seed * 83.1) * 7821;
    return x - Math.floor(x);
  };
  const startX = random(2) * 1080;
  const speed = random(3) * 2.0 + 1.0;
  const startY = 1920 + (index * 130);
  const currentY = startY - (frame * speed);
  const y = ((currentY + 120) % (1920 + 240)) - 120;
  const x = startX + Math.sin(frame * 0.02) * 40;

  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: 0.5, pointerEvents: "none" }}>
      {getParticleContent(category, index, color)}
    </div>
  );
};

const BrandHeader: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Brand header V6"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <Img
        src={staticFile("UPOS logo.png")}
        style={{ width: 380, height: 120, objectFit: "contain", translate: "-0.1px 9.9px" }}
      />
    </Interactive.Div>
  );
};

const LiquidBlobHero: React.FC<{ imageUrl: string; accentColor: string }> = ({ imageUrl, accentColor }) => {
  const frame = useCurrentFrame();
  
  // Real-time morphing border radius sines/cosines!
  const b1 = 50 + Math.sin(frame * 0.04) * 12;
  const b2 = 50 - Math.sin(frame * 0.04) * 12;
  const b3 = 45 + Math.cos(frame * 0.035) * 14;
  const b4 = 55 - Math.cos(frame * 0.035) * 14;
  
  const b5 = 40 + Math.sin(frame * 0.03) * 10;
  const b6 = 45 + Math.cos(frame * 0.04) * 11;
  const b7 = 55 - Math.cos(frame * 0.04) * 11;
  const b8 = 60 - Math.sin(frame * 0.03) * 10;

  const blobRadius = `${b1}% ${b2}% ${b3}% ${b4}% / ${b5}% ${b6}% ${b7}% ${b8}%`;
  const scale = Math.sin(frame * 0.035) * 0.05 + 1.05;

  return (
    <Interactive.Div
      name="Liquid Blob Hero Container"
      style={{
        position: "relative",
        width: 860,
        height: 860,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Interactive.Div
        name="Morphing Liquid Card"
        style={{
          width: 800,
          height: 800,
          borderRadius: blobRadius,
          overflow: "hidden",
          border: `6px solid ${accentColor}`,
          boxShadow: `0 35px 80px rgba(0,0,0,0.65), 0 0 50px ${accentColor}44`,
          transform: `scale(${scale})`,
          transition: "border-radius 0.2s ease-out",
        }}
      >
        <Img
          src={imageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Interactive.Div>
    </Interactive.Div>
  );
};

const HookBanner: React.FC<{ hookText: string; accentColor: string }> = ({ hookText, accentColor }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Blob Hook Banner"
      style={{
        width: 900,
        background: "rgba(10, 14, 22, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `3px solid ${accentColor}`,
        borderRadius: 24,
        padding: "16px 28px",
        color: "#ffffff",
        fontFamily,
        fontSize: 36,
        fontWeight: 800,
        textAlign: "center",
        boxShadow: `0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${accentColor}33`,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(frame, [10, 25], [-20, 0], { extrapolateRight: "clamp", easing: ease })}px)`,
        WebkitTextStroke: "1px #000000",
        textShadow: "0 4px 12px rgba(0,0,0,0.7)",
        zIndex: 90,
      }}
    >
      {hookText}
    </Interactive.Div>
  );
};

const splitScriptIntoCaptions = (text: string) => {
  if (!text) return [];
  const cleaned = text
    .replace(/\[pause\]/gi, "")
    .replace(/\[break\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(/(?<=[.?!,;])\s+/);
  const finalChunks = [];
  for (const part of parts) {
    const words = part.split(/\s+/);
    if (words.length > 8) {
      const mid = Math.ceil(words.length / 2);
      finalChunks.push(words.slice(0, mid).join(" "));
      finalChunks.push(words.slice(mid).join(" "));
    } else {
      finalChunks.push(part);
    }
  }
  return finalChunks.filter(Boolean);
};

const parseRichText = (text: string, accentColor: string) => {
  if (!text) return "";
  const parts = text.split(/(\[strong\].*?\[\/strong\])/gi);
  return parts.map((part, index) => {
    if (part.startsWith("[strong]") && part.endsWith("[/strong]")) {
      return (
        <span key={index} style={{ color: accentColor, fontWeight: 900 }}>
          {part.slice(8, -9)}
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
  const opacity = interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(local, [0, 8], [0.94, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)) });

  return (
    <Interactive.Div
      name="Blob Layout Subtitle"
      style={{
        width: 900,
        background: "rgba(10, 14, 22, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `4px solid ${accentColor}`,
        borderRadius: 28,
        padding: "30px 40px",
        color: "#ffffff",
        fontFamily: subtitleFont,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        fontSize: 54,
        fontWeight: 900,
        lineHeight: 1.25,
        textAlign: "center",
        WebkitTextStroke: "3px #000000",
        textShadow: "6px 6px 0px #000000",
        opacity,
        transform: `scale(${scale})`,
        zIndex: 100,
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
      name="Footer V6"
      style={{
        color: accentColor,
        fontFamily,
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: 1.2,
        opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" }),
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
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 12, backgroundColor: "rgba(255, 255, 255, 0.05)", zIndex: 10 }}>
      <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${accentColor} 0%, #ffffff 100%)`, boxShadow: `0 0 15px ${accentColor}` }} />
    </div>
  );
};

export const calculateIndustryVideoV6Metadata: CalculateMetadataFunction<IndustryVideoV6Props> = async ({ props }) => {
  if (!props.audioUrl) return { durationInFrames: 360 };
  try {
    const duration = await getAudioDuration(props.audioUrl);
    const audioFrames = Math.ceil(duration * FPS);
    return { durationInFrames: audioFrames + Math.round(END_PADDING_SECONDS * FPS) };
  } catch {
    return { durationInFrames: 360 };
  }
};

export const IndustryVideoV6: React.FC<IndustryVideoV6Props> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  hookText,
  themeColor,
  industry,
}) => {
  const accentColor = themeColor || COLORS.accentDefault;
  const category = getIndustryCategory(industry);
  const lines = splitScriptIntoCaptions(text);
  const particles = Array.from({ length: 15 });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily, overflow: "hidden" }}>
      <Sequence name="Background">
        <Background imageUrl={imageUrl} category={category} />
      </Sequence>
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 1 }}>
        {particles.map((_, i) => (
          <DynamicParticle key={i} index={i} category={category} color={accentColor} />
        ))}
      </AbsoluteFill>
      {audioUrl && (
        <Sequence name="Voiceover">
          <Audio src={audioUrl} />
        </Sequence>
      )}
      {backgroundMusicUrl && (
        <Sequence name="Background music">
          <Audio src={backgroundMusicUrl} volume={0.12} loop />
        </Sequence>
      )}
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
        {hookText ? <HookBanner hookText={hookText} accentColor={accentColor} /> : null}
        <LiquidBlobHero imageUrl={imageUrl} accentColor={accentColor} />
        <Subtitles lines={lines} accentColor={accentColor} />
        <Footer accentColor={accentColor} />
      </AbsoluteFill>
      <ProgressBar accentColor={accentColor} />
    </AbsoluteFill>
  );
};
