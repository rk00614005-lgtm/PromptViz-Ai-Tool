export type DataType = 'numeric' | 'categorical' | 'date' | 'text';

export interface ColumnMeta {
  name: string;
  type: DataType;
  missingCount: number;
  uniqueCount: number;
  sampleValues: any[];
  min?: number;
  max?: number;
  mean?: number;
}

export interface Dataset {
  id: string;
  userId: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnMeta[];
  dataQualityScore: number;
  storagePath?: string;
  rawPreviewData?: Record<string, any>[];
  data?: Record<string, any>[]; // Cached in-memory active data
  createdAt: string;
  updatedAt: string;
}

export type ChartType = 
  | 'bar' 
  | 'horizontal_bar' 
  | 'line' 
  | 'area' 
  | 'pie' 
  | 'donut' 
  | 'scatter' 
  | 'histogram';

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

export type ColorPalette = 'teal_emerald' | 'navy_blue' | 'sunset_amber' | 'cyberpunk' | 'monochrome';

export interface ChartConfig {
  chartType: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  groupBy?: string;
  palette: ColorPalette;
  sortBy?: 'x' | 'y' | 'none';
  sortDirection?: 'asc' | 'desc';
  showGrid?: boolean;
  showLegend?: boolean;
  isStacked?: boolean;
  binCount?: number;
  colorOverrides?: Record<string, string>;
  subtitle?: string;
}

export interface Visualization {
  id: string;
  userId: string;
  datasetId?: string;
  title: string;
  prompt: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  groupBy?: string;
  palette: ColorPalette;
  config: ChartConfig;
  insights?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptAnalysis {
  clarityScore: number;
  specificityScore: number;
  completenessScore: number;
  overallScore: number;
  ambiguityWarnings: string[];
  missingSuggestions: string[];
  improvedPrompt: string;
  rationale: string;
  suggestedChartType: ChartType;
  extractedParameters?: {
    intent?: string;
    xAxis?: string;
    yAxis?: string;
    aggregation?: AggregationType;
    groupBy?: string;
  };
}

export interface PromptVersion {
  id: string;
  userId: string;
  originalPrompt: string;
  improvedPrompt: string;
  clarityScore: number;
  specificityScore: number;
  completenessScore: number;
  suggestions: string[];
  status: 'draft' | 'applied' | 'archived';
  createdAt: string;
}

export interface CopilotMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  calculationDetails?: {
    formula: string;
    result: any;
    columnsUsed: string[];
    explanation: string;
  };
  suggestedChart?: Partial<Visualization>;
  timestamp: string;
}

export interface NumericStats {
  column: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  outliersCount: number;
  outlierValues: number[];
}

export interface CategoricalStats {
  column: string;
  total: number;
  unique: number;
  missing: number;
  topValues: { value: string; count: number; percentage: number }[];
}

export interface DataInsightSummary {
  numericStats: Record<string, NumericStats>;
  categoricalStats: Record<string, CategoricalStats>;
  missingValueSummary: { column: string; count: number; percentage: number }[];
  duplicateRowCount: number;
  totalRows: number;
  correlationMatrix: { col1: string; col2: string; correlation: number }[];
  trends: { column: string; dateColumn: string; direction: 'up' | 'down' | 'flat'; slope: number; changePercent: number }[];
  keyTakeaways: string[];
}

export interface Report {
  id: string;
  userId: string;
  datasetId?: string;
  datasetName?: string;
  title: string;
  authorName: string;
  summary: string;
  introduction: string;
  conclusion: string;
  visualizationIds: string[];
  insightsIncluded: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TestRuleFinding {
  rule: string;
  category: 'prompt' | 'data' | 'compatibility' | 'quality';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  fixSuggestion?: string;
}

export interface TestRun {
  id: string;
  userId: string;
  testName: string;
  status: 'pass' | 'warning' | 'fail';
  prompt: string;
  findings: TestRuleFinding[];
  datasetName?: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'dark' | 'light';
  defaultChartType: ChartType;
  defaultPalette: ColorPalette;
  previewRowLimit: number;
  dateFormat: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  company: string;
  role: string;
}
