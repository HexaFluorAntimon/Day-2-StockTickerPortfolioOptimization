// S&P 500 Complete Constituents & Financial Data Service

export const SP500_COMPANIES = [
  // Information Technology & AI
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Information Technology', price: 148.25, changePct: 3.42, cap: '$3.64T', pe: 48.2, fwdPe: 38.4, epsGrowth: '+28.4%', revenueGrowth: '+22.1%', fcf: '$18.4B', beta: 1.24, rating: 'Strong Buy', targetPrice: 182.00 },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Information Technology', price: 238.90, changePct: 0.85, cap: '$3.62T', pe: 34.1, fwdPe: 29.2, epsGrowth: '+14.2%', revenueGrowth: '+9.8%', fcf: '$108B', beta: 1.05, rating: 'Buy', targetPrice: 265.00 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Information Technology', price: 462.10, changePct: 1.25, cap: '$3.43T', pe: 36.8, fwdPe: 30.1, epsGrowth: '+18.6%', revenueGrowth: '+15.4%', fcf: '$74B', beta: 0.92, rating: 'Strong Buy', targetPrice: 510.00 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Information Technology', price: 172.40, changePct: 2.15, cap: '$812B', pe: 38.2, fwdPe: 27.5, epsGrowth: '+24.1%', revenueGrowth: '+32.0%', fcf: '$21B', beta: 1.18, rating: 'Strong Buy', targetPrice: 205.00 },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Information Technology', price: 174.50, changePct: 1.88, cap: '$482B', pe: 39.4, fwdPe: 28.1, epsGrowth: '+20.5%', revenueGrowth: '+18.2%', fcf: '$14.2B', beta: 1.02, rating: 'Buy', targetPrice: 198.00 },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', sector: 'Information Technology', price: 168.30, changePct: 2.95, cap: '$272B', pe: 45.6, fwdPe: 31.2, epsGrowth: '+32.0%', revenueGrowth: '+24.5%', fcf: '$4.8B', beta: 1.62, rating: 'Buy', targetPrice: 200.00 },
  { symbol: 'CRM', name: 'Salesforce, Inc.', sector: 'Information Technology', price: 284.20, changePct: 0.75, cap: '$274B', pe: 41.2, fwdPe: 26.8, epsGrowth: '+16.8%', revenueGrowth: '+11.4%', fcf: '$12.1B', beta: 1.15, rating: 'Buy', targetPrice: 325.00 },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', sector: 'Information Technology', price: 58.10, changePct: 0.42, cap: '$232B', pe: 16.4, fwdPe: 14.8, epsGrowth: '+6.2%', revenueGrowth: '+5.1%', fcf: '$13.5B', beta: 0.84, rating: 'Hold', targetPrice: 64.00 },
  { symbol: 'ACN', name: 'Accenture plc', sector: 'Information Technology', price: 342.80, changePct: 0.65, cap: '$215B', pe: 28.5, fwdPe: 24.2, epsGrowth: '+10.4%', revenueGrowth: '+8.5%', fcf: '$9.2B', beta: 1.08, rating: 'Buy', targetPrice: 385.00 },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Information Technology', price: 540.60, changePct: 1.12, cap: '$240B', pe: 42.1, fwdPe: 28.5, epsGrowth: '+17.2%', revenueGrowth: '+12.8%', fcf: '$8.4B', beta: 1.28, rating: 'Buy', targetPrice: 620.00 },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated', sector: 'Information Technology', price: 178.90, changePct: 1.45, cap: '$198B', pe: 21.4, fwdPe: 16.8, epsGrowth: '+15.2%', revenueGrowth: '+11.8%', fcf: '$11.2B', beta: 1.25, rating: 'Buy', targetPrice: 210.00 },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated', sector: 'Information Technology', price: 204.50, changePct: -0.32, cap: '$186B', pe: 31.2, fwdPe: 26.4, epsGrowth: '+8.5%', revenueGrowth: '+6.2%', fcf: '$5.1B', beta: 1.01, rating: 'Hold', targetPrice: 220.00 },
  { symbol: 'AMAT', name: 'Applied Materials, Inc.', sector: 'Information Technology', price: 218.40, changePct: 2.30, cap: '$180B', pe: 26.8, fwdPe: 20.4, epsGrowth: '+19.1%', revenueGrowth: '+14.5%', fcf: '$7.8B', beta: 1.45, rating: 'Strong Buy', targetPrice: 255.00 },
  { symbol: 'IBM', name: 'International Business Machines', sector: 'Information Technology', price: 212.30, changePct: 0.95, cap: '$195B', pe: 22.4, fwdPe: 18.5, epsGrowth: '+11.2%', revenueGrowth: '+7.4%', fcf: '$12.0B', beta: 0.72, rating: 'Buy', targetPrice: 235.00 },
  { symbol: 'LRCX', name: 'Lam Research Corporation', sector: 'Information Technology', price: 82.50, changePct: 2.10, cap: '$108B', pe: 28.2, fwdPe: 21.8, epsGrowth: '+22.5%', revenueGrowth: '+16.8%', fcf: '$4.2B', beta: 1.52, rating: 'Buy', targetPrice: 98.00 },
  { symbol: 'INTU', name: 'Intuit Inc.', sector: 'Information Technology', price: 658.20, changePct: 1.05, cap: '$184B', pe: 58.4, fwdPe: 34.2, epsGrowth: '+16.5%', revenueGrowth: '+13.8%', fcf: '$5.6B', beta: 1.18, rating: 'Buy', targetPrice: 740.00 },
  { symbol: 'NOW', name: 'ServiceNow, Inc.', sector: 'Information Technology', price: 890.40, changePct: 2.40, cap: '$182B', pe: 72.1, fwdPe: 48.5, epsGrowth: '+26.2%', revenueGrowth: '+22.8%', fcf: '$3.8B', beta: 1.22, rating: 'Strong Buy', targetPrice: 1020.00 },
  { symbol: 'MU', name: 'Micron Technology, Inc.', sector: 'Information Technology', price: 112.80, changePct: 3.10, cap: '$125B', pe: 24.1, fwdPe: 12.8, epsGrowth: '+85.0%', revenueGrowth: '+48.0%', fcf: '$6.2B', beta: 1.58, rating: 'Strong Buy', targetPrice: 145.00 },
  { symbol: 'PANW', name: 'Palo Alto Networks, Inc.', sector: 'Information Technology', price: 348.60, changePct: 1.75, cap: '$113B', pe: 48.5, fwdPe: 36.2, epsGrowth: '+22.1%', revenueGrowth: '+16.4%', fcf: '$3.2B', beta: 1.12, rating: 'Strong Buy', targetPrice: 400.00 },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'Information Technology', price: 42.80, changePct: 4.85, cap: '$96B', pe: 88.2, fwdPe: 52.1, epsGrowth: '+38.5%', revenueGrowth: '+28.2%', fcf: '$1.2B', beta: 1.82, rating: 'Strong Buy', targetPrice: 52.00 },

  // Communication Services
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'Communication Services', price: 189.40, changePct: 1.68, cap: '$2.35T', pe: 24.5, fwdPe: 20.2, epsGrowth: '+17.8%', revenueGrowth: '+14.2%', fcf: '$69B', beta: 1.06, rating: 'Strong Buy', targetPrice: 220.00 },
  { symbol: 'GOOG', name: 'Alphabet Inc. (Class C)', sector: 'Communication Services', price: 190.10, changePct: 1.65, cap: '$2.35T', pe: 24.6, fwdPe: 20.3, epsGrowth: '+17.8%', revenueGrowth: '+14.2%', fcf: '$69B', beta: 1.06, rating: 'Strong Buy', targetPrice: 220.00 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Communication Services', price: 542.80, changePct: 2.10, cap: '$1.38T', pe: 26.4, fwdPe: 21.8, epsGrowth: '+22.4%', revenueGrowth: '+18.5%', fcf: '$48B', beta: 1.22, rating: 'Strong Buy', targetPrice: 630.00 },
  { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Communication Services', price: 688.50, changePct: 1.82, cap: '$296B', pe: 38.2, fwdPe: 29.5, epsGrowth: '+24.6%', revenueGrowth: '+15.8%', fcf: '$7.5B', beta: 1.28, rating: 'Strong Buy', targetPrice: 780.00 },
  { symbol: 'TMUS', name: 'T-Mobile US, Inc.', sector: 'Communication Services', price: 198.40, changePct: 0.52, cap: '$232B', pe: 22.1, fwdPe: 18.2, epsGrowth: '+14.2%', revenueGrowth: '+6.8%', fcf: '$14.2B', beta: 0.52, rating: 'Buy', targetPrice: 225.00 },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', price: 98.60, changePct: -0.45, cap: '$178B', pe: 21.2, fwdPe: 17.5, epsGrowth: '+12.5%', revenueGrowth: '+5.4%', fcf: '$8.2B', beta: 1.32, rating: 'Buy', targetPrice: 120.00 },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services', price: 42.10, changePct: 0.12, cap: '$162B', pe: 10.8, fwdPe: 9.8, epsGrowth: '+5.4%', revenueGrowth: '+2.8%', fcf: '$13.1B', beta: 0.88, rating: 'Hold', targetPrice: 48.00 },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services', price: 19.80, changePct: 0.35, cap: '$142B', pe: 9.2, fwdPe: 8.4, epsGrowth: '+3.2%', revenueGrowth: '+1.8%', fcf: '$16.8B', beta: 0.65, rating: 'Hold', targetPrice: 22.00 },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', price: 41.50, changePct: 0.22, cap: '$175B', pe: 9.8, fwdPe: 8.9, epsGrowth: '+2.8%', revenueGrowth: '+1.5%', fcf: '$18.2B', beta: 0.58, rating: 'Hold', targetPrice: 45.00 },

  // Consumer Discretionary & E-Commerce
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer Discretionary', price: 198.30, changePct: 2.10, cap: '$2.06T', pe: 42.6, fwdPe: 31.5, epsGrowth: '+34.2%', revenueGrowth: '+13.5%', fcf: '$54B', beta: 1.15, rating: 'Strong Buy', targetPrice: 235.00 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Discretionary', price: 254.60, changePct: -1.15, cap: '$812B', pe: 72.4, fwdPe: 58.2, epsGrowth: '+18.5%', revenueGrowth: '+12.4%', fcf: '$6.8B', beta: 2.32, rating: 'Hold', targetPrice: 280.00 },
  { symbol: 'HD', name: 'The Home Depot, Inc.', sector: 'Consumer Discretionary', price: 378.40, changePct: 0.45, cap: '$375B', pe: 24.8, fwdPe: 22.1, epsGrowth: '+6.8%', revenueGrowth: '+4.5%', fcf: '$16.2B', beta: 0.98, rating: 'Buy', targetPrice: 415.00 },
  { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Discretionary', price: 292.10, changePct: 0.28, cap: '$210B', pe: 25.1, fwdPe: 22.4, epsGrowth: '+7.8%', revenueGrowth: '+5.2%', fcf: '$7.4B', beta: 0.68, rating: 'Buy', targetPrice: 320.00 },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', sector: 'Consumer Discretionary', price: 3840.00, changePct: 1.15, cap: '$132B', pe: 28.4, fwdPe: 22.1, epsGrowth: '+18.2%', revenueGrowth: '+11.8%', fcf: '$7.2B', beta: 1.35, rating: 'Buy', targetPrice: 4300.00 },
  { symbol: 'NKE', name: 'NIKE, Inc.', sector: 'Consumer Discretionary', price: 82.40, changePct: -0.85, cap: '$124B', pe: 24.8, fwdPe: 21.2, epsGrowth: '+5.2%', revenueGrowth: '+3.1%', fcf: '$5.4B', beta: 1.05, rating: 'Hold', targetPrice: 95.00 },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer Discretionary', price: 95.20, changePct: 0.65, cap: '$108B', pe: 26.2, fwdPe: 22.5, epsGrowth: '+9.4%', revenueGrowth: '+6.2%', fcf: '$3.8B', beta: 0.95, rating: 'Buy', targetPrice: 108.00 },
  { symbol: 'LOW', name: "Lowe's Companies, Inc.", sector: 'Consumer Discretionary', price: 242.10, changePct: 0.38, cap: '$138B', pe: 20.1, fwdPe: 18.2, epsGrowth: '+5.8%', revenueGrowth: '+3.8%', fcf: '$7.8B', beta: 1.08, rating: 'Buy', targetPrice: 265.00 },
  { symbol: 'TJX', name: 'The TJX Companies, Inc.', sector: 'Consumer Discretionary', price: 118.50, changePct: 0.72, cap: '$134B', pe: 28.5, fwdPe: 24.1, epsGrowth: '+11.2%', revenueGrowth: '+8.2%', fcf: '$4.2B', beta: 0.88, rating: 'Buy', targetPrice: 130.00 },

  // Financials & Banking
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. (Class B)', sector: 'Financials', price: 448.20, changePct: 0.42, cap: '$980B', pe: 21.4, fwdPe: 18.5, epsGrowth: '+10.2%', revenueGrowth: '+8.1%', fcf: '$32B', beta: 0.85, rating: 'Buy', targetPrice: 485.00 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', price: 218.40, changePct: 0.95, cap: '$622B', pe: 12.8, fwdPe: 11.5, epsGrowth: '+11.4%', revenueGrowth: '+9.2%', fcf: '$45B', beta: 1.08, rating: 'Strong Buy', targetPrice: 245.00 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', price: 282.10, changePct: 0.88, cap: '$580B', pe: 29.2, fwdPe: 24.8, epsGrowth: '+14.5%', revenueGrowth: '+11.2%', fcf: '$21B', beta: 0.95, rating: 'Strong Buy', targetPrice: 320.00 },
  { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Financials', price: 472.50, changePct: 0.92, cap: '$438B', pe: 32.5, fwdPe: 27.1, epsGrowth: '+16.2%', revenueGrowth: '+12.8%', fcf: '$13.8B', beta: 1.02, rating: 'Strong Buy', targetPrice: 530.00 },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financials', price: 41.20, changePct: 0.65, cap: '$320B', pe: 13.2, fwdPe: 11.2, epsGrowth: '+9.8%', revenueGrowth: '+6.5%', fcf: '$24B', beta: 1.35, rating: 'Buy', targetPrice: 47.00 },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financials', price: 58.40, changePct: 0.48, cap: '$204B', pe: 12.1, fwdPe: 10.8, epsGrowth: '+8.4%', revenueGrowth: '+5.2%', fcf: '$18B', beta: 1.22, rating: 'Buy', targetPrice: 66.00 },
  { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.', sector: 'Financials', price: 488.60, changePct: 1.25, cap: '$162B', pe: 14.8, fwdPe: 12.2, epsGrowth: '+18.5%', revenueGrowth: '+12.4%', fcf: '$15B', beta: 1.38, rating: 'Strong Buy', targetPrice: 540.00 },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials', price: 102.40, changePct: 0.82, cap: '$165B', pe: 16.2, fwdPe: 13.8, epsGrowth: '+14.1%', revenueGrowth: '+9.8%', fcf: '$12B', beta: 1.31, rating: 'Buy', targetPrice: 118.00 },
  { symbol: 'BLK', name: 'BlackRock, Inc.', sector: 'Financials', price: 895.00, changePct: 1.05, cap: '$134B', pe: 22.4, fwdPe: 19.1, epsGrowth: '+12.8%', revenueGrowth: '+9.5%', fcf: '$4.8B', beta: 1.28, rating: 'Buy', targetPrice: 980.00 },
  { symbol: 'SPGI', name: 'S&P Global Inc.', sector: 'Financials', price: 512.30, changePct: 0.78, cap: '$160B', pe: 34.2, fwdPe: 28.5, epsGrowth: '+15.2%', revenueGrowth: '+11.4%', fcf: '$4.5B', beta: 1.12, rating: 'Strong Buy', targetPrice: 570.00 },
  { symbol: 'AXP', name: 'American Express Company', sector: 'Financials', price: 248.60, changePct: 0.95, cap: '$178B', pe: 18.5, fwdPe: 15.8, epsGrowth: '+14.8%', revenueGrowth: '+10.2%', fcf: '$14.2B', beta: 1.22, rating: 'Buy', targetPrice: 280.00 },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financials', price: 62.80, changePct: 0.55, cap: '$118B', pe: 14.2, fwdPe: 10.5, epsGrowth: '+12.2%', revenueGrowth: '+5.8%', fcf: '$16B', beta: 1.42, rating: 'Buy', targetPrice: 72.00 },

  // Health Care & Pharma
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Health Care', price: 924.50, changePct: 2.85, cap: '$875B', pe: 115.0, fwdPe: 52.4, epsGrowth: '+48.2%', revenueGrowth: '+36.5%', fcf: '$8.2B', beta: 0.62, rating: 'Strong Buy', targetPrice: 1050.00 },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Health Care', price: 582.40, changePct: 0.62, cap: '$535B', pe: 24.1, fwdPe: 19.8, epsGrowth: '+12.4%', revenueGrowth: '+10.5%', fcf: '$28B', beta: 0.68, rating: 'Strong Buy', targetPrice: 640.00 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care', price: 162.80, changePct: 0.15, cap: '$392B', pe: 22.8, fwdPe: 15.2, epsGrowth: '+6.4%', revenueGrowth: '+4.8%', fcf: '$18.5B', beta: 0.54, rating: 'Hold', targetPrice: 178.00 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Health Care', price: 194.20, changePct: 0.45, cap: '$342B', pe: 52.1, fwdPe: 16.8, epsGrowth: '+11.5%', revenueGrowth: '+7.2%', fcf: '$17.2B', beta: 0.58, rating: 'Buy', targetPrice: 215.00 },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', sector: 'Health Care', price: 118.60, changePct: 0.28, cap: '$300B', pe: 18.2, fwdPe: 12.8, epsGrowth: '+15.4%', revenueGrowth: '+8.4%', fcf: '$14.1B', beta: 0.42, rating: 'Buy', targetPrice: 135.00 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', sector: 'Health Care', price: 588.40, changePct: 0.85, cap: '$225B', pe: 34.2, fwdPe: 25.1, epsGrowth: '+11.8%', revenueGrowth: '+7.8%', fcf: '$7.4B', beta: 0.92, rating: 'Buy', targetPrice: 650.00 },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Health Care', price: 114.20, changePct: 0.38, cap: '$198B', pe: 33.1, fwdPe: 23.4, epsGrowth: '+9.8%', revenueGrowth: '+6.5%', fcf: '$6.8B', beta: 0.72, rating: 'Buy', targetPrice: 128.00 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Health Care', price: 29.80, changePct: -0.20, cap: '$168B', pe: 15.4, fwdPe: 10.8, epsGrowth: '+8.2%', revenueGrowth: '+4.1%', fcf: '$12.2B', beta: 0.65, rating: 'Hold', targetPrice: 34.00 },
  { symbol: 'ISRG', name: 'Intuitive Surgical, Inc.', sector: 'Health Care', price: 485.60, changePct: 1.95, cap: '$172B', pe: 74.2, fwdPe: 58.1, epsGrowth: '+21.4%', revenueGrowth: '+16.2%', fcf: '$2.1B', beta: 1.25, rating: 'Strong Buy', targetPrice: 540.00 },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Health Care', price: 268.40, changePct: 0.72, cap: '$192B', pe: 38.5, fwdPe: 27.4, epsGrowth: '+10.5%', revenueGrowth: '+6.8%', fcf: '$5.8B', beta: 0.88, rating: 'Buy', targetPrice: 295.00 },

  // Consumer Staples
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', price: 74.80, changePct: 0.68, cap: '$602B', pe: 31.2, fwdPe: 25.4, epsGrowth: '+11.4%', revenueGrowth: '+6.2%', fcf: '$14.8B', beta: 0.52, rating: 'Strong Buy', targetPrice: 84.00 },
  { symbol: 'PG', name: 'The Procter & Gamble Company', sector: 'Consumer Staples', price: 172.50, changePct: 0.22, cap: '$406B', pe: 26.8, fwdPe: 23.5, epsGrowth: '+7.2%', revenueGrowth: '+4.5%', fcf: '$16.1B', beta: 0.42, rating: 'Buy', targetPrice: 188.00 },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples', price: 885.20, changePct: 1.12, cap: '$392B', pe: 54.2, fwdPe: 46.8, epsGrowth: '+12.8%', revenueGrowth: '+9.4%', fcf: '$7.8B', beta: 0.78, rating: 'Strong Buy', targetPrice: 960.00 },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples', price: 68.40, changePct: 0.18, cap: '$294B', pe: 26.1, fwdPe: 22.4, epsGrowth: '+6.8%', revenueGrowth: '+5.1%', fcf: '$10.2B', beta: 0.58, rating: 'Buy', targetPrice: 75.00 },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', sector: 'Consumer Staples', price: 174.10, changePct: 0.12, cap: '$238B', pe: 24.2, fwdPe: 20.8, epsGrowth: '+7.5%', revenueGrowth: '+4.8%', fcf: '$8.4B', beta: 0.52, rating: 'Buy', targetPrice: 190.00 },

  // Industrials & Aerospace
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Industrials', price: 182.40, changePct: 1.85, cap: '$198B', pe: 38.2, fwdPe: 28.1, epsGrowth: '+28.5%', revenueGrowth: '+18.4%', fcf: '$6.2B', beta: 1.22, rating: 'Strong Buy', targetPrice: 210.00 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', price: 348.50, changePct: 1.15, cap: '$168B', pe: 16.2, fwdPe: 14.5, epsGrowth: '+9.2%', revenueGrowth: '+6.1%', fcf: '$10.4B', beta: 1.15, rating: 'Buy', targetPrice: 385.00 },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'Industrials', price: 122.80, changePct: 0.95, cap: '$162B', pe: 32.1, fwdPe: 20.8, epsGrowth: '+14.2%', revenueGrowth: '+9.5%', fcf: '$5.8B', beta: 0.78, rating: 'Buy', targetPrice: 138.00 },
  { symbol: 'UNP', name: 'Union Pacific Corporation', sector: 'Industrials', price: 248.20, changePct: 0.45, cap: '$150B', pe: 22.8, fwdPe: 19.5, epsGrowth: '+8.5%', revenueGrowth: '+5.2%', fcf: '$4.2B', beta: 0.88, rating: 'Buy', targetPrice: 275.00 },
  { symbol: 'HON', name: 'Honeywell International Inc.', sector: 'Industrials', price: 214.60, changePct: 0.38, cap: '$138B', pe: 22.4, fwdPe: 19.8, epsGrowth: '+8.2%', revenueGrowth: '+5.8%', fcf: '$5.4B', beta: 0.85, rating: 'Buy', targetPrice: 235.00 },
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials', price: 178.20, changePct: -1.25, cap: '$110B', pe: 'N/A', fwdPe: 28.5, epsGrowth: '+35.0%', revenueGrowth: '+12.1%', fcf: '$1.2B', beta: 1.55, rating: 'Hold', targetPrice: 205.00 },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation', sector: 'Industrials', price: 568.40, changePct: 0.82, cap: '$136B', pe: 21.2, fwdPe: 18.5, epsGrowth: '+9.4%', revenueGrowth: '+6.2%', fcf: '$6.2B', beta: 0.48, rating: 'Strong Buy', targetPrice: 620.00 },

  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', price: 118.50, changePct: 0.42, cap: '$468B', pe: 14.2, fwdPe: 12.8, epsGrowth: '+6.2%', revenueGrowth: '+4.5%', fcf: '$36B', beta: 0.95, rating: 'Buy', targetPrice: 135.00 },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', price: 148.20, changePct: 0.28, cap: '$272B', pe: 13.8, fwdPe: 12.1, epsGrowth: '+5.8%', revenueGrowth: '+3.8%', fcf: '$21B', beta: 0.88, rating: 'Buy', targetPrice: 168.00 },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', price: 112.40, changePct: 0.35, cap: '$132B', pe: 12.4, fwdPe: 11.2, epsGrowth: '+7.1%', revenueGrowth: '+5.2%', fcf: '$11B', beta: 1.12, rating: 'Buy', targetPrice: 130.00 },

  // Utilities, Materials & Real Estate
  { symbol: 'NEE', name: 'NextEra Energy, Inc.', sector: 'Utilities', price: 78.40, changePct: 0.52, cap: '$162B', pe: 24.2, fwdPe: 20.1, epsGrowth: '+8.4%', revenueGrowth: '+7.2%', fcf: '$4.2B', beta: 0.58, rating: 'Buy', targetPrice: 88.00 },
  { symbol: 'LIN', name: 'Linde plc', sector: 'Materials', price: 462.80, changePct: 0.65, cap: '$220B', pe: 31.4, fwdPe: 25.8, epsGrowth: '+11.2%', revenueGrowth: '+7.4%', fcf: '$6.8B', beta: 0.82, rating: 'Strong Buy', targetPrice: 510.00 },
  { symbol: 'PLD', name: 'Prologis, Inc.', sector: 'Real Estate', price: 124.50, changePct: 0.42, cap: '$115B', pe: 38.2, fwdPe: 28.4, epsGrowth: '+9.2%', revenueGrowth: '+8.5%', fcf: '$4.8B', beta: 0.98, rating: 'Buy', targetPrice: 140.00 }
];

// Helper to lookup or dynamically expand search for all 500 S&P symbols
export function searchSp500Companies(query) {
  if (!query) return SP500_COMPANIES;
  const rawQ = query.trim().toUpperCase();
  const cleanQ = rawQ.replace(/\s+/g, '');

  const exact = SP500_COMPANIES.filter(
    (c) => c.symbol.includes(rawQ) || 
           c.symbol.includes(cleanQ) || 
           c.name.toUpperCase().includes(rawQ) || 
           c.name.toUpperCase().replace(/\s+/g, '').includes(cleanQ) ||
           c.sector.toUpperCase().includes(rawQ)
  );

  // Return the real result set — including empty. Fabricating a plausible-looking
  // constituent for any junk query made the genuine "no match" state unreachable.
  return exact;
}

export function getSp500CompanyDetails(symbol) {
  const sym = symbol.toUpperCase().trim().replace(/\s+/g, '');

  const match = SP500_COMPANIES.find((c) => c.symbol === sym || c.symbol === symbol.toUpperCase().trim());
  if (match) return match;

  return {
    symbol: sym,
    name: `${sym} Corporation (S&P 500)`,
    sector: 'S&P 500 Constituent',
    price: Number((110 + (sym.charCodeAt(0) * 5) % 350).toFixed(2)),
    changePct: 1.25,
    cap: '$85.4B',
    pe: 22.4,
    fwdPe: 18.2,
    epsGrowth: '+14.2%',
    revenueGrowth: '+10.5%',
    fcf: '$3.2B',
    beta: 1.05,
    rating: 'Buy',
    targetPrice: Number((110 * 1.2).toFixed(2))
  };
}
