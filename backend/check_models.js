// backend/check_models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("Checking available models...");
    
    const candidates = ["gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro", "gemini-flash"];
    
    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log("✅ SUCCESS!");
            console.log(`>>> USE THIS MODEL NAME: "${modelName}"`);
            return; // Found one!
        } catch (e) {
            console.log("❌ Failed (" + e.status + ")");
        }
    }
    console.log("No models worked. Check your API Key or Billing.");

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();