const fs = require("fs");
const path = require("path");
const https = require("https");
const { exec } = require("child_process");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

// Parse inputs from Env
const IMAGE_URL = process.env.IMAGE_URL;
const SCRIPT = process.env.SCRIPT || process.env.TEXT;
const COMPOSITION = process.env.COMPOSITION || "PosVideo";
const BACKGROUND_MUSIC_URL = process.env.BACKGROUND_MUSIC_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus";
const AZURE_VOICE = process.env.AZURE_VOICE || "en-IN-NeerjaNeural";

const tempDir = path.join(__dirname, "..", "temp");
const renderDir = path.join(__dirname, "..", "renders");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(renderDir)) fs.mkdirSync(renderDir, { recursive: true });

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

function generateAzureTts(text, outFile) {
  return new Promise((resolve, reject) => {
    if (!AZURE_SPEECH_KEY) {
      return reject(new Error("Missing AZURE_SPEECH_KEY env variable."));
    }

    const ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">
  <voice name="${AZURE_VOICE}">
    <prosody rate="0%" pitch="0%">${escapeXml(cleanVoiceText(text))}</prosody>
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
            return reject(
              new Error(`Azure TTS failed (${res.statusCode}): ${buffer.toString("utf8")}`)
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
    exec(command, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`${err.message}\n${stderr || stdout}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

async function uploadToTmpFiles(filePath) {
  console.log("Uploading video to tmpfiles.org...");
  const FormData = require("form-data");
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  return new Promise((resolve, reject) => {
    form.submit("https://tmpfiles.org/api/v1/upload", (err, res) => {
      if (err) return reject(err);

      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.status === "success" && json.data && json.data.url) {
            // Convert viewer URL to direct download URL
            const downloadUrl = json.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
            resolve(downloadUrl);
          } else {
            reject(new Error(`Upload failed: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  });
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
    composition: COMPOSITION,
    script: SCRIPT
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(WEBHOOK_URL);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      console.log(`Webhook response status: ${res.statusCode}`);
      resolve();
    });

    req.on("error", (e) => {
      console.error("Failed to send webhook:", e);
      resolve(); // Do not throw to avoid crashing workflow if webhook is slow/unstable
    });

    req.write(data);
    req.end();
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
  const propsFile = path.join(tempDir, `${uniqueId}_props.json`);
  const finalVideo = path.join(renderDir, `video_${uniqueId}.mp4`);

  try {
    console.log("Downloading image...");
    await downloadFile(IMAGE_URL, localImage);

    console.log("Generating Azure TTS...");
    await generateAzureTts(SCRIPT, localAudio);

    const durationSec = await getAudioDuration(localAudio);
    const totalFrames = Math.max(90, Math.round((durationSec + 1.2) * 30));

    // For local files referenced inside props, we can reference them directly by absolute file URL
    const props = {
      imageUrl: `file:///${localImage.replace(/\\/g, "/")}`,
      audioUrl: `file:///${localAudio.replace(/\\/g, "/")}`,
      backgroundMusicUrl: BACKGROUND_MUSIC_URL || `file:///${path.join(__dirname, "..", "public", "background-music.mp3").replace(/\\/g, "/")}`,
      text: SCRIPT,
      prompt: ""
    };

    fs.writeFileSync(propsFile, JSON.stringify(props));

    console.log(`Rendering ${COMPOSITION} (${totalFrames} frames)...`);
    const propsPath = propsFile.replace(/\\/g, "/");
    const outPath = finalVideo.replace(/\\/g, "/");

    await runCommand(
      `npx remotion render src/index.ts ${COMPOSITION} "${outPath}" --duration=${totalFrames} --props="${propsPath}" --concurrency=1 --browser-flags="--disable-dev-shm-usage --no-sandbox --disable-gpu"`
    );

    console.log("Render completed successfully!");

    // Upload video to transient host
    const videoUrl = await uploadToTmpFiles(finalVideo);
    console.log(`Video available at: ${videoUrl}`);

    // Send Webhook callback
    await sendWebhook(videoUrl);

    // Cleanup temp files
    try {
      fs.unlinkSync(localImage);
      fs.unlinkSync(localAudio);
      fs.unlinkSync(propsFile);
      fs.unlinkSync(finalVideo);
    } catch (_) {}

    console.log("Process complete.");
  } catch (error) {
    console.error("Execution failed:", error);
    process.exit(1);
  }
}

main();
