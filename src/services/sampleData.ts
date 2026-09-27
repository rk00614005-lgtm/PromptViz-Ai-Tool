import { Dataset, ColumnMeta, DataType } from '../types';

export function detectColumnType(values: any[]): DataType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'text';

  // Check if dates
  const dateMatches = nonNull.filter(v => {
    if (typeof v === 'number') return false;
    const str = String(v).trim();
    if (/^\d{4}-\d{2}(-\d{2})?/.test(str)) return true;
    const parsed = Date.parse(str);
    return !isNaN(parsed) && str.length > 5;
  });
  if (dateMatches.length / nonNull.length > 0.8) return 'date';

  // Check if numeric
  const numMatches = nonNull.filter(v => {
    if (typeof v === 'number') return !isNaN(v);
    const cleaned = String(v).replace(/[$,%]/g, '').trim();
    return cleaned !== '' && !isNaN(Number(cleaned));
  });
  if (numMatches.length / nonNull.length > 0.85) return 'numeric';

  // Categorical vs text
  const uniqueCount = new Set(nonNull.map(v => String(v).toLowerCase())).size;
  if (uniqueCount <= 30 || uniqueCount / nonNull.length < 0.35) {
    return 'categorical';
  }

  return 'text';
}

export function extractColumnMetadata(data: Record<string, any>[]): ColumnMeta[] {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);

  return keys.map(key => {
    const values = data.map(r => r[key]);
    const type = detectColumnType(values);
    const missingCount = values.filter(v => v === null || v === undefined || v === '').length;
    const uniqueValues = Array.from(new Set(values.filter(v => v !== null && v !== undefined && v !== '')));
    const sampleValues = uniqueValues.slice(0, 5);

    let min: number | undefined;
    let max: number | undefined;
    let mean: number | undefined;

    if (type === 'numeric') {
      const nums = values
        .map(v => (typeof v === 'number' ? v : Number(String(v).replace(/[$,%]/g, ''))))
        .filter(n => !isNaN(n));
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = Number((nums.reduce((acc, n) => acc + n, 0) / nums.length).toFixed(2));
      }
    }

    return {
      name: key,
      type,
      missingCount,
      uniqueCount: uniqueValues.length,
      sampleValues,
      min,
      max,
      mean
    };
  });
}

export function calculateQualityScore(data: Record<string, any>[], columns: ColumnMeta[]): number {
  if (!data || data.length === 0) return 0;
  let score = 100;

  // Penalize missing values
  const totalCells = data.length * columns.length;
  const totalMissing = columns.reduce((acc, col) => acc + col.missingCount, 0);
  const missingRatio = totalMissing / Math.max(1, totalCells);
  score -= Math.round(missingRatio * 40);

  // Penalize duplicate rows
  const stringified = data.map(r => JSON.stringify(r));
  const uniqueRows = new Set(stringified).size;
  const duplicateRatio = (data.length - uniqueRows) / data.length;
  score -= Math.round(duplicateRatio * 30);

  return Math.max(10, Math.min(100, score));
}

// 1. SaaS Growth & Revenue Dataset
const saasRows = [
  { Month: '2024-01', Region: 'North America', Product_Tier: 'Enterprise', Customers: 145, MRR: 72500, ARR: 870000, Churn_Rate: 1.2, CSAT: 4.8 },
  { Month: '2024-01', Region: 'Europe', Product_Tier: 'Enterprise', Customers: 110, MRR: 55000, ARR: 660000, Churn_Rate: 1.4, CSAT: 4.6 },
  { Month: '2024-01', Region: 'Asia Pacific', Product_Tier: 'Pro', Customers: 280, MRR: 42000, ARR: 504000, Churn_Rate: 2.1, CSAT: 4.5 },
  { Month: '2024-01', Region: 'Latin America', Product_Tier: 'Starter', Customers: 420, MRR: 21000, ARR: 252000, Churn_Rate: 3.5, CSAT: 4.3 },
  { Month: '2024-02', Region: 'North America', Product_Tier: 'Enterprise', Customers: 158, MRR: 79000, ARR: 948000, Churn_Rate: 0.9, CSAT: 4.9 },
  { Month: '2024-02', Region: 'Europe', Product_Tier: 'Pro', Customers: 240, MRR: 36000, ARR: 432000, Churn_Rate: 1.8, CSAT: 4.7 },
  { Month: '2024-02', Region: 'Asia Pacific', Product_Tier: 'Enterprise', Customers: 95, MRR: 47500, ARR: 570000, Churn_Rate: 1.5, CSAT: 4.6 },
  { Month: '2024-02', Region: 'Latin America', Product_Tier: 'Pro', Customers: 190, MRR: 28500, ARR: 342000, Churn_Rate: 2.8, CSAT: 4.4 },
  { Month: '2024-03', Region: 'North America', Product_Tier: 'Pro', Customers: 510, MRR: 76500, ARR: 918000, Churn_Rate: 1.6, CSAT: 4.8 },
  { Month: '2024-03', Region: 'Europe', Product_Tier: 'Enterprise', Customers: 125, MRR: 62500, ARR: 750000, Churn_Rate: 1.1, CSAT: 4.7 },
  { Month: '2024-03', Region: 'Asia Pacific', Product_Tier: 'Pro', Customers: 320, MRR: 48000, ARR: 576000, Churn_Rate: 2.0, CSAT: 4.5 },
  { Month: '2024-03', Region: 'Latin America', Product_Tier: 'Starter', Customers: 460, MRR: 23000, ARR: 276000, Churn_Rate: 3.2, CSAT: 4.2 },
  { Month: '2024-04', Region: 'North America', Product_Tier: 'Enterprise', Customers: 172, MRR: 86000, ARR: 1032000, Churn_Rate: 0.8, CSAT: 4.9 },
  { Month: '2024-04', Region: 'Europe', Product_Tier: 'Starter', Customers: 530, MRR: 26500, ARR: 318000, Churn_Rate: 2.9, CSAT: 4.5 },
  { Month: '2024-04', Region: 'Asia Pacific', Product_Tier: 'Enterprise', Customers: 115, MRR: 57500, ARR: 690000, Churn_Rate: 1.3, CSAT: 4.7 },
  { Month: '2024-04', Region: 'Latin America', Product_Tier: 'Pro', Customers: 215, MRR: 32250, ARR: 387000, Churn_Rate: 2.6, CSAT: 4.3 },
  { Month: '2024-05', Region: 'North America', Product_Tier: 'Pro', Customers: 560, MRR: 84000, ARR: 1008000, Churn_Rate: 1.4, CSAT: 4.8 },
  { Month: '2024-05', Region: 'Europe', Product_Tier: 'Enterprise', Customers: 138, MRR: 69000, ARR: 828000, Churn_Rate: 1.0, CSAT: 4.7 },
  { Month: '2024-05', Region: 'Asia Pacific', Product_Tier: 'Pro', Customers: 350, MRR: 52500, ARR: 630000, Churn_Rate: 1.9, CSAT: 4.6 },
  { Month: '2024-05', Region: 'Latin America', Product_Tier: 'Enterprise', Customers: 60, MRR: 30000, ARR: 360000, Churn_Rate: 2.1, CSAT: 4.4 },
  { Month: '2024-06', Region: 'North America', Product_Tier: 'Enterprise', Customers: 190, MRR: 95000, ARR: 1140000, Churn_Rate: 0.7, CSAT: 5.0 },
  { Month: '2024-06', Region: 'Europe', Product_Tier: 'Pro', Customers: 290, MRR: 43500, ARR: 522000, Churn_Rate: 1.5, CSAT: 4.8 },
  { Month: '2024-06', Region: 'Asia Pacific', Product_Tier: 'Enterprise', Customers: 130, MRR: 65000, ARR: 780000, Churn_Rate: 1.2, CSAT: 4.7 },
  { Month: '2024-06', Region: 'Latin America', Product_Tier: 'Pro', Customers: 240, MRR: 36000, ARR: 432000, Churn_Rate: 2.4, CSAT: 4.5 },
];

// 2. Global E-Commerce Product Orders
const ecommerceRows = [
  { Order_ID: 'ORD-101', Category: 'Electronics', Sub_Category: 'Laptops', Region: 'East', Units: 42, Revenue: 54600, Profit: 12200, Discount_Percent: 5, Rating: 4.7 },
  { Order_ID: 'ORD-102', Category: 'Electronics', Sub_Category: 'Accessories', Region: 'West', Units: 180, Revenue: 16200, Profit: 6480, Discount_Percent: 10, Rating: 4.3 },
  { Order_ID: 'ORD-103', Category: 'Office Supplies', Sub_Category: 'Storage', Region: 'Central', Units: 95, Revenue: 9500, Profit: 2850, Discount_Percent: 15, Rating: 4.1 },
  { Order_ID: 'ORD-104', Category: 'Furniture', Sub_Category: 'Chairs', Region: 'South', Units: 65, Revenue: 22750, Profit: 4550, Discount_Percent: 8, Rating: 4.5 },
  { Order_ID: 'ORD-105', Category: 'Electronics', Sub_Category: 'Smartphones', Region: 'East', Units: 88, Revenue: 70400, Profit: 17600, Discount_Percent: 2, Rating: 4.8 },
  { Order_ID: 'ORD-106', Category: 'Office Supplies', Sub_Category: 'Paper', Region: 'West', Units: 310, Revenue: 9300, Profit: 3720, Discount_Percent: 12, Rating: 4.2 },
  { Order_ID: 'ORD-107', Category: 'Furniture', Sub_Category: 'Tables', Region: 'Central', Units: 40, Revenue: 26000, Profit: 3900, Discount_Percent: 20, Rating: 3.9 },
  { Order_ID: 'ORD-108', Category: 'Electronics', Sub_Category: 'Laptops', Region: 'South', Units: 35, Revenue: 45500, Profit: 10465, Discount_Percent: 6, Rating: 4.6 },
  { Order_ID: 'ORD-109', Category: 'Office Supplies', Sub_Category: 'Binders', Region: 'East', Units: 240, Revenue: 7200, Profit: 2880, Discount_Percent: 10, Rating: 4.4 },
  { Order_ID: 'ORD-110', Category: 'Furniture', Sub_Category: 'Bookcases', Region: 'West', Units: 50, Revenue: 18500, Profit: 2775, Discount_Percent: 15, Rating: 4.0 },
  { Order_ID: 'ORD-111', Category: 'Electronics', Sub_Category: 'Audio', Region: 'Central', Units: 140, Revenue: 21000, Profit: 7350, Discount_Percent: 5, Rating: 4.7 },
  { Order_ID: 'ORD-112', Category: 'Furniture', Sub_Category: 'Chairs', Region: 'East', Units: 80, Revenue: 28000, Profit: 5600, Discount_Percent: 10, Rating: 4.6 },
];

export function getSampleDatasets(userId: string): Dataset[] {
  const saasCols = extractColumnMetadata(saasRows);
  const saasDataset: Dataset = {
    id: 'sample-ds-saas',
    userId,
    name: 'Global SaaS Metrics 2024',
    description: 'Monthly Recurring Revenue (MRR), ARR, Churn Rate, and CSAT across geographical regions and product tiers.',
    fileName: 'global_saas_metrics_2024.csv',
    fileSize: 4280,
    rowCount: saasRows.length,
    columnCount: saasCols.length,
    columns: saasCols,
    dataQualityScore: calculateQualityScore(saasRows, saasCols),
    rawPreviewData: saasRows.slice(0, 15),
    data: saasRows,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  const ecomCols = extractColumnMetadata(ecommerceRows);
  const ecomDataset: Dataset = {
    id: 'sample-ds-ecom',
    userId,
    name: 'E-Commerce Sales & Profitability',
    description: 'Detailed category breakdown of order revenue, profit margin, units sold, and consumer ratings.',
    fileName: 'ecommerce_sales_profitability.csv',
    fileSize: 3120,
    rowCount: ecommerceRows.length,
    columnCount: ecomCols.length,
    columns: ecomCols,
    dataQualityScore: calculateQualityScore(ecommerceRows, ecomCols),
    rawPreviewData: ecommerceRows.slice(0, 15),
    data: ecommerceRows,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return [saasDataset, ecomDataset];
}
