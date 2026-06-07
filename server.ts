/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
  }

  // API endpoint to review a trade using Gemini
  app.post("/api/gemini/review-trade", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured. Please supply GEMINI_API_KEY in the Secrets panel of your AI Studio settings."
        });
      }

      const { trade } = req.body;
      if (!trade) {
        return res.status(400).json({ error: "Missing trade data in request body." });
      }

      const prompt = `Analyze this trade from a visual trading journal focused on psychology, discipline, and performance.
Provide a high-quality review from a professional trading coach.

Trade Details:
- Pair: ${trade.pair}
- Direction: ${trade.direction}
- Day: ${trade.dayOfWeek}
- Entry Price: ${trade.entry}
- Stop Loss: ${trade.stopLoss}
- Take Profit: ${trade.takeProfit}
- Risk Level: ${trade.riskPercentage}%
- Result Profit/Loss: ${trade.resultPercentage}%
- R Multiple: ${trade.rMultiple}R
- Outcome: ${trade.outcome}
- Entry Model: ${trade.entryModel}
- Strategy Confluence checklist:
  * Candle Range High swept (CRH): ${trade.confluence?.crh ? "YES" : "NO"}
  * Candle Range Low swept (CRL): ${trade.confluence?.crl ? "YES" : "NO"}
  * Higher Timeframe PDA reached (PDRA): ${trade.confluence?.pdra ? "YES" : "NO"}
  * Asia Session High swept (ASH): ${trade.confluence?.ash ? "YES" : "NO"}
  * Asia Session Low swept (ASL): ${trade.confluence?.asl ? "YES" : "NO"}

Pre-Trade Psychology:
- Emotional State: ${trade.preTradePsychology.emotionalState}
- Confidence Level (1-5): ${trade.preTradePsychology.confidenceLevel}
- Focus Level (1-5): ${trade.preTradePsychology.focusLevel}
- Energy Level (1-5): ${trade.preTradePsychology.energyLevel}
- Followed Trading Plan: ${trade.preTradePsychology.followedPlan ? "YES" : "NO"}
- Pre-Trade Notes: ${trade.preTradePsychology.notes}

Post-Trade Reflection:
- Post-Trade Emotional State: ${trade.postTradeReflection?.emotionalTags?.join(", ") || "N/A"}
- Lessons Learned: ${trade.postTradeReflection?.lessonsLearned || "None"}
- Would Take Again: ${trade.postTradeReflection?.wouldTakeAgain ? "YES" : "NO"}

As a seasoned, firm, and supportive Trading Coach, please synthesize this trade. You must return your analysis in raw JSON that matches this exact structure:
{
  "rating": "A" | "B" | "C" | "D" | "F" | "Psychology Alert" | "Pristine Execution",
  "comparisonWithPlan": "1-2 sentences analyzing their discipline and plan compliance.",
  "feedback": "2-3 sentences with clear psychological critique and constructive criticism regarding emotions.",
  "coachingAdvice": "A list of 2-3 short, actionable coaching points."
}

Ensure the output is valid JSON only. Do not wrap in markdown code blocks like \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      res.json({ result: JSON.parse(responseText.trim()) });
    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
