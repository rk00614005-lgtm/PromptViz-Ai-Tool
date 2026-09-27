# PromptViz AI — Prompt Engineering for Data Visualization

> An intelligent, professional analytics workspace converting natural-language directives into mathematically verified, interactive visualizations, automated statistical data insights, and publication-ready executive reports.


Preview link : https://ai.studio/apps/bf1c1931-fdbf-429f-a4e3-76001c0d80d7?fullscreenApplet=true
---

## 🚀 Key Modules & Architecture

1. **Dashboard**: High-level KPI metrics, recent activity feeds, active dataset quick-switchers, and chart-type breakdown.
2. **Visualization Generator**: Natural-language prompt parsing (hybrid Gemini 3.8 Flash + deterministic rule engine), Recharts multi-chart rendering (Bar, Horizontal Bar, Line, Area, Pie, Donut, Scatter, Histogram), live config panel, PNG canvas capture, and CSV data export.
3. **Prompt Builder**: Guided analytical form with goal formulation, axes mapping, explicit reduction aggregations (Sum, Avg, Count, Min, Max), and reusable analytical templates (Trend, Comparison, Ranking, Share).
4. **Prompt Engineering Lab**: Transparent heuristic auditing across Clarity, Specificity, and Completeness scores; side-by-side Before & After comparison; ambiguity warnings; and acceptance workflows.
5. **Dataset Manager**: Drag-and-drop CSV/XLSX file ingestion, schema auditor (detects Numeric, Categorical, Date, and Text columns), missing-value flags, duplicate checks, and Data Quality Scores (0-100).
6. **AI Visualization Copilot**: Conversational data intelligence grounded in active dataset records with mathematical verification formulas and 1-click chart generation handoff.
7. **Data Insights**: Automated 5-number summaries (min, max, mean, median, std dev), IQR statistical outlier detection (1.5× IQR), Pearson correlation matrix, and chronological trajectory tracking.
8. **Report Generator**: Multi-chart briefing composer with Executive Summary, Methodology, live print preview, PDF export, and underlying CSV extraction.
9. **Testing & Evaluation**: 5-rule deterministic test suite (completeness, column existence, aggregation compatibility, cognitive cardinality limits, dataset emptiness).
10. **Visualization History**: Persistent historical archive with search, type filters, JSON inspection, and restore-to-workspace actions.
11. **Prompt Guide**: Comprehensive educational syllabus on visual channels, good vs. weak prompt dissections, and copyable prompt templates.
12. **Settings**: User profile management, chart defaults, custom color palettes, and database connection status.

---

## 📦 Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS
- **Visualization**: Recharts
- **Parsing**: PapaParse (CSV), XLSX (Excel Spreadsheets)
- **AI Engine**: Google GenAI SDK (`@google/genai`) using model `gemini-3.8-flash` on server-side proxy
- **Deterministic Rules Engine**: Client/Server fallback parsing with Pearson r, IQR outlier filters, and statistical aggregators
- **Database & Auth**: PostgreSQL / Supabase with Row Level Security (RLS) policies and encrypted local session persistence
- **Backend**: Express on Node.js / tsx

---

## 🛠️ Environment Variables

Create or configure `.env` (refer to `.env.example`):

```bash
# Gemini AI API Key (Injected automatically in Google AI Studio or configured in Secrets)
GEMINI_API_KEY="your-gemini-api-key"

# Application URL
APP_URL="http://localhost:3000"

# Optional Supabase credentials for production cloud synchronization
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

*Note: If Supabase credentials are not provided, PromptViz AI automatically engages an encrypted user-isolated local persistent storage engine so the app functions 100% out of the box.*

---

## 🗄️ Database Migrations (Supabase / PostgreSQL)

The complete SQL migration script is located at:
`supabase/migrations/20260927_init_promptviz.sql`

To apply to your Supabase instance:
1. Navigate to the Supabase Dashboard -> **SQL Editor**.
2. Paste the contents of `supabase/migrations/20260927_init_promptviz.sql`.
3. Click **Run**. All tables (`profiles`, `datasets`, `visualizations`, `prompt_versions`, `reports`, `visualization_history`, `copilot_messages`, `test_runs`, `user_settings`) and Row-Level Security policies (`auth.uid() = user_id`) will be provisioned.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development full-stack server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
