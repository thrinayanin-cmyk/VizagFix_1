import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with recommended parameters
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
  console.log('[DEBUG] Received POST /api/chat with body:', req.body);
  try {
    const { message, conversation = [] } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      // Graceful fallback response if GEMINI_API_KEY is not configured
      res.json({
        reply: getFallbackAnswer(message),
      });
      return;
    }

    const systemInstruction = `You are the official VizagFix Civic AI Assistant for Greater Visakhapatnam Municipal Corporation (GVMC).
You assist citizens with civic complaints, neighborhood safety, statistics on affected residents, problems solved, and how VizagFix helps our city.

Key Facts & Context:
1. Community Impact & Sufferers:
   - Over 14,850+ citizens in Visakhapatnam (MVP Colony, Beach Road, Dwaraka Nagar, Madhurawada, Gajuwaka) suffer from civic issues:
   - 6,200+ commuters face dangerous road potholes and accidents.
   - 4,100+ residents, women, students, and seniors suffer from unlit/dark street lights at night.
   - 2,800+ families suffer from overflowing community waste bins, disease risks, and bad smells.
   - 1,750+ households face low drinking water pressure and flooded sidewalks from burst pipelines.
2. Problems Solved:
   - 1,280+ complaints have been successfully resolved and verified with photographic proof.
   - Average resolution rate: 94.2%.
   - Average response time: 48 hours for urgent issues.
3. How VizagFix Is Helpful:
   - Simple Plain English: Anyone can report an issue in 60 seconds without complicated government jargon.
   - Map & Pincode Precision: Drop a pin on the map to pinpoint the exact broken lamp post or road crater with 6-digit pincode.
   - Stops Fake Closures: Officers must attach photo proof of completion, and citizens verify the fix.
   - Fast Escalation: Direct officer contact details and helpline transparency.
4. Helpline:
   - Toll-Free GVMC Municipal Helpline: 1800-425-0005.

Tone & Style:
- Use simple, friendly, empathetic plain English.
- Avoid complicated jargon.
- Format responses cleanly with brief bullet points when helpful.
- Keep answers concise and directly focused on the citizen's question.`;

    // Build chat contents
    const contents: any[] = [];
    conversation.slice(-4).forEach((c: { sender: string; text: string }) => {
      contents.push({
        role: c.sender === 'user' ? 'user' : 'model',
        parts: [{ text: c.text }],
      });
    });
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI response timeout')), 3500);
    });

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const reply = response.text || getFallbackAnswer(message);
    res.json({ reply });
  } catch (error) {
    console.error('Gemini chat error/timeout, using fallback:', error instanceof Error ? error.message : error);
    // Return friendly fallback answer
    res.json({
      reply: getFallbackAnswer(req.body?.message || ''),
    });
  }
});

// Fallback response generator in case API is offline
function getFallbackAnswer(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('suffer') || m.includes('many members') || m.includes('people affected') || m.includes('impact')) {
    return 'Across Visakhapatnam, over 14,850+ citizens suffer from civic issues each month. Specifically:\n• 6,200+ commuters face dangerous potholes and accident risks.\n• 4,100+ residents face safety concerns from dark street lights at night.\n• 2,800+ families deal with overflowing garbage bins and hygiene risks.\n• 1,750+ households suffer from low water pressure caused by leaking pipelines.';
  }
  if (m.includes('solved') || m.includes('fixed') || m.includes('resolution')) {
    return 'VizagFix and GVMC have successfully solved and verified over 1,280+ civic complaints to date! We currently maintain a 94.2% resolution rate with an average response time of 48 hours for urgent repairs.';
  }
  if (m.includes('help') || m.includes('how it helps') || m.includes('why')) {
    return 'VizagFix is helpful to our community in 4 major ways:\n1. Simple for Everyone: Easy plain English without complex government terms.\n2. Exact Map & Pincode: Drop a pin so repair teams reach the exact spot immediately.\n3. Stops Fake Closures: Verified before & after photos ensure work is genuinely done.\n4. Protects Lives: Rapid repair of potholes and pipeline leaks prevents injuries and saves clean drinking water.';
  }
  if (m.includes('file') || m.includes('report') || m.includes('complain')) {
    return 'Filing a complaint takes only 1 minute on VizagFix:\n1. Click "File a Complaint" in the menu.\n2. Choose what is broken (Pothole, Street Light, Waste, Water Leak).\n3. Click on the map to set your location & check your 6-digit pincode.\n4. Add a photo and click Submit! You will get an instant Complaint ID to track.';
  }
  if (m.includes('helpline') || m.includes('phone') || m.includes('contact') || m.includes('number')) {
    return 'You can contact the Greater Visakhapatnam Municipal Corporation (GVMC) 24/7 Toll-Free Helpline at: 1800-425-0005.';
  }
  return 'Hello! I am your VizagFix Civic Assistant. I can tell you how many citizens are affected by civic issues in Vizag, how many problems we have solved, how VizagFix helps our neighborhood, or guide you through filing a complaint. How can I help you today?';
}

// Dev & Production serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VizagFix server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
