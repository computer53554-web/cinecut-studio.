import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint for AI Auto-Captions generation
app.post('/api/captions/generate', async (req, res) => {
  try {
    const { style = 'tiktok', wordsPerSegment = 3, topic = 'epic travel vlog', duration = 14 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback procedural captions if no key is supplied
      return res.json({
        captions: generateProceduralCaptions(style, wordsPerSegment, duration),
      });
    }

    const prompt = `You are an expert viral video subtitle editor for TikTok, YouTube Shorts, and CapCut.
Generate animated subtitle segments for a ${duration}-second video about "${topic}".
Style: ${style} (punchy, high energy, captivating phrases).
Keep each subtitle segment short (approx ${wordsPerSegment} words per caption).
The segments must sequentially span from 0.0 seconds to ${duration} seconds without overlapping.
Return structured segments with start, duration, text, and primary keyword to highlight.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'The subtitle phrase in all caps or bold casing',
              },
              start: {
                type: Type.NUMBER,
                description: 'Timeline start offset in seconds',
              },
              duration: {
                type: Type.NUMBER,
                description: 'Duration of subtitle in seconds',
              },
              highlightWord: {
                type: Type.STRING,
                description: 'The punchy word to emphasize with color',
              },
            },
            required: ['text', 'start', 'duration'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '[]');
    return res.json({ captions: parsed });
  } catch (error) {
    console.error('Caption generation error:', error);
    // Graceful fallback to guaranteed procedural captions
    const { style = 'tiktok', wordsPerSegment = 3, duration = 14 } = req.body;
    return res.json({
      captions: generateProceduralCaptions(style, wordsPerSegment, duration),
    });
  }
});

function generateProceduralCaptions(style: string, _wordsPerSegment: number, totalDuration: number) {
  const viralPhrases = [
    { text: 'WATCH THIS TRANSFORMATION', highlight: 'TRANSFORMATION' },
    { text: 'THE ULTIMATE SECRET', highlight: 'SECRET' },
    { text: 'NOBODY TALKS ABOUT THIS', highlight: 'NOBODY' },
    { text: 'STEP INTO THE FUTURE', highlight: 'FUTURE' },
    { text: 'PURE CINEMATIC MAGIC', highlight: 'MAGIC' },
    { text: 'ARE YOU READY FOR THIS', highlight: 'READY' },
    { text: 'LEVEL UP YOUR CONTENT', highlight: 'LEVEL' },
    { text: 'LIKE AND SUBSCRIBE NOW', highlight: 'SUBSCRIBE' },
  ];

  const segDuration = Math.min(2.5, Math.max(1.2, totalDuration / viralPhrases.length));
  const count = Math.min(viralPhrases.length, Math.floor(totalDuration / segDuration));

  return viralPhrases.slice(0, count).map((item, idx) => ({
    text: item.text,
    start: Math.round(idx * segDuration * 10) / 10,
    duration: Math.round(segDuration * 10) / 10,
    highlightWord: item.highlight,
  }));
}

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
