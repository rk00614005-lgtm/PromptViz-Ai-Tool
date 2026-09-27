import { Dataset, PromptAnalysis, ChartType, AggregationType, ColorPalette, CopilotMessage } from '../types';
import { parsePromptDeterministically, analyzePromptQuality } from './ruleEngine';

export interface AIStatus {
  isAvailable: boolean;
  provider: string;
}

export const aiService = {
  /**
   * Parse natural language visualization prompt into chart configuration
   */
  async parsePrompt(prompt: string, dataset?: Dataset): Promise<{
    intent: string;
    chartType: ChartType;
    xAxis: string;
    yAxis: string;
    aggregation: AggregationType;
    groupBy?: string;
    title: string;
    palette: ColorPalette;
    confidence: number;
    aiPowered: boolean;
    provider: string;
    warnings: string[];
  }> {
    try {
      const response = await fetch('/api/ai/parse-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          columns: dataset?.columns || [],
          datasetName: dataset?.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.chartType && data.xAxis && data.yAxis) {
          return {
            ...data,
            aiPowered: true,
            provider: 'Gemini 3.8 Flash (Server-Side)'
          };
        }
      }
    } catch (e) {
      // Fall through to deterministic engine
      console.warn('Backend AI service unreachable, engaging deterministic rules engine:', e);
    }

    // Deterministic Rule-Based Parsing
    const parsed = parsePromptDeterministically(prompt, dataset);
    return {
      ...parsed,
      aiPowered: false,
      provider: 'Deterministic Rule Engine'
    };
  },

  /**
   * Analyze prompt quality with clarity, specificity & completeness scores
   */
  async analyzePrompt(prompt: string, dataset?: Dataset): Promise<PromptAnalysis & { aiPowered: boolean; provider: string }> {
    try {
      const response = await fetch('/api/ai/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          columns: dataset?.columns || [],
          datasetName: dataset?.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.overallScore === 'number') {
          return {
            ...data,
            aiPowered: true,
            provider: 'Gemini 3.8 Flash (Server-Side)'
          };
        }
      }
    } catch (e) {
      console.warn('Backend AI prompt analyzer unavailable, fallback to heuristics:', e);
    }

    // Deterministic Rule-Based Analysis
    const analysis = analyzePromptQuality(prompt, dataset);
    return {
      ...analysis,
      aiPowered: false,
      provider: 'Deterministic Rule Engine'
    };
  },

  /**
   * Ask Copilot a question about the active dataset
   */
  async askCopilot(
    question: string,
    dataset: Dataset,
    history: CopilotMessage[]
  ): Promise<{
    answer: string;
    calculationDetails?: {
      formula: string;
      result: any;
      columnsUsed: string[];
      explanation: string;
    };
    suggestedChart?: any;
    aiPowered: boolean;
    provider: string;
  }> {
    // 1. Calculate deterministic metrics from data first
    const qLower = question.toLowerCase();
    const rawData = dataset.data || dataset.rawPreviewData || [];
    const numCols = dataset.columns.filter(c => c.type === 'numeric');
    const catCols = dataset.columns.filter(c => c.type === 'categorical');
    const dateCols = dataset.columns.filter(c => c.type === 'date');

    // Deterministic math logic for specific questions:
    let calculationDetails: any = undefined;
    let suggestedChart: any = undefined;
    let deterministicAnswer = '';

    // "highest / max" query
    if (qLower.includes('highest') || qLower.includes('maximum') || qLower.includes('top')) {
      const targetMetric = numCols.find(c => qLower.includes(c.name.toLowerCase().replace(/_/g, ' '))) || numCols[0];
      const targetCat = catCols.find(c => qLower.includes(c.name.toLowerCase().replace(/_/g, ' '))) || catCols[0];

      if (targetMetric && targetCat && rawData.length > 0) {
        // Group and sum
        const totals: Record<string, number> = {};
        rawData.forEach(r => {
          const key = String(r[targetCat.name] || 'Other');
          totals[key] = (totals[key] || 0) + (Number(r[targetMetric.name]) || 0);
        });

        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const top = sorted[0];

        deterministicAnswer = `Based on calculations over ${rawData.length} rows, **${top[0]}** holds the highest total ${targetMetric.name.replace(/_/g, ' ')} at **${top[1].toLocaleString()}**.`;
        calculationDetails = {
          formula: `SUM(${targetMetric.name}) GROUP BY ${targetCat.name} ORDER BY DESC LIMIT 1`,
          result: top[1],
          columnsUsed: [targetCat.name, targetMetric.name],
          explanation: `Aggregated ${targetMetric.name} across all unique ${targetCat.name} values and sorted descending.`
        };

        suggestedChart = {
          title: `Top ${targetCat.name.replace(/_/g, ' ')} by ${targetMetric.name.replace(/_/g, ' ')}`,
          chartType: 'horizontal_bar',
          xAxis: targetCat.name,
          yAxis: targetMetric.name,
          aggregation: 'sum'
        };
      }
    }

    // "average" query
    else if (qLower.includes('average') || qLower.includes('mean')) {
      const targetMetric = numCols.find(c => qLower.includes(c.name.toLowerCase().replace(/_/g, ' '))) || numCols[0];
      if (targetMetric && rawData.length > 0) {
        const nums = rawData.map(r => Number(r[targetMetric.name])).filter(n => !isNaN(n));
        const avg = nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length);

        deterministicAnswer = `The average ${targetMetric.name.replace(/_/g, ' ')} across all ${nums.length} records is **${avg.toFixed(2)}** (Min: ${Math.min(...nums)}, Max: ${Math.max(...nums)}).`;
        calculationDetails = {
          formula: `AVG(${targetMetric.name}) = SUM(${targetMetric.name}) / COUNT(*)`,
          result: Number(avg.toFixed(2)),
          columnsUsed: [targetMetric.name],
          explanation: `Calculated arithmetic mean from ${nums.length} valid numeric values.`
        };

        suggestedChart = {
          title: `Distribution of ${targetMetric.name.replace(/_/g, ' ')}`,
          chartType: 'histogram',
          xAxis: targetMetric.name,
          yAxis: targetMetric.name,
          aggregation: 'count'
        };
      }
    }

    // "trend / monthly" query
    else if (qLower.includes('trend') || qLower.includes('monthly') || qLower.includes('over time')) {
      const dateCol = dateCols[0];
      const targetMetric = numCols[0];
      if (dateCol && targetMetric && rawData.length > 0) {
        deterministicAnswer = `Analyzed the timeline for **${targetMetric.name.replace(/_/g, ' ')}** along the **${dateCol.name}** axis.`;
        suggestedChart = {
          title: `${targetMetric.name.replace(/_/g, ' ')} Trend over ${dateCol.name}`,
          chartType: 'line',
          xAxis: dateCol.name,
          yAxis: targetMetric.name,
          aggregation: 'sum'
        };
        calculationDetails = {
          formula: `SUM(${targetMetric.name}) GROUP BY ${dateCol.name} ORDER BY ${dateCol.name} ASC`,
          result: 'Timeline aggregated',
          columnsUsed: [dateCol.name, targetMetric.name],
          explanation: `Grouped data chronologically by ${dateCol.name}.`
        };
      }
    }

    // "missing / quality" query
    else if (qLower.includes('missing') || qLower.includes('null') || qLower.includes('quality')) {
      const missingTotal = dataset.columns.reduce((a, c) => a + c.missingCount, 0);
      deterministicAnswer = `The dataset **${dataset.name}** has an overall Data Quality Score of **${dataset.dataQualityScore}/100** with **${missingTotal} missing values** detected across ${dataset.columnCount} columns.`;
      calculationDetails = {
        formula: `Data Quality Formula = 100 - (Missing% * 40) - (Duplicate% * 30)`,
        result: dataset.dataQualityScore,
        columnsUsed: dataset.columns.map(c => c.name),
        explanation: 'Audited all cells for null, undefined, or empty string values.'
      };
    }

    // Try calling server-side AI if question is complex or need deeper explanation
    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          datasetMeta: {
            name: dataset.name,
            rowCount: dataset.rowCount,
            columns: dataset.columns.map(c => ({ name: c.name, type: c.type, min: c.min, max: c.max, mean: c.mean })),
            sampleRows: rawData.slice(0, 10)
          },
          deterministicContext: {
            answer: deterministicAnswer,
            calculationDetails,
            suggestedChart
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          answer: data.answer || deterministicAnswer,
          calculationDetails: data.calculationDetails || calculationDetails,
          suggestedChart: data.suggestedChart || suggestedChart,
          aiPowered: true,
          provider: 'Gemini 3.8 Flash (Server-Side)'
        };
      }
    } catch (e) {
      console.warn('Copilot server-side AI unavailable, using deterministic math:', e);
    }

    // Deterministic fallback answer
    if (!deterministicAnswer) {
      deterministicAnswer = `Found ${numCols.length} numeric columns (${numCols.map(c => c.name).join(', ')}) and ${catCols.length} categorical columns in **${dataset.name}**. Try asking about the highest values, averages, or requesting a chart!`;
      if (catCols.length > 0 && numCols.length > 0) {
        suggestedChart = {
          title: `Total ${numCols[0].name.replace(/_/g, ' ')} by ${catCols[0].name.replace(/_/g, ' ')}`,
          chartType: 'bar',
          xAxis: catCols[0].name,
          yAxis: numCols[0].name,
          aggregation: 'sum'
        };
      }
    }

    return {
      answer: deterministicAnswer,
      calculationDetails,
      suggestedChart,
      aiPowered: false,
      provider: 'Deterministic Rule Engine'
    };
  }
};
