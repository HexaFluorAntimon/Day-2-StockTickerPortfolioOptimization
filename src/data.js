// Data Service: Twelve Data API, NewsAPI Live Market News, S&P 500 Fundamentals & AI Synthesis

import { getSp500CompanyDetails } from './sp500.js';
import { fetchNewsApiHeadlines } from './newsapi.js';

export const POPULAR_TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Semiconductors', price: 148.25, changePct: 3.42, cap: '$3.64T', pe: 48.2 },
  { symbol: 'AAPL', name: 'Apple Inc', sector: 'Consumer Electronics', price: 238.90, changePct: 0.85, cap: '$3.62T', pe: 34.1 },
  { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Software & Cloud', price: 462.10, changePct: 1.25, cap: '$3.43T', pe: 36.8 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Internet & AI', price: 189.40, changePct: 1.68, cap: '$2.35T', pe: 24.5 },
  { symbol: 'TSLA', name: 'Tesla Inc', sector: 'EV & Robotics', price: 254.60, changePct: -1.15, cap: '$812B', pe: 72.4 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'E-Commerce & Cloud', price: 198.30, changePct: 2.10, cap: '$2.06T', pe: 42.6 },
  { symbol: 'PLTR', name: 'Palantir Tech', sector: 'AI & Enterprise', price: 42.80, changePct: 4.85, cap: '$96B', pe: 88.2 },
  { symbol: 'LLY', name: 'Eli Lilly & Co', sector: 'Health Care', price: 924.50, changePct: 2.85, cap: '$875B', pe: 115.0 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', price: 218.40, changePct: 0.95, cap: '$622B', pe: 12.8 }
];

/**
 * Fetch daily bars from Twelve Data or fall back to realistic generated 2026 bars
 */
// Records how the most recent price series was obtained, so the UI can be honest about
// whether the user is looking at live vendor data or the generated model dataset.
let lastDataSource = { kind: 'model', detail: 'No Twelve Data key configured' };

export function getLastDataSource() {
  return lastDataSource;
}

export async function fetchStockData(ticker, apiKey) {
  if (apiKey && apiKey.trim().length > 3) {
    try {
      // 400 daily bars so a real 200-period SMA can be computed, not just approximated.
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(ticker)}&interval=1day&outputsize=400&apikey=${apiKey.trim()}`;
      const response = await fetch(url);
      const body = await response.text();
      let raw;
      try {
        raw = JSON.parse(body);
      } catch {
        throw new Error('Twelve Data returned non-JSON output');
      }

      if (raw && raw.status === 'error') {
        throw new Error(raw.message || 'Twelve Data error');
      }

      if (raw && raw.values && raw.values.length > 0) {
        lastDataSource = { kind: 'live', detail: 'Twelve Data' };
        return raw.values
          .map((b) => ({
            date: b.datetime,
            open: Number(b.open),
            high: Number(b.high),
            low: Number(b.low),
            close: Number(b.close),
            volume: Number(b.volume)
          }))
          .sort((a, b) => (a.date < b.date ? -1 : 1));
      }
      lastDataSource = { kind: 'model', detail: 'Twelve Data returned no bars' };
    } catch (err) {
      console.warn(`Twelve Data live fetch failed for ${ticker}, using 2026 model dataset: ${err.message}`);
      lastDataSource = { kind: 'model', detail: err.message };
    }
  } else {
    lastDataSource = { kind: 'model', detail: 'No Twelve Data key configured' };
  }

  // Generate realistic 2026 dataset for ticker
  return generateSyntheticData(ticker);
}

/**
 * Generate ~18 months of realistic daily trading bars for 2026.
 *
 * Long enough that a genuine 200-period SMA (and therefore the golden/death-cross
 * signal) can be computed rather than falling back to the latest price. The walk is
 * rescaled at the end so the final close lands exactly on the reference price, which
 * keeps the hero quote, the analyst target and the upside percentage consistent.
 */
function generateSyntheticData(ticker) {
  const symbol = ticker.toUpperCase();
  const details = getSp500CompanyDetails(symbol);
  const found = POPULAR_TICKERS.find((t) => t.symbol === symbol);

  const basePrice = found ? found.price : details.price;
  const volatility = symbol === 'BTC' ? 0.035 : symbol === 'NVDA' ? 0.025 : 0.015;
  const drift = 0.0006; // gentle upward bias for the 2026 AI expansion cycle

  const CALENDAR_DAYS = 560; // ≈ 400 weekday bars
  const bars = [];
  const today = new Date('2026-08-03'); // Current platform time constraint in 2026

  let currentClose = basePrice * 0.72; // start well below so the trend has room to run

  for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    // Skip weekends
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split('T')[0];

    // Zero-mean noise plus explicit drift, so the trend is controlled by `drift` alone
    const randomChange = (Math.random() - 0.5) * volatility;
    currentClose = currentClose * (1 + randomChange + drift);

    const dayHigh = currentClose * (1 + Math.random() * (volatility * 0.8));
    const dayLow = currentClose * (1 - Math.random() * (volatility * 0.8));
    const dayOpen = dayLow + Math.random() * (dayHigh - dayLow);
    const volume = Math.floor(15000000 + Math.random() * 35000000);

    bars.push({
      date: dateStr,
      open: dayOpen,
      high: dayHigh,
      low: dayLow,
      close: currentClose,
      volume
    });
  }

  // Normalise so the most recent close matches the reference price exactly.
  const finalClose = bars[bars.length - 1].close;
  const scale = finalClose > 0 ? basePrice / finalClose : 1;

  return bars.map((b) => ({
    date: b.date,
    open: Number((b.open * scale).toFixed(2)),
    high: Number((b.high * scale).toFixed(2)),
    low: Number((b.low * scale).toFixed(2)),
    close: Number((b.close * scale).toFixed(2)),
    volume: b.volume
  }));
}

/**
 * Get Fundamentals & S&P 500 Metrics for ticker
 */
export function getCompanyFundamentals(ticker, latestPrice) {
  const details = getSp500CompanyDetails(ticker);

  const price = latestPrice || details.price;
  const targetVal = details.targetPrice || (price * 1.20);
  const target = `$${Number(targetVal).toFixed(2)}`;
  const upsideVal = ((targetVal - price) / price) * 100;
  const upside = `${upsideVal >= 0 ? '+' : ''}${upsideVal.toFixed(1)}%`;

  return {
    symbol: details.symbol,
    name: details.name,
    sector: details.sector,
    marketCap: details.cap,
    peRatio: details.pe,
    forwardPe: details.fwdPe,
    epsGrowth2026: details.epsGrowth || '+18.4%',
    revenueGrowth: `${details.revenueGrowth || '+12.5%'} YoY`,
    freeCashFlow: details.fcf || '$12.4B',
    beta: details.beta || 1.05,
    targetPrice: target,
    upsidePct: upside,
    analystRating: details.rating || 'Strong Buy',
    buyCount: details.rating === 'Strong Buy' ? 34 : 22,
    holdCount: 6,
    sellCount: 1
  };
}

/**
 * Escape HTML-significant characters so untrusted strings (news headlines, model
 * output, user-typed tickers) can never inject markup when interpolated into innerHTML.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert markdown (headers, bold, bullets, dividers) into HTML.
 *
 * The input is escaped first, so model output cannot inject markup. Presentation is
 * carried by semantic class names styled in style.css rather than inline utility
 * classes, so the research note follows the theme automatically.
 */
export function formatMarkdownToHtml(text) {
  if (!text) return '';

  let html = escapeHtml(text.trim());

  // 1. Clean out top-level duplicate headers like "# NVDA 2026 Research Synthesis"
  html = html.replace(/^#\s+[A-Z0-9\s&()]+\s+2026\s+Research\s+Synthesis.*$/gim, '');

  // 2. Markdown headers
  html = html.replace(/^### (.*$)/gim, '<h5 class="ai-h3">$1</h5>');
  html = html.replace(/^## (.*$)/gim, '<h4 class="ai-h2">$1</h4>');
  html = html.replace(/^# (.*$)/gim, '<h3 class="ai-h1">$1</h3>');

  // 3. Horizontal rule
  html = html.replace(/^\s*---\s*$/gm, '<hr class="ai-rule" />');

  // 4. Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="ai-strong">$1</strong>');

  // 5. Bullets
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ai-li">$1</li>');
  html = html.replace(/(<li class="ai-li">[\s\S]*?<\/li>)(?:\s*(?=<li class="ai-li">))?/g, '$1');
  html = html.replace(/(?:<li class="ai-li">[\s\S]*?<\/li>\s*)+/g, (match) => `<ul class="ai-list">${match.trim()}</ul>`);

  // 6. Paragraphs
  const parts = html.split(/\n\s*\n/);
  if (parts.length > 1) {
    html = parts
      .map((p) => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<hr')) return p;
        return `<p class="ai-p">${p}</p>`;
      })
      .join('');
  } else {
    html = html.replace(/\n/g, '<br />');
  }

  return html;
}

/**
 * Generate or fetch GenAI Research Synthesis Note via OpenRouter API
 */
export async function getAiResearchSynthesis(ticker, priceData, metrics, openRouterKey, promptPreset = 'General') {
  if (openRouterKey && openRouterKey.trim().length > 5) {
    try {
      const first = priceData[0];
      const latest = priceData[priceData.length - 1];
      const pctChange = ((latest.close - first.close) / first.close) * 100;

      const summary = `${ticker} trading data 2026: Start date ${first.date} at $${first.close.toFixed(2)}, Latest date ${latest.date} at $${latest.close.toFixed(2)} (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%). High: $${metrics.high52.toFixed(2)}, Low: $${metrics.low52.toFixed(2)}. Preset Focus: ${promptPreset}.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-5',
          max_tokens: 1200,
          messages: [
            {
              role: 'system',
              content: 'You are an elite Wall Street quantitative portfolio strategist in 2026. Provide a clean, beautifully formatted financial synthesis without continuous unparsed single-line markdown.'
            },
            {
              role: 'user',
              content: `${summary}\n\nWrite a tailored 2026 research report focused specifically on ${promptPreset} for ${ticker}. Use short, readable paragraphs and clean bold highlights.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return parseAiResponse(ticker, text, metrics, promptPreset);
      }
    } catch (err) {
      console.warn('OpenRouter call failed, generating 2026 GenAI synthesis offline:', err);
    }
  }

  // High-fidelity fallback GenAI Financial Synthesis
  return generateDefaultAiSynthesis(ticker, priceData, metrics, promptPreset);
}

function parseAiResponse(ticker, text, metrics, preset = 'General') {
  return {
    rawText: text,
    sentimentScore: 86,
    sentimentLabel: `${preset} Conviction`,
    summaryParagraph: text,
    keyDrivers: [
      'Next-gen AI inference infrastructure rollout driving double-digit margin expansion',
      'Accelerating enterprise cloud ARR with 120%+ net retention rate',
      'Strong free-cash-flow yield supporting buybacks & strategic M&A'
    ],
    risks: [
      'Potential supply chain friction in high-bandwidth memory chips',
      'Macro rate volatility impacting tech equity multiples'
    ],
    rating: 'Outperform (2026 Conviction List)'
  };
}

function generateDefaultAiSynthesis(ticker, priceData, metrics, preset = 'General') {
  const symbol = ticker.toUpperCase();
  // Fundamentals live on the S&P 500 constituent record, not on the price-derived
  // metrics object — reading them off `metrics` renders "undefined" in the note.
  const details = getSp500CompanyDetails(symbol);
  const isUp = metrics.dayPctChange >= 0;
  const price = metrics.latestPrice.toFixed(2);
  const pe = details.pe;
  const fwdPe = details.fwdPe;
  const fcf = details.fcf; // already formatted with a leading "$"
  const revenueGrowth = details.revenueGrowth;
  const epsGrowth = details.epsGrowth;
  const high = metrics.high52.toFixed(2);
  const low = metrics.low52.toFixed(2);

  // Generate tailored paragraph based on selected focus category
  let summaryParagraph = '';
  let sentimentScore = isUp ? 84 : 68;
  let sentimentLabel = 'Strong Bullish Expansion';

  if (preset === 'Valuation') {
    sentimentScore = 88;
    sentimentLabel = 'Deep Value & FCF Outperform';
    summaryParagraph = `## Valuation & Discounted Cash Flow Analysis

**${symbol} Valuation Thesis (2026):**
Trading at **$${price}**, ${symbol} presents an attractive risk/reward profile with a **Trailing P/E of ${pe}x** and a compressed **Forward P/E of ${fwdPe}x**. Operating cash conversion remains exceptionally strong with **${fcf} in annual Free Cash Flow**, enabling ongoing capital return via share repurchases and balance sheet deleveraging.

### Key Multiples & Fair Value Matrix
- **Forward P/E:** **${fwdPe}x** (vs. S&P 500 peer average of 28.5x)
- **Free Cash Flow:** **${fcf}** with a 4.2% FCF Yield
- **DCF Fair Value Estimate:** **$${(metrics.latestPrice * 1.18).toFixed(2)}** representing a **+18.0% upside margin of safety**.`;
  } else if (preset === 'Earnings') {
    sentimentScore = 86;
    sentimentLabel = 'Earnings Beat Catalyst';
    summaryParagraph = `## 2026 Earnings & Revenue Growth Catalyst

**${symbol} H2 2026 Earnings Outlook:**
${symbol} is positioned for a strong quarterly earnings print. Consensus estimates model **Revenue Growth at ${revenueGrowth} YoY** and **EPS Growth at ${epsGrowth}**, anchored by multi-quarter enterprise contract wins and sustained backlog execution.

### Quarterly Catalyst Drivers
- **Revenue Trajectory:** **${revenueGrowth}** year-over-year surge
- **EPS Trajectory:** **${epsGrowth}** bottom-line expansion
- **Beat Probability:** **High Confidence** driven by +4.8% average historical surprise margin.`;
  } else if (preset === 'Technical') {
    sentimentScore = isUp ? 85 : 72;
    sentimentLabel = 'Technical Breakout Alert';
    summaryParagraph = `## Technical Market Structure & Trend Breakdown

**${symbol} Chart Pattern & Support/Resistance Setup:**
${symbol} is holding a strong structural bull trend at **$${price}**. The 52-week trading channel spans from a low of **$${low}** to a high of **$${high}**. Both 50-day and 200-day moving averages reflect active institutional accumulation.

### Key Technical Levels
- **Current Price:** **$${price}** (${isUp ? '+' : ''}${metrics.dayPctChange.toFixed(2)}% today)
- **Breakout Target:** **$${high}** (52-Week High Resistance Zone)
- **Structural Support Floor:** **$${(metrics.latestPrice * 0.93).toFixed(2)}** (50D SMA Demand Zone).`;
  } else { // General
    sentimentScore = isUp ? 84 : 66;
    sentimentLabel = '2026 Conviction Bull Thesis';
    summaryParagraph = `## General 2026 Market Outlook & Strategy

**${symbol} Comprehensive 2026 Overview:**
${symbol} exhibits high-conviction market positioning in Q3 2026, trading near **$${price}** (${isUp ? '+' : ''}${metrics.dayPctChange.toFixed(2)}% today). Supported by **${revenueGrowth} Revenue Growth** and **${fcf} in Free Cash Flow**, the company maintains a dominant competitive moat across its core industry verticals.

### 2026 Macro Trajectory
- **52-Week High Re-Test Target:** **$${high}**
- **52-Week Floor Base:** **$${low}**
- **Overall Rating:** **Top 2026 Portfolio Conviction Pick**.`;
  }

  const driversMap = {
    NVDA: [
      'Rubin GPU architecture production ramp exceeding yield targets across top tier hyperscalers',
      'Data center networking expansion driving 40%+ sequential software margin improvement',
      'Enterprise autonomous agent hardware demand creating multi-quarter backlog'
    ],
    AAPL: [
      'Apple Intelligence 2.0 subscription tier monetization expanding software ARPU',
      'Vision Pro Gen 2 enterprise ecosystem adoption surging in healthcare and engineering',
      'Record services revenue growth offsetting smartphone market maturity'
    ],
    BTC: [
      'Institutional sovereign treasury reserve allocations following landmark global legislation',
      'Post-halving supply shock interacting with record spot ETF inflows',
      'DeFi L2 scaling throughput unlocking new institutional yield products'
    ]
  };

  const drivers = driversMap[symbol] || [
    `Accelerating 2026 revenue trajectory fueled by direct enterprise AI deployment`,
    `Robust balance sheet with $12B+ net cash position providing downside protection`,
    `Expanding operating margins through automated AI workflow integration`
  ];

  return {
    sentimentScore,
    sentimentLabel,
    summaryParagraph,
    keyDrivers: drivers,
    risks: [
      'Macro liquidity shifts and central bank interest rate recalibration',
      'Geopolitical supply chain bottleneck exposure in key tech hardware hubs'
    ],
    rating: 'Top 2026 Conviction Pick'
  };
}

/**
 * Fetch live news via NewsAPI or return curated market headlines
 */
export async function get2026MarketNews(ticker, newsApiKey) {
  const symbol = ticker.toUpperCase();

  if (newsApiKey && newsApiKey.trim().length > 3) {
    try {
      const articles = await fetchNewsApiHeadlines(symbol, newsApiKey);
      if (articles && articles.length > 0) {
        return articles.map(art => ({
          title: art.title,
          source: art.source,
          time: art.publishedAt,
          impact: art.sentiment,
          snippet: art.description,
          url: art.url,
          isLive: true
        }));
      }
    } catch (err) {
      console.warn('NewsAPI fetch error, falling back to curated feed:', err.message);
    }
  }

  return [
    {
      title: `${symbol} Q2 2026 Earnings Beat: Revenue Up 24% YoY Driven by Next-Gen AI Demand`,
      source: 'Bloomberg Terminal',
      time: '22m ago',
      impact: 'Bullish',
      snippet: 'Analysts highlight record gross margins and expanded multi-year enterprise backlog as key catalysts for 2026 valuation expansion.',
      url: '#'
    },
    {
      title: `Global Tech Spending Revised Upward to $5.2 Trillion for 2026: Semiconductor & Cloud Outperform`,
      source: 'Reuters Finance',
      time: '1h ago',
      impact: 'Bullish',
      snippet: 'Enterprise hardware & software budgets prioritize real-time AI agents and high-throughput datacenters.',
      url: '#'
    },
    {
      title: `Federal Reserve Signals Neutral Rate Stabilization as Inflation Cooled to 2.1%`,
      source: 'Wall Street Journal',
      time: '3h ago',
      impact: 'Neutral',
      snippet: 'Macro conditions remain favorable for growth equities and digital assets heading into H2 2026.',
      url: '#'
    }
  ];
}
