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
  bg: "#080b11", // Ultra dark slate/navy
  accentDefault: "#2563eb",
  text: "#FFFFFF",
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const FPS = 30;
const END_PADDING_SECONDS = 1.2;

export type IndustryVideoV1Props = {
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

export const industryVideoV1DefaultProps: IndustryVideoV1Props = {
  imageUrl: "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
  audioUrl: staticFile("voiceover/pos-video.mp3"),
  backgroundMusicUrl: staticFile("background-music.mp3"),
  text: "Restaurant billing me deri? [pause] U POS lagayein aur orders ko super-fast kitchen tak pahunchayein!",
  prompt: "",
  hookText: "",
  bodyText: "",
  themeColor: "",
  industry: "Restaurant",
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

export const calculateIndustryVideoV1Metadata: CalculateMetadataFunction<
  IndustryVideoV1Props
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
  // 50% of the particles are retail/POS automation icons (scanner, invoice printer, credit card, cash drawer)
  if (index % 2 === 1) {
    const posIcons = ["🖨️", "🧾", "💳", "🏷️", "🪙"];
    const icon = posIcons[(index >> 1) % posIcons.length];
    return <div style={{ fontSize: 26, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.35))" }}>{icon}</div>;
  }

  if (category === "pharmacy") {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: 14, height: 32, borderRadius: 16, overflow: "hidden", transform: "rotate(45deg)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <div style={{ flex: 1, backgroundColor: color }} />
        <div style={{ flex: 1, backgroundColor: "#ffffff" }} />
      </div>
    );
  }

  if (category === "restaurant" || category === "coffee" || category === "bakery") {
    return (
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
        }}
      />
    );
  }

  const emojis: Record<string, string[]> = {
    grocery: ["🛒", "🍏", "🛍️", "🍅", "🍇"],
    fashion: ["✨", "🛍️", "👗", "🎀", "💄", "🌸"],
    shoe: ["👟", "✨", "👟", "🛍️"],
    icecream: ["🍦", "🍧", "🍒", "✨"],
    cosmetics: ["💄", "💅", "💋", "✨"],
    mobile: ["📱", "🎧", "🔌", "🔋"],
    electronics: ["💻", "🔌", "🔌", "⚙️"],
    hardware: ["🔧", "🔨", "🔩", "⚙️"],
    toy: ["🎈", "🧸", "⭐", "🦄"],
    book: ["📖", "📚", "✏️", "💡"],
    autoparts: ["🚗", "🔧", "⚙️", "🔋"],
    gym: ["💪", "🏋️‍♂️", "🏃", "⚡"],
  };

  const pool = emojis[category] || ["✨", "⭐"];
  const emoji = pool[(index >> 1) % pool.length];
  return <div style={{ fontSize: 36, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))" }}>{emoji}</div>;
};

const Background: React.FC<{ imageUrl: string; category: string }> = ({ imageUrl, category }) => {
  const frame = useCurrentFrame();

  // Resolve the industry-specific banner image
  let bannerImg = staticFile("upos_banner_retail.png");
  if (category === "restaurant") {
    bannerImg = staticFile("upos_banner_restaurant.png");
  } else if (category === "pharmacy") {
    bannerImg = staticFile("upos_banner_pharmacy.png");
  } else if (category === "grocery") {
    bannerImg = staticFile("upos_banner_grocery.png");
  } else if (category === "fashion") {
    bannerImg = staticFile("upos_banner_fashion.png");
  } else if (category === "coffee") {
    bannerImg = staticFile("upos_banner_coffee.png");
  } else if (category === "shoe") {
    bannerImg = staticFile("upos_banner_shoe.png");
  } else if (category === "icecream") {
    bannerImg = staticFile("upos_banner_icecream.png");
  } else if (category === "cosmetics") {
    bannerImg = staticFile("upos_banner_cosmetics.png");
  } else if (category === "mobile" || category === "electronics") {
    bannerImg = staticFile("upos_banner_mobile.png");
  } else if (category === "bakery") {
    bannerImg = staticFile("upos_banner_bakery.png");
  } else if (category === "hardware" || category === "autoparts") {
    bannerImg = staticFile("upos_banner_hardware.png");
  } else if (category === "toy") {
    bannerImg = staticFile("upos_banner_toy.png");
  }

  // Zoom standard banner images slightly more for 9:16 vertical crop
  const zoom = interpolate(Math.sin(frame * 0.035), [-1, 1], [1.25, 1.33]);

  // Subtle drifting movements on independent sine/cosine waves
  const driftX = Math.sin(frame * 0.022) * 20; 
  const driftY = Math.cos(frame * 0.026) * 12;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Bottom Layer: User's custom product image */}
      {/* Top Layer: Industry-specific UPOS banner image with high opacity */}
      <Img
        src={bannerImg}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.8, // 72% opacity overlay to blend both images beautifully
          filter: "brightness(0.55) contrast(1.05) blur(3px)",
          transform: `scale(${zoom}) translate(${driftX}px, ${driftY}px)`,
        }}
        from={-4} /><Img
        src={imageUrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.1, // 72% opacity overlay to blend both images beautifully
          
          filter: "brightness(0.3) contrast(1.1) blur(4px)",
          transform: `scale(${zoom}) translate(${driftX}px, ${driftY}px)`,
        }} />
      {/* Dark overlay gradient for text contrast */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(8,11,17,0.25) 0%, rgba(8,11,17,0.55) 100%)",
        }}
      />
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
  const swayRange = random(4) * 60 + 20;
  const swaySpeed = random(5) * 0.03 + 0.01;

  const startY = 1920 + (index * 130);
  const currentY = startY - (frame * speed);
  const y = ((currentY + 120) % (1920 + 240)) - 120;
  const x = startX + Math.sin(frame * swaySpeed) * swayRange;

  const opacity = interpolate(y, [0, 300, 1620, 1920], [0, 0.65, 0.65, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        pointerEvents: "none",
        transform: `rotate(${frame * (random(6) * 2 - 1) * 0.8}deg)`,
      }}
    >
      {getParticleContent(category, index, color)}
    </div>
  );
};

const BrandHeader: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  
  // Sweep fully from left (-280px) to right (480px) to cross the 380px box completely
  const shineTranslate = interpolate(frame % 110, [0, 45], [-280, 480], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="Brand header"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        opacity: interpolate(frame, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}>
      <div
        style={{
          width: 380, // Bigger logo size
          height: 120,
          position: "relative",
          overflow: "hidden", // Restore overflow crop to align and restrict shine to the logo face!
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("UPOS logo.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            translate: "-0.1px 9.9px"
          }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 45,
            height: "100%",
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)",
            transform: `skewX(-25deg) translateX(${shineTranslate}px)`,
          }}
        />
      </div>
    </Interactive.Div>
  );
};

const CircleHero: React.FC<{ imageUrl: string; accentColor: string }> = ({ imageUrl, accentColor }) => {
  const frame = useCurrentFrame();
  
  // Smooth zooming pulse inside circle (breathing effect)
  const pulseScale = Math.sin(frame * 0.045) * 0.07 + 1.07; // Zoom ranges smoothly from 1.00 to 1.14
  
  const borderRotate = frame * 1.6;
  const floatY = Math.sin(frame * 0.05) * 12;
  const swayX = Math.cos(frame * 0.04) * 6;

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
      }}>
      {/* Dynamic Glowing Neon Ring */}
      <div
        style={{
          position: "absolute",
          width: 844,
          height: 844,
          borderRadius: "50%",
          border: "4px dashed transparent",
          backgroundImage: `linear-gradient(${accentColor}, #ffffff, ${accentColor})`,
          backgroundOrigin: "border-box",
          boxShadow: `0 0 35px ${accentColor}66, inset 0 0 30px ${accentColor}22`,
          transform: `rotate(${borderRotate}deg)`,
          opacity: 0.85,
        }}
      />
      {/* Circle Crop Container */}
      <div
        style={{
          width: 800,
          height: 800,
          borderRadius: "50%",
          overflow: "hidden",
          border: `6px solid #0d121b`,
          boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          zIndex: 2,
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${pulseScale})`,
          }}
        />
      </div>
    </Interactive.Div>
  );
};

const parseRichText = (text: string, accentColor: string, category: string) => {
  if (!text) return "";
  const parts = text.split(/(\[strong\].*?\[\/strong\])/gi);
  
  // Custom text shadows based on industry category
  const glowShadow = category === "restaurant"
    ? `0 0 8px ${accentColor}, 0 0 16px #ff7a00, 0 0 24px #ffb700`
    : `0 0 8px ${accentColor}, 0 0 20px ${accentColor}77`;

  return parts.map((part, index) => {
    if (part.startsWith("[strong]") && part.endsWith("[/strong]")) {
      const content = part.slice(8, -9);
      return (
        <span key={index} style={{ color: accentColor, fontWeight: 900, textShadow: `6px 6px 0px #000000, ${glowShadow}` }}>
          {content}
        </span>
      );
    }
    return part;
  });
};

const splitScriptIntoCaptions = (text: string) => {
  if (!text) return [];
  // Remove formatting bracket tags but keep inline strong formatting tags
  const cleaned = text
    .replace(/\[pause\]/gi, "")
    .replace(/\[break\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Split at sentence breaks or commas to keep chunks short and highly readable
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

const HookBanner: React.FC<{ hookText: string; accentColor: string }> = ({ hookText, accentColor }) => {
  const frame = useCurrentFrame();
  if (!hookText) return null;

  return (
    <Interactive.Div
      name="Hook Banner"
      style={{
        width: 900,
        background: "rgba(10, 14, 22, 0.65)", // Frosted glass backing
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `3px solid ${accentColor}`,
        borderRadius: 24,
        padding: "16px 28px",
        color: "#ffffff",
        fontFamily, // Changed to Outfit (readable body font)
        fontSize: 36, // Easily readable size
        fontWeight: 800,
        textAlign: "center",
        boxShadow: `0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${accentColor}33`,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        opacity: interpolate(frame, [10, 25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        transform: `translateY(${interpolate(frame, [10, 25], [-20, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })}px)`,
        WebkitTextStroke: "1px #000000", // Fine black outline for high contrast
        textShadow: "0 4px 12px rgba(0,0,0,0.7)", // Soft clean shadow
        zIndex: 90,
      }}
    >
      {hookText}
    </Interactive.Div>
  );
};

const Subtitles: React.FC<{ lines: string[]; accentColor: string; category: string }> = ({ lines, accentColor, category }) => {
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

  return (
    <Interactive.Div
      name="Subtitle"
      style={{
        width: 900,
        background: "rgba(10, 14, 22, 0.65)", // Frosted glass backing
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `4px solid ${accentColor}`, // Prominent border matching the active themeColor
        borderRadius: 28,
        padding: "30px 40px",
        color: "#ffffff",
        fontFamily: subtitleFont,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        fontSize: 54, // Consistent clean subtitle size
        fontWeight: 900,
        lineHeight: 1.25,
        textAlign: "center",
        WebkitTextStroke: "3px #000000",
        textShadow: "6px 6px 0px #000000",
        opacity,
        transform: `scale(${scale})`,
        translate: interpolate(local, [0, 8], ["0px 15px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        zIndex: 100,
      }}
    >
      {parseRichText(active.line, accentColor, category)}
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
          background: `linear-gradient(90deg, ${accentColor} 0%, #ffffff 100%)`,
          boxShadow: `0 0 15px ${accentColor}`,
        }}
      />
    </div>
  );
};



export const IndustryVideoV1: React.FC<IndustryVideoV1Props> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  hookText,
  bodyText,
  themeColor,
  industry,
}) => {
  const accentColor = themeColor || COLORS.accentDefault;
  const category = getIndustryCategory(industry);

  const lines = splitScriptIntoCaptions(text);

  // Generate 15 dynamic background particles
  const particlesCount = 15;
  const particles = Array.from({ length: particlesCount });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily, overflow: "hidden" }}>
      <Sequence name="Background">
        <Background imageUrl={imageUrl} category={category} />
      </Sequence>
      {/* Floating dynamic particles tailored to the industry type */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 1 }}>
        {particles.map((_, i) => (
          <DynamicParticle key={i} index={i} category={category} color={accentColor} />
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
        {hookText ? <HookBanner hookText={hookText} accentColor={accentColor} /> : null}
        <CircleHero imageUrl={imageUrl} accentColor={accentColor} />
        <Subtitles lines={lines} accentColor={accentColor} category={category} />
        <Footer accentColor={accentColor} />
      </AbsoluteFill>
      <ProgressBar accentColor={accentColor} />
    </AbsoluteFill>
  );
};
