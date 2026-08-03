import Chart from 'chart.js/auto';
import { calculateSMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateMetrics } from './src/indicators.js';
import {
  POPULAR_TICKERS,
  fetchStockData,
  getCompanyFundamentals,
  getAiResearchSynthesis,
  get2026MarketNews
} from './src/data.js';

// APPLICATION STATE
const state = {
  ticker: 'NVDA',
  timeframe: '3M',
  chartStyle: 'area', // 'area' or 'candles'
  priceData: [],
  metrics: null,
  companyData: null,
  aiSynthesis: null,
  activeOverlays: {
    sma50: true,
    sma200: true,
    bollinger: false,
    volume: true
  },
  apiKeys: {
    twelveData: localStorage.getItem('aura_twelvedata_key') || '',
    openRouter: localStorage.getItem('aura_openrouter_key') || ''
  }
};

let priceChartInstance = null;

// DOM ELEMENT REFERENCES
const el = {
  tickerTape: document.getElementById('ticker-tape'),
  quickTickerPills: document.getElementById('quick-ticker-pills'),
  tickerSearch: document.getElementById('ticker-search'),
  dropdown: document.getElementById('search-results-dropdown'),
  
  // Hero
  heroSymbol: document.getElementById('hero-ticker-symbol'),
  heroCompanyName: document.getElementById('hero-company-name'),
  heroSector: document.getElementById('hero-sector-tag'),
  heroYtd: document.getElementById('hero-ytd-tag'),
  heroPrice: document.getElementById('hero-price'),
  heroChangeContainer: document.getElementById('hero-change-container'),
  heroChangeIcon: document.getElementById('hero-change-icon'),
  heroChangeDollar: document.getElementById('hero-change-dollar'),
  heroChangePct: document.getElementById('hero-change-pct'),
  heroDayLow: document.getElementById('hero-day-low'),
  heroDayHigh: document.getElementById('hero-day-high'),
  heroDayBar: document.getElementById('hero-day-bar'),
  hero52Low: document.getElementById('hero-52w-low'),
  hero52High: document.getElementById('hero-52w-high'),
  hero52Bar: document.getElementById('hero-52w-bar'),

  // Chart Controls & Readout
  chartCanvas: document.getElementById('priceChart'),
  chartLoader: document.getElementById('chart-loader'),
  timeframePills: document.getElementById('timeframe-pills'),
  toggleSma50: document.getElementById('toggle-sma50'),
  toggleSma200: document.getElementById('toggle-sma200'),
  toggleBollinger: document.getElementById('toggle-bollinger'),
  toggleVolume: document.getElementById('toggle-volume'),
  btnChartArea: document.getElementById('btn-chart-area'),
  btnChartCandle: document.getElementById('btn-chart-candle'),
  ohlcDate: document.getElementById('ohlc-date'),
  ohlcOpen: document.getElementById('ohlc-open'),
  ohlcHigh: document.getElementById('ohlc-high'),
  ohlcLow: document.getElementById('ohlc-low'),
  ohlcClose: document.getElementById('ohlc-close'),
  ohlcVol: document.getElementById('ohlc-vol'),

  // Fundamentals
  mCap: document.getElementById('metric-market-cap'),
  mPe: document.getElementById('metric-pe'),
  mFwdPe: document.getElementById('metric-fwd-pe'),
  mEpsGrowth: document.getElementById('metric-eps-growth'),
  mRevGrowth: document.getElementById('metric-rev-growth'),
  mFcf: document.getElementById('metric-fcf'),
  mBeta: document.getElementById('metric-beta'),
  mTarget: document.getElementById('metric-target'),

  // AI Synthesis
  aiSentimentLabel: document.getElementById('ai-sentiment-label'),
  aiScoreBadge: document.getElementById('ai-score-badge'),
  aiNoteText: document.getElementById('ai-note-text'),
  aiDriversList: document.getElementById('ai-drivers-list'),
  aiPresetSelect: document.getElementById('ai-preset-select'),
  btnRegenerateAi: document.getElementById('btn-regenerate-ai'),

  // Technical Radar
  radarRsiVal: document.getElementById('radar-rsi-val'),
  radarRsiBar: document.getElementById('radar-rsi-bar'),
  radarRsiStatus: document.getElementById('radar-rsi-status'),
  radarMacdVal: document.getElementById('radar-macd-val'),
  radarMaTrend: document.getElementById('radar-ma-trend'),

  // News & Modal
  newsContainer: document.getElementById('news-container'),
  btnOpenApiModal: document.getElementById('btn-open-api-modal'),
  btnCloseApiModal: document.getElementById('btn-close-api-modal'),
  btnCancelApiModal: document.getElementById('btn-cancel-api-modal'),
  apiModal: document.getElementById('api-modal'),
  apiKeysForm: document.getElementById('api-keys-form'),
  twelveDataInput: document.getElementById('twelvedata-key'),
  openRouterInput: document.getElementById('openrouter-key'),
  apiStatusPing: document.getElementById('api-status-ping'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusLabel: document.getElementById('api-status-label'),
  btnRefresh: document.getElementById('btn-refresh')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initApiModalValues();
  renderTickerTape();
  renderQuickTickerPills();
  setupEventListeners();
  loadDashboardData(state.ticker);
});

function initApiModalValues() {
  if (el.twelveDataInput) el.twelveDataInput.value = state.apiKeys.twelveData;
  if (el.openRouterInput) el.openRouterInput.value = state.apiKeys.openRouter;
  updateApiStatusBadge();
}

function updateApiStatusBadge() {
  const hasTwelve = state.apiKeys.twelveData.trim().length > 3;
  const hasRouter = state.apiKeys.openRouter.trim().length > 3;

  if (hasTwelve && hasRouter) {
    el.apiStatusLabel.textContent = 'Live API Active';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
  } else if (hasTwelve || hasRouter) {
    el.apiStatusLabel.textContent = 'Partial Key Active';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-indigo-500';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75';
  } else {
    el.apiStatusLabel.textContent = '2026 Feed (Demo Mode)';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-amber-500';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75';
  }
}

// TOP MARKET TICKER TAPE
function renderTickerTape() {
  const tapeItems = [
    { symbol: 'S&P 500', price: '5,640.20', change: '+0.84%', up: true },
    { symbol: 'NASDAQ', price: '18,210.80', change: '+1.42%', up: true },
    { symbol: 'DOW JONES', price: '40,890.15', change: '+0.28%', up: true },
    { symbol: 'BITCOIN 2026', price: '$94,250.00', change: '+4.12%', up: true },
    { symbol: 'NVDA', price: '$148.25', change: '+3.42%', up: true },
    { symbol: 'AAPL', price: '$238.90', change: '+0.85%', up: true },
    { symbol: 'MSFT', price: '$462.10', change: '+1.25%', up: true },
    { symbol: 'TSLA', price: '$254.60', change: '-1.15%', up: false },
    { symbol: '10Y TREASURY', price: '3.88%', change: '-0.04', up: false }
  ];

  // Duplicate for smooth seamless loop
  const list = [...tapeItems, ...tapeItems];
  
  el.tickerTape.innerHTML = list.map(item => `
    <div class="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition" onclick="window.handleTickerSelect('${item.symbol.split(' ')[0]}')">
      <span class="font-bold text-slate-300">${item.symbol}:</span>
      <span class="text-slate-100 font-semibold">${item.price}</span>
      <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${item.up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
        ${item.change}
      </span>
    </div>
  `).join('<span class="text-slate-700">•</span>');
}

// QUICK TICKER SELECTION PILLS
function renderQuickTickerPills() {
  el.quickTickerPills.innerHTML = POPULAR_TICKERS.map(t => {
    const isActive = t.symbol === state.ticker;
    const colorClass = t.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400';
    return `
      <button 
        data-symbol="${t.symbol}"
        class="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
          isActive 
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' 
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
        }"
      >
        <span>${t.symbol}</span>
        <span class="${isActive ? 'text-indigo-200' : colorClass} text-[10px]">${t.changePct >= 0 ? '+' : ''}${t.changePct}%</span>
      </button>
    `;
  }).join('');

  el.quickTickerPills.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.getAttribute('data-symbol');
      if (sym) switchTicker(sym);
    });
  });
}

// MAIN DASHBOARD DATA LOADING ENGINE
async function loadDashboardData(ticker) {
  showChartLoader(true);
  state.ticker = ticker.toUpperCase();

  try {
    // 1. Fetch Market Bars
    state.priceData = await fetchStockData(state.ticker, state.apiKeys.twelveData);
    state.metrics = calculateMetrics(state.priceData, state.ticker);
    state.companyData = getCompanyFundamentals(state.ticker, state.metrics.latestPrice);

    // 2. Render Hero & Fundamentals
    renderHeroBanner();
    renderFundamentals();

    // 3. Render Interactive Price Chart
    renderChart();

    // 4. Render Technical Signals
    renderTechnicalRadar();

    // 5. Render News
    renderNewsFeed();

    // 6. Fetch / Generate AI Research Synthesis
    loadAiSynthesis();

    // Update Quick Pills Active State
    renderQuickTickerPills();
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  } finally {
    showChartLoader(false);
  }
}

function showChartLoader(show) {
  if (el.chartLoader) {
    if (show) el.chartLoader.classList.remove('hidden');
    else el.chartLoader.classList.add('hidden');
  }
}

// RENDER HERO BANNER
function renderHeroBanner() {
  const m = state.metrics;
  const c = state.companyData;
  if (!m || !c) return;

  el.heroSymbol.textContent = c.symbol;
  el.heroCompanyName.textContent = c.name;
  el.heroSector.textContent = c.sector;
  el.heroYtd.textContent = `${m.ytdChangePct >= 0 ? '+' : ''}${m.ytdChangePct}% 2026 YTD`;

  el.heroPrice.textContent = `$${m.latestPrice.toFixed(2)}`;

  const isUp = m.dayChange >= 0;
  el.heroChangeContainer.className = `flex items-center gap-2 px-3 py-1 rounded-xl font-mono font-bold text-lg ${
    isUp 
      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
  }`;
  el.heroChangeIcon.textContent = isUp ? '▲' : '▼';
  el.heroChangeDollar.textContent = `${isUp ? '+' : ''}$${m.dayChange.toFixed(2)}`;
  el.heroChangePct.textContent = `(${isUp ? '+' : ''}${m.dayPctChange.toFixed(2)}%)`;

  el.heroDayLow.textContent = `$${m.dayLow.toFixed(2)}`;
  el.heroDayHigh.textContent = `$${m.dayHigh.toFixed(2)}`;
  const dayBarPct = Math.min(100, Math.max(10, ((m.latestPrice - m.dayLow) / (m.dayHigh - m.dayLow || 1)) * 100));
  el.heroDayBar.style.width = `${dayBarPct}%`;

  el.hero52Low.textContent = `$${m.low52.toFixed(2)}`;
  el.hero52High.textContent = `$${m.high52.toFixed(2)}`;
  const bar52Pct = Math.min(100, Math.max(10, ((m.latestPrice - m.low52) / (m.high52 - m.low52 || 1)) * 100));
  el.hero52Bar.style.width = `${bar52Pct}%`;
}

// RENDER FUNDAMENTALS GRID
function renderFundamentals() {
  const c = state.companyData;
  if (!c) return;

  el.mCap.textContent = c.marketCap;
  el.mPe.textContent = c.peRatio !== 'N/A' ? `${c.peRatio}x` : 'N/A';
  el.mFwdPe.textContent = c.forwardPe !== 'N/A' ? `${c.forwardPe}x` : 'N/A';
  el.mEpsGrowth.textContent = c.epsGrowth2026;
  el.mRevGrowth.textContent = c.revenueGrowth;
  el.mFcf.textContent = c.freeCashFlow;
  el.mBeta.textContent = c.beta;
  el.mTarget.innerHTML = `${c.targetPrice} <span class="text-[10px] text-emerald-400">(${c.upsidePct})</span>`;
}

// RENDER PRICE CHART WITH CHART.JS
function renderChart() {
  if (!state.priceData || state.priceData.length === 0) return;

  // Filter bars based on timeframe
  const filteredBars = filterBarsByTimeframe(state.priceData, state.timeframe);

  const labels = filteredBars.map(b => {
    const parts = b.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const closes = filteredBars.map(b => b.close);
  const volumes = filteredBars.map(b => b.volume);

  const sma50Values = calculateSMA(filteredBars, 20); // 20-period
  const sma200Values = calculateSMA(filteredBars, 50);
  const bb = calculateBollingerBands(filteredBars, 20, 2);

  // Set default readout to latest bar
  updateOhlcReadout(filteredBars[filteredBars.length - 1]);

  const ctx = el.chartCanvas.getContext('2d');

  // Create gradient fill
  const isUpTrend = closes[closes.length - 1] >= closes[0];
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  if (isUpTrend) {
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
  } else {
    gradient.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
    gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
  }

  const primaryColor = isUpTrend ? '#818cf8' : '#f43f5e';

  // Build datasets
  const datasets = [];

  if (state.chartStyle === 'area') {
    datasets.push({
      label: `${state.ticker} Price ($)`,
      data: closes,
      borderColor: primaryColor,
      borderWidth: 2.5,
      fill: true,
      backgroundColor: gradient,
      tension: 0.25,
      pointRadius: filteredBars.length > 40 ? 0 : 3,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: primaryColor,
      yAxisID: 'y'
    });
  } else {
    // High-Low Range Candle wicks / bars
    datasets.push({
      label: `${state.ticker} High-Low`,
      data: filteredBars.map(b => [b.low, b.high]),
      type: 'bar',
      barThickness: 2,
      backgroundColor: filteredBars.map(b => (b.close >= b.open ? '#10b981' : '#f43f5e')),
      yAxisID: 'y'
    });

    // Candle Body (Open-Close)
    datasets.push({
      label: `${state.ticker} Candle Body`,
      data: filteredBars.map(b => [Math.min(b.open, b.close), Math.max(b.open, b.close)]),
      type: 'bar',
      barThickness: Math.max(3, Math.min(10, 300 / filteredBars.length)),
      backgroundColor: filteredBars.map(b => (b.close >= b.open ? '#10b981' : '#f43f5e')),
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.sma50) {
    datasets.push({
      label: '50 SMA',
      data: sma50Values,
      borderColor: '#6366f1',
      borderWidth: 1.5,
      borderDash: [4, 4],
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.sma200) {
    datasets.push({
      label: '200 SMA',
      data: sma200Values,
      borderColor: '#f59e0b',
      borderWidth: 1.5,
      borderDash: [2, 2],
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.bollinger) {
    datasets.push({
      label: 'Upper BB',
      data: bb.upper,
      borderColor: 'rgba(192, 132, 252, 0.6)',
      borderWidth: 1,
      fill: false,
      pointRadius: 0,
      yAxisID: 'y'
    });
    datasets.push({
      label: 'Lower BB',
      data: bb.lower,
      borderColor: 'rgba(192, 132, 252, 0.6)',
      borderWidth: 1,
      fill: '-1',
      backgroundColor: 'rgba(192, 132, 252, 0.08)',
      pointRadius: 0,
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.volume) {
    const maxVol = Math.max(...volumes);
    const normalizedVol = volumes.map(v => (v / maxVol) * (Math.max(...closes) * 0.2));
    datasets.push({
      label: 'Volume',
      data: normalizedVol,
      type: 'bar',
      backgroundColor: closes.map((c, i) => (i > 0 && c >= closes[i - 1] ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)')),
      yAxisID: 'y'
    });
  }

  if (priceChartInstance) {
    priceChartInstance.destroy();
  }

  priceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false, // We use custom live top readout bar
          external: (context) => {
            const idx = context.tooltip.dataPoints?.[0]?.dataIndex;
            if (idx !== undefined && filteredBars[idx]) {
              updateOhlcReadout(filteredBars[idx]);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 12 }
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            color: '#64748b',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (val) => `$${val.toFixed(0)}`
          }
        }
      }
    }
  });
}

function updateOhlcReadout(bar) {
  if (!bar) return;
  if (el.ohlcDate) el.ohlcDate.textContent = bar.date;
  if (el.ohlcOpen) el.ohlcOpen.textContent = `$${bar.open.toFixed(2)}`;
  if (el.ohlcHigh) el.ohlcHigh.textContent = `$${bar.high.toFixed(2)}`;
  if (el.ohlcLow) el.ohlcLow.textContent = `$${bar.low.toFixed(2)}`;
  if (el.ohlcClose) el.ohlcClose.textContent = `$${bar.close.toFixed(2)}`;
  if (el.ohlcVol) el.ohlcVol.textContent = `${(bar.volume / 1000000).toFixed(1)}M`;
}

function filterBarsByTimeframe(data, tf) {
  if (tf === '1D') return data.slice(-2);
  if (tf === '1W') return data.slice(-5);
  if (tf === '1M') return data.slice(-22);
  if (tf === 'YTD') return data.slice(-60);
  return data; // 3M default (90 days)
}

// RENDER TECHNICAL RADAR
function renderTechnicalRadar() {
  if (!state.priceData || state.priceData.length === 0) return;

  const rsi = calculateRSI(state.priceData);
  const macd = calculateMACD(state.priceData);

  el.radarRsiVal.textContent = rsi.value;
  el.radarRsiBar.style.width = `${Math.min(100, Math.max(5, rsi.value))}%`;
  el.radarRsiStatus.textContent = rsi.status;

  el.radarMacdVal.textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram} (${macd.status})`;
  el.radarMaTrend.textContent = state.metrics.periodPctChange >= 0 ? 'Golden Cross Active' : 'Neutral Consolidation';
}

// AI RESEARCH SYNTHESIS LOADER
async function loadAiSynthesis() {
  el.aiNoteText.textContent = 'Generating 2026 GenAI Financial Analysis...';
  el.btnRegenerateAi.disabled = true;

  const preset = el.aiPresetSelect ? el.aiPresetSelect.value : 'General';
  const aiData = await getAiResearchSynthesis(
    state.ticker,
    state.priceData,
    state.metrics,
    state.apiKeys.openRouter,
    preset
  );

  state.aiSynthesis = aiData;
  renderAiSynthesis();
  el.btnRegenerateAi.disabled = false;
}

function renderAiSynthesis() {
  const ai = state.aiSynthesis;
  if (!ai) return;

  el.aiSentimentLabel.textContent = ai.sentimentLabel;
  el.aiScoreBadge.textContent = ai.sentimentScore;

  // Render note text
  el.aiNoteText.textContent = ai.summaryParagraph;

  // Render bullet drivers
  el.aiDriversList.innerHTML = ai.keyDrivers.map(driver => `
    <li class="flex items-start gap-2">
      <span class="text-indigo-400 mt-0.5">•</span>
      <span>${driver}</span>
    </li>
  `).join('');
}

// RENDER NEWS FEED
function renderNewsFeed() {
  const news = get2026MarketNews(state.ticker);

  el.newsContainer.innerHTML = news.map(item => `
    <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-indigo-400 font-bold">${item.source}</span>
          <span class="text-slate-500">${item.time}</span>
        </div>
        <h4 class="text-xs font-bold text-slate-100 leading-snug">${item.title}</h4>
        <p class="text-[11px] text-slate-400 leading-relaxed">${item.snippet}</p>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px] font-mono">
        <span class="px-2 py-0.5 rounded ${item.impact === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300'} font-bold">
          ${item.impact} Impact
        </span>
        <span class="text-slate-500 cursor-pointer hover:text-indigo-400 transition">Read Analysis →</span>
      </div>
    </div>
  `).join('');
}

// SEARCH & AUTOCOMPLETE HANDLERS
function setupEventListeners() {
  // Search Input & Dropdown
  el.tickerSearch.addEventListener('input', (e) => {
    const val = e.target.value.trim().toUpperCase();
    if (!val) {
      el.dropdown.classList.add('hidden');
      return;
    }

    const matches = POPULAR_TICKERS.filter(
      t => t.symbol.includes(val) || t.name.toUpperCase().includes(val)
    );

    if (matches.length > 0) {
      el.dropdown.innerHTML = matches.map(m => `
        <div class="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-800/50 last:border-0" onclick="window.handleTickerSelect('${m.symbol}')">
          <div>
            <span class="font-mono font-bold text-white text-sm">${m.symbol}</span>
            <span class="text-xs text-slate-400 block">${m.name}</span>
          </div>
          <span class="font-mono text-xs ${m.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
            $${m.price.toFixed(2)} (${m.changePct >= 0 ? '+' : ''}${m.changePct}%)
          </span>
        </div>
      `).join('');
      el.dropdown.classList.remove('hidden');
    } else {
      el.dropdown.innerHTML = `
        <div class="p-3 text-xs text-slate-400 font-mono text-center cursor-pointer hover:bg-slate-800" onclick="window.handleTickerSelect('${val}')">
          Analyze custom ticker "<strong>${val}</strong>" →
        </div>
      `;
      el.dropdown.classList.remove('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!el.tickerSearch.contains(e.target) && !el.dropdown.contains(e.target)) {
      el.dropdown.classList.add('hidden');
    }
  });

  // Global Keyboard Shortcut Cmd+K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      el.tickerSearch.focus();
    }
  });

  // Timeframe Pills
  el.timeframePills.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tf = btn.getAttribute('data-tf');
      if (tf) {
        state.timeframe = tf;
        el.timeframePills.querySelectorAll('button').forEach(b => {
          b.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition';
        });
        btn.className = 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold shadow';
        renderChart();
      }
    });
  });

  // Indicator Overlays Toggles
  el.toggleSma50.addEventListener('click', () => {
    state.activeOverlays.sma50 = !state.activeOverlays.sma50;
    el.toggleSma50.classList.toggle('opacity-50', !state.activeOverlays.sma50);
    renderChart();
  });

  el.toggleSma200.addEventListener('click', () => {
    state.activeOverlays.sma200 = !state.activeOverlays.sma200;
    el.toggleSma200.classList.toggle('opacity-50', !state.activeOverlays.sma200);
    renderChart();
  });

  if (el.toggleBollinger) {
    el.toggleBollinger.addEventListener('click', () => {
      state.activeOverlays.bollinger = !state.activeOverlays.bollinger;
      el.toggleBollinger.classList.toggle('opacity-50', !state.activeOverlays.bollinger);
      renderChart();
    });
  }

  el.toggleVolume.addEventListener('click', () => {
    state.activeOverlays.volume = !state.activeOverlays.volume;
    el.toggleVolume.classList.toggle('opacity-50', !state.activeOverlays.volume);
    renderChart();
  });

  if (el.btnChartArea && el.btnChartCandle) {
    el.btnChartArea.addEventListener('click', () => {
      state.chartStyle = 'area';
      el.btnChartArea.className = 'px-2 py-0.5 rounded font-semibold bg-indigo-600 text-white shadow';
      el.btnChartCandle.className = 'px-2 py-0.5 rounded font-semibold text-slate-400 hover:text-white transition';
      renderChart();
    });

    el.btnChartCandle.addEventListener('click', () => {
      state.chartStyle = 'candles';
      el.btnChartCandle.className = 'px-2 py-0.5 rounded font-semibold bg-indigo-600 text-white shadow';
      el.btnChartArea.className = 'px-2 py-0.5 rounded font-semibold text-slate-400 hover:text-white transition';
      renderChart();
    });
  }

  // AI Re-Generate
  el.btnRegenerateAi.addEventListener('click', () => {
    loadAiSynthesis();
  });

  if (el.aiPresetSelect) {
    el.aiPresetSelect.addEventListener('change', () => {
      loadAiSynthesis();
    });
  }

  // Refresh Button
  el.btnRefresh.addEventListener('click', () => {
    loadDashboardData(state.ticker);
  });

  // API Modal Open / Close / Save
  el.btnOpenApiModal.addEventListener('click', () => {
    el.apiModal.classList.remove('hidden');
  });

  el.btnCloseApiModal.addEventListener('click', () => {
    el.apiModal.classList.add('hidden');
  });

  el.btnCancelApiModal.addEventListener('click', () => {
    el.apiModal.classList.add('hidden');
  });

  el.apiKeysForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.apiKeys.twelveData = el.twelveDataInput.value.trim();
    state.apiKeys.openRouter = el.openRouterInput.value.trim();

    localStorage.setItem('aura_twelvedata_key', state.apiKeys.twelveData);
    localStorage.setItem('aura_openrouter_key', state.apiKeys.openRouter);

    updateApiStatusBadge();
    el.apiModal.classList.add('hidden');
    loadDashboardData(state.ticker);
  });
}

function switchTicker(symbol) {
  state.ticker = symbol.toUpperCase();
  el.tickerSearch.value = '';
  el.dropdown.classList.add('hidden');
  loadDashboardData(state.ticker);
}

// Global window handle for inline onclicks
window.handleTickerSelect = (symbol) => {
  switchTicker(symbol);
};
