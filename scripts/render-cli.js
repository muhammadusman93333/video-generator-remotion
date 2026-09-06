const fs = require("fs");
const path = require("path");
const https = require("https");
const { exec } = require("child_process");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

// Load environment variables from .env file
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Parse inputs from Env
const IMAGE_URL = process.env.IMAGE_URL;
const SCRIPT = process.env.SCRIPT || process.env.TEXT;
let COMPOSITION = process.env.COMPOSITION || "IndustryVideo";
if (COMPOSITION === "random") {
  COMPOSITION = "IndustryVideo";
}
const BACKGROUND_MUSIC_URL = process.env.BACKGROUND_MUSIC_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus";
const AZURE_VOICE = process.env.AZURE_VOICE || "en-IN-NeerjaNeural";
const TTS_PROVIDER = (process.env.TTS_PROVIDER || "edge").toLowerCase();

const HOOK_TEXT = process.env.HOOK_TEXT || process.env.HOOK || "";
const BODY_TEXT = process.env.BODY_TEXT || process.env.BODY || "";
const SUBTITLES = process.env.SUBTITLES || process.env.SUBTITLE || "";
const THEME_COLOR = process.env.THEME_COLOR || process.env.COLOR || "";
const INDUSTRY = process.env.INDUSTRY || "";
const LAYOUT_STYLE = process.env.LAYOUT_STYLE ? JSON.parse(process.env.LAYOUT_STYLE) : null;

const tempDir = path.join(__dirname, "..", "temp");
const renderDir = path.join(__dirname, "..", "renders");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(renderDir)) fs.mkdirSync(renderDir, { recursive: true });

function safeUnlink(...files) {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) {}
  }
}

function getFfprobePath() {
  return ffprobeInstaller.path;
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

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download file, status: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => reject(err));
    });
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
  escaped = escaped.replace(/\[pause\]/gi, '<break time="600ms" />');
  escaped = escaped.replace(/\[break\]/gi, '<break time="600ms" />');
  escaped = escaped.replace(/\[strong\](.*?)\[\/strong\]/gi, '<emphasis level="strong">$1</emphasis>');
  escaped = escaped.replace(/\[moderate\](.*?)\[\/moderate\]/gi, '<emphasis level="moderate">$1</emphasis>');
  return escaped;
}

function parseVtt(vttContent) {
  if (!vttContent) return [];
  const blocks = vttContent.trim().split(/\r?\n\r?\n/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
      if (match) {
        const start = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10) + parseInt(match[4], 10) / 1000;
        const end = parseInt(match[5], 10) * 3600 + parseInt(match[6], 10) * 60 + parseInt(match[7], 10) + parseInt(match[8], 10) / 1000;
        const text = lines.slice(i + 1).join(" ").trim();
        cues.push({ start, end, text });
        break;
      }
    }
  }
  return cues;
}

function buildCaptionCues(vttCues, subtitleText, totalDurationSec, fps = 30) {
  const sentences = subtitleText
    ? subtitleText
        .replace(/\[pause\]/gi, "")
        .replace(/\[break\]/gi, "")
        .split(/(?<=[.?!])\s+|\r?\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const cues = [];

  function addChunks(text, startSec, endSec) {
    if (!text) return;
    const words = text.split(/\s+/).filter(Boolean);
    const maxWords = 8;
    if (words.length <= maxWords) {
      cues.push({
        text,
        startFrame: Math.round(startSec * fps),
        endFrame: Math.max(Math.round(startSec * fps) + 1, Math.round(endSec * fps)),
      });
      return;
    }

    const chunkCount = Math.ceil(words.length / maxWords);
    const wordsPerChunk = Math.ceil(words.length / chunkCount);
    const totalWords = words.length;
    const dur = Math.max(0.1, endSec - startSec);

    let wCursor = 0;
    for (let c = 0; c < chunkCount; c++) {
      const chunkWords = words.slice(wCursor, wCursor + wordsPerChunk);
      if (chunkWords.length === 0) break;
      const cStart = startSec + (wCursor / totalWords) * dur;
      const cEnd = startSec + ((wCursor + chunkWords.length) / totalWords) * dur;
      cues.push({
        text: chunkWords.join(" "),
        startFrame: Math.round(cStart * fps),
        endFrame: Math.max(Math.round(cStart * fps) + 1, Math.round(cEnd * fps)),
      });
      wCursor += chunkWords.length;
    }
  }

  if (vttCues && vttCues.length > 0 && sentences.length === vttCues.length) {
    for (let i = 0; i < sentences.length; i++) {
      addChunks(sentences[i], vttCues[i].start, vttCues[i].end);
    }
  } else if (vttCues && vttCues.length > 0 && sentences.length > 0) {
    const speechStart = vttCues[0].start;
    const speechEnd = vttCues[vttCues.length - 1].end;
    const speechDur = Math.max(0.5, speechEnd - speechStart);
    const totalChars = sentences.reduce((acc, s) => acc + s.length, 0) || 1;
    let charAcc = 0;
    for (const sent of sentences) {
      const sStart = speechStart + (charAcc / totalChars) * speechDur;
      const sEnd = speechStart + ((charAcc + sent.length) / totalChars) * speechDur;
      addChunks(sent, sStart, sEnd);
      charAcc += sent.length;
    }
  } else if (sentences.length > 0) {
    const totalChars = sentences.reduce((acc, s) => acc + s.length, 0) || 1;
    let charAcc = 0;
    for (const sent of sentences) {
      const sStart = (charAcc / totalChars) * totalDurationSec;
      const sEnd = ((charAcc + sent.length) / totalChars) * totalDurationSec;
      addChunks(sent, sStart, sEnd);
      charAcc += sent.length;
    }
  }

  return cues;
}

function generateEdgeTts(text, outFile, outVttFile, voice = AZURE_VOICE) {
  return new Promise((resolve, reject) => {
    const cleanText = cleanVoiceText(text)
      .replace(/\[pause\]/gi, " ")
      .replace(/\[break\]/gi, " ")
      .replace(/\[strong\](.*?)\[\/strong\]/gi, "$1")
      .replace(/\[moderate\](.*?)\[\/moderate\]/gi, "$1");

    const hasUrduCharacters = /[\u0600-\u06FF]/.test(cleanText);
    let targetVoice = voice;
    if (!targetVoice || targetVoice.includes("*") || targetVoice.trim() === "") {
      targetVoice = hasUrduCharacters ? "ur-PK-AsadNeural" : "en-IN-NeerjaNeural";
    }
    targetVoice = targetVoice.replace(/^["']|["']$/g, "").trim();
    if (hasUrduCharacters && targetVoice.startsWith("en-")) {
      console.log(`[TTS] Urdu text detected. Switching voice from '${targetVoice}' to 'ur-PK-AsadNeural'`);
      targetVoice = "ur-PK-AsadNeural";
    }

    const fallbackVoice = hasUrduCharacters ? "ur-PK-UzmaNeural" : "en-IN-NeerjaNeural";

    const tempTextFile = path.join(tempDir, `tts_cli_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
    try {
      fs.writeFileSync(tempTextFile, cleanText, "utf8");
    } catch (writeErr) {
      return reject(writeErr);
    }

    const rateValue = process.env.TTS_RATE || "-4%";
    const rateFlag = `--rate="${rateValue}"`;
    const vttFlag = outVttFile ? `--write-subtitles "${outVttFile}"` : "";

    const execEnv = {
      ...process.env,
      PATH: process.env.PATH + (process.platform === "win32" ? "" : ":/home/runner/.local/bin:/root/.local/bin")
    };

    const executeTts = (selectedVoice, callback) => {
      console.log(`[TTS] Requesting Edge-TTS (Voice: ${selectedVoice})...`);
      const cmdEdgeTts = `edge-tts --file "${tempTextFile}" --write-media "${outFile}" ${vttFlag} --voice "${selectedVoice}" ${rateFlag}`.trim();
      const cmdPy = `python -m edge_tts --file "${tempTextFile}" --write-media "${outFile}" ${vttFlag} --voice "${selectedVoice}" ${rateFlag}`.trim();
      const cmdPyWin = `py -m edge_tts --file "${tempTextFile}" --write-media "${outFile}" ${vttFlag} --voice "${selectedVoice}" ${rateFlag}`.trim();
      const cmdPy3 = `python3 -m edge_tts --file "${tempTextFile}" --write-media "${outFile}" ${vttFlag} --voice "${selectedVoice}" ${rateFlag}`.trim();

      const candidateCmds = process.platform === "win32"
        ? [cmdPy, cmdEdgeTts, cmdPyWin]
        : [cmdPy3, cmdEdgeTts, cmdPy];

      const tryCommand = (cmd, nextCmds) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 10, env: execEnv }, (err) => {
          if (!err && fs.existsSync(outFile) && fs.statSync(outFile).size > 0) {
            return callback(null, outFile);
          }
          if (nextCmds.length > 0) {
            tryCommand(nextCmds[0], nextCmds.slice(1));
          } else {
            console.log("[TTS] Retrying with python pip install...");
            const pipCmd = process.platform === "win32"
              ? "python -m pip install edge-tts"
              : "python3 -m pip install --break-system-packages edge-tts || pip install --break-system-packages edge-tts || python3 -m pip install edge-tts || pip install edge-tts";

            exec(pipCmd, { env: execEnv }, (installErr) => {
              if (installErr) {
                return callback(installErr);
              }
              const retryPyCmd = process.platform === "win32" ? cmdPy : `${cmdPy3} || ${cmdPy}`;
              exec(retryPyCmd, { maxBuffer: 1024 * 1024 * 10, env: execEnv }, (retryErr) => {
                if (!retryErr && fs.existsSync(outFile) && fs.statSync(outFile).size > 0) {
                  return callback(null, outFile);
                }
                callback(retryErr || new Error("Output file empty"));
              });
            });
          }
        });
      };

      tryCommand(candidateCmds[0], candidateCmds.slice(1));
    };

    executeTts(targetVoice, (err, resFile) => {
      if (!err && resFile) {
        safeUnlink(tempTextFile);
        console.log(`[TTS] Edge-TTS generated successfully: ${resFile}`);
        return resolve(resFile);
      }
      if (targetVoice !== fallbackVoice) {
        console.warn(`[TTS] Edge-TTS failed with voice '${targetVoice}'. Retrying with fallback '${fallbackVoice}'...`);
        executeTts(fallbackVoice, (retryErr, retryFile) => {
          safeUnlink(tempTextFile);
          if (!retryErr && retryFile) {
            console.log(`[TTS] Edge-TTS generated successfully with fallback voice: ${retryFile}`);
            return resolve(retryFile);
          }
          reject(new Error(`Edge-TTS fallback failed: ${retryErr ? retryErr.message : "Output file empty"}`));
        });
      } else {
        safeUnlink(tempTextFile);
        reject(new Error(`Edge-TTS fallback failed: ${err ? err.message : "Output file empty"}`));
      }
    });
  });
}

function generateAzureTts(text, outFile) {
  return new Promise((resolve, reject) => {
    if (!AZURE_SPEECH_KEY) {
      return reject(new Error("Missing AZURE_SPEECH_KEY env variable."));
    }

    const innerContent = convertCustomTagsToSsml(text);

    const ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">
  <voice name="${AZURE_VOICE}">
    <prosody rate="0%" pitch="0%">${innerContent}</prosody>
  </voice>
</speak>`;

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
            let detail = buffer.toString("utf8");
            if (res.statusCode === 401) {
              detail += " (Unauthorized)";
            }
            return reject(
              new Error(`Azure TTS failed (${res.statusCode}): ${detail}`)
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

async function generateTtsWithFallback(text, outFile, outVttFile = null) {
  if (TTS_PROVIDER === "edge" || TTS_PROVIDER === "edge-tts") {
    console.log(`[TTS] Directly using Edge-TTS (Voice: ${AZURE_VOICE})...`);
    return await generateEdgeTts(text, outFile, outVttFile);
  }

  if (AZURE_SPEECH_KEY) {
    try {
      console.log("Generating Azure TTS...");
      return await generateAzureTts(text, outFile);
    } catch (azureErr) {
      console.warn(`[Warning] Azure TTS failed (${azureErr.message}). Falling back to free Edge-TTS...`);
    }
  } else {
    console.log("No AZURE_SPEECH_KEY provided. Using Edge-TTS...");
  }
  return await generateEdgeTts(text, outFile, outVttFile);
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`${err.message}\n${stderr || stdout}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

async function uploadVideo(filePath) {
  const uploadUrl = process.env.UPLOAD_SERVER_URL || "https://uvisionpk.com/upload_media_api/upload_video.php";
  console.log(`Uploading video to ${uploadUrl}...`);
  const FormData = require("form-data");
  const axios = require("axios");
  const form = new FormData();
  form.append("video", fs.createReadStream(filePath));

  const headers = {
    ...form.getHeaders()
  };
  if (process.env.API_BEARER_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.API_BEARER_TOKEN}`;
  }

  try {
    const response = await axios.post(uploadUrl, form, { headers });
    if (response.data && response.data.status === "success" && response.data.url) {
      return response.data.url;
    } else {
      throw new Error(`Upload failed: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    const errorMsg = error.response && error.response.data
      ? JSON.stringify(error.response.data)
      : error.message;
    throw new Error(`Upload failed: ${errorMsg}`);
  }
}

async function sendWebhook(videoUrl) {
  if (!WEBHOOK_URL) {
    console.log("No webhook URL configured, skipping webhook callback.");
    return;
  }
  console.log(`Sending webhook notification to ${WEBHOOK_URL}...`);
  const data = JSON.stringify({
    status: "success",
    video_url: videoUrl,
    videoUrl: videoUrl,
    "video url": videoUrl,
    image_url: IMAGE_URL,
    imageUrl: IMAGE_URL,
    composition: COMPOSITION,
    script: SCRIPT,
    hook: HOOK_TEXT,
    body: BODY_TEXT,
    industry: INDUSTRY
  });

  return new Promise((resolve) => {
    function makeRequest(targetUrl, depth = 0) {
      if (depth > 3) {
        console.error("Webhook redirect depth exceeded.");
        return resolve();
      }
      try {
        const urlObj = new URL(targetUrl);
        const req = https.request({
          hostname: urlObj.hostname,
          path: urlObj.pathname + (urlObj.search || ""),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        }, (res) => {
          res.resume();
          console.log(`Webhook response status: ${res.statusCode}`);
          if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location) {
            console.log(`Following redirect to: ${res.headers.location}`);
            makeRequest(res.headers.location, depth + 1);
          } else {
            resolve();
          }
        });

        req.on("error", (e) => {
          console.error("Failed to send webhook:", e);
          resolve();
        });

        req.write(data);
        req.end();
      } catch (err) {
        console.error("Webhook URL parsing error:", err);
        resolve();
      }
    }

    makeRequest(WEBHOOK_URL);
  });
}

async function main() {
  if (!IMAGE_URL || !SCRIPT) {
    console.error("Missing required environment variables: IMAGE_URL or SCRIPT (TEXT)");
    process.exit(1);
  }

  const uniqueId = `github_${Date.now()}`;
  const localImage = path.join(tempDir, `${uniqueId}.jpeg`);
  const localAudio = path.join(tempDir, `${uniqueId}_voice.mp3`);
  const localVtt = path.join(tempDir, `${uniqueId}_voice.vtt`);
  const propsFile = path.join(tempDir, `${uniqueId}_props.json`);
  const finalVideo = path.join(renderDir, `${uniqueId}.mp4`);

  // Start local HTTP static server so Remotion Puppeteer can fetch local images/audio reliably
  const server = require("http").createServer((req, res) => {
    let reqPath = decodeURI(req.url.split("?")[0]);
    if (reqPath.startsWith("/")) reqPath = reqPath.slice(1);
    const filePath = path.join(__dirname, "..", reqPath);

    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        res.statusCode = 404;
        return res.end("Not found");
      }

      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      } else if (filePath.endsWith(".jpeg") || filePath.endsWith(".jpg")) {
        res.setHeader("Content-Type", "image/jpeg");
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
      }

      fs.createReadStream(filePath).pipe(res);
    });
  });

  const PORT = 3000;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Local assets server running at http://localhost:${PORT}`);

  try {
    console.log("Downloading image...");
    await downloadFile(IMAGE_URL, localImage);

    await generateTtsWithFallback(SCRIPT, localAudio, localVtt);

    let vttCues = [];
    if (fs.existsSync(localVtt) && fs.statSync(localVtt).size > 0) {
      try {
        const vttContent = fs.readFileSync(localVtt, "utf8");
        vttCues = parseVtt(vttContent);
        console.log(`[TTS] Extracted ${vttCues.length} speech timestamp cues from Edge-TTS`);
      } catch (e) {
        console.warn("[TTS] Could not parse VTT subtitles:", e.message);
      }
    }

    // Use local server port for duration query
    const localAudioUrl = `http://localhost:${PORT}/temp/${uniqueId}_voice.mp3`;
    const durationSec = await getAudioDuration(localAudio); // ffprobe can read file directly
    const totalFrames = Math.max(90, Math.round((durationSec + 1.2) * 30));

    const captions = buildCaptionCues(vttCues, SUBTITLES || SCRIPT, durationSec, 30);
    console.log(`[TTS] Prepared ${captions.length} timed subtitle cues for render`);

    // Map local files to HTTP localhost URLs for Puppeteer/Chrome to fetch successfully
    const props = {
      imageUrl: `http://localhost:${PORT}/temp/${uniqueId}.jpeg`,
      audioUrl: localAudioUrl,
      backgroundMusicUrl: BACKGROUND_MUSIC_URL || `http://localhost:${PORT}/public/background-music.mp3`,
      text: SCRIPT,
      subtitles: SUBTITLES || undefined,
      captions: captions.length > 0 ? captions : undefined,
      prompt: "",
      hookText: HOOK_TEXT,
      bodyText: BODY_TEXT,
      themeColor: THEME_COLOR,
      industry: INDUSTRY,
      layoutStyle: LAYOUT_STYLE || {},
    };

    fs.writeFileSync(propsFile, JSON.stringify(props));

    console.log(`Rendering ${COMPOSITION} (${totalFrames} frames)...`);
    const propsPath = propsFile.replace(/\\/g, "/");
    const outPath = finalVideo.replace(/\\/g, "/");

    const concurrency = process.env.REMOTION_CONCURRENCY || "1";
    const concurrencyFlag = concurrency !== "auto" ? `--concurrency=${concurrency}` : "";
    const browserFlags = process.env.REMOTION_BROWSER_FLAGS || "--disable-dev-shm-usage --no-sandbox --disable-gpu";

    await runCommand(
      `npx remotion render src/index.ts ${COMPOSITION} "${outPath}" --duration=${totalFrames} --props="${propsPath}" ${concurrencyFlag} --browser-flags="${browserFlags}"`
    );

    console.log("Render completed successfully!");

    // Close the assets server
    server.close();

    // Upload video to transient host
    const videoUrl = await uploadVideo(finalVideo);
    console.log(`Video available at: ${videoUrl}`);

    // Send Webhook callback
    await sendWebhook(videoUrl);

    // Cleanup temp files
    safeUnlink(localImage, localAudio, localVtt, propsFile, finalVideo);

    console.log("Process complete.");
  } catch (error) {
    console.error("Execution failed:", error);
    server.close();
    safeUnlink(localImage, localAudio, localVtt, propsFile, finalVideo);
    process.exit(1);
  }
}

main();
