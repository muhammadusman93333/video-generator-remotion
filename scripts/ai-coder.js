const fs = require("fs");
const path = require("path");
const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROMPT = process.env.AI_PROMPT;
const TARGET_FILE = path.join(__dirname, "..", "src", "PosVideo.tsx");

async function main() {
  if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
  }
  if (!PROMPT) {
    console.error("Error: AI_PROMPT is not set.");
    process.exit(1);
  }

  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`Error: Target file not found at ${TARGET_FILE}`);
    process.exit(1);
  }

  console.log("Reading current PosVideo.tsx code...");
  const currentCode = fs.readFileSync(TARGET_FILE, "utf8");

  console.log("Sending request to Gemini API...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemInstruction = 
    "You are an expert React and Remotion animation engineer. Your task is to update the provided source code of a Remotion composition file (PosVideo.tsx) based on the user's design/styling instructions. You MUST return ONLY the final, complete, syntactically correct TypeScript React code. Do NOT wrap the code in markdown code blocks like ```tsx or ```. Do NOT include any introduction, explanations, or warnings. The code you return will be written directly to the file and must compile immediately.";

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Here is the current source code of PosVideo.tsx:\n\n${currentCode}\n\nUser request: ${PROMPT}\n\nReturn the updated complete source code:`
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction
        }
      ]
    },
    generationConfig: {
      temperature: 0.1
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    let newCode = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!newCode) {
      throw new Error(`Invalid response from Gemini API: ${JSON.stringify(response.data)}`);
    }

    // Clean up markdown blocks if the model ignored instructions and wrapped it anyway
    newCode = newCode.trim();
    if (newCode.startsWith("```")) {
      // Find the first newline to strip the ```typescript or ```tsx prefix
      const firstNewline = newCode.indexOf("\n");
      if (firstNewline !== -1) {
        newCode = newCode.substring(firstNewline + 1);
      }
      // Remove trailing ```
      if (newCode.endsWith("```")) {
        newCode = newCode.substring(0, newCode.length - 3);
      }
      newCode = newCode.trim();
    }

    console.log("Writing updated code to PosVideo.tsx...");
    fs.writeFileSync(TARGET_FILE, newCode, "utf8");
    console.log("PosVideo.tsx successfully updated by Gemini!");
  } catch (error) {
    console.error("Failed to update code using Gemini:", error.message);
    if (error.response) {
      console.error("API response details:", JSON.stringify(error.response.data));
    }
    process.exit(1);
  }
}

main();
