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
import { loadFont } from "@remotion/google-fonts/NotoNastaliqUrdu";
import { getAudioDuration } from "./get-audio-duration";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["arabic"],
});

const FPS = 30;
const END_PADDING_SECONDS = 1.5;

export type QuranicQalamVideoProps = {
  text: string;
  audioUrl?: string;
  backgroundMusicUrl?: string;
  themeColor?: string;
};

export const quranicQalamVideoDefaultProps: QuranicQalamVideoProps = {
  text: "کیا زندگی کا شور آپ کے سکون کو نگل رہا ہے؟\nخاموشی سے اپنے رب پر توکل کر لیں۔\nکیونکہ دلوں کا سچا اطمینان اور سکون\nصرف اسی پاک ذات کے ذکر میں پوشیدہ ہے۔",
  audioUrl: "",
  backgroundMusicUrl: "",
  themeColor: "#C3A13B", // Warm spiritual Gold
};

export const calculateQuranicQalamVideoMetadata: CalculateMetadataFunction<
  QuranicQalamVideoProps
> = async ({ props }) => {
  if (!props.audioUrl) {
    return { durationInFrames: 390 }; // ~13 seconds default
  }

  try {
    const durationInSeconds = await getAudioDuration(props.audioUrl);
    return {
      durationInFrames: Math.max(
        120,
        Math.ceil((durationInSeconds + END_PADDING_SECONDS) * FPS)
      ),
    };
  } catch (_e) {
    return { durationInFrames: 390 };
  }
};

// Inkpot SVG Component
const Dawaat: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  return (
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.25))" }}>
      {/* Jar base shadow */}
      <ellipse cx="50" cy="85" rx="30" ry="8" fill="rgba(0,0,0,0.15)" />
      {/* Inkpot main body */}
      <rect x="25" y="45" width="50" height="40" rx="12" fill="#122c34" stroke={accentColor} strokeWidth="3" />
      {/* Neck */}
      <ellipse cx="50" cy="45" rx="18" ry="6" fill="#122c34" stroke={accentColor} strokeWidth="3" />
      <ellipse cx="50" cy="45" rx="10" ry="3.5" fill="#040b0e" />
      {/* Gold pattern decoration */}
      <circle cx="50" cy="65" r="9" fill="none" stroke={accentColor} strokeWidth="2" strokeDasharray="3 2" />
      <path d="M 33 65 Q 50 72 67 65" fill="none" stroke={accentColor} strokeWidth="1.5" />
      {/* Cap leaning against inkpot */}
      <path d="M 72 65 Q 85 70 88 80 L 80 84 Q 72 72 72 65" fill={accentColor} stroke="#685623" strokeWidth="2" />
    </svg>
  );
};

// Qalam SVG Component
const Qalam: React.FC<{ accentColor: string; angle: number }> = ({ accentColor, angle }) => {
  return (
    <svg
      width="100"
      height="180"
      viewBox="0 0 100 180"
      style={{
        position: "absolute",
        // The bottom-left tip of the nib is at coordinates (0, 180) in SVG.
        // We offset it so that the tip matches the absolute anchor point exactly.
        left: -12, 
        bottom: -2,
        transformOrigin: "0px 180px",
        transform: `rotate(${angle}deg)`,
        filter: "drop-shadow(-8px 12px 10px rgba(0,0,0,0.3))",
      }}
    >
      {/* Reed shaft (main body) */}
      <path d="M 10 0 L 22 0 L 22 140 L 0 180 L 0 160 L 10 140 Z" fill="#8c6239" stroke="#5c3f21" strokeWidth="2" />
      {/* Bevel cut for nib */}
      <path d="M 0 180 L 2 170 C 5 162, 12 162, 15 170 L 20 160 Q 15 145 10 140 L 0 160 Z" fill="#e6c229" />
      {/* Nib slit */}
      <line x1="0" y1="180" x2="8" y2="168" stroke="#332211" strokeWidth="1.5" />
      {/* Gold brand band */}
      <rect x="10" y="40" width="12" height="15" fill={accentColor} />
    </svg>
  );
};

// Ambient floating particles
const Particle: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const random = (seed: number) => {
    const x = Math.sin(index * 392.83 + seed * 83.12) * 9842;
    return x - Math.floor(x);
  };

  const size = Math.round(random(1) * 8 + 4);
  const startX = random(2) * 1080;
  const speed = random(3) * 1.5 + 0.6;
  const swayRange = random(4) * 60 + 20;
  const swaySpeed = random(5) * 0.03 + 0.01;

  const startY = 1920 + (index * 110);
  const currentY = startY - (frame * speed);
  const y = ((currentY + 100) % (1920 + 200)) - 100;
  const x = startX + Math.sin(frame * swaySpeed) * swayRange;

  const opacity = interpolate(y, [0, 150, 1750, 1920], [0, 0.5, 0.5, 0], {
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
        filter: "blur(1px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
};

export const QuranicQalamVideo: React.FC<QuranicQalamVideoProps> = ({
  text,
  audioUrl,
  backgroundMusicUrl,
  themeColor = "#C3A13B",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const accentColor = themeColor;

  // Split lines cleanly
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Distribute writing frames among lines
  const startWritingFrame = 45; // Start writing after brief entrance (1.5s)
  const endWritingFrame = durationInFrames - Math.round(END_PADDING_SECONDS * FPS);
  const totalWritingFrames = Math.max(120, endWritingFrame - startWritingFrame);

  const totalChars = lines.reduce((acc, line) => acc + line.length, 0) || 1;

  // Compute start/end frames for each line based on character count
  let frameCursor = startWritingFrame;
  const lineTimings = lines.map((line, index) => {
    const share = line.length / totalChars;
    const duration = Math.round(share * totalWritingFrames);
    const start = frameCursor;
    const end = start + duration;
    frameCursor = end;
    return { line, start, end, index };
  });

  // Calculate paper entrance zoom and fade
  const paperScale = interpolate(frame, [0, 20], [0.93, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const paperOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background slow-pan zoom
  const bgScale = interpolate(frame, [0, durationInFrames], [1.02, 1.1], {
    extrapolateRight: "clamp",
  });

  // Particles
  const particles = Array.from({ length: 12 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#18140f",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background Serene Warm Gradient & Light Vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle, #2a221a 0%, #15110d 100%)",
          scale: bgScale,
        }}
      />

      {/* Floating spiritual particles */}
      {particles.map((_, i) => (
        <Particle key={i} index={i} color={accentColor} />
      ))}

      {/* Voiceover audio */}
      {audioUrl && (
        <Sequence name="Voiceover">
          <Audio src={audioUrl} />
        </Sequence>
      )}

      {/* Spiritual background music */}
      {backgroundMusicUrl && (
        <Sequence name="Background Music">
          <Audio src={backgroundMusicUrl} volume={0.08} loop />
        </Sequence>
      )}

      <AbsoluteFill
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 60px",
          zIndex: 2,
        }}
      >
        {/* PARCHMENT PAPER CONTAINER */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            maxWidth: 960,
            maxHeight: 1760,
            borderRadius: 40,
            // Parchment texture styling
            background: "#f4edd9",
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(220,205,175,0.85) 100%)`,
            border: "5px solid #d4c4a8",
            boxShadow: "0 40px 90px rgba(0, 0, 0, 0.65), inset 0 0 80px rgba(100, 75, 45, 0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px 70px",
            scale: paperScale,
            opacity: paperOpacity,
          }}
        >
          {/* HEADER: Spiritual Branding */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `2px solid ${accentColor}33`,
              paddingBottom: 25,
            }}
          >
            <div style={{ color: "#4a3c2c", fontSize: 34, fontWeight: 700, letterSpacing: 1.5 }}>
              قُرآنی ہدایت
            </div>
            {/* Dawaat in corner */}
            <div style={{ marginTop: -15, marginRight: -20 }}>
              <Dawaat accentColor={accentColor} />
            </div>
          </div>

          {/* CENTRAL CALLIGRAPHY AREA */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 90,
              direction: "rtl",
              textAlign: "right",
            }}
          >
            {lines.map((line, idx) => {
              const timing = lineTimings[idx];
              const isLineActive = frame >= timing.start && frame < timing.end;
              const isLineWritten = frame >= timing.end;
              const isLineNotStarted = frame < timing.start;

              // Compute character count to reveal
              let visibleText = "";
              if (isLineWritten) {
                visibleText = line;
              } else if (isLineActive) {
                const elapsed = frame - timing.start;
                const totalLineFrames = timing.end - timing.start;
                const revealProgress = elapsed / totalLineFrames;
                const revealCount = Math.floor(revealProgress * line.length);
                visibleText = line.substring(0, revealCount);
              }

              // Subtle qalam writing wobble
              const qalamWobble = isLineActive ? Math.sin(frame * 0.9) * 4.0 : 0;
              const qalamAngle = -15 + qalamWobble;

              // Line opacity transition
              const lineOpacity = isLineNotStarted
                ? 0
                : interpolate(frame, [timing.start, timing.start + 10], [0.3, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });

              return (
                <div
                  key={idx}
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: idx === 0 ? "#1c140c" : "#3c2e1e",
                    lineHeight: 1.6,
                    opacity: lineOpacity,
                    position: "relative",
                    minHeight: 80,
                    display: "flex",
                    alignItems: "center",
                    paddingRight: 20,
                  }}
                >
                  <span
                    style={{
                      direction: "rtl",
                      unicodeBidi: "plaintext",
                      borderRight: idx === 0 ? `4px solid ${accentColor}` : "none",
                      paddingRight: idx === 0 ? 15 : 0,
                    }}
                  >
                    {visibleText}
                  </span>

                  {/* Inline calligraphic cursor (Qalam) */}
                  {isLineActive && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 0,
                        height: 0,
                        position: "relative",
                        verticalAlign: "baseline",
                      }}
                    >
                      <Qalam accentColor={accentColor} angle={qalamAngle} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* FOOTER: Comfort note */}
          <div
            style={{
              textAlign: "center",
              color: "#6c5b4b",
              fontSize: 26,
              fontWeight: 500,
              borderTop: `2px solid ${accentColor}22`,
              paddingTop: 30,
            }}
          >
            دلوں کا سکون، ذکرِ الٰہی میں ہے
          </div>
        </div>
      </AbsoluteFill>

      {/* Progress bar at the very bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 14,
          backgroundColor: "rgba(255,255,255,0.06)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: `${(frame / (durationInFrames - 1)) * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${accentColor} 0%, #ffffff 100%)`,
            boxShadow: `0 0 15px ${accentColor}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
