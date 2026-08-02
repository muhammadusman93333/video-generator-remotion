const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes and static assets
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus";
const AZURE_VOICE = process.env.AZURE_VOICE || "en-IN-ArjunNeural";

app.use(express.json({ limit: "2mb" }));
app.use("/renders", express.static(path.join(__dirname, "renders")));
app.use("/temp", express.static(path.join(__dirname, "temp")));
app.use("/assets", express.static(__dirname));
app.use("/public", express.static(path.join(__dirname, "public")));

const tempDir = path.join(__dirname, "temp");
const renderDir = path.join(__dirname, "renders");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(renderDir)) fs.mkdirSync(renderDir, { recursive: true });

function getFfmpegPath() {
  return fs.existsSync("/home/uvisjanu/bin/ffmpeg")
    ? "/home/uvisjanu/bin/ffmpeg"
    : ffmpegInstaller.path;
}

function getFfprobePath() {
  return fs.existsSync("/home/uvisjanu/bin/ffprobe")
    ? "/home/uvisjanu/bin/ffprobe"
    : ffprobeInstaller.path;
}

function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    exec(
      `"${getFfprobePath()}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      (err, stdout) => {
        if (err) return reject(err);
        resolve(parseFloat(stdout.trim()));
      }
    );
  });
}

async function downloadFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({
    url,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    responseType: "stream",
    timeout: 120000,
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanVoiceText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/https?:\/\//i.test(line) || /www\./i.test(line)) return false;
      if (line.startsWith("#")) return false;
      if (/\+92|\b03\d{9}\b/.test(line)) return false;
      if (/^🌐|^📞/.test(line)) return false;
      return true;
    })
    .join(" ")
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    )
    .replace(/[*#_🌐📞]/g, "")
    .replace(/#\w+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function convertCustomTagsToSsml(text) {
  let escaped = escapeXml(cleanVoiceText(text));
  // Convert [pause] or [break] into SSML break tags
  escaped = escaped.replace(/\[pause\]/gi, '<break time="600ms" />');
  escaped = escaped.replace(/\[break\]/gi, '<break time="600ms" />');
  // Convert [strong]...[/strong] into SSML emphasis tags
  escaped = escaped.replace(/\[strong\](.*?)\[\/strong\]/gi, '<emphasis level="strong">$1</emphasis>');
  escaped = escaped.replace(/\[moderate\](.*?)\[\/moderate\]/gi, '<emphasis level="moderate">$1</emphasis>');
  return escaped;
}

function generateAzureTts(text, outFile, options = {}) {
  return new Promise((resolve, reject) => {
    if (!AZURE_SPEECH_KEY) {
      return reject(
        new Error("Missing AZURE_SPEECH_KEY in .env — required for voiceover")
      );
    }

    const voice = options.voice || AZURE_VOICE;
    const rate = options.rate || "0%";
    const pitch = options.pitch || "0%";
    const style = options.style || "";

    // Determine language code from voice name, e.g. "en-IN-NeerjaNeural" -> "en-IN"
    const lang = voice.split("-").slice(0, 2).join("-") || "en-US";

    const innerContent = convertCustomTagsToSsml(text);

    let ssml = "";
    if (style) {
      ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
  <voice name="${voice}">
    <mstts:express-as style="${style}">
      <prosody rate="${rate}" pitch="${pitch}">${innerContent}</prosody>
    </mstts:express-as>
  </voice>
</speak>`;
    } else {
      ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
  <voice name="${voice}">
    <prosody rate="${rate}" pitch="${pitch}">${innerContent}</prosody>
  </voice>
</speak>`;
    }

    const req = https.request(
      {
        hostname: `${AZURE_SPEECH_REGION}.tts.speech.microsoft.com`,
        path: "/cognitiveservices/v1",
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "upos-remotion-tts",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            return reject(
              new Error(
                `Azure TTS failed (${res.statusCode}): ${buffer.toString("utf8")}`
              )
            );
          }
          fs.writeFileSync(outFile, buffer);
          resolve(outFile);
        });
      }
    );

    req.on("error", reject);
    req.write(ssml);
    req.end();
  });
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const envPrefix = fs.existsSync("/home/uvisjanu/bin/ffmpeg")
      ? "PATH=$PATH:/home/uvisjanu/bin "
      : "";

    exec(`${envPrefix}${command}`, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`${err.message}\n${stderr || stdout}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  return `${req.protocol}://${req.get("host")}`;
}

function safeUnlink(...files) {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) {}
  }
}

function generateRandomLayoutStyle() {
  const shapes = ["circle", "hexagon", "card3d", "diagonal", "blob", "squircle"];
  const animations = ["spring", "fade", "glitch", "slideLeft", "slideRight"];
  const glows = ["neon", "metallic", "glass", "none"];
  const fonts = ["outfit", "lilita", "poppins", "inter"];

  return {
    frameShape: shapes[Math.floor(Math.random() * shapes.length)],
    animationStyle: animations[Math.floor(Math.random() * animations.length)],
    borderGlow: glows[Math.floor(Math.random() * glows.length)],
    fontPair: fonts[Math.floor(Math.random() * fonts.length)],
  };
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    azureTtsConfigured: Boolean(AZURE_SPEECH_KEY),
    voice: AZURE_VOICE,
  });
});

/**
 * Make.com / automation endpoint
 *
 * Body JSON:
 * {
 *   "image_url": "https://..../image.jpeg",   // required
 *   "script": "Voice + subtitle text",        // required (alias: text)
 *   "prompt": "optional context / notes",     // optional
 *   "composition": "PosVideo",                // optional: PosVideo | MainVideo
 *   "background_music_url": "https://..."     // optional
 * }
 *
 * Response:
 * { "status": "success", "url": "https://host/renders/video_xxx.mp4", ... }
 */
app.post("/generate", async (req, res) => {
  const imageUrl = req.body.image_url || req.body.imageUrl;
  const script =
    req.body.script || req.body.text || req.body.voiceover_script || req.body.voiceoverScript;
  const prompt = req.body.prompt || "";
  let composition = req.body.composition || "random";
  if (composition === "random" || composition === "IndustryVideo") {
    const randomId = Math.floor(Math.random() * 6) + 1;
    composition = `IndustryVideoV${randomId}`;
  }

  const hookText = req.body.hookText || req.body.hook || "";
  const bodyText = req.body.bodyText || req.body.body || "";
  const themeColor = req.body.themeColor || req.body.theme_color || "";

  if (!imageUrl || !script) {
    return res.status(400).json({
      status: "error",
      message:
        "Missing required fields. Send JSON: { image_url, script } (script alias: text). Optional: prompt, composition, background_music_url, hookText, bodyText, themeColor",
    });
  }

  const uniqueId = Math.random().toString(36).substring(7) + "_" + Date.now();
  const localImage = path.join(tempDir, `${uniqueId}.jpeg`);
  const localAudio = path.join(tempDir, `${uniqueId}_voice.mp3`);
  const propsFile = path.join(tempDir, `${uniqueId}_props.json`);
  const finalVideo = path.join(renderDir, `video_${uniqueId}.mp4`);
  const baseUrl = getBaseUrl(req);

  try {
    console.log(`[${uniqueId}] Downloading image...`);
    await downloadFile(imageUrl, localImage);

    const voice = req.body.voice || AZURE_VOICE;
    const style = req.body.style || req.body.tone || "";
    let rate = req.body.rate || req.body.speed;
    if (rate === undefined) {
      rate = "+5%";
    } else if (typeof rate === "number") {
      const percent = Math.round((rate - 1) * 100);
      rate = `${percent >= 0 ? "+" : ""}${percent}%`;
    }
    let pitch = req.body.pitch;
    if (pitch === undefined) {
      pitch = "-5%";
    } else if (typeof pitch === "number") {
      const percent = Math.round(pitch * 100);
      pitch = `${percent >= 0 ? "+" : ""}${percent}%`;
    }

    console.log(`[${uniqueId}] Generating Azure TTS...`);
    await generateAzureTts(script, localAudio, { voice, style, rate, pitch });

    const durationSec = await getAudioDuration(localAudio);
    const totalFrames = Math.max(90, Math.round((durationSec + 1.2) * 30));

    const backgroundMusicUrl =
      req.body.background_music_url ||
      `${baseUrl}/public/background-music.mp3`;

    const layoutStyle = req.body.layoutStyle || req.body.layout_style || generateRandomLayoutStyle();

    const props = {
      imageUrl: `${baseUrl}/temp/${uniqueId}.jpeg`,
      audioUrl: `${baseUrl}/temp/${uniqueId}_voice.mp3`,
      backgroundMusicUrl,
      text: script,
      prompt,
      hookText,
      bodyText,
      themeColor,
      industry: req.body.industry || "",
      layoutStyle,
    };

    fs.writeFileSync(propsFile, JSON.stringify(props));

    console.log(
      `[${uniqueId}] Rendering ${composition} (${totalFrames} frames)...`
    );

    const propsPath = propsFile.replace(/\\/g, "/");
    const outPath = finalVideo.replace(/\\/g, "/");

    const concurrency = process.env.REMOTION_CONCURRENCY || "1";
    const concurrencyFlag = concurrency !== "auto" ? `--concurrency=${concurrency}` : "";
    const browserFlags = process.env.REMOTION_BROWSER_FLAGS || "--disable-dev-shm-usage --no-sandbox --disable-gpu";

    await runCommand(
      `npx remotion render src/index.ts ${composition} "${outPath}" --duration=${totalFrames} --props="${propsPath}" ${concurrencyFlag} --browser-flags="${browserFlags}"`
    );

    // Keep audio/image briefly available is no longer needed after render
    safeUnlink(localImage, localAudio, propsFile);

    const videoUrl = `${baseUrl}/renders/video_${uniqueId}.mp4`;
    console.log(`[${uniqueId}] Done: ${videoUrl}`);

    res.json({
      status: "success",
      url: videoUrl,
      video_url: videoUrl,
      composition,
      duration_seconds: durationSec,
      frames: totalFrames,
      prompt: prompt || null,
    });
  } catch (error) {
    console.error(`[${uniqueId}] Error:`, error);
    safeUnlink(localImage, localAudio, propsFile);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * Restaurant Video Generation endpoint
 */
app.post("/generate/restaurant", async (req, res) => {
  const imageUrl = req.body.image_url || req.body.imageUrl;
  const script =
    req.body.script || req.body.text || req.body.voiceover_script || req.body.voiceoverScript;
  const prompt = req.body.prompt || "";
  const randomId = Math.floor(Math.random() * 6) + 1;
  const composition = `IndustryVideoV${randomId}`;

  const hookText = req.body.hookText || req.body.hook || "";
  const bodyText = req.body.bodyText || req.body.body || "";
  const themeColor = req.body.themeColor || req.body.theme_color || "";

  if (!imageUrl || !script) {
    return res.status(400).json({
      status: "error",
      message:
        "Missing required fields. Send JSON: { image_url, script } (script alias: text). Optional: hookText, bodyText, themeColor",
    });
  }

  const uniqueId = Math.random().toString(36).substring(7) + "_" + Date.now();
  const localImage = path.join(tempDir, `${uniqueId}.jpeg`);
  const localAudio = path.join(tempDir, `${uniqueId}_voice.mp3`);
  const propsFile = path.join(tempDir, `${uniqueId}_props.json`);
  const finalVideo = path.join(renderDir, `video_${uniqueId}.mp4`);
  const baseUrl = getBaseUrl(req);

  try {
    console.log(`[Restaurant ${uniqueId}] Downloading image...`);
    await downloadFile(imageUrl, localImage);

    const voice = req.body.voice || AZURE_VOICE;
    const style = req.body.style || req.body.tone || "";
    let rate = req.body.rate || req.body.speed;
    if (rate === undefined) {
      rate = "+5%";
    } else if (typeof rate === "number") {
      const percent = Math.round((rate - 1) * 100);
      rate = `${percent >= 0 ? "+" : ""}${percent}%`;
    }
    let pitch = req.body.pitch;
    if (pitch === undefined) {
      pitch = "-5%";
    } else if (typeof pitch === "number") {
      const percent = Math.round(pitch * 100);
      pitch = `${percent >= 0 ? "+" : ""}${percent}%`;
    }

    console.log(`[Restaurant ${uniqueId}] Generating Azure TTS...`);
    await generateAzureTts(script, localAudio, { voice, style, rate, pitch });

    const durationSec = await getAudioDuration(localAudio);
    const totalFrames = Math.max(90, Math.round((durationSec + 1.2) * 30));

    const backgroundMusicUrl =
      req.body.background_music_url ||
      `${baseUrl}/public/background-music.mp3`;

    const layoutStyle = req.body.layoutStyle || req.body.layout_style || generateRandomLayoutStyle();

    const props = {
      imageUrl: `${baseUrl}/temp/${uniqueId}.jpeg`,
      audioUrl: `${baseUrl}/temp/${uniqueId}_voice.mp3`,
      backgroundMusicUrl,
      text: script,
      prompt,
      hookText,
      bodyText,
      themeColor,
      industry: "Restaurant",
      layoutStyle,
    };

    fs.writeFileSync(propsFile, JSON.stringify(props));

    console.log(
      `[Restaurant ${uniqueId}] Rendering ${composition} (${totalFrames} frames)...`
    );

    const propsPath = propsFile.replace(/\\/g, "/");
    const outPath = finalVideo.replace(/\\/g, "/");

    const concurrency = process.env.REMOTION_CONCURRENCY || "1";
    const concurrencyFlag = concurrency !== "auto" ? `--concurrency=${concurrency}` : "";
    const browserFlags = process.env.REMOTION_BROWSER_FLAGS || "--disable-dev-shm-usage --no-sandbox --disable-gpu";

    await runCommand(
      `npx remotion render src/index.ts ${composition} "${outPath}" --duration=${totalFrames} --props="${propsPath}" ${concurrencyFlag} --browser-flags="${browserFlags}"`
    );

    safeUnlink(localImage, localAudio, propsFile);

    const videoUrl = `${baseUrl}/renders/video_${uniqueId}.mp4`;
    console.log(`[Restaurant ${uniqueId}] Done: ${videoUrl}`);

    res.json({
      status: "success",
      url: videoUrl,
      video_url: videoUrl,
      composition,
      duration_seconds: durationSec,
      frames: totalFrames,
    });
  } catch (error) {
    console.error(`[Restaurant ${uniqueId}] Error:`, error);
    safeUnlink(localImage, localAudio, propsFile);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});


/**
 * Text-to-Speech endpoint
 *
 * Body JSON:
 * {
 *   "text": "Hello world",               // required (alias: script)
 *   "voice": "en-US-JennyNeural",        // optional
 *   "style": "cheerful",                 // optional (alias: tone)
 *   "rate": "0%",                        // optional (alias: speed, can be string like "+10%" or number like 1.1)
 *   "pitch": "0%"                        // optional (can be string like "+5%" or number like 0.05)
 * }
 *
 * Response:
 * { "status": "success", "url": "https://host/temp/tts_xxx_voice.mp3", ... }
 */
app.post("/tts", async (req, res) => {
  const text = req.body.text || req.body.script;
  if (!text) {
    return res.status(400).json({
      status: "error",
      message: "Missing required field: text (or script)",
    });
  }

  const voice = req.body.voice || AZURE_VOICE;
  const style = req.body.style || req.body.tone || "";
  
  let rate = req.body.rate || req.body.speed;
  if (rate === undefined) {
    rate = "+5%";
  } else if (typeof rate === "number") {
    const percent = Math.round((rate - 1) * 100);
    rate = `${percent >= 0 ? "+" : ""}${percent}%`;
  }

  let pitch = req.body.pitch;
  if (pitch === undefined) {
    pitch = "-5%";
  } else if (typeof pitch === "number") {
    const percent = Math.round(pitch * 100);
    pitch = `${percent >= 0 ? "+" : ""}${percent}%`;
  }

  const uniqueId = Math.random().toString(36).substring(7) + "_" + Date.now();
  const localAudio = path.join(tempDir, `tts_${uniqueId}_voice.mp3`);
  const baseUrl = getBaseUrl(req);

  try {
    console.log(`[TTS ${uniqueId}] Generating TTS...`);
    await generateAzureTts(text, localAudio, { voice, style, rate, pitch });

    const durationSec = await getAudioDuration(localAudio);
    const audioUrl = `${baseUrl}/temp/tts_${uniqueId}_voice.mp3`;

    console.log(`[TTS ${uniqueId}] Done: ${audioUrl}`);

    res.json({
      status: "success",
      url: audioUrl,
      audio_url: audioUrl,
      duration_seconds: durationSec,
      parameters: {
        voice,
        style,
        rate,
        pitch,
      },
    });
  } catch (error) {
    console.error(`[TTS ${uniqueId}] Error:`, error);
    safeUnlink(localAudio);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});


app.listen(PORT, () => {
  console.log(`Video generator running on http://localhost:${PORT}`);
  console.log(`POST /generate  { image_url, script, prompt? }`);
  console.log(`POST /tts       { text, voice?, style?, rate?, pitch? }`);
  console.log(`GET  /health`);
  if (!AZURE_SPEECH_KEY) {
    console.warn("WARNING: AZURE_SPEECH_KEY is not set in .env");
  }
});
