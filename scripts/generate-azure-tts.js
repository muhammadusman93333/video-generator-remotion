/**
 * Generate Azure TTS voiceover for PosVideo.
 * Usage: node scripts/generate-azure-tts.js
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
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

const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION || "eastus";

if (!KEY) {
  console.error("Missing AZURE_SPEECH_KEY in .env");
  process.exit(1);
}

const DEFAULT_TEXT =
  "Kya aap thak chuke hain manual billing se?\nUPOS offers automated invoicing that saves you hours of stock tallying time every day at closing time!";

const text = (process.argv[2] || DEFAULT_TEXT)
  .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
  .replace(/[*#_🌐📞]/g, "")
  .replace(/\n+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Hinglish-friendly Indian English neural voice
const voice = "en-IN-NeerjaNeural";
const ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">
  <voice name="${voice}">
    <prosody rate="0%" pitch="0%">
      ${escapeXml(text)}
    </prosody>
  </voice>
</speak>`;

const outDir = path.join(__dirname, "..", "public", "voiceover");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "pos-video.mp3");

const options = {
  hostname: `${REGION}.tts.speech.microsoft.com`,
  path: "/cognitiveservices/v1",
  method: "POST",
  headers: {
    "Ocp-Apim-Subscription-Key": KEY,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    "User-Agent": "upos-remotion-tts",
  },
};

console.log(`Requesting Azure TTS (${voice})...`);
console.log(`Text: ${text}`);

const req = https.request(options, (res) => {
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => {
    const buffer = Buffer.concat(chunks);
    if (res.statusCode !== 200) {
      console.error(`Azure TTS failed (${res.statusCode}): ${buffer.toString("utf8")}`);
      process.exit(1);
    }
    fs.writeFileSync(outFile, buffer);
    console.log(`Saved: ${outFile} (${buffer.length} bytes)`);
  });
});

req.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

req.write(ssml);
req.end();
