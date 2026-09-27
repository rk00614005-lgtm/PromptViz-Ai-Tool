import { Dataset, ColumnMeta, ChartType, AggregationType, ColorPalette, ChartConfig, PromptAnalysis, DataInsightSummary, NumericStats, CategoricalStats, TestRuleFinding } from '../types';

/**
 * Deterministic Natural Language Parser for Data Visualization Prompts
 */
export function parsePromptDeterministically(
  prompt: string,
  dataset?: Dataset
): {
  intent: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  groupBy?: string;
  title: string;
  palette: ColorPalette;
  confidence: number;
  warnings: string[];
} {
  const p = prompt.toLowerCase();
  const warnings: string[] = [];

  // Default fallbacks if dataset provided
  const columns = dataset?.columns || [];
  const numericCols = columns.filter(c => c.type === 'numeric');
  const categoricalCols = columns.filter(c => c.type === 'categorical');
  const dateCols = columns.filter(c => c.type === 'date');

  // 1. Detect Chart Type Intent
  let chartType: ChartType = 'bar';
  if (p.includes('donut') || p.includes('doughnut')) {
    chartType = 'donut';
  } else if (p.includes('pie') || p.includes('proportion') || p.includes('share') || p.includes('breakdown')) {
    chartType = 'pie';
  } else if (p.includes('horizontal bar') || p.includes('ranking') || p.includes('rank') || p.includes('top 5') || p.includes('top 10')) {
    chartType = 'horizontal_bar';
  } else if (p.includes('area') || p.includes('cumulative') || p.includes('volume')) {
    chartType = 'area';
  } else if (p.includes('line') || p.includes('trend') || p.includes('over time') || p.includes('monthly') || p.includes('trajectory') || p.includes('timeline')) {
    chartType = 'line';
  } else if (p.includes('scatter') || p.includes('correlation') || p.includes('relationship') || p.includes('versus') || p.includes(' vs ')) {
    chartType = 'scatter';
  } else if (p.includes('histogram') || p.includes('frequency') || p.includes('distribution') || p.includes('spread')) {
    chartType = 'histogram';
  } else if (p.includes('bar') || p.includes('compare') || p.includes('comparison')) {
    chartType = 'bar';
  }

  // 2. Detect Aggregation
  let aggregation: AggregationType = 'sum';
  if (p.includes('average') || p.includes('avg') || p.includes('mean')) {
    aggregation = 'avg';
  } else if (p.includes('count') || p.includes('number of') || p.includes('frequency of') || p.includes('how many')) {
    aggregation = 'count';
  } else if (p.includes('maximum') || p.includes('max') || p.includes('highest') || p.includes('peak')) {
    aggregation = 'max';
  } else if (p.includes('minimum') || p.includes('min') || p.includes('lowest')) {
    aggregation = 'min';
  } else if (p.includes('sum') || p.includes('total') || p.includes('aggregate')) {
    aggregation = 'sum';
  }

  // 3. Match Columns from Dataset
  let matchedX = '';
  let matchedY = '';
  let matchedGroup = '';

  // Match columns by checking prompt tokens against column names (case-insensitive & snake/clean words)
  const findColumnMatch = (cols: ColumnMeta[]) => {
    for (const col of cols) {
      const colNorm = col.name.toLowerCase().replace(/[_ -]/g, ' ');
      const rawNorm = col.name.toLowerCase();
      if (p.includes(colNorm) || p.includes(rawNorm)) {
        return col.name;
      }
    }
    return '';
  };

  // Find X axis
  if (chartType === 'line' || chartType === 'area') {
    // Prefer date column first
    if (dateCols.length > 0) {
      const dateMatch = findColumnMatch(dateCols);
      matchedX = dateMatch || dateCols[0].name;
    }
  }

  if (!matchedX) {
    // Try matching any categorical or date column mentioned
    matchedX = findColumnMatch([...categoricalCols, ...dateCols]);
  }

  // Find Y axis (prefer numeric)
  matchedY = findColumnMatch(numericCols);

  // If still not matched, use heuristics
  if (!matchedX) {
    if (categoricalCols.length > 0) matchedX = categoricalCols[0].name;
    else if (columns.length > 0) matchedX = columns[0].name;
    warnings.push(`X-axis was inferred as "${matchedX}" based on dataset structure.`);
  }

  if (!matchedY) {
    if (numericCols.length > 0) matchedY = numericCols[0].name;
    else if (columns.length > 1) matchedY = columns[1].name;
    warnings.push(`Y-axis was inferred as "${matchedY}" based on dataset structure.`);
  }

  // Check if scatter needs 2 numeric columns
  if (chartType === 'scatter') {
    const numCols = numericCols.filter(c => c.name !== matchedY);
    if (numCols.length > 0) {
      matchedX = numCols[0].name;
    }
  }

  // Check Group By (e.g., "grouped by region" or "by product tier")
  const groupByMatch = p.match(/(?:grouped by|split by|broken down by|by)\s+([a-zA-Z0-9_ ]+)/i);
  if (groupByMatch && groupByMatch[1]) {
    const candidate = groupByMatch[1].trim().toLowerCase();
    const matchedCol = categoricalCols.find(c => candidate.includes(c.name.toLowerCase().replace(/[_ -]/g, ' ')));
    if (matchedCol && matchedCol.name !== matchedX) {
      matchedGroup = matchedCol.name;
    }
  }

  // Palette detection
  let palette: ColorPalette = 'teal_emerald';
  if (p.includes('sunset') || p.includes('orange') || p.includes('amber')) palette = 'sunset_amber';
  else if (p.includes('navy') || p.includes('blue')) palette = 'navy_blue';
  else if (p.includes('cyber') || p.includes('neon') || p.includes('purple')) palette = 'cyberpunk';
  else if (p.includes('gray') || p.includes('mono')) palette = 'monochrome';

  // Construct Title
  const aggLabel = aggregation === 'avg' ? 'Average' : aggregation === 'sum' ? 'Total' : aggregation.toUpperCase();
  const title = `${aggLabel} ${matchedY.replace(/_/g, ' ')} by ${matchedX.replace(/_/g, ' ')}`;

  return {
    intent: `Display ${aggLabel.toLowerCase()} of ${matchedY} grouped across ${matchedX}`,
    chartType,
    xAxis: matchedX,
    yAxis: matchedY,
    aggregation,
    groupBy: matchedGroup || undefined,
    title,
    palette,
    confidence: matchedX && matchedY ? 92 : 65,
    warnings
  };
}

/**
 * Chart Type Recommender based on data types & analytical goal
 */
export function recommendChartType(
  xType: string,
  yType: string,
  cardinality: number
): { recommended: ChartType; reasons: string[] } {
  if (xType === 'date') {
    return {
      recommended: 'line',
      reasons: ['Temporal x-axis is best suited for Line or Area charts to demonstrate trends over time.']
    };
  }
  if (xType === 'numeric' && yType === 'numeric') {
    return {
      recommended: 'scatter',
      reasons: ['Both axes are numeric, making Scatter ideal to assess correlation and distribution without premature aggregation.']
    };
  }
  if (cardinality <= 6 && (xType === 'categorical')) {
    return {
      recommended: 'donut',
      reasons: ['Low categorical cardinality (≤ 6 categories) allows clear proportional breakdown without visual clutter.']
    };
  }
  if (cardinality > 12) {
    return {
      recommended: 'horizontal_bar',
      reasons: ['Higher cardinality (> 12 items) renders much better on a horizontal bar chart where category labels do not overlap.']
    };
  }
  return {
    recommended: 'bar',
    reasons: ['Categorical X with continuous numeric Y is the standard benchmark for bar comparisons.']
  };
}

/**
 * Data Aggregation Engine for Recharts
 */
export function aggregateChartData(
  rawData: Record<string, any>[],
  config: ChartConfig
): { data: any[]; keys: string[] } {
  if (!rawData || rawData.length === 0 || !config.xAxis || !config.yAxis) {
    return { data: [], keys: [] };
  }

  const { xAxis, yAxis, aggregation, groupBy, chartType, binCount = 8 } = config;

  // Histogram special handling
  if (chartType === 'histogram') {
    const values = rawData
      .map(r => Number(r[yAxis] ?? r[xAxis]))
      .filter(v => !isNaN(v));
    if (values.length === 0) return { data: [], keys: ['count'] };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / binCount || 1;

    const bins = Array.from({ length: binCount }, (_, i) => {
      const start = min + i * step;
      const end = start + step;
      return {
        binRange: `${start.toFixed(1)} - ${end.toFixed(1)}`,
        count: 0,
        start,
        end
      };
    });

    values.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / step), binCount - 1);
      if (bins[idx]) bins[idx].count++;
    });

    return { data: bins, keys: ['count'] };
  }

  // Scatter special handling: raw pairs without heavy aggregation
  if (chartType === 'scatter') {
    const points = rawData
      .slice(0, 200)
      .map(r => ({
        [xAxis]: Number(r[xAxis]) || 0,
        [yAxis]: Number(r[yAxis]) || 0,
        label: r.Order_ID || r.name || `${r[xAxis]} - ${r[yAxis]}`
      }))
      .filter(p => !isNaN(p[xAxis]) && !isNaN(p[yAxis]));
    return { data: points, keys: [yAxis] };
  }

  // Standard aggregation by xAxis (and optional groupBy)
  const groups: Record<string, { [key: string]: any; count: number; total: number; min: number; max: number; values: number[] }> = {};
  const groupKeys = new Set<string>();

  rawData.forEach(row => {
    const rawX = row[xAxis];
    const xKey = rawX === null || rawX === undefined ? 'Unknown' : String(rawX);
    const rawY = Number(row[yAxis]);
    const numY = isNaN(rawY) ? 0 : rawY;

    if (!groups[xKey]) {
      groups[xKey] = {
        count: 0,
        total: 0,
        min: numY,
        max: numY,
        values: []
      };
    }

    groups[xKey].count += 1;
    groups[xKey].total += numY;
    groups[xKey].min = Math.min(groups[xKey].min, numY);
    groups[xKey].max = Math.max(groups[xKey].max, numY);
    groups[xKey].values.push(numY);

    if (groupBy && row[groupBy]) {
      const gKey = String(row[groupBy]);
      groupKeys.add(gKey);
      if (!groups[xKey][gKey]) groups[xKey][gKey] = 0;
      groups[xKey][gKey] += numY;
    }
  });

  const result = Object.entries(groups).map(([xVal, group]) => {
    let finalY = 0;
    if (aggregation === 'sum') finalY = group.total;
    else if (aggregation === 'avg') finalY = group.count > 0 ? Number((group.total / group.count).toFixed(2)) : 0;
    else if (aggregation === 'count') finalY = group.count;
    else if (aggregation === 'min') finalY = group.min;
    else if (aggregation === 'max') finalY = group.max;
    else finalY = group.total;

    const rowObj: any = {
      [xAxis]: xVal,
      [yAxis]: finalY
    };

    if (groupBy && groupKeys.size > 0) {
      groupKeys.forEach(gk => {
        rowObj[gk] = group[gk] || 0;
      });
    }

    return rowObj;
  });

  // Sorting
  if (config.sortBy === 'y') {
    result.sort((a, b) => {
      const diff = (a[yAxis] || 0) - (b[yAxis] || 0);
      return config.sortDirection === 'desc' ? -diff : diff;
    });
  } else if (config.sortBy === 'x') {
    result.sort((a, b) => {
      const comp = String(a[xAxis]).localeCompare(String(b[xAxis]));
      return config.sortDirection === 'desc' ? -comp : comp;
    });
  }

  const keys = groupBy && groupKeys.size > 0 ? Array.from(groupKeys) : [yAxis];
  return { data: result, keys };
}

/**
 * Calculate Rigorous Data Insights
 * (Descriptive stats, IQR outliers, Pearson correlation, trends)
 */
export function computeDatasetInsights(
  data: Record<string, any>[],
  columns: ColumnMeta[]
): DataInsightSummary {
  const numericStats: Record<string, NumericStats> = {};
  const categoricalStats: Record<string, CategoricalStats> = {};
  const missingValueSummary: { column: string; count: number; percentage: number }[] = [];

  const totalRows = data.length;

  columns.forEach(col => {
    // Missing values
    const missing = data.filter(r => r[col.name] === null || r[col.name] === undefined || r[col.name] === '').length;
    missingValueSummary.push({
      column: col.name,
      count: missing,
      percentage: Number(((missing / Math.max(1, totalRows)) * 100).toFixed(1))
    });

    // Numeric Descriptive Stats
    if (col.type === 'numeric') {
      const nums = data
        .map(r => (typeof r[col.name] === 'number' ? r[col.name] : Number(r[col.name])))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      if (nums.length > 0) {
        const min = nums[0];
        const max = nums[nums.length - 1];
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = Number((sum / nums.length).toFixed(2));
        const mid = Math.floor(nums.length / 2);
        const median = nums.length % 2 !== 0 ? nums[mid] : Number(((nums[mid - 1] + nums[mid]) / 2).toFixed(2));

        // Variance & StdDev
        const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length;
        const stdDev = Number(Math.sqrt(variance).toFixed(2));

        // Quartiles & IQR
        const q1 = nums[Math.floor(nums.length * 0.25)];
        const q3 = nums[Math.floor(nums.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierValues = nums.filter(n => n < lowerBound || n > upperBound);

        numericStats[col.name] = {
          column: col.name,
          count: nums.length,
          min,
          max,
          mean,
          median,
          stdDev,
          q1,
          q3,
          iqr,
          outliersCount: outlierValues.length,
          outlierValues: outlierValues.slice(0, 10)
        };
      }
    }

    // Categorical Stats
    if (col.type === 'categorical' || col.type === 'text') {
      const counts: Record<string, number> = {};
      data.forEach(r => {
        const val = r[col.name];
        if (val !== null && val !== undefined && val !== '') {
          const s = String(val);
          counts[s] = (counts[s] || 0) + 1;
        }
      });

      const topValues = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
          value,
          count,
          percentage: Number(((count / Math.max(1, totalRows)) * 100).toFixed(1))
        }));

      categoricalStats[col.name] = {
        column: col.name,
        total: totalRows,
        unique: Object.keys(counts).length,
        missing,
        topValues
      };
    }
  });

  // Duplicate Rows
  const strRows = data.map(r => JSON.stringify(r));
  const duplicateRowCount = totalRows - new Set(strRows).size;

  // Pearson Correlation Analysis for Numeric Pairs
  const correlationMatrix: { col1: string; col2: string; correlation: number }[] = [];
  const numColNames = Object.keys(numericStats);

  for (let i = 0; i < numColNames.length; i++) {
    for (let j = i + 1; j < numColNames.length; j++) {
      const colA = numColNames[i];
      const colB = numColNames[j];

      const pairs = data
        .map(r => [Number(r[colA]), Number(r[colB])])
        .filter(([a, b]) => !isNaN(a) && !isNaN(b));

      if (pairs.length > 2) {
        const n = pairs.length;
        const meanA = pairs.reduce((acc, [a]) => acc + a, 0) / n;
        const meanB = pairs.reduce((acc, [, b]) => acc + b, 0) / n;

        let numerator = 0;
        let denomA = 0;
        let denomB = 0;

        pairs.forEach(([a, b]) => {
          const diffA = a - meanA;
          const diffB = b - meanB;
          numerator += diffA * diffB;
          denomA += diffA * diffA;
          denomB += diffB * diffB;
        });

        const r = denomA * denomB > 0 ? Number((numerator / Math.sqrt(denomA * denomB)).toFixed(3)) : 0;
        correlationMatrix.push({ col1: colA, col2: colB, correlation: r });
      }
    }
  }

  // Simple Trend Analysis for Date fields
  const trends: { column: string; dateColumn: string; direction: 'up' | 'down' | 'flat'; slope: number; changePercent: number }[] = [];
  const dateCol = columns.find(c => c.type === 'date');

  if (dateCol && numColNames.length > 0) {
    const sorted = [...data]
      .filter(r => r[dateCol.name] && !isNaN(Date.parse(r[dateCol.name])))
      .sort((a, b) => Date.parse(a[dateCol.name]) - Date.parse(b[dateCol.name]));

    numColNames.slice(0, 3).forEach(numCol => {
      if (sorted.length >= 2) {
        const first = Number(sorted[0][numCol]);
        const last = Number(sorted[sorted.length - 1][numCol]);
        if (!isNaN(first) && !isNaN(last) && first !== 0) {
          const changePercent = Number((((last - first) / Math.abs(first)) * 100).toFixed(1));
          const direction = changePercent > 3 ? 'up' : changePercent < -3 ? 'down' : 'flat';
          trends.push({
            column: numCol,
            dateColumn: dateCol.name,
            direction,
            slope: Number(((last - first) / sorted.length).toFixed(2)),
            changePercent
          });
        }
      }
    });
  }

  // Key Takeaways in plain language
  const keyTakeaways: string[] = [];
  if (duplicateRowCount > 0) {
    keyTakeaways.push(`Dataset contains ${duplicateRowCount} duplicate rows that could skew aggregated metric counts.`);
  } else {
    keyTakeaways.push('Row uniqueness is pristine (0 duplicate records found).');
  }

  // Strong correlations
  const strongCorr = correlationMatrix.find(c => Math.abs(c.correlation) > 0.7);
  if (strongCorr) {
    keyTakeaways.push(`High correlation (r = ${strongCorr.correlation}) observed between ${strongCorr.col1} and ${strongCorr.col2}. Note: correlation does not establish causation.`);
  }

  // Outliers
  Object.values(numericStats).forEach(s => {
    if (s.outliersCount > 0) {
      keyTakeaways.push(`${s.column} has ${s.outliersCount} statistical outlier(s) beyond 1.5× IQR (Q1: ${s.q1}, Q3: ${s.q3}).`);
    }
  });

  return {
    numericStats,
    categoricalStats,
    missingValueSummary,
    duplicateRowCount,
    totalRows,
    correlationMatrix,
    trends,
    keyTakeaways
  };
}

/**
 * Transparent Prompt Scoring & Engineering Heuristics
 */
export function analyzePromptQuality(
  prompt: string,
  dataset?: Dataset
): PromptAnalysis {
  const p = prompt.trim();
  const lower = p.toLowerCase();
  const ambiguityWarnings: string[] = [];
  const missingSuggestions: string[] = [];

  let clarityScore = 80;
  let specificityScore = 75;
  let completenessScore = 70;

  // 1. Check prompt length
  if (p.length < 15) {
    clarityScore -= 25;
    ambiguityWarnings.push('Prompt is very brief; lack of analytical context leads to speculative defaults.');
  }

  // 2. Check Chart Type mention
  const hasChartType = /bar|line|pie|area|scatter|donut|histogram|ranking/i.test(lower);
  if (!hasChartType) {
    specificityScore -= 20;
    missingSuggestions.push('Explicitly name desired chart type (e.g. "as a horizontal bar chart" or "using a line graph").');
  }

  // 3. Check Aggregation mention
  const hasAggregation = /sum|total|average|avg|mean|count|max|min|distribution|median/i.test(lower);
  if (!hasAggregation) {
    completenessScore -= 25;
    missingSuggestions.push('Specify aggregation method (e.g. "total sum", "average", or "record count") to prevent unaggregated row stacking.');
  }

  // 4. Check Dataset Column mentions
  let columnMatchCount = 0;
  if (dataset) {
    dataset.columns.forEach(col => {
      const colNorm = col.name.toLowerCase().replace(/[_ -]/g, ' ');
      if (lower.includes(colNorm) || lower.includes(col.name.toLowerCase())) {
        columnMatchCount++;
      }
    });

    if (columnMatchCount === 0) {
      clarityScore -= 30;
      ambiguityWarnings.push('No recognized dataset column names found in prompt. Mention actual dataset column headers.');
    } else if (columnMatchCount === 1) {
      completenessScore -= 15;
      missingSuggestions.push('Only one column identified. Usually a visualization requires an independent dimension (X-axis) and a dependent metric (Y-axis).');
    }
  }

  // 5. Check Sorting & Top N
  const hasSorting = /sort|order|descending|ascending|top \d+|bottom \d+|highest|lowest/i.test(lower);
  if (!hasSorting) {
    specificityScore -= 10;
    missingSuggestions.push('Consider adding sorting instructions (e.g., "ordered by value descending" or "top 10").');
  }

  // Bound scores
  clarityScore = Math.max(20, Math.min(100, clarityScore));
  specificityScore = Math.max(20, Math.min(100, specificityScore));
  completenessScore = Math.max(20, Math.min(100, completenessScore));
  const overallScore = Math.round((clarityScore * 0.35) + (specificityScore * 0.35) + (completenessScore * 0.30));

  // Synthesize improved prompt
  const parsed = parsePromptDeterministically(prompt, dataset);
  const aggText = parsed.aggregation === 'avg' ? 'average' : parsed.aggregation === 'sum' ? 'total' : parsed.aggregation;
  const improvedPrompt = `Create a ${parsed.chartType.replace('_', ' ')} chart displaying the ${aggText} ${parsed.yAxis.replace(/_/g, ' ')} for each ${parsed.xAxis.replace(/_/g, ' ')}, sorted descending by ${parsed.yAxis.replace(/_/g, ' ')} with clean readable labels.`;

  return {
    clarityScore,
    specificityScore,
    completenessScore,
    overallScore,
    ambiguityWarnings,
    missingSuggestions,
    improvedPrompt,
    rationale: `Scored ${overallScore}/100. Prompt was enhanced by declaring the precise aggregation (${aggText}), defining the explicit dimensions (${parsed.xAxis} vs ${parsed.yAxis}), and specifying sort order for visual readability.`,
    suggestedChartType: parsed.chartType,
    extractedParameters: {
      intent: parsed.intent,
      xAxis: parsed.xAxis,
      yAxis: parsed.yAxis,
      aggregation: parsed.aggregation,
      groupBy: parsed.groupBy
    }
  };
}

/**
 * Automated Testing and Evaluation Engine
 */
export function runEvaluationTests(
  prompt: string,
  config: ChartConfig,
  dataset?: Dataset
): TestRuleFinding[] {
  const findings: TestRuleFinding[] = [];

  // Rule 1: Prompt Completeness
  if (!prompt || prompt.trim().length < 10) {
    findings.push({
      rule: 'Prompt Length & Specificity',
      category: 'prompt',
      status: 'fail',
      message: 'The prompt is under 10 characters and lacks actionable instructions.',
      fixSuggestion: 'Provide a structured request such as "Show total revenue by region as a bar chart".'
    });
  } else {
    findings.push({
      rule: 'Prompt Length & Specificity',
      category: 'prompt',
      status: 'pass',
      message: `Prompt contains ${prompt.trim().split(/\s+/).length} words with clear intent.`
    });
  }

  // Rule 2: Column Existence
  if (!dataset) {
    findings.push({
      rule: 'Dataset Reference Verification',
      category: 'data',
      status: 'warning',
      message: 'No active dataset selected to cross-reference columns against.',
      fixSuggestion: 'Select a dataset from the Dataset Manager.'
    });
  } else {
    const colNames = dataset.columns.map(c => c.name);
    const xExists = colNames.includes(config.xAxis);
    const yExists = colNames.includes(config.yAxis);

    if (!xExists || !yExists) {
      findings.push({
        rule: 'Column Existence Verification',
        category: 'data',
        status: 'fail',
        message: `Specified axes [${config.xAxis}, ${config.yAxis}] are not found in dataset columns.`,
        fixSuggestion: `Choose from available columns: ${colNames.slice(0, 5).join(', ')}...`
      });
    } else {
      findings.push({
        rule: 'Column Existence Verification',
        category: 'data',
        status: 'pass',
        message: `Both "${config.xAxis}" and "${config.yAxis}" verified in dataset schema.`
      });
    }

    // Rule 3: Aggregation Compatibility
    const yColMeta = dataset.columns.find(c => c.name === config.yAxis);
    if (yColMeta && yColMeta.type !== 'numeric' && config.aggregation !== 'count') {
      findings.push({
        rule: 'Aggregation Type Compatibility',
        category: 'compatibility',
        status: 'fail',
        message: `Column "${config.yAxis}" is of type ${yColMeta.type}, which cannot be mathematically aggregated using "${config.aggregation}".`,
        fixSuggestion: 'Change aggregation to "count" or select a numeric column for the Y-axis.'
      });
    } else {
      findings.push({
        rule: 'Aggregation Type Compatibility',
        category: 'compatibility',
        status: 'pass',
        message: `Aggregation "${config.aggregation}" is fully compatible with metric "${config.yAxis}".`
      });
    }

    // Rule 4: Chart/Data Cardinality Compatibility
    if (config.chartType === 'pie' || config.chartType === 'donut') {
      const xColMeta = dataset.columns.find(c => c.name === config.xAxis);
      if (xColMeta && xColMeta.uniqueCount > 10) {
        findings.push({
          rule: 'Cognitive Load & Cardinality Check',
          category: 'compatibility',
          status: 'warning',
          message: `Category "${config.xAxis}" contains ${xColMeta.uniqueCount} unique values. Pie/Donut charts with >8 slices become unreadable.`,
          fixSuggestion: 'Switch to a Horizontal Bar chart or apply a top-N filter.'
        });
      } else {
        findings.push({
          rule: 'Cognitive Load & Cardinality Check',
          category: 'compatibility',
          status: 'pass',
          message: 'Category slice count is within readable human perception limits (≤ 10).'
        });
      }
    }

    // Rule 5: Empty Dataset Check
    if (dataset.rowCount === 0) {
      findings.push({
        rule: 'Dataset Population Check',
        category: 'quality',
        status: 'fail',
        message: 'The selected dataset contains 0 rows.',
        fixSuggestion: 'Upload or generate data containing valid records.'
      });
    } else {
      findings.push({
        rule: 'Dataset Population Check',
        category: 'quality',
        status: 'pass',
        message: `Dataset contains ${dataset.rowCount} populated rows.`
      });
    }
  }

  return findings;
}
