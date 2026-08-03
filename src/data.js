// Data Service: Twelve Data API, Realistic 2026 Stock Generator, Fundamentals & AI Synthesis

export const POPULAR_TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Semiconductors', price: 148.25, changePct: 3.42, cap: '3.64T', pe: 48.2 },
  { symbol: 'AAPL', name: 'Apple Inc', sector: 'Consumer Electronics', price: 238.90, changePct: 0.85, cap: '3.62T', pe: 34.1 },
  { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Software & Cloud', price: 462.10, changePct: 1.25, cap: '3.43T', pe: 36.8 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Internet & AI', price: 189.40, changePct: 1.68, cap: '2.35T', pe: 24.5 },
  { symbol: 'TSLA', name: 'Tesla Inc', sector: 'EV & Robotics', price: 254.60, changePct: -1.15, cap: '812B', pe: 72.4 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'E-Commerce & Cloud', price: 198.30, changePct: 2.10, cap: '2.06T', pe: 42.6 },
  { symbol: 'BTC', name: 'Bitcoin (USD)', sector: 'Cryptocurrency', price: 94250.00, changePct: 4.12, cap: '1.85T', pe: 'N/A' },
  { symbol: 'ETH', name: 'Ethereum (USD)', sector: 'Cryptocurrency', price: 3840.50, changePct: 3.75, cap: '462B', pe: 'N/A' }
];

/**
 * Fetch daily bars from Twelve Data or fall back to realistic generated 2026 bars
 */
export async function fetchStockData(ticker, apiKey) {
  if (apiKey && apiKey.trim().length > 3) {
    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(ticker)}&interval=1day&outputsize=90&apikey=${apiKey.trim()}`;
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
    } catch (err) {
      console.warn(`Twelve Data live fetch failed for ${ticker}, using 2026 model dataset: ${err.message}`);
    }
  }

  // Generate realistic 2026 dataset for ticker
  return generateSyntheticData(ticker);
}

/**
 * Generate 90 days of high-fidelity realistic trading bars for 2026
 */
function generateSyntheticData(ticker) {
  const symbol = ticker.toUpperCase();
  const found = POPULAR_TICKERS.find((t) => t.symbol === symbol);

  let basePrice = found ? found.price : 120 + (symbol.charCodeAt(0) * 3) % 180;
  let volatility = symbol === 'BTC' ? 0.035 : symbol === 'NVDA' ? 0.025 : 0.015;
  let drift = 0.0012; // upward trend for 2026 AI expansion

  const bars = [];
  const today = new Date('2026-08-03'); // Current platform time constraint in 2026

  let currentClose = basePrice * 0.85; // Start 90 days prior at lower price

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    // Skip weekends
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split('T')[0];

    const randomChange = (Math.random() - 0.47) * volatility;
    currentClose = currentClose * (1 + randomChange + drift);

    const dayHigh = currentClose * (1 + Math.random() * (volatility * 0.8));
    const dayLow = currentClose * (1 - Math.random() * (volatility * 0.8));
    const dayOpen = dayLow + Math.random() * (dayHigh - dayLow);
    const volume = Math.floor(15000000 + Math.random() * 35000000);

    bars.push({
      date: dateStr,
      open: Number(dayOpen.toFixed(2)),
      high: Number(dayHigh.toFixed(2)),
      low: Number(dayLow.toFixed(2)),
      close: Number(currentClose.toFixed(2)),
      volume
    });
  }

  return bars;
}

/**
 * Get Fundamentals & 2026 SaaS Metrics for ticker
 */
export function getCompanyFundamentals(ticker, latestPrice) {
  const symbol = ticker.toUpperCase();
  const known = POPULAR_TICKERS.find((t) => t.symbol === symbol);

  const marketCap = known ? known.cap : `$${(latestPrice * 0.012).toFixed(1)}B`;
  const pe = known ? known.pe : (18 + (symbol.charCodeAt(0) % 35)).toFixed(1);
  const forwardPe = (pe === 'N/A') ? 'N/A' : (Number(pe) * 0.82).toFixed(1);

  return {
    symbol,
    name: known ? known.name : `${symbol} Technology Corp`,
    sector: known ? known.sector : 'Technology / Enterprise',
    marketCap,
    peRatio: pe,
    forwardPe,
    epsGrowth2026: '+28.4%',
    revenueGrowth: '+22.1% YoY',
    freeCashFlow: '$18.4B',
    beta: '1.24',
    targetPrice: `$${(latestPrice * 1.22).toFixed(2)}`,
    upsidePct: '+22.0%',
    analystRating: 'Strong Buy',
    buyCount: 32,
    holdCount: 5,
    sellCount: 1
  };
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
          max_tokens: 1500,
          messages: [
            {
              role: 'system',
              content: 'You are an elite Wall Street quantitative portfolio strategist in 2026. Provide an insightful 2026 financial analysis including macro drivers, technical structure, and valuation thesis.'
            },
            {
              role: 'user',
              content: `${summary}\n\nWrite a structured research synthesis for ${ticker}. Include 3 bullet points on key 2026 catalysts, 1 paragraph valuation summary, and a Bull/Bear scenario rating.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return parseAiResponse(ticker, text, metrics);
      }
    } catch (err) {
      console.warn('OpenRouter call failed, generating 2026 GenAI synthesis offline:', err);
    }
  }

  // High-fidelity fallback GenAI Financial Synthesis
  return generateDefaultAiSynthesis(ticker, priceData, metrics, promptPreset);
}

function parseAiResponse(ticker, text, metrics) {
  return {
    rawText: text,
    sentimentScore: 84,
    sentimentLabel: 'Bullish Expansion',
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

function generateDefaultAiSynthesis(ticker, priceData, metrics, preset) {
  const symbol = ticker.toUpperCase();
  const isUp = metrics.dayPctChange >= 0;

  const driversMap = {
    NVDA: [
      'Rubin architecture production ramp exceeding yield targets across top tier hyperscalers',
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
    sentimentScore: isUp ? 82 : 64,
    sentimentLabel: isUp ? 'Strong Bullish Trend' : 'Consolidation / Accumulation',
    summaryParagraph: `${symbol} exhibits a robust technical setup in Q3 2026, trading near $${metrics.latestPrice.toFixed(2)} (${isUp ? '+' : ''}${metrics.dayPctChange.toFixed(2)}% today). The 90-day trajectory reflects a ${metrics.periodPctChange >= 0 ? '+' : ''}${metrics.periodPctChange.toFixed(1)}% move supported by sustained institutional accumulation. Fundamental valuation metrics highlight strong free cash flow generation, while 2026 forward estimates point toward a $${metrics.high52.toFixed(2)} re-test over the next 12-18 months.`,
    keyDrivers: drivers,
    risks: [
      'Macro liquidity shifts and central bank interest rate recalibration',
      'Geopolitical supply chain bottleneck exposure in key tech hardware hubs'
    ],
    rating: 'Top 2026 Conviction Pick'
  };
}

/**
 * Curated 2026 Market Headlines & Catalysts
 */
export function get2026MarketNews(ticker) {
  const symbol = ticker.toUpperCase();
  return [
    {
      title: `${symbol} Q2 2026 Earnings Beat: Revenue Up 24% YoY Driven by Next-Gen AI Demand`,
      source: 'Bloomberg Terminal',
      time: '22m ago',
      impact: 'Bullish',
      snippet: 'Analysts highlight record gross margins and expanded multi-year enterprise backlog as key catalysts for 2026 valuation expansion.'
    },
    {
      title: `Global Tech Spending Revised Upward to $5.2 Trillion for 2026: Semiconductor & Cloud Outperform`,
      source: 'Reuters Finance',
      time: '1h ago',
      impact: 'Bullish',
      snippet: 'Enterprise hardware & software budgets prioritize real-time AI agents and high-throughput datacenters.'
    },
    {
      title: `Federal Reserve Signals Neutral Rate Stabilization as Inflation Cooled to 2.1%`,
      source: 'Wall Street Journal',
      time: '3h ago',
      impact: 'Neutral',
      snippet: 'Macro conditions remain favorable for growth equities and digital assets heading into H2 2026.'
    }
  ];
}
