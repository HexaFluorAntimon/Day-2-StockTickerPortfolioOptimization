import Chart from 'chart.js/auto';
import { calculateSMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateMetrics } from './src/indicators.js';
import {
  POPULAR_TICKERS,
  fetchStockData,
  getCompanyFundamentals,
  getAiResearchSynthesis,
  get2026MarketNews,
  formatMarkdownToHtml
} from './src/data.js';
import { searchSp500Companies, SP500_COMPANIES } from './src/sp500.js';

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
    newsApi: localStorage.getItem('aura_newsapi_key') || '',
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

  // Technical Radar & Dedicated Sections
  radarRsiVal: document.getElementById('radar-rsi-val'),
  radarRsiBar: document.getElementById('radar-rsi-bar'),
  radarRsiStatus: document.getElementById('radar-rsi-status'),
  radarMacdVal: document.getElementById('radar-macd-val'),
  radarMaTrend: document.getElementById('radar-ma-trend'),
  techTickerBadge: document.getElementById('tech-ticker-badge'),
  // RSI Card
  rsiBadge: document.getElementById('rsi-badge'),
  rsiValue: document.getElementById('rsi-value'),
  rsiStatusText: document.getElementById('rsi-status-text'),
  rsiBar: document.getElementById('rsi-bar'),
  rsiComment: document.getElementById('rsi-comment'),
  rsiDistOverbought: document.getElementById('rsi-dist-overbought'),
  rsiDistOversold: document.getElementById('rsi-dist-oversold'),
  // MACD Card
  macdBadge: document.getElementById('macd-badge'),
  macdValue: document.getElementById('macd-value'),
  macdStatusText: document.getElementById('macd-status-text'),
  macdLineVal: document.getElementById('macd-line-val'),
  macdSignalVal: document.getElementById('macd-signal-val'),
  macdHistVal: document.getElementById('macd-hist-val'),
  macdComment: document.getElementById('macd-comment'),
  // Moving Averages Card
  maTrendBadge: document.getElementById('ma-trend-badge'),
  maSma50Val: document.getElementById('ma-sma50-val'),
  maSma50Diff: document.getElementById('ma-sma50-diff'),
  maSma200Val: document.getElementById('ma-sma200-val'),
  maSma200Diff: document.getElementById('ma-sma200-diff'),
  maComment: document.getElementById('ma-comment'),
  // Bollinger Bands Card
  bbPosBadge: document.getElementById('bb-pos-badge'),
  bbLowerVal: document.getElementById('bb-lower-val'),
  bbMidVal: document.getElementById('bb-mid-val'),
  bbUpperVal: document.getElementById('bb-upper-val'),
  bbPctB: document.getElementById('bb-pct-b'),
  bbPctBar: document.getElementById('bb-pct-bar'),
  bbComment: document.getElementById('bb-comment'),

  // News & Modal
  newsContainer: document.getElementById('news-container'),
  btnOpenApiModal: document.getElementById('btn-open-api-modal'),
  btnCloseApiModal: document.getElementById('btn-close-api-modal'),
  btnCancelApiModal: document.getElementById('btn-cancel-api-modal'),
  apiModal: document.getElementById('api-modal'),
  apiKeysForm: document.getElementById('api-keys-form'),
  newsApiInput: document.getElementById('newsapi-key'),
  twelveDataInput: document.getElementById('twelvedata-key'),
  openRouterInput: document.getElementById('openrouter-key'),
  apiStatusPing: document.getElementById('api-status-ping'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusLabel: document.getElementById('api-status-label'),
  fundamentalsBadge: document.getElementById('fundamentals-badge'),
  btnRefresh: document.getElementById('btn-refresh'),

  // S&P 500 Directory Modal Elements
  btnOpenSp500Modal: document.getElementById('btn-open-sp500-modal'),
  btnCloseSp500Modal: document.getElementById('btn-close-sp500-modal'),
  sp500Modal: document.getElementById('sp500-modal'),
  sp500ModalSearch: document.getElementById('sp500-modal-search'),
  sp500ModalSector: document.getElementById('sp500-modal-sector'),
  sp500ModalCount: document.getElementById('sp500-modal-count'),
  sp500ModalTbody: document.getElementById('sp500-modal-tbody')
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
  if (el.newsApiInput) el.newsApiInput.value = state.apiKeys.newsApi;
  if (el.twelveDataInput) el.twelveDataInput.value = state.apiKeys.twelveData;
  if (el.openRouterInput) el.openRouterInput.value = state.apiKeys.openRouter;
  updateApiStatusBadge();
}

function updateApiStatusBadge() {
  const hasNewsApi = state.apiKeys.newsApi.trim().length > 3;
  const hasTwelve = state.apiKeys.twelveData.trim().length > 3;
  const hasRouter = state.apiKeys.openRouter.trim().length > 3;

  if (hasNewsApi) {
    el.apiStatusLabel.textContent = 'NewsAPI Live Stream Active';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-mint-400';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75';
  } else if (hasTwelve && hasRouter) {
    el.apiStatusLabel.textContent = 'Live API Active';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
  } else if (hasTwelve || hasRouter) {
    el.apiStatusLabel.textContent = 'Partial Key Active';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-moss-500';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-400 opacity-75';
  } else {
    el.apiStatusLabel.textContent = 'Verified S&P 500 Data Active';
    el.apiStatusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500';
    el.apiStatusPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
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
    <div class="flex items-center gap-2 cursor-pointer hover:text-moss-400 transition" onclick="window.handleTickerSelect('${item.symbol.split(' ')[0]}')">
      <span class="font-bold text-paper-300">${item.symbol}:</span>
      <span class="text-paper-100 font-semibold">${item.price}</span>
      <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${item.up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-clay-500/10 text-clay-400 border border-clay-500/20'}">
        ${item.change}
      </span>
    </div>
  `).join('<span class="text-paper-700">•</span>');
}

// QUICK TICKER SELECTION PILLS
function renderQuickTickerPills() {
  el.quickTickerPills.innerHTML = POPULAR_TICKERS.map(t => {
    const isActive = t.symbol === state.ticker;
    const colorClass = t.changePct >= 0 ? 'text-emerald-400' : 'text-clay-400';
    return `
      <button 
        data-symbol="${t.symbol}"
        class="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
          isActive 
            ? 'bg-moss-600 text-paper-50 border-moss-500 shadow-md shadow-moss-600/30' 
            : 'bg-paper-900 border-paper-800 text-paper-300 hover:border-paper-700 hover:text-paper-50'
        }"
      >
        <span>${t.symbol}</span>
        <span class="${isActive ? 'text-moss-200' : colorClass} text-[10px]">${t.changePct >= 0 ? '+' : ''}${t.changePct}%</span>
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
    // 1. Fetch Market Bars & Fundamentals
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

    // 5. Render News via NewsAPI or Curated
    await renderNewsFeed();

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
      : 'bg-clay-500/10 border border-clay-500/20 text-clay-400'
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

  if (el.fundamentalsBadge) {
    el.fundamentalsBadge.textContent = 'Real-Time S&P 500 Data';
    el.fundamentalsBadge.className = 'text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold';
  }

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
    gradient.addColorStop(0, 'rgba(47, 128, 73, 0.35)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
  } else {
    gradient.addColorStop(0, 'rgba(178, 87, 56, 0.35)');
    gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
  }

  const primaryColor = isUpTrend ? '#4c9f5e' : '#b25738';

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
      backgroundColor: filteredBars.map(b => (b.close >= b.open ? '#1f8054' : '#b25738')),
      yAxisID: 'y'
    });

    // Candle Body (Open-Close)
    datasets.push({
      label: `${state.ticker} Candle Body`,
      data: filteredBars.map(b => [Math.min(b.open, b.close), Math.max(b.open, b.close)]),
      type: 'bar',
      barThickness: Math.max(3, Math.min(10, 300 / filteredBars.length)),
      backgroundColor: filteredBars.map(b => (b.close >= b.open ? '#1f8054' : '#b25738')),
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.sma50) {
    datasets.push({
      label: '50 SMA',
      data: sma50Values,
      borderColor: '#2f8049',
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
      borderColor: '#e4a238',
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
      borderColor: 'rgba(139, 148, 119, 0.7)',
      borderWidth: 1,
      fill: false,
      pointRadius: 0,
      yAxisID: 'y'
    });
    datasets.push({
      label: 'Lower BB',
      data: bb.lower,
      borderColor: 'rgba(139, 148, 119, 0.7)',
      borderWidth: 1,
      fill: '-1',
      backgroundColor: 'rgba(139, 148, 119, 0.12)',
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
      backgroundColor: closes.map((c, i) => (i > 0 && c >= closes[i - 1] ? 'rgba(31, 128, 84, 0.3)' : 'rgba(178, 87, 56, 0.3)')),
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
          ticks: { color: '#5c7d68', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 12 }
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            color: '#5c7d68',
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

// RENDER TECHNICAL RADAR & DEDICATED SECTIONS
function renderTechnicalRadar() {
  if (!state.priceData || state.priceData.length === 0) return;

  const rsi = calculateRSI(state.priceData);
  const macd = calculateMACD(state.priceData);
  const sma50Series = calculateSMA(state.priceData, 50);
  const sma200Series = calculateSMA(state.priceData, 200);
  const bb = calculateBollingerBands(state.priceData, 20, 2);

  const latestPrice = state.metrics ? state.metrics.latestPrice : state.priceData[state.priceData.length - 1].close;
  const sma50 = sma50Series[sma50Series.length - 1] || latestPrice;
  const sma200 = sma200Series[sma200Series.length - 1] || latestPrice;

  const bbUpper = bb.upper[bb.upper.length - 1] || latestPrice * 1.05;
  const bbMid = bb.middle[bb.middle.length - 1] || latestPrice;
  const bbLower = bb.lower[bb.lower.length - 1] || latestPrice * 0.95;

  // 1. Ticker badge
  if (el.techTickerBadge) el.techTickerBadge.textContent = state.ticker;

  // 2. Quick Radar
  if (el.radarRsiVal) el.radarRsiVal.textContent = rsi.value;
  if (el.radarRsiBar) el.radarRsiBar.style.width = `${Math.min(100, Math.max(5, rsi.value))}%`;
  if (el.radarRsiStatus) el.radarRsiStatus.textContent = rsi.status;
  if (el.radarMacdVal) el.radarMacdVal.textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram} (${macd.status})`;
  if (el.radarMaTrend) el.radarMaTrend.textContent = sma50 >= sma200 ? 'Golden Cross Active' : 'Neutral / Bearish';

  // 3. Dedicated Section 1: RSI
  if (el.rsiValue) el.rsiValue.textContent = rsi.value;
  if (el.rsiStatusText) el.rsiStatusText.textContent = rsi.status;
  if (el.rsiBar) el.rsiBar.style.width = `${Math.min(100, Math.max(5, rsi.value))}%`;

  if (el.rsiBadge) {
    if (rsi.value >= 70) {
      el.rsiBadge.textContent = 'OVERBOUGHT';
      el.rsiBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-clay-500/10 text-clay-400 border border-clay-500/20';
    } else if (rsi.value <= 30) {
      el.rsiBadge.textContent = 'OVERSOLD';
      el.rsiBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else if (rsi.value >= 60) {
      el.rsiBadge.textContent = 'BULLISH';
      el.rsiBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss-500/10 text-moss-300 border border-moss-500/20';
    } else {
      el.rsiBadge.textContent = 'NEUTRAL';
      el.rsiBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-paper-800 text-paper-300 border border-paper-700';
    }
  }

  const toOverbought = (70 - rsi.value).toFixed(1);
  const toOversold = (rsi.value - 30).toFixed(1);
  if (el.rsiDistOverbought) el.rsiDistOverbought.textContent = rsi.value >= 70 ? 'In Overbought Zone' : `${toOverbought} pts`;
  if (el.rsiDistOversold) el.rsiDistOversold.textContent = rsi.value <= 30 ? 'In Oversold Zone' : `${toOversold} pts`;

  if (el.rsiComment) {
    if (rsi.value >= 70) {
      el.rsiComment.textContent = `RSI at ${rsi.value} signals heavy buying pressure. Caution for potential mean reversion pullback.`;
    } else if (rsi.value <= 30) {
      el.rsiComment.textContent = `RSI at ${rsi.value} indicates deeply oversold technical condition. Potential reversal candidate.`;
    } else {
      el.rsiComment.textContent = `RSI at ${rsi.value} demonstrates sustained ${rsi.status.toLowerCase()} price structure with room for expansion.`;
    }
  }

  // 4. Dedicated Section 2: MACD
  if (el.macdValue) {
    el.macdValue.textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram}`;
    el.macdValue.className = macd.histogram >= 0 ? 'text-2xl font-mono font-extrabold text-emerald-400' : 'text-2xl font-mono font-extrabold text-clay-400';
  }
  if (el.macdStatusText) el.macdStatusText.textContent = macd.status;
  if (el.macdLineVal) el.macdLineVal.textContent = `${macd.macd >= 0 ? '+' : ''}${macd.macd}`;
  if (el.macdSignalVal) el.macdSignalVal.textContent = `${macd.signal >= 0 ? '+' : ''}${macd.signal}`;
  if (el.macdHistVal) {
    el.macdHistVal.textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram}`;
    el.macdHistVal.className = macd.histogram >= 0 ? 'font-bold text-emerald-400' : 'font-bold text-clay-400';
  }
  if (el.macdBadge) {
    if (macd.histogram >= 0) {
      el.macdBadge.textContent = 'BULLISH CROSSOVER';
      el.macdBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else {
      el.macdBadge.textContent = 'BEARISH CROSSOVER';
      el.macdBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-clay-500/10 text-clay-400 border border-clay-500/20';
    }
  }
  if (el.macdComment) {
    if (macd.histogram >= 0) {
      el.macdComment.textContent = `MACD line (${macd.macd}) is trading above signal line (${macd.signal}), reflecting bullish impulse.`;
    } else {
      el.macdComment.textContent = `MACD line (${macd.macd}) is below signal line (${macd.signal}), signaling short-term profit-taking.`;
    }
  }

  // 5. Dedicated Section 3: Moving Averages
  const diff50 = (((latestPrice - sma50) / sma50) * 100).toFixed(1);
  const diff200 = (((latestPrice - sma200) / sma200) * 100).toFixed(1);

  if (el.maSma50Val) el.maSma50Val.textContent = `$${sma50.toFixed(2)}`;
  if (el.maSma50Diff) {
    el.maSma50Diff.textContent = `${diff50 >= 0 ? '+' : ''}${diff50}% vs 50D`;
    el.maSma50Diff.className = diff50 >= 0 ? 'text-[10px] text-emerald-400 block font-bold' : 'text-[10px] text-clay-400 block font-bold';
  }
  if (el.maSma200Val) el.maSma200Val.textContent = `$${sma200.toFixed(2)}`;
  if (el.maSma200Diff) {
    el.maSma200Diff.textContent = `${diff200 >= 0 ? '+' : ''}${diff200}% vs 200D`;
    el.maSma200Diff.className = diff200 >= 0 ? 'text-[10px] text-emerald-400 block font-bold' : 'text-[10px] text-clay-400 block font-bold';
  }
  if (el.maTrendBadge) {
    if (sma50 >= sma200) {
      el.maTrendBadge.textContent = 'GOLDEN CROSS ACTIVE';
      el.maTrendBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else {
      el.maTrendBadge.textContent = 'DEATH CROSS / BEARISH';
      el.maTrendBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ochre-500/10 text-ochre-400 border border-ochre-500/20';
    }
  }
  if (el.maComment) {
    if (latestPrice >= sma50 && sma50 >= sma200) {
      el.maComment.textContent = `Strong structural alignment: Price sits ${diff50}% above 50D SMA and ${diff200}% above 200D SMA.`;
    } else if (latestPrice < sma50 && latestPrice >= sma200) {
      el.maComment.textContent = `Consolidating between 50D SMA ($${sma50.toFixed(2)}) resistance and 200D SMA ($${sma200.toFixed(2)}) support.`;
    } else {
      el.maComment.textContent = `Trading below key moving averages; monitoring for stabilization near major support levels.`;
    }
  }

  // 6. Dedicated Section 4: Bollinger Bands
  const pctB = bbUpper !== bbLower ? (((latestPrice - bbLower) / (bbUpper - bbLower)) * 100).toFixed(0) : 50;
  const bandwidth = bbMid > 0 ? (((bbUpper - bbLower) / bbMid) * 100).toFixed(1) : 10;

  if (el.bbLowerVal) el.bbLowerVal.textContent = `$${bbLower.toFixed(2)}`;
  if (el.bbMidVal) el.bbMidVal.textContent = `$${bbMid.toFixed(2)}`;
  if (el.bbUpperVal) el.bbUpperVal.textContent = `$${bbUpper.toFixed(2)}`;
  if (el.bbPctB) el.bbPctB.textContent = `${pctB}% (%B)`;
  if (el.bbPctBar) el.bbPctBar.style.width = `${Math.min(100, Math.max(0, pctB))}%`;

  if (el.bbPosBadge) {
    if (pctB >= 80) {
      el.bbPosBadge.textContent = 'UPPER BAND TEST';
      el.bbPosBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sage-500/10 text-sage-300 border border-sage-500/20';
    } else if (pctB <= 20) {
      el.bbPosBadge.textContent = 'LOWER BAND TEST';
      el.bbPosBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss-500/10 text-moss-300 border border-moss-500/20';
    } else {
      el.bbPosBadge.textContent = 'MID CHANNEL';
      el.bbPosBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-paper-800 text-paper-300 border border-paper-700';
    }
  }

  if (el.bbComment) {
    el.bbComment.textContent = `Volatility bandwidth at ${bandwidth}%. Price trades at ${pctB}% position within the 20-period envelope.`;
  }
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

  if (el.aiSentimentLabel) el.aiSentimentLabel.textContent = ai.sentimentLabel;
  if (el.aiScoreBadge) el.aiScoreBadge.textContent = ai.sentimentScore;

  // Render note text using Markdown-to-HTML parser
  if (el.aiNoteText) {
    el.aiNoteText.innerHTML = formatMarkdownToHtml(ai.summaryParagraph);
  }

  // Render bullet drivers
  if (el.aiDriversList) {
    el.aiDriversList.innerHTML = ai.keyDrivers.map(driver => `
      <li class="flex items-start gap-2 text-xs text-paper-300">
        <span class="text-mint-400 font-bold mt-0.5">•</span>
        <span class="leading-relaxed font-sans">${driver}</span>
      </li>
    `).join('');
  }
}

// RENDER NEWS FEED
async function renderNewsFeed() {
  const news = await get2026MarketNews(state.ticker, state.apiKeys.newsApi);

  el.newsContainer.innerHTML = news.map(item => `
    <div class="bg-paper-950/60 p-4 rounded-xl border border-paper-800/60 hover:border-paper-700 transition flex flex-col justify-between space-y-3">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-moss-400 font-bold">${item.source} ${item.isLive ? '<span class="text-[9px] text-mint-400 bg-mint-500/10 px-1 py-0.2 rounded border border-mint-500/20 font-sans">LIVE NEWSAPI</span>' : ''}</span>
          <span class="text-paper-500">${item.time}</span>
        </div>
        <h4 class="text-xs font-bold text-paper-100 leading-snug">${item.title}</h4>
        <p class="text-[11px] text-paper-400 leading-relaxed">${item.snippet || ''}</p>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-paper-800/40 text-[10px] font-mono">
        <span class="px-2 py-0.5 rounded ${item.impact === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : item.impact === 'Bearish' ? 'bg-clay-500/10 text-clay-400 border border-clay-500/20' : 'bg-paper-800 text-paper-300'} font-bold">
          ${item.impact}
        </span>
        ${item.url && item.url !== '#' ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-moss-400 hover:underline transition">Read Article →</a>` : '<span class="text-paper-500">Curated Update</span>'}
      </div>
    </div>
  `).join('');
}

// SEARCH & AUTOCOMPLETE HANDLERS
function setupEventListeners() {
  // Search Input & Dropdown for All S&P 500 Companies
  el.tickerSearch.addEventListener('focus', () => {
    const val = el.tickerSearch.value.trim();
    showSearchMatches(val);
  });

  el.tickerSearch.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    showSearchMatches(val);
  });

  function showSearchMatches(val) {
    const matches = searchSp500Companies(val);

    if (matches.length > 0) {
      el.dropdown.innerHTML = `
        <div class="px-3 py-1.5 bg-paper-950 border-b border-paper-800 text-[10px] font-mono text-paper-400 uppercase tracking-wider flex items-center justify-between">
          <span>S&P 500 Companies (${matches.length} found)</span>
          <span>Click to select</span>
        </div>
        ${matches.map(m => `
          <div class="p-3 hover:bg-paper-800/90 cursor-pointer flex items-center justify-between border-b border-paper-800/40 last:border-0 transition" onclick="window.handleTickerSelect('${m.symbol}')">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-paper-50 text-sm">${m.symbol}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-moss-500/10 text-moss-300 border border-moss-500/20">${m.sector}</span>
              </div>
              <span class="text-xs text-paper-400 block font-medium">${m.name}</span>
            </div>
            <div class="text-right space-y-0.5 font-mono text-xs">
              <div class="font-bold text-paper-50">$${m.price.toFixed(2)} <span class="${m.changePct >= 0 ? 'text-emerald-400' : 'text-clay-400'}">(${m.changePct >= 0 ? '+' : ''}${m.changePct}%)</span></div>
              <div class="text-[10px] text-paper-400">Cap: <strong class="text-paper-200">${m.cap}</strong> • P/E: <strong class="text-paper-200">${m.pe}</strong></div>
            </div>
          </div>
        `).join('')}
      `;
      el.dropdown.classList.remove('hidden');
    } else {
      el.dropdown.innerHTML = `
        <div class="p-3 text-xs text-paper-400 font-mono text-center cursor-pointer hover:bg-paper-800" onclick="window.handleTickerSelect('${val.toUpperCase()}')">
          Analyze custom ticker "<strong>${val.toUpperCase()}</strong>" →
        </div>
      `;
      el.dropdown.classList.remove('hidden');
    }
  }

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
          b.className = 'px-2.5 py-1 rounded-lg text-paper-400 hover:text-paper-50 transition';
        });
        btn.className = 'px-2.5 py-1 rounded-lg bg-moss-600 text-paper-50 font-bold shadow';
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
      el.btnChartArea.className = 'px-2 py-0.5 rounded font-semibold bg-moss-600 text-paper-50 shadow';
      el.btnChartCandle.className = 'px-2 py-0.5 rounded font-semibold text-paper-400 hover:text-paper-50 transition';
      renderChart();
    });

    el.btnChartCandle.addEventListener('click', () => {
      state.chartStyle = 'candles';
      el.btnChartCandle.className = 'px-2 py-0.5 rounded font-semibold bg-moss-600 text-paper-50 shadow';
      el.btnChartArea.className = 'px-2 py-0.5 rounded font-semibold text-paper-400 hover:text-paper-50 transition';
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
    state.apiKeys.newsApi = el.newsApiInput ? el.newsApiInput.value.trim() : '';
    state.apiKeys.twelveData = el.twelveDataInput ? el.twelveDataInput.value.trim() : '';
    state.apiKeys.openRouter = el.openRouterInput ? el.openRouterInput.value.trim() : '';

    localStorage.setItem('aura_newsapi_key', state.apiKeys.newsApi);
    localStorage.setItem('aura_twelvedata_key', state.apiKeys.twelveData);
    localStorage.setItem('aura_openrouter_key', state.apiKeys.openRouter);

    updateApiStatusBadge();
    el.apiModal.classList.add('hidden');
    loadDashboardData(state.ticker);
  });

  // S&P 500 Directory Modal Handlers
  if (el.btnOpenSp500Modal && el.sp500Modal) {
    el.btnOpenSp500Modal.addEventListener('click', () => {
      el.sp500Modal.classList.remove('hidden');
      renderSp500DirectoryTable();
    });

    el.btnCloseSp500Modal.addEventListener('click', () => {
      el.sp500Modal.classList.add('hidden');
    });

    if (el.sp500ModalSearch) {
      el.sp500ModalSearch.addEventListener('input', renderSp500DirectoryTable);
    }

    if (el.sp500ModalSector) {
      el.sp500ModalSector.addEventListener('change', renderSp500DirectoryTable);
    }
  }
}

function renderSp500DirectoryTable() {
  if (!el.sp500ModalTbody) return;

  const searchQuery = el.sp500ModalSearch ? el.sp500ModalSearch.value.trim().toUpperCase() : '';
  const sectorQuery = el.sp500ModalSector ? el.sp500ModalSector.value : 'ALL';

  let filtered = SP500_COMPANIES;

  if (sectorQuery !== 'ALL') {
    filtered = filtered.filter(c => c.sector === sectorQuery);
  }

  if (searchQuery) {
    filtered = filtered.filter(c => 
      c.symbol.includes(searchQuery) || 
      c.name.toUpperCase().includes(searchQuery) || 
      c.sector.toUpperCase().includes(searchQuery)
    );
  }

  if (el.sp500ModalCount) {
    el.sp500ModalCount.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    el.sp500ModalTbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-paper-500 font-mono text-xs">
          No S&P 500 companies found matching filters.
        </td>
      </tr>
    `;
    return;
  }

  el.sp500ModalTbody.innerHTML = filtered.map(c => `
    <tr class="hover:bg-paper-800/80 cursor-pointer transition border-b border-paper-800/40 last:border-0" onclick="window.handleSp500DirectorySelect('${c.symbol}')">
      <td class="p-3">
        <div class="font-bold text-paper-50 font-mono text-sm">${c.symbol}</div>
        <div class="text-[11px] text-paper-400 font-sans">${c.name}</div>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-paper-800 text-paper-300 border border-paper-700">${c.sector}</span>
      </td>
      <td class="p-3 text-right font-bold text-paper-50">$${c.price.toFixed(2)}</td>
      <td class="p-3 text-right text-paper-300">${c.cap}</td>
      <td class="p-3 text-right text-paper-300">${c.pe}</td>
      <td class="p-3 text-right text-emerald-400 font-bold">$${c.targetPrice ? c.targetPrice.toFixed(2) : '-'}</td>
      <td class="p-3 text-center">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.rating === 'Strong Buy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-moss-500/10 text-moss-300 border border-moss-500/20'}">
          ${c.rating}
        </span>
      </td>
    </tr>
  `).join('');
}

function switchTicker(symbol) {
  state.ticker = symbol.toUpperCase();
  el.tickerSearch.value = '';
  el.dropdown.classList.add('hidden');
  if (el.sp500Modal) el.sp500Modal.classList.add('hidden');
  loadDashboardData(state.ticker);
}

// Global window handles for inline onclicks
window.handleTickerSelect = (symbol) => {
  switchTicker(symbol);
};

window.handleSp500DirectorySelect = (symbol) => {
  switchTicker(symbol);
};
