import React from "react";
import {
  Audio,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  CanvasImage,
} from "remotion";

export interface MainVideoProps {
  imageUrl?: string;
  audioUrl?: string;
  backgroundMusicUrl?: string;
  text?: string;
}

export const MainVideo: React.FC<MainVideoProps> = ({ imageUrl = "", audioUrl, backgroundMusicUrl, text = "" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 1. Zoom effect for the image (from 1.0 to 1.15)
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  // 2. Parse text lines (ignore URLs, phone numbers, and hashtags for display subtitles)
  const sentences = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length === 0) return false;
      if (line.includes("http") || line.includes("www.")) return false;
      if (line.startsWith("#")) return false;
      if (line.includes("+92") || line.includes("📞")) return false;
      return true;
    });

  // 3. Dynamic Subtitle Timing:
  // We divide the total frames among sentences based on the character length of each sentence.
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  let currentStartFrame = 0;
  const timedSentences = sentences.map((sentence) => {
    const share = sentence.length / (totalChars || 1);
    const duration = Math.round(share * durationInFrames);
    const start = currentStartFrame;
    const end = start + duration;
    currentStartFrame = end;
    return { sentence, start, end };
  });

  // 4. Find the current subtitle to display
  const activeSubtitle = timedSentences.find(
    (item) => frame >= item.start && frame < item.end
  );

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0d0d0d",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* BACKGROUND: Blurred cover version of the image to create a rich look */}
      <Img
        src={imageUrl}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(20px) brightness(0.4)",
          transform: `scale(${scale * 1.1})`,
        }}
      />
      {/* AUDIO TRACKS */}
      {audioUrl && <Audio src={audioUrl} />}
      {backgroundMusicUrl && <Audio src={backgroundMusicUrl} volume={0.12} loop />}
      {/* CALL TO ACTION HEADER */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          textShadow: "0px 2px 8px rgba(0,0,0,0.5)",
          zIndex: 10,
        }}
      >
        🚀 Business Automation
      </div>
      {/* CENTER WORKSPACE: Panning clear 1:1 image with absolute overlay subtitle */}
      <div
        style={{
          width: 460,
          height: 460,
          borderRadius: 24,
          boxShadow: "0px 20px 50px rgba(0,0,0,0.7)",
          overflow: "hidden",
          border: "2px solid rgba(255, 255, 255, 0.1)",
          zIndex: 5,
          position: "relative",
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }} />

        {/* ANIMATED DYNAMIC SUBTITLES OVERLAID ON IMAGE */}
        {activeSubtitle && (() => {
          // Calculate frames relative to the start of this specific subtitle
          const relativeFrame = frame - activeSubtitle.start;
          
          // Typing speed: 1 character per frame
          const visibleLength = Math.min(
            activeSubtitle.sentence.length,
            Math.floor(relativeFrame / 1)
          );
          const textToDisplay = activeSubtitle.sentence.slice(0, visibleLength);
          const isDoneTyping = visibleLength === activeSubtitle.sentence.length;
          
          // Blink cursor every 6 frames
          const showCursor = !isDoneTyping && (Math.floor(relativeFrame / 3) % 2 === 0);

          // Animate container entry
          const opacity = interpolate(relativeFrame, [0, 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(relativeFrame, [0, 8], [15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 20,
                right: 20,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(12px)",
                padding: "15px 20px",
                borderRadius: 16,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.4,
                boxShadow: "0px 10px 30px rgba(0,0,0,0.5)",
                opacity: opacity,
                transform: `translateY(${translateY}px)`,
              }}
            >
              {textToDisplay}
              {showCursor && <span style={{ color: "#ffd700", marginLeft: 2 }}>|</span>}
            </div>
          );
        })()}
      </div>
      {/* BOTTOM FOOTER BRANDING */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#ffd700", // Gold color for CTA
          fontSize: 20,
          fontWeight: 700,
          textShadow: "0px 2px 4px rgba(0,0,0,0.8)",
          zIndex: 10,
        }}
      >
        📞 +923049301811 &nbsp; | &nbsp; uvisionpk.com
      </div>
      <CanvasImage
        src={staticFile("final uvision icon.jpg")}
        from={11}
        style={{
          position: "absolute",
          translate: "-3.1px -319.3px",
          rotate: "-2.5deg",
          scale: 2.619
        }} /></div>
  );
};
