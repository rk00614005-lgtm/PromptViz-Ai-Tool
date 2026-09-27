import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Parse visualization prompt endpoint
app.post('/api/ai/parse-prompt', async (req, res) => {
  try {
    const { prompt, columns, datasetName } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI not configured on server' });
    }

    const colList = (columns || [])
      .map((c: any) => `${c.name} (${c.type}, sample: [${(c.sampleValues || []).slice(0, 3).join(', ')}])`)
      .join('\n');

    const promptMessage = `You are an expert Data Visualization Engineer and Prompt Parser.
Task: Parse this natural-language prompt into an exact chart specification based strictly on the provided dataset columns.

Prompt: "${prompt}"
Dataset: "${datasetName || 'General Data'}"
Available Columns:
${colList}

Rules:
1. chartType MUST be one of: 'bar', 'horizontal_bar', 'line', 'area', 'pie', 'donut', 'scatter', 'histogram'.
2. xAxis and yAxis MUST match one of the column names provided in the Available Columns list.
3. aggregation MUST be one of: 'sum', 'avg', 'count', 'min', 'max', 'none'.
4. Do not invent columns that do not exist.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptMessage,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            chartType: { type: Type.STRING },
            xAxis: { type: Type.STRING },
            yAxis: { type: Type.STRING },
            aggregation: { type: Type.STRING },
            groupBy: { type: Type.STRING },
            title: { type: Type.STRING },
            palette: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['intent', 'chartType', 'xAxis', 'yAxis', 'aggregation', 'title']
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json(parsedJson);
  } catch (err: any) {
    console.error('Server AI Parse Error:', err);
    return res.status(500).json({ error: err.message || 'AI Parse execution failed' });
  }
});

// 2. Analyze Prompt Quality endpoint
app.post('/api/ai/analyze-prompt', async (req, res) => {
  try {
    const { prompt, columns, datasetName } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI not configured on server' });
    }

    const colNames = (columns || []).map((c: any) => `${c.name} (${c.type})`).join(', ');

    const promptMessage = `You are a Visualization Prompt Engineering Auditor.
Analyze the user's visualization prompt for clarity, specificity, and completeness.
Target Dataset: "${datasetName || 'Active Dataset'}"
Available Columns: ${colNames}
Input Prompt: "${prompt}"

Score each dimension from 0 to 100 based on:
- clarity: Is the request concise, grammatically clear, and direct?
- specificity: Are chart type, sorting, or filtering explicitly stated?
- completeness: Are independent dimension (X) and dependent metric (Y) and reduction aggregation stated?
Provide transparent suggestions and an improved, robust version of the prompt.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptMessage,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clarityScore: { type: Type.INTEGER },
            specificityScore: { type: Type.INTEGER },
            completenessScore: { type: Type.INTEGER },
            overallScore: { type: Type.INTEGER },
            ambiguityWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            missingSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            improvedPrompt: { type: Type.STRING },
            rationale: { type: Type.STRING },
            suggestedChartType: { type: Type.STRING }
          },
          required: [
            'clarityScore',
            'specificityScore',
            'completenessScore',
            'overallScore',
            'ambiguityWarnings',
            'missingSuggestions',
            'improvedPrompt',
            'rationale'
          ]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json(parsedJson);
  } catch (err: any) {
    console.error('Server AI Analyze Error:', err);
    return res.status(500).json({ error: err.message || 'AI Analyze execution failed' });
  }
});

// 3. AI Copilot Q&A endpoint
app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { question, datasetMeta, deterministicContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!ai) {
      // Return deterministic calculation answer directly
      if (deterministicContext?.answer) {
        return res.json({
          answer: deterministicContext.answer,
          calculationDetails: deterministicContext.calculationDetails,
          suggestedChart: deterministicContext.suggestedChart
        });
      }
      return res.status(503).json({ error: 'Gemini AI not configured on server' });
    }

    const promptMessage = `You are the PromptViz AI Visualization Copilot.
You answer user questions about their dataset strictly based on mathematical reality and the provided metadata.
Dataset: ${JSON.stringify(datasetMeta)}
Deterministic Calculation Pre-Audit: ${JSON.stringify(deterministicContext)}
User Question: "${question}"

Instructions:
1. Provide a professional, concise analytics response.
2. If mathematical calculations were performed, highlight the actual numbers.
3. Suggest an appropriate chart specification if relevant to the question.
4. Never invent statistics not grounded in the data.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptMessage,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            suggestedChart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                chartType: { type: Type.STRING },
                xAxis: { type: Type.STRING },
                yAxis: { type: Type.STRING },
                aggregation: { type: Type.STRING }
              }
            }
          },
          required: ['answer']
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({
      answer: parsedJson.answer || deterministicContext?.answer,
      calculationDetails: deterministicContext?.calculationDetails,
      suggestedChart: parsedJson.suggestedChart || deterministicContext?.suggestedChart
    });
  } catch (err: any) {
    console.error('Server AI Copilot Error:', err);
    return res.status(500).json({ error: err.message || 'AI Copilot execution failed' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`PromptViz AI full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
