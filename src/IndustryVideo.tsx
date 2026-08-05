import React, { useState, useMemo } from "react";
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
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { getAudioDuration } from "./get-audio-duration";

const { fontFamily: outfitFont } = loadFont("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const { fontFamily: subtitleFont } = loadLilita("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const { fontFamily: poppinsFont } = loadPoppins("normal", {
  weights: ["400", "700", "800", "900"],
  subsets: ["latin"],
});

const { fontFamily: interFont } = loadInter("normal", {
  weights: ["400", "700", "800", "900"],
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

export type LayoutStyle = {
  frameShape?: "circle" | "hexagon" | "card3d" | "diagonal" | "blob" | "squircle";
  animationStyle?: "spring" | "fade" | "glitch" | "slideLeft" | "slideRight";
  borderGlow?: "neon" | "metallic" | "glass" | "none";
  overlayType?: "cyber" | "soft" | "vignette" | "glass";
  fontPair?: "outfit" | "lilita" | "poppins" | "inter";
};

export type IndustryVideoProps = {
  imageUrl: string;
  audioUrl: string;
  backgroundMusicUrl: string;
  text: string;
  prompt?: string;
  hookText?: string;
  bodyText?: string;
  themeColor?: string;
  industry?: string;
  layoutStyle?: LayoutStyle;
};

export const industryVideoDefaultProps: IndustryVideoProps = {
  imageUrl: "https://uvisionpk.com/upload_media_api/uploads/generated_post_image.jpeg",
  audioUrl: staticFile("voiceover/pos-video.mp3"),
  backgroundMusicUrl: staticFile("background-music.mp3"),
  text: "Restaurant billing me deri? [pause] U POS lagayein aur orders ko super-fast kitchen tak pahunchayein!",
  prompt: "",
  hookText: "Restaurant billing me deri?",
  bodyText: "orders ko super-fast kitchen tak pahunchayein!",
  themeColor: "",
  industry: "Restaurant",
  layoutStyle: {},
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

export const calculateIndustryVideoMetadata: CalculateMetadataFunction<
  IndustryVideoProps
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
  if (norm.includes("dairy") || norm.includes("milk")) return "dairy";
  if (norm.includes("meat") || norm.includes("butcher")) return "meat";
  if (norm.includes("fruit") || norm.includes("vegetable")) return "fruitvegetable";
  if (norm.includes("stationery")) return "stationery";
  if (norm.includes("fabric") || norm.includes("cloth")) return "fabric";
  if (norm.includes("jewelry")) return "jewelry";
  if (norm.includes("sweets") || norm.includes("mithai")) return "sweets";
  if (norm.includes("paint")) return "paint";
  if (norm.includes("sanitary") || norm.includes("tiles")) return "sanitary";
  if (norm.includes("juice") || norm.includes("shake")) return "juice";
  if (norm.includes("cleaners") || norm.includes("laundry")) return "laundry";
  if (norm.includes("mobile") && norm.includes("repair")) return "mobilerepair";
  if (norm.includes("super store") || norm.includes("supermarket")) return "superstore";
  if (norm.includes("optical") || norm.includes("eyewear")) return "optical";
  if (norm.includes("pet")) return "pet";
  if (norm.includes("tea") || norm.includes("chai")) return "tea";
  if (norm.includes("grocery")) return "grocery";
  if (norm.includes("pharmacy") || norm.includes("medical")) return "pharmacy";
  if (norm.includes("restaurant") || norm.includes("dhaba") || norm.includes("food")) return "restaurant";
  if (norm.includes("fashion") || norm.includes("boutique") || norm.includes("clothing")) return "fashion";
  if (norm.includes("coffee")) return "coffee";
  if (norm.includes("shoe")) return "shoe";
  if (norm.includes("ice cream")) return "icecream";
  if (norm.includes("cosmetic")) return "cosmetics";
  if (norm.includes("mobile")) return "mobile";
  if (norm.includes("bakery")) return "bakery";
  if (norm.includes("hardware")) return "hardware";
  if (norm.includes("toy")) return "toy";
  if (norm.includes("electronics")) return "electronics";
  if (norm.includes("book") || norm.includes("gift")) return "book";
  if (norm.includes("gym") || norm.includes("fitness")) return "gym";
  if (norm.includes("auto") || norm.includes("parts")) return "autoparts";
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
  } else if (category === "mobile") {
    bannerImg = staticFile("upos_banner_mobile.png");
  } else if (category === "electronics") {
    bannerImg = staticFile("upos_banner_electronics.png");
  } else if (category === "bakery") {
    bannerImg = staticFile("upos_banner_bakery.png");
  } else if (category === "hardware") {
    bannerImg = staticFile("upos_banner_hardware.png");
  } else if (category === "autoparts") {
    bannerImg = staticFile("upos_banner_autoparts.png");
  } else if (category === "toy") {
    bannerImg = staticFile("upos_banner_toy.png");
  } else if (category === "book") {
    bannerImg = staticFile("upos_banner_book.png");
  } else if (category === "gym") {
    bannerImg = staticFile("upos_banner_gym.png");
  } else if (category === "dairy") {
    bannerImg = staticFile("upos_banner_dairy.png");
  } else if (category === "meat") {
    bannerImg = staticFile("upos_banner_meat.png");
  } else if (category === "fruitvegetable") {
    bannerImg = staticFile("upos_banner_fruitvegetable.png");
  } else if (category === "stationery") {
    bannerImg = staticFile("upos_banner_stationery.png");
  } else if (category === "fabric") {
    bannerImg = staticFile("upos_banner_fabric.png");
  } else if (category === "jewelry") {
    bannerImg = staticFile("upos_banner_jewelry.png");
  } else if (category === "sweets") {
    bannerImg = staticFile("upos_banner_sweets.png");
  } else if (category === "paint") {
    bannerImg = staticFile("upos_banner_paint.png");
  } else if (category === "sanitary") {
    bannerImg = staticFile("upos_banner_sanitary.png");
  } else if (category === "juice") {
    bannerImg = staticFile("upos_banner_juice.png");
  } else if (category === "laundry") {
    bannerImg = staticFile("upos_banner_laundry.png");
  } else if (category === "mobilerepair") {
    bannerImg = staticFile("upos_banner_mobilerepair.png");
  } else if (category === "superstore") {
    bannerImg = staticFile("upos_banner_superstore.png");
  } else if (category === "optical") {
    bannerImg = staticFile("upos_banner_optical.png");
  } else if (category === "pet") {
    bannerImg = staticFile("upos_banner_pet.png");
  } else if (category === "tea") {
    bannerImg = staticFile("upos_banner_coffee.png");
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

        translate: "0px 11.1px"
      }}>
      <div
        style={{
          width: 380, // Bigger logo size
          height: 110,
          position: "relative",
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
            filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 15px ${accentColor}cc) drop-shadow(0 0 4px #ffffff)`,
            translate: "0px -66px",
          }} />
      </div>
    </Interactive.Div>
  );
};

const CustomHero: React.FC<{
  imageUrl: string;
  accentColor: string;
  layoutStyle: LayoutStyle;
}> = ({ imageUrl, accentColor, layoutStyle }) => {
  const frame = useCurrentFrame();
  const shape = layoutStyle.frameShape || "circle";
  const glow = layoutStyle.borderGlow || "neon";

  // Pulse & Sway animation properties
  const pulseScale = Math.sin(frame * 0.045) * 0.07 + 1.07;
  const floatY = Math.sin(frame * 0.05) * 12;
  const swayX = Math.cos(frame * 0.04) * 6;
  const borderRotate = frame * 1.6;

  // 3D Tilt sways for card3d shape
  const rotateX = shape === "card3d" ? Math.sin(frame * 0.045) * 6.0 : 0;
  const rotateY = shape === "card3d" ? Math.cos(frame * 0.035) * 8.0 : 0;

  // Morphing liquid blob border-radius
  const b1 = 50 + Math.sin(frame * 0.04) * 12;
  const b2 = 50 - Math.sin(frame * 0.04) * 12;
  const b3 = 45 + Math.cos(frame * 0.035) * 14;
  const b4 = 55 - Math.cos(frame * 0.035) * 14;
  const b5 = 40 + Math.sin(frame * 0.03) * 10;
  const b6 = 45 + Math.cos(frame * 0.04) * 11;
  const b7 = 55 - Math.cos(frame * 0.04) * 11;
  const b8 = 60 - Math.sin(frame * 0.03) * 10;
  const blobRadius = `${b1}% ${b2}% ${b3}% ${b4}% / ${b5}% ${b6}% ${b7}% ${b8}%`;

  // Determine border-radius and styles for different shape types
  let borderRadius = "50%"; // default circle
  let clipPath = "none";
  let skewStyle = "none";

  if (shape === "squircle") {
    borderRadius = "80px";
  } else if (shape === "card3d") {
    borderRadius = "48px";
  } else if (shape === "diagonal") {
    borderRadius = "36px";
    skewStyle = "rotate(-2.5deg)";
  } else if (shape === "blob") {
    borderRadius = blobRadius;
  } else if (shape === "hexagon") {
    borderRadius = "24px";
    clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
  }

  // Border Glow styles
  let glowStyle: React.CSSProperties = {};
  if (glow === "neon") {
    glowStyle = {
      boxShadow: `0 0 35px ${accentColor}88, inset 0 0 30px ${accentColor}33`,
      border: `6px solid ${accentColor}`,
    };
  } else if (glow === "metallic") {
    glowStyle = {
      boxShadow: "0 25px 60px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.25)",
      border: "6px solid #e2e8f0",
    };
  } else if (glow === "glass") {
    glowStyle = {
      boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
      border: "6px solid rgba(255, 255, 255, 0.45)",
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
    };
  } else {
    glowStyle = {
      boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
      border: "3px solid rgba(255,255,255,0.15)",
    };
  }

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
        transform: `translate(${swayX}px, ${floatY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${skewStyle}`,
        perspective: shape === "card3d" ? 1200 : undefined,
        transformStyle: shape === "card3d" ? "preserve-3d" : undefined,
      }}
    >
      {/* Dashed outer accent ring (only for circle shape) */}
      {shape === "circle" && (
        <div
          style={{
            position: "absolute",
            width: 844,
            height: 844,
            borderRadius: "50%",
            border: "4px dashed transparent",
            backgroundImage: `linear-gradient(${accentColor}, #ffffff, ${accentColor})`,
            backgroundOrigin: "border-box",
            boxShadow: `0 0 35px ${accentColor}66`,
            transform: `rotate(${borderRotate}deg)`,
            opacity: 0.85,
          }}
        />
      )}
      {/* Main Cropped Image Container */}
      <div
        style={{
          width: 800,
          height: 800,
          borderRadius,
          clipPath,
          overflow: "hidden",
          zIndex: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          ...glowStyle,
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${pulseScale})`
          }}
        />
        {/* Holographic light sweep overlay for 3D card */}
        {shape === "card3d" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "200%",
              height: "100%",
              background: "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)",
              transform: `translateX(${Math.sin(frame * 0.03) * 200 - 50}%)`,
              pointerEvents: "none",
            }}
          />
        )}
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

const getFontFamily = (pairName?: string) => {
  if (pairName === "inter") return interFont;
  if (pairName === "poppins") return poppinsFont;
  if (pairName === "lilita") return subtitleFont;
  return outfitFont;
};

const HookBanner: React.FC<{ hookText: string; accentColor: string; layoutStyle: LayoutStyle }> = ({ hookText, accentColor, layoutStyle }) => {
  const frame = useCurrentFrame();
  if (!hookText) return null;

  const anim = layoutStyle.animationStyle || "spring";
  const activeFont = getFontFamily(layoutStyle.fontPair);

  let opacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  let transform = "";
  if (anim === "spring") {
    const scale = interpolate(frame, [10, 25], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)) });
    transform = `scale(${scale}) translateY(${interpolate(frame, [10, 25], [-20, 0], { extrapolateRight: "clamp" })}px)`;
  } else if (anim === "slideLeft") {
    const slideX = interpolate(frame, [10, 25], [-400, 0], { extrapolateRight: "clamp", easing: ease });
    transform = `translateX(${slideX}px)`;
  } else if (anim === "slideRight") {
    const slideX = interpolate(frame, [10, 25], [400, 0], { extrapolateRight: "clamp", easing: ease });
    transform = `translateX(${slideX}px)`;
  } else {
    transform = `translateY(${interpolate(frame, [10, 25], [-10, 0], { extrapolateRight: "clamp" })}px)`;
  }

  return (
    <Interactive.Div
      name="Hook Banner"
      style={{
        width: 900,

        // Frosted glass backing
        background: "rgba(10, 14, 22, 0.65)",

        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `3px solid ${accentColor}`,
        borderRadius: 24,
        padding: "16px 28px",
        color: "#ffffff",
        fontFamily: activeFont,

        // Easily readable size
        fontSize: 36,

        fontWeight: 800,
        textAlign: "center",
        boxShadow: `0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${accentColor}33`,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        opacity,
        transform,

        // Fine black outline for high contrast
        WebkitTextStroke: "1px #000000",

        // Soft clean shadow
        textShadow: "0 4px 12px rgba(0,0,0,0.7)",

        zIndex: 90,
        translate: "0px 61px",
        scale: 0.186
      }}
    >
      {hookText}
    </Interactive.Div>
  );
};

const Subtitles: React.FC<{ lines: string[]; accentColor: string; category: string; layoutStyle: LayoutStyle }> = ({ lines, accentColor, category, layoutStyle }) => {
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
  const anim = layoutStyle.animationStyle || "spring";
  const activeFont = getFontFamily(layoutStyle.fontPair || "lilita"); // default to lilita for captions

  let opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  let transform = "";
  if (anim === "spring") {
    const scale = interpolate(local, [0, 8], [0.94, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)) });
    transform = `scale(${scale})`;
  } else if (anim === "slideLeft") {
    const slideX = interpolate(local, [0, 8], [-300, 0], { extrapolateRight: "clamp", easing: ease });
    transform = `translateX(${slideX}px)`;
  } else if (anim === "slideRight") {
    const slideX = interpolate(local, [0, 8], [300, 0], { extrapolateRight: "clamp", easing: ease });
    transform = `translateX(${slideX}px)`;
  } else if (anim === "glitch") {
    const shiftX = local < 4 ? (local % 2 === 0 ? -15 : 15) : 0;
    transform = `translateX(${shiftX}px)`;
  }

  return (
    <Interactive.Div
      name="Subtitle"
      style={{
        width: 900,

        // Frosted glass backing
        background: "rgba(10, 14, 22, 0.65)",

        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",

        // Prominent border matching the active themeColor
        border: `4px solid ${accentColor}`,

        borderRadius: 28,
        padding: "30px 40px",
        color: "#ffffff",
        fontFamily: activeFont,
        textTransform: "uppercase",
        letterSpacing: 1.5,

        // Consistent clean subtitle size
        fontSize: 54,

        fontWeight: 900,
        lineHeight: 1.25,
        textAlign: "center",
        WebkitTextStroke: "3px #000000",
        textShadow: "6px 6px 0px #000000",
        opacity,
        transform,
        zIndex: 100,
        translate: "0px -20.3px"
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        background: "rgba(10, 14, 22, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `3px solid ${accentColor}`,
        borderRadius: "30px",
        padding: "16px 40px",
        boxShadow: `0 15px 35px rgba(0, 0, 0, 0.4), 0 0 25px ${accentColor}44`,

        opacity: interpolate(frame, [20, 40], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),

        translate: "0px -38.7px"
      }}
    >
      <span style={{ color: "#ffffff", fontSize: 32, fontWeight: 800, letterSpacing: 0.5 }}>🌐 uvisionpk.com</span>
      <span style={{ color: accentColor, fontSize: 36, fontWeight: 900 }}>·</span>
      <span style={{ color: "#ffffff", fontSize: 32, fontWeight: 800, letterSpacing: 0.5 }}>📞 +92 304 9301811</span>
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



const randomSeed = Math.floor(Math.random() * 100000);

export const IndustryVideo: React.FC<IndustryVideoProps> = ({
  imageUrl,
  audioUrl,
  backgroundMusicUrl,
  text,
  hookText,
  bodyText,
  themeColor,
  industry,
  layoutStyle = {},
}) => {
  const activeStyle = useMemo(() => {
    const shapes = ["circle", "hexagon", "card3d", "diagonal", "blob", "squircle"];
    const animations = ["spring", "fade", "glitch", "slideLeft", "slideRight"];
    const glows = ["neon", "metallic", "glass", "none"];
    const fonts = ["outfit", "lilita", "poppins", "inter"];

    return {
      frameShape: layoutStyle?.frameShape || shapes[randomSeed % shapes.length] as any,
      animationStyle: layoutStyle?.animationStyle || animations[(randomSeed + 2) % animations.length] as any,
      borderGlow: layoutStyle?.borderGlow || glows[(randomSeed + 4) % glows.length] as any,
      fontPair: layoutStyle?.fontPair || fonts[(randomSeed + 6) % fonts.length] as any,
    };
  }, [layoutStyle]);

  const accentColor = themeColor || COLORS.accentDefault;
  const category = getIndustryCategory(industry);

  const lines = splitScriptIntoCaptions(text);
  const activeFont = getFontFamily(activeStyle.fontPair);

  // Generate 15 dynamic background particles
  const particlesCount = 15;
  const particles = Array.from({ length: particlesCount });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: activeFont, overflow: "hidden" }}>
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
          zIndex: 3,
        }}
      >
        {/* Top Section: Logo */}
        <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
          <BrandHeader accentColor={accentColor} />
        </div>

        {/* Hook Section */}
        {hookText ? (
          <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 9 }}>
            <HookBanner hookText={hookText} accentColor={accentColor} layoutStyle={activeStyle} />
          </div>
        ) : null}

        {/* Center Section: Main Image */}
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5 }}>
          <CustomHero imageUrl={imageUrl} accentColor={accentColor} layoutStyle={activeStyle} />
        </div>

        {/* Subtitles Section (above Footer) */}
        <div style={{ position: "absolute", bottom: 250, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 8 }}>
          <Subtitles lines={lines} accentColor={accentColor} category={category} layoutStyle={activeStyle} />
        </div>

        {/* Bottom Section: Footer (CTA) */}
        <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
          <Footer accentColor={accentColor} />
        </div>
      </AbsoluteFill>
      <ProgressBar accentColor={accentColor} />
    </AbsoluteFill>
  );
};
