import express from "express";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import os from "os";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const officeparser = require("officeparser");

const router = express.Router();

// Helper to download the PDF/PPTX buffer from Cloudinary
async function downloadDocument(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document from URL: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// POST /api/ai/ask
router.post("/ask", async (req, res) => {
  try {
    const { documentUrl, query } = req.body;

    if (!documentUrl || !query) {
      return res.status(400).json({ success: false, message: "Missing documentUrl or query." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ 
        success: false, 
        message: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file." 
      });
    }

    // Ensure the document URL is HTTPS
    const secureUrl = documentUrl.replace("http://", "https://");
    const isPdf = secureUrl.toLowerCase().includes(".pdf");
    const isPptx = secureUrl.toLowerCase().includes(".pptx") || secureUrl.toLowerCase().includes(".ppt");

    if (!isPdf && !isPptx) {
      return res.status(400).json({
        success: false,
        message: "The AI Assistant currently only supports .pdf and .pptx presentations.",
      });
    }

    console.log(`🤖 Downloading document for AI analysis: ${secureUrl}`);
    const docBuffer = await downloadDocument(secureUrl);
    
    let presentationText = "";

    console.log(`🤖 Parsing document text...`);
    if (isPdf) {
      const pdfData = await pdfParse(docBuffer);
      presentationText = pdfData.text;
    } else {
      // For PPTX, write buffer to temp file, parse, then delete
      const tempPath = path.join(os.tmpdir(), `ai_temp_${Date.now()}.pptx`);
      fs.writeFileSync(tempPath, docBuffer);
      try {
        const parsed = await officeparser.parseOffice(tempPath);
        if (typeof parsed === "string") {
          presentationText = parsed;
        } else if (Array.isArray(parsed)) {
          presentationText = parsed.join("\n");
        } else if (parsed && typeof parsed === "object") {
          presentationText = parsed.text || JSON.stringify(parsed);
        } else {
          presentationText = String(parsed || "");
        }
      } finally {
        fs.unlinkSync(tempPath);
      }
    }

    // Ensure it's a string before using string methods
    presentationText = String(presentationText || "");

    if (presentationText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Could not extract any text from this presentation.",
      });
    }

    console.log(`🤖 Querying Gemini...`);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert AI assistant evaluating a hackathon presentation.
The following is the full extracted text from the team's presentation:

--- PRESENTATION CONTENT START ---
${presentationText.substring(0, 50000)} // Limit context to avoid token issues
--- PRESENTATION CONTENT END ---

Based ONLY on the presentation content above, please answer the following question from the judge:
Question: ${query}

Provide a concise, direct, and helpful answer. Do not hallucinate information not present in the slides.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const aiAnswer = response.text;

    res.json({ success: true, answer: aiAnswer });

  } catch (error) {
    console.error("❌ AI Route Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to process AI query" });
  }
});

export default router;
