import Chart from 'chart.js/auto';
import { calculateSMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateMetrics } from './src/indicators.js';
import {
  POPULAR_TICKERS,
  fetchStockData,
  getCompanyFundamentals,
  getAiResearchSynthesis,
  get2026MarketNews,
  formatMarkdownToHtml,
  escapeHtml,
  getLastDataSource
} from './src/data.js';
import { searchSp500Companies, SP500_COMPANIES } from './src/sp500.js';
import {
  generateBasketSeries,
  toSimpleReturns,
  covarianceMatrix,
  correlationMatrix,
  equalWeights,
  inverseVolWeights,
  minVarianceWeights,
  maxSharpeWeights,
  portfolioReturns,
  portfolioStats,
  rollingCorrelation,
  rollingSharpe,
  rollingBeta,
  mean as avg
} from './src/portfolio.js';

/**
 * Opening ticker, in priority order: ?symbol= in the URL, then the last one viewed,
 * then the default. Makes a view shareable and bookmarkable.
 */
function resolveInitialTicker() {
  const fromUrl = new URLSearchParams(window.location.search).get('symbol');
  const candidate = (fromUrl || localStorage.getItem('aura_last_ticker') || 'NVDA').toUpperCase();
  return /^[A-Z.\-]{1,8}$/.test(candidate) ? candidate : 'NVDA';
}

// APPLICATION STATE
const state = {
  ticker: resolveInitialTicker(),
  timeframe: localStorage.getItem('aura_timeframe') || '3M',
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

  // Technical indicator cards
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
  toastRegion: document.getElementById('toast-region'),
  dataSourceBadge: document.getElementById('data-source-badge'),
  btnWatch: document.getElementById('btn-watch'),
  watchlist: document.getElementById('watchlist'),
  watchlistWrap: document.getElementById('watchlist-wrap'),
  btnExport: document.getElementById('btn-export'),

  // Portfolio view
  viewNav: document.getElementById('view-nav'),
  viewMarkets: document.getElementById('view-markets'),
  viewPortfolio: document.getElementById('view-portfolio'),
  basketChips: document.getElementById('basket-chips'),
  basketAdd: document.getElementById('basket-add'),
  btnBasketReset: document.getElementById('btn-basket-reset'),
  rfRate: document.getElementById('rf-rate'),
  weightCap: document.getElementById('weight-cap'),
  pfSampleNote: document.getElementById('pf-sample-note'),
  methodCards: document.getElementById('method-cards'),
  methodTable: document.getElementById('method-table'),
  corrMatrix: document.getElementById('corr-matrix'),
  rollingTabs: document.getElementById('rolling-tabs'),
  rollingControls: document.getElementById('rolling-controls'),
  rollingNote: document.getElementById('rolling-note'),
  rollingCanvas: document.getElementById('rollingChart'),
  corrA: document.getElementById('corr-a'),
  corrB: document.getElementById('corr-b'),

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
  renderWatchlist();
  renderWatchButton();
  setupEventListeners();
  setupPortfolioListeners();
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

  const count = [hasNewsApi, hasTwelve, hasRouter].filter(Boolean).length;

  // Say what is actually configured. The old copy read "Verified S&P 500 Data
  // Active" even with zero keys, which claimed live data the app did not have.
  if (count === 3) {
    el.apiStatusLabel.textContent = 'All keys set';
    el.apiStatusDot.className = 'status-dot is-ok';
    el.apiStatusPing.className = 'status-ping is-ok';
  } else if (count > 0) {
    el.apiStatusLabel.textContent = `${count} of 3 keys`;
    el.apiStatusDot.className = 'status-dot is-partial';
    el.apiStatusPing.className = 'status-ping is-partial';
  } else {
    el.apiStatusLabel.textContent = 'Demo mode';
    el.apiStatusDot.className = 'status-dot is-partial';
    el.apiStatusPing.className = 'status-ping is-partial';
  }

  const titles = [
    `NewsAPI: ${hasNewsApi ? 'set' : 'not set'}`,
    `Twelve Data: ${hasTwelve ? 'set' : 'not set'}`,
    `OpenRouter: ${hasRouter ? 'set' : 'not set'}`
  ].join(' · ');
  el.btnOpenApiModal?.setAttribute('title', titles);
  el.btnOpenApiModal?.setAttribute('aria-label', `API keys — ${titles}`);
}

// TOP MARKET TICKER TAPE
function renderTickerTape() {
  // `ticker` is only set for entries that are actually tradable symbols in the dataset.
  // Indices and rates are display-only — clicking them used to load a bogus "S&P"/"10Y" ticker.
  const tapeItems = [
    { label: 'S&P 500', price: '5,640.20', change: '+0.84%', up: true },
    { label: 'NASDAQ', price: '18,210.80', change: '+1.42%', up: true },
    { label: 'DOW JONES', price: '40,890.15', change: '+0.28%', up: true },
    { label: '10Y TREASURY', price: '3.88%', change: '-0.04', up: false },
    { label: 'NVDA', ticker: 'NVDA', price: '$148.25', change: '+3.42%', up: true },
    { label: 'AAPL', ticker: 'AAPL', price: '$238.90', change: '+0.85%', up: true },
    { label: 'MSFT', ticker: 'MSFT', price: '$462.10', change: '+1.25%', up: true },
    { label: 'TSLA', ticker: 'TSLA', price: '$254.60', change: '-1.15%', up: false },
    { label: 'META', ticker: 'META', price: '$542.80', change: '+2.10%', up: true }
  ];

  // Duplicate for smooth seamless loop
  const list = [...tapeItems, ...tapeItems];

  el.tickerTape.innerHTML = list
    .map(item => {
      const interactive = Boolean(item.ticker);
      const tag = interactive ? 'button' : 'div';
      const attrs = interactive
        ? ` type="button" tabindex="-1" data-tape-symbol="${escapeHtml(item.ticker)}" class="tape-item tape-item--link"`
        : ' class="tape-item"';
      return `
    <${tag}${attrs}>
      <span class="tape-label">${escapeHtml(item.label)}</span>
      <span class="tape-price">${escapeHtml(item.price)}</span>
      <span class="tape-delta ${item.up ? 'is-up' : 'is-down'}">${escapeHtml(item.change)}</span>
    </${tag}>`;
    })
    .join('<span class="tape-sep" aria-hidden="true">•</span>');
}

// QUICK TICKER SELECTION PILLS
function renderQuickTickerPills() {
  el.quickTickerPills.innerHTML = POPULAR_TICKERS.map(t => {
    const isActive = t.symbol === state.ticker;
    return `
      <button
        type="button"
        data-symbol="${escapeHtml(t.symbol)}"
        class="chip${isActive ? ' is-active' : ''}"
        ${isActive ? 'aria-current="true"' : ''}
      >
        <span class="chip__sym">${escapeHtml(t.symbol)}</span>
        <span class="chip__delta ${t.changePct >= 0 ? 'is-up' : 'is-down'}">${t.changePct >= 0 ? '+' : ''}${t.changePct}%</span>
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
    renderDataSourceBadge();
    renderWatchButton();
    renderWatchlist();
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    showToast(`Could not load ${state.ticker}: ${err.message}`, 'error');
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

// ---------------------------------------------------------------- WATCHLIST --
// A small persisted set of symbols, surfaced as a row of chips next to Trending.

function getWatchlist() {
  try {
    const raw = JSON.parse(localStorage.getItem('aura_watchlist') || '[]');
    return Array.isArray(raw) ? raw.filter(s => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function setWatchlist(list) {
  localStorage.setItem('aura_watchlist', JSON.stringify([...new Set(list)].slice(0, 12)));
}

function toggleWatch(symbol) {
  const sym = symbol.toUpperCase();
  const list = getWatchlist();
  const next = list.includes(sym) ? list.filter(s => s !== sym) : [...list, sym];
  setWatchlist(next);
  showToast(list.includes(sym) ? `${sym} removed from watchlist` : `${sym} added to watchlist`);
  renderWatchlist();
  renderWatchButton();
}

function renderWatchButton() {
  if (!el.btnWatch) return;
  const watched = getWatchlist().includes(state.ticker);
  el.btnWatch.setAttribute('aria-pressed', String(watched));
  el.btnWatch.classList.toggle('is-on', watched);
  el.btnWatch.title = watched ? `Remove ${state.ticker} from watchlist` : `Add ${state.ticker} to watchlist`;
  el.btnWatch.setAttribute('aria-label', el.btnWatch.title);
}

function renderWatchlist() {
  if (!el.watchlist) return;
  const list = getWatchlist();
  el.watchlistWrap?.classList.toggle('hidden', list.length === 0);
  el.watchlist.innerHTML = list
    .map(
      sym => `<button type="button" class="chip chip--sm${sym === state.ticker ? ' is-active' : ''}" data-symbol="${escapeHtml(sym)}">
        <span class="chip__sym">${escapeHtml(sym)}</span>
      </button>`
    )
    .join('');
}

/** Transient status message. Announced politely so screen readers pick it up. */
let toastTimer = null;
function showToast(message, kind = 'info') {
  const region = el.toastRegion;
  if (!region) return;
  region.innerHTML = `<div class="toast toast--${kind}">${escapeHtml(message)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    region.innerHTML = '';
  }, 6000);
}

/** Reflect whether the chart is showing live vendor bars or the generated model series. */
function renderDataSourceBadge() {
  if (!el.dataSourceBadge) return;
  const src = getLastDataSource();
  const live = src.kind === 'live';
  el.dataSourceBadge.textContent = live ? 'Live market data' : 'Model dataset';
  el.dataSourceBadge.className = `tag ${live ? 'is-up' : 'is-flat'}`;
  el.dataSourceBadge.title = live
    ? 'Daily bars from Twelve Data'
    : `Generated 2026 series — ${src.detail}. Add a Twelve Data key for live bars.`;
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

  // Treat a change that rounds to zero as flat rather than showing "▲ +$0.00"
  const flat = Math.abs(m.dayPctChange) < 0.005;
  const isUp = m.dayChange >= 0;
  const tone = flat ? 'is-flat' : isUp ? 'is-up' : 'is-down';
  el.heroChangeContainer.className = `delta-chip ${tone}`;
  el.heroChangeIcon.textContent = flat ? '■' : isUp ? '▲' : '▼';
  el.heroChangeDollar.textContent = flat
    ? 'Unchanged'
    : `${isUp ? '+' : ''}$${m.dayChange.toFixed(2)}`;
  el.heroChangePct.textContent = flat ? '' : `(${isUp ? '+' : ''}${m.dayPctChange.toFixed(2)}%)`;

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
    // Fundamentals always come from the bundled S&P 500 reference set, never live
    el.fundamentalsBadge.textContent = 'Reference data';
    el.fundamentalsBadge.className = 'tag is-neutral';
  }

  el.mCap.textContent = c.marketCap;
  el.mPe.textContent = c.peRatio !== 'N/A' ? `${c.peRatio}x` : 'N/A';
  el.mFwdPe.textContent = c.forwardPe !== 'N/A' ? `${c.forwardPe}x` : 'N/A';
  el.mEpsGrowth.textContent = c.epsGrowth2026;
  el.mRevGrowth.textContent = c.revenueGrowth;
  el.mFcf.textContent = c.freeCashFlow;
  el.mBeta.textContent = c.beta;
  el.mTarget.innerHTML = `${escapeHtml(c.targetPrice)} <span class="metric__delta ${
    String(c.upsidePct).startsWith('-') ? 'is-down' : 'is-up'
  }">${escapeHtml(c.upsidePct)}</span>`;
}

// RENDER PRICE CHART WITH CHART.JS
function renderChart() {
  if (!state.priceData || state.priceData.length === 0) return;

  // Filter bars based on timeframe
  const allBars = state.priceData;
  const filteredBars = filterBarsByTimeframe(allBars, state.timeframe);
  // Indicators are computed over the FULL series and then sliced to the visible window,
  // so a 50/200 SMA is correct at the left edge of the view instead of starting at null.
  const offset = allBars.length - filteredBars.length;

  const labels = filteredBars.map(b => {
    const parts = b.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const closes = filteredBars.map(b => b.close);
  const volumes = filteredBars.map(b => b.volume);

  const sma50Values = calculateSMA(allBars, 50).slice(offset);
  const sma200Values = calculateSMA(allBars, 200).slice(offset);
  const bbFull = calculateBollingerBands(allBars, 20, 2);
  const bb = {
    upper: bbFull.upper.slice(offset),
    middle: bbFull.middle.slice(offset),
    lower: bbFull.lower.slice(offset)
  };

  // Set default readout to latest bar
  updateOhlcReadout(filteredBars[filteredBars.length - 1]);

  const ctx = el.chartCanvas.getContext('2d');

  // Palette tuned for the light paper ground
  const C = {
    up: '#1c6e46',
    down: '#a8492a',
    sma50: '#2f7d4f',
    sma200: '#d08b1f',
    band: 'rgba(47, 111, 134, 0.55)',
    bandFill: 'rgba(47, 111, 134, 0.08)',
    volUp: 'rgba(47, 125, 79, 0.30)',
    volDown: 'rgba(168, 73, 42, 0.22)',
    grid: 'rgba(20, 53, 42, 0.07)',
    tick: '#6b7a70'
  };

  // Area gradient — both stops in the same hue family, fading to transparent
  const isUpTrend = closes[closes.length - 1] >= closes[0];
  const gradient = ctx.createLinearGradient(0, 0, 0, el.chartCanvas.clientHeight || 360);
  if (isUpTrend) {
    gradient.addColorStop(0, 'rgba(28, 110, 70, 0.22)');
    gradient.addColorStop(1, 'rgba(28, 110, 70, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(168, 73, 42, 0.20)');
    gradient.addColorStop(1, 'rgba(168, 73, 42, 0)');
  }

  const primaryColor = isUpTrend ? C.up : C.down;

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
    // Wick and body share one x slot: `grouped: false` overlays them instead of
    // placing them side by side, which is what makes it read as a candle.
    datasets.push({
      label: `${state.ticker} High-Low`,
      data: filteredBars.map(b => [b.low, b.high]),
      type: 'bar',
      grouped: false,
      barThickness: 1.5,
      backgroundColor: filteredBars.map(b => (b.close >= b.open ? C.up : C.down)),
      yAxisID: 'y'
    });

    datasets.push({
      label: `${state.ticker} Candle Body`,
      data: filteredBars.map(b => [Math.min(b.open, b.close), Math.max(b.open, b.close)]),
      type: 'bar',
      grouped: false,
      barThickness: Math.max(3, Math.min(11, 420 / filteredBars.length)),
      backgroundColor: filteredBars.map(b => (b.close >= b.open ? C.up : C.down)),
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.sma50) {
    datasets.push({
      label: '50 SMA',
      data: sma50Values,
      borderColor: C.sma50,
      borderWidth: 1.5,
      borderDash: [5, 4],
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
      borderColor: C.sma200,
      borderWidth: 1.5,
      borderDash: [2, 3],
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
      borderColor: C.band,
      borderWidth: 1,
      fill: false,
      pointRadius: 0,
      yAxisID: 'y'
    });
    datasets.push({
      label: 'Lower BB',
      data: bb.lower,
      borderColor: C.band,
      borderWidth: 1,
      fill: '-1',
      backgroundColor: C.bandFill,
      pointRadius: 0,
      yAxisID: 'y'
    });
  }

  if (state.activeOverlays.volume) {
    // Volume rides its own hidden axis so it never compresses the price scale.
    datasets.push({
      label: 'Volume',
      data: volumes,
      type: 'bar',
      backgroundColor: closes.map((c, i) => (i > 0 && c >= closes[i - 1] ? C.volUp : C.volDown)),
      borderWidth: 0,
      barPercentage: 0.62,
      categoryPercentage: 0.92,
      yAxisID: 'yVol',
      order: 10
    });
  }

  if (priceChartInstance) {
    priceChartInstance.destroy();
  }

  // Snap the readout back to the most recent bar when the pointer leaves, so it
  // never sits frozen on whatever was last hovered.
  if (!el.chartCanvas.dataset.leaveBound) {
    el.chartCanvas.addEventListener('mouseleave', () => {
      const bars = filterBarsByTimeframe(state.priceData, state.timeframe);
      updateOhlcReadout(bars[bars.length - 1]);
    });
    el.chartCanvas.dataset.leaveBound = '1';
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
          grid: { color: C.grid, drawTicks: false },
          border: { display: false },
          ticks: { color: C.tick, font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 10, padding: 6 }
        },
        yVol: {
          // Hidden axis for the volume bars. Capped at 4x peak volume so the bars
          // occupy roughly the bottom quarter and never intrude on the price line.
          display: false,
          beginAtZero: true,
          max: Math.max(...volumes) * 4,
          grid: { display: false }
        },
        y: {
          position: 'right',
          // Never anchor the price scale at zero — it flattens the series.
          beginAtZero: false,
          grace: '8%',
          grid: { color: C.grid, drawTicks: false },
          border: { display: false },
          ticks: {
            color: C.tick,
            padding: 8,
            font: { family: 'JetBrains Mono', size: 11 },
            maxTicksLimit: 7,
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

// Approximate US trading days per window
const TIMEFRAME_BARS = { '1W': 5, '1M': 22, '3M': 65, '6M': 130, '1Y': 252 };

function filterBarsByTimeframe(data, tf) {
  if (!data || data.length === 0) return [];

  if (tf === 'YTD') {
    const latestYear = data[data.length - 1].date.slice(0, 4);
    const ytd = data.filter(b => b.date >= `${latestYear}-01-01`);
    // Fall back to ~6M if the dataset does not reach back to January
    return ytd.length > 5 ? ytd : data.slice(-TIMEFRAME_BARS['6M']);
  }

  const bars = TIMEFRAME_BARS[tf];
  return bars ? data.slice(-bars) : data.slice(-TIMEFRAME_BARS['3M']);
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

  // 2. RSI
  if (el.rsiValue) el.rsiValue.textContent = rsi.value;
  if (el.rsiStatusText) el.rsiStatusText.textContent = rsi.status;
  if (el.rsiBar) {
    el.rsiBar.style.width = `${Math.min(100, Math.max(5, rsi.value))}%`;
    // Bar colour tracks the zone, so the meter is readable without the label
    const zone = rsi.value >= 70 ? 'is-hot' : rsi.value <= 30 ? 'is-cold' : 'is-mid';
    el.rsiBar.className = `meter__fill ${zone}`;
  }

  if (el.rsiBadge) {
    if (rsi.value >= 70) {
      el.rsiBadge.textContent = 'OVERBOUGHT';
      el.rsiBadge.className = 'tag is-down';
    } else if (rsi.value <= 30) {
      el.rsiBadge.textContent = 'OVERSOLD';
      el.rsiBadge.className = 'tag is-up';
    } else if (rsi.value >= 60) {
      el.rsiBadge.textContent = 'BULLISH';
      el.rsiBadge.className = 'tag is-accent';
    } else {
      el.rsiBadge.textContent = 'NEUTRAL';
      el.rsiBadge.className = 'tag is-flat';
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
    el.macdValue.className = macd.histogram >= 0 ? 'stat-lg is-up' : 'stat-lg is-down';
  }
  if (el.macdStatusText) el.macdStatusText.textContent = macd.status;
  if (el.macdLineVal) el.macdLineVal.textContent = `${macd.macd >= 0 ? '+' : ''}${macd.macd}`;
  if (el.macdSignalVal) el.macdSignalVal.textContent = `${macd.signal >= 0 ? '+' : ''}${macd.signal}`;
  if (el.macdHistVal) {
    el.macdHistVal.textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram}`;
    el.macdHistVal.className = macd.histogram >= 0 ? 'num is-up' : 'num is-down';
  }
  if (el.macdBadge) {
    if (macd.histogram >= 0) {
      el.macdBadge.textContent = 'BULLISH CROSSOVER';
      el.macdBadge.className = 'tag is-up';
    } else {
      el.macdBadge.textContent = 'BEARISH CROSSOVER';
      el.macdBadge.className = 'tag is-down';
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
  // Keep these numeric — comparing the toFixed() string made "-0.0" test as >= 0
  // and render "+-0.0%".
  const diff50 = ((latestPrice - sma50) / sma50) * 100;
  const diff200 = ((latestPrice - sma200) / sma200) * 100;
  const fmtPct = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;

  if (el.maSma50Val) el.maSma50Val.textContent = `$${sma50.toFixed(2)}`;
  if (el.maSma50Diff) {
    el.maSma50Diff.textContent = `${fmtPct(diff50)}% vs 50D`;
    el.maSma50Diff.className = diff50 >= 0 ? 'num-sm is-up block' : 'num-sm is-down block';
  }
  if (el.maSma200Val) el.maSma200Val.textContent = `$${sma200.toFixed(2)}`;
  if (el.maSma200Diff) {
    el.maSma200Diff.textContent = `${fmtPct(diff200)}% vs 200D`;
    el.maSma200Diff.className = diff200 >= 0 ? 'num-sm is-up block' : 'num-sm is-down block';
  }
  if (el.maTrendBadge) {
    if (sma50 >= sma200) {
      el.maTrendBadge.textContent = 'GOLDEN CROSS ACTIVE';
      el.maTrendBadge.className = 'tag is-up';
    } else {
      el.maTrendBadge.textContent = 'DEATH CROSS / BEARISH';
      el.maTrendBadge.className = 'tag is-accent';
    }
  }
  if (el.maComment) {
    // Branch on the actual price/average relationship — the old `else` claimed the
    // price was below both averages in cases where it was above the 50-day.
    const above50 = latestPrice >= sma50;
    const above200 = latestPrice >= sma200;
    if (above50 && above200) {
      el.maComment.textContent = `Price sits ${fmtPct(diff50)}% against the 50D and ${fmtPct(diff200)}% against the 200D — both averages are support.`;
    } else if (!above50 && above200) {
      el.maComment.textContent = `Consolidating between the 50D SMA ($${sma50.toFixed(2)}) as resistance and the 200D SMA ($${sma200.toFixed(2)}) as support.`;
    } else if (above50 && !above200) {
      el.maComment.textContent = `Recovering above the 50D SMA ($${sma50.toFixed(2)}) but still below the 200D SMA ($${sma200.toFixed(2)}).`;
    } else {
      el.maComment.textContent = `Trading below both key averages; watching for stabilisation near major support.`;
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
      el.bbPosBadge.className = 'tag is-accent';
    } else if (pctB <= 20) {
      el.bbPosBadge.textContent = 'LOWER BAND TEST';
      el.bbPosBadge.className = 'tag is-accent';
    } else {
      el.bbPosBadge.textContent = 'MID CHANNEL';
      el.bbPosBadge.className = 'tag is-flat';
    }
  }

  if (el.bbComment) {
    el.bbComment.textContent = `Volatility bandwidth at ${bandwidth}%. Price trades at ${pctB}% position within the 20-period envelope.`;
  }
}

// AI RESEARCH SYNTHESIS LOADER
async function loadAiSynthesis() {
  el.aiNoteText.textContent = 'Generating research synthesis…';
  el.btnRegenerateAi.disabled = true;

  const preset = el.aiPresetSelect ? el.aiPresetSelect.value : 'General';
  try {
    state.aiSynthesis = await getAiResearchSynthesis(
      state.ticker,
      state.priceData,
      state.metrics,
      state.apiKeys.openRouter,
      preset
    );
    renderAiSynthesis();
  } catch (err) {
    console.error('AI synthesis failed:', err);
    el.aiNoteText.textContent = 'Could not generate the research note. Try again, or check your OpenRouter key.';
    showToast(`Research synthesis failed: ${err.message}`, 'error');
  } finally {
    // Always re-enable, otherwise one rejection disables the button for the session
    el.btnRegenerateAi.disabled = false;
  }
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
    el.aiDriversList.innerHTML = ai.keyDrivers
      .map(driver => `<li class="driver">${escapeHtml(driver)}</li>`)
      .join('');
  }
}

/** Only allow http(s) links through to an href. */
function safeUrl(url) {
  if (!url || url === '#') return null;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

// RENDER NEWS FEED
async function renderNewsFeed() {
  const news = await get2026MarketNews(state.ticker, state.apiKeys.newsApi);

  el.newsContainer.innerHTML = news
    .map(item => {
      const href = safeUrl(item.url);
      const impactClass =
        item.impact === 'Bullish' ? 'is-up' : item.impact === 'Bearish' ? 'is-down' : 'is-flat';
      return `
    <article class="news-card">
      <div class="news-card__body">
        <div class="news-card__meta">
          <span class="news-card__source">${escapeHtml(item.source)}${
            item.isLive ? '<span class="news-card__live">LIVE</span>' : ''
          }</span>
          <span class="news-card__time">${escapeHtml(item.time)}</span>
        </div>
        <h4 class="news-card__title">${escapeHtml(item.title)}</h4>
        <p class="news-card__snippet">${escapeHtml(item.snippet || '')}</p>
      </div>
      <div class="news-card__footer">
        <span class="tag ${impactClass}">${escapeHtml(item.impact)}</span>
        ${
          href
            ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="news-card__link">Read article →</a>`
            : '<span class="news-card__curated">Curated update</span>'
        }
      </div>
    </article>`;
    })
    .join('');
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
    const matches = searchSp500Companies(val).slice(0, 40);

    if (matches.length > 0) {
      el.dropdown.innerHTML = `
        <div class="dropdown__head">
          <span>${matches.length} match${matches.length === 1 ? '' : 'es'}</span>
          <span>↩ to select</span>
        </div>
        ${matches
          .map(
            m => `
          <button type="button" class="dropdown__row" data-symbol="${escapeHtml(m.symbol)}">
            <span class="dropdown__ident">
              <span class="dropdown__sym">${escapeHtml(m.symbol)}</span>
              <span class="dropdown__name">${escapeHtml(m.name)}</span>
            </span>
            <span class="dropdown__stats">
              <span class="dropdown__price">$${m.price.toFixed(2)}</span>
              <span class="dropdown__delta ${m.changePct >= 0 ? 'is-up' : 'is-down'}">${
                m.changePct >= 0 ? '+' : ''
              }${m.changePct}%</span>
            </span>
          </button>`
          )
          .join('')}
      `;
      el.dropdown.classList.remove('hidden');
    } else {
      const custom = val.toUpperCase();
      el.dropdown.innerHTML = `
        <button type="button" class="dropdown__empty" data-symbol="${escapeHtml(custom)}">
          Analyse custom ticker <strong>${escapeHtml(custom)}</strong> →
        </button>
      `;
      el.dropdown.classList.remove('hidden');
    }
  }

  // Delegated selection — avoids building inline onclick handlers from data values
  el.dropdown.addEventListener('click', (e) => {
    const row = e.target.closest('[data-symbol]');
    if (row) switchTicker(row.getAttribute('data-symbol'));
  });

  // Arrow-key navigation through the results, Enter to choose
  el.tickerSearch.addEventListener('keydown', (e) => {
    if (el.dropdown.classList.contains('hidden')) return;
    const rows = Array.from(el.dropdown.querySelectorAll('[data-symbol]'));
    if (rows.length === 0) return;
    const current = rows.findIndex(r => r.classList.contains('is-active'));

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next =
        e.key === 'ArrowDown'
          ? (current + 1) % rows.length
          : current <= 0
            ? rows.length - 1
            : current - 1;
      rows.forEach(r => r.classList.remove('is-active'));
      rows[next].classList.add('is-active');
      rows[next].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = current >= 0 ? rows[current] : rows[0];
      if (pick) switchTicker(pick.getAttribute('data-symbol'));
    }
  });

  el.tickerTape.addEventListener('click', (e) => {
    const item = e.target.closest('[data-tape-symbol]');
    if (item) switchTicker(item.getAttribute('data-tape-symbol'));
  });

  document.addEventListener('click', (e) => {
    if (!el.tickerSearch.contains(e.target) && !el.dropdown.contains(e.target)) {
      el.dropdown.classList.add('hidden');
    }
  });

  // Global Keyboard Shortcut Cmd+K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if (!((e.metaKey || e.ctrlKey) && e.key === 'k')) return;
    e.preventDefault();
    // The header search is hidden on narrow viewports; focusing a display:none
    // input does nothing, so fall back to the directory, which has its own search.
    if (el.tickerSearch.offsetParent !== null) {
      el.tickerSearch.focus();
    } else if (el.sp500Modal) {
      openModal(el.sp500Modal);
      renderSp500DirectoryTable();
      el.sp500ModalSearch?.focus();
    }
  });

  // Timeframe Pills
  const syncTimeframePills = () => {
    el.timeframePills.querySelectorAll('button').forEach(b => {
      const active = b.getAttribute('data-tf') === state.timeframe;
      b.className = active ? 'seg-btn is-active' : 'seg-btn';
      b.setAttribute('aria-pressed', String(active));
    });
  };

  el.timeframePills.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tf = btn.getAttribute('data-tf');
      if (!tf) return;
      state.timeframe = tf;
      localStorage.setItem('aura_timeframe', tf);
      syncTimeframePills();
      renderChart();
    });
  });

  // Restore whichever timeframe was last used
  syncTimeframePills();

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
      el.btnChartArea.className = 'seg-btn is-active';
      el.btnChartCandle.className = 'seg-btn';
      renderChart();
    });

    el.btnChartCandle.addEventListener('click', () => {
      state.chartStyle = 'candles';
      el.btnChartCandle.className = 'seg-btn is-active';
      el.btnChartArea.className = 'seg-btn';
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

  // Watchlist
  if (el.btnWatch) {
    el.btnWatch.addEventListener('click', () => toggleWatch(state.ticker));
  }
  if (el.watchlist) {
    el.watchlist.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-symbol]');
      if (chip) switchTicker(chip.getAttribute('data-symbol'));
    });
  }

  // Export the visible window as CSV
  if (el.btnExport) {
    el.btnExport.addEventListener('click', () => {
      const bars = filterBarsByTimeframe(state.priceData, state.timeframe);
      if (!bars.length) return showToast('Nothing to export yet', 'error');
      const rows = [
        ['date', 'open', 'high', 'low', 'close', 'volume'],
        ...bars.map(b => [b.date, b.open, b.high, b.low, b.close, b.volume])
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.ticker}-${state.timeframe}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${bars.length} bars for ${state.ticker}`);
    });
  }

  // API Modal Open / Close / Save
  el.btnOpenApiModal.addEventListener('click', () => {
    openModal(el.apiModal);
    if (el.newsApiInput) el.newsApiInput.focus();
  });

  el.btnCloseApiModal.addEventListener('click', () => closeModal(el.apiModal));
  el.btnCancelApiModal.addEventListener('click', () => closeModal(el.apiModal));

  el.apiKeysForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.apiKeys.newsApi = el.newsApiInput ? el.newsApiInput.value.trim() : '';
    state.apiKeys.twelveData = el.twelveDataInput ? el.twelveDataInput.value.trim() : '';
    state.apiKeys.openRouter = el.openRouterInput ? el.openRouterInput.value.trim() : '';

    localStorage.setItem('aura_newsapi_key', state.apiKeys.newsApi);
    localStorage.setItem('aura_twelvedata_key', state.apiKeys.twelveData);
    localStorage.setItem('aura_openrouter_key', state.apiKeys.openRouter);

    updateApiStatusBadge();
    closeModal(el.apiModal);
    loadDashboardData(state.ticker);
  });

  // S&P 500 Directory Modal Handlers
  if (el.btnOpenSp500Modal && el.sp500Modal) {
    el.btnOpenSp500Modal.addEventListener('click', () => {
      openModal(el.sp500Modal);
      renderSp500DirectoryTable();
      if (el.sp500ModalSearch) el.sp500ModalSearch.focus();
    });

    el.btnCloseSp500Modal.addEventListener('click', () => closeModal(el.sp500Modal));

    if (el.sp500ModalSearch) {
      el.sp500ModalSearch.addEventListener('input', renderSp500DirectoryTable);
    }

    if (el.sp500ModalSector) {
      el.sp500ModalSector.addEventListener('change', renderSp500DirectoryTable);
    }

    // Delegated row selection, mouse and keyboard
    if (el.sp500ModalTbody) {
      el.sp500ModalTbody.addEventListener('click', (e) => {
        const row = e.target.closest('[data-symbol]');
        if (row) switchTicker(row.getAttribute('data-symbol'));
      });
      el.sp500ModalTbody.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const row = e.target.closest('[data-symbol]');
        if (row) {
          e.preventDefault();
          switchTicker(row.getAttribute('data-symbol'));
        }
      });
    }
  }

  // Close any open modal on Escape, or by clicking the backdrop
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (el.apiModal && !el.apiModal.classList.contains('hidden')) closeModal(el.apiModal);
    if (el.sp500Modal && !el.sp500Modal.classList.contains('hidden')) closeModal(el.sp500Modal);
    if (el.dropdown) el.dropdown.classList.add('hidden');
  });

  [el.apiModal, el.sp500Modal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

// MODAL OPEN / CLOSE, restoring focus to whatever opened the dialog
let lastFocusedBeforeModal = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep Tab cycling inside the open dialog. */
function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = [el.apiModal, el.sp500Modal].find(m => m && !m.classList.contains('hidden'));
  if (!modal) return;

  const nodes = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(n => n.offsetParent !== null);
  if (nodes.length === 0) return;

  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openModal(modal) {
  if (!modal) return;
  lastFocusedBeforeModal = document.activeElement;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', trapFocus);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  if (
    (!el.apiModal || el.apiModal.classList.contains('hidden')) &&
    (!el.sp500Modal || el.sp500Modal.classList.contains('hidden'))
  ) {
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', trapFocus);
  }
  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
    lastFocusedBeforeModal.focus();
    lastFocusedBeforeModal = null;
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
        <td colspan="7" class="dir__empty">No companies match these filters.</td>
      </tr>
    `;
    return;
  }

  el.sp500ModalTbody.innerHTML = filtered
    .map(
      c => `
    <tr class="dir__row" data-symbol="${escapeHtml(c.symbol)}" tabindex="0" aria-label="Analyse ${escapeHtml(c.symbol)}">
      <td class="dir__cell">
        <div class="dir__sym">${escapeHtml(c.symbol)}</div>
        <div class="dir__name">${escapeHtml(c.name)}</div>
      </td>
      <td class="dir__cell"><span class="tag is-neutral">${escapeHtml(c.sector)}</span></td>
      <td class="dir__cell dir__num dir__num--strong">$${c.price.toFixed(2)}</td>
      <td class="dir__cell dir__num">${escapeHtml(c.cap)}</td>
      <td class="dir__cell dir__num">${escapeHtml(String(c.pe))}</td>
      <td class="dir__cell dir__num ${c.targetPrice && c.targetPrice >= c.price ? 'is-up' : c.targetPrice ? 'is-down' : ''}">${c.targetPrice ? '$' + c.targetPrice.toFixed(2) : '—'}</td>
      <td class="dir__cell dir__rating">
        <span class="tag ${c.rating === 'Strong Buy' ? 'is-up' : c.rating === 'Hold' ? 'is-flat' : 'is-accent'}">${escapeHtml(c.rating)}</span>
      </td>
    </tr>`
    )
    .join('');
}

function switchTicker(symbol) {
  if (!symbol) return;
  state.ticker = symbol.toUpperCase();
  el.tickerSearch.value = '';
  el.dropdown.classList.add('hidden');
  if (el.sp500Modal && !el.sp500Modal.classList.contains('hidden')) closeModal(el.sp500Modal);

  // Keep the URL and the remembered ticker in step, so the view is shareable
  localStorage.setItem('aura_last_ticker', state.ticker);
  const url = new URL(window.location.href);
  url.searchParams.set('symbol', state.ticker);
  window.history.replaceState({}, '', url);

  loadDashboardData(state.ticker);
}

/* ==========================================================================
   PORTFOLIO VIEW
   Prices -> simple returns -> covariance -> weights, plus rolling diagnostics.
   ========================================================================== */

const DEFAULT_BASKET = ['NVDA', 'AAPL', 'MSFT', 'JPM', 'LLY', 'XOM'];

const pf = {
  basket: loadBasket(),
  rollingMetric: 'correlation',
  pairA: null,
  pairB: null,
  data: null
};

let rollingChartInstance = null;

function loadBasket() {
  try {
    const raw = JSON.parse(localStorage.getItem('aura_basket') || 'null');
    if (Array.isArray(raw) && raw.length >= 2) return raw.slice(0, 8);
  } catch {
    /* fall through to default */
  }
  return [...DEFAULT_BASKET];
}

function saveBasket() {
  localStorage.setItem('aura_basket', JSON.stringify(pf.basket));
}

const rfValue = () => Math.max(0, Number(el.rfRate?.value ?? 3.5)) / 100;
const capValue = () => Math.min(1, Math.max(0.1, Number(el.weightCap?.value ?? 40) / 100));

const pct = (v, digits = 2) => `${v >= 0 ? '' : '−'}${Math.abs(v * 100).toFixed(digits)}%`;

/** Recompute everything from the current basket and inputs. */
function computePortfolio() {
  const symbols = pf.basket;
  if (symbols.length < 2) return null;

  const gen = generateBasketSeries(symbols, 500);
  const returns = {};
  for (const s of symbols) returns[s] = toSimpleReturns(gen.series[s].prices);
  const marketReturns = toSimpleReturns(gen.market.prices);

  const cov = covarianceMatrix(returns, symbols);
  const corr = correlationMatrix(returns, symbols);
  const meanDaily = symbols.map(s => avg(returns[s]));

  const rf = rfValue();
  const cap = capValue();

  const methods = [
    { key: 'equal', name: 'Equal weight', goal: 'nothing — a naive benchmark', weights: equalWeights(symbols.length) },
    { key: 'invvol', name: 'Inverse volatility', goal: 'lower risk, no solver', weights: inverseVolWeights(cov) },
    { key: 'minvar', name: 'Minimum variance', goal: 'lowest total risk', weights: minVarianceWeights(cov, cap) },
    { key: 'sharpe', name: 'Maximum Sharpe', goal: 'best return per unit of risk', weights: maxSharpeWeights(cov, meanDaily, rf, cap) }
  ];

  for (const m of methods) {
    m.daily = portfolioReturns(returns, symbols, m.weights);
    m.stats = portfolioStats(m.daily, rf);
  }

  return { symbols, gen, returns, marketReturns, cov, corr, methods, rf, sessions: returns[symbols[0]].length };
}

function renderPortfolio() {
  if (!el.viewPortfolio) return;
  if (pf.basket.length < 2) {
    el.methodCards.innerHTML = '<p class="text-[13px] text-ink-mute">Add at least two companies to the basket.</p>';
    el.methodTable.innerHTML = '';
    el.corrMatrix.innerHTML = '';
    renderBasketChips();
    return;
  }

  pf.data = computePortfolio();
  const d = pf.data;

  if (el.pfSampleNote) el.pfSampleNote.textContent = `${d.sessions} sessions · ${d.symbols.length} names`;

  renderBasketChips();
  renderMethodCards(d);
  renderMethodTable(d);
  renderCorrMatrix(d);
  syncPairSelects(d);
  renderRollingChart(d);
}

function renderBasketChips() {
  if (!el.basketChips) return;
  el.basketChips.innerHTML = pf.basket
    .map(
      sym => `<span class="basket-chip">
        <span class="chip__sym">${escapeHtml(sym)}</span>
        <button type="button" class="basket-chip__x" data-remove="${escapeHtml(sym)}"
          aria-label="Remove ${escapeHtml(sym)} from basket" ${pf.basket.length <= 2 ? 'disabled' : ''}>×</button>
      </span>`
    )
    .join('');

  // Keep the picker in sync with what is already held
  if (el.basketAdd) {
    const options = SP500_COMPANIES.filter(c => !pf.basket.includes(c.symbol))
      .map(c => `<option value="${escapeHtml(c.symbol)}">${escapeHtml(c.symbol)} — ${escapeHtml(c.name)}</option>`)
      .join('');
    el.basketAdd.innerHTML = `<option value="">Add a company…</option>${options}`;
    el.basketAdd.disabled = pf.basket.length >= 8;
  }
}

function renderMethodCards(d) {
  const palette = ['#24693b', '#4c9f5e', '#8cc096', '#d08b1f', '#b3542f', '#2f6f86', '#8b9477', '#14352a'];
  el.methodCards.innerHTML = d.methods
    .map(m => {
      const bars = d.symbols
        .map((s, i) => {
          const w = m.weights[i];
          if (w < 0.001) return '';
          return `<span class="wbar__seg" style="width:${(w * 100).toFixed(2)}%;background:${palette[i % palette.length]}" title="${escapeHtml(s)} ${(w * 100).toFixed(1)}%"></span>`;
        })
        .join('');
      const rows = d.symbols
        .map((s, i) => ({ s, w: m.weights[i], c: palette[i % palette.length] }))
        .filter(x => x.w >= 0.001)
        .sort((a, b) => b.w - a.w)
        .map(
          x => `<li class="wlist__row">
            <span class="wlist__dot" style="background:${x.c}"></span>
            <span class="wlist__sym">${escapeHtml(x.s)}</span>
            <span class="wlist__pct">${(x.w * 100).toFixed(1)}%</span>
          </li>`
        )
        .join('');
      return `<article class="card--quiet rounded-xl2 p-4 flex flex-col gap-3">
        <div>
          <h3 class="text-[13px] font-bold text-ink">${escapeHtml(m.name)}</h3>
          <p class="text-[11px] text-ink-mute leading-snug">${escapeHtml(m.goal)}</p>
        </div>
        <div class="wbar" role="img" aria-label="Weight allocation for ${escapeHtml(m.name)}">${bars}</div>
        <ul class="wlist">${rows}</ul>
      </article>`;
    })
    .join('');
}

function renderMethodTable(d) {
  const bestVol = Math.min(...d.methods.map(m => m.stats.annVol));
  const bestSharpe = Math.max(...d.methods.map(m => m.stats.sharpe));

  el.methodTable.innerHTML = d.methods
    .map(m => {
      const volWin = Math.abs(m.stats.annVol - bestVol) < 1e-9;
      const shWin = Math.abs(m.stats.sharpe - bestSharpe) < 1e-9;
      return `<tr class="border-b border-line last:border-0">
        <td class="py-2.5 pr-3 text-[13px] font-semibold text-ink">${escapeHtml(m.name)}</td>
        <td class="py-2.5 px-3 text-[12px] text-ink-mute">${escapeHtml(m.goal)}</td>
        <td class="py-2.5 px-3 text-right num text-[12.5px] ${m.stats.annReturn >= 0 ? 'is-up' : 'is-down'}">${pct(m.stats.annReturn)}</td>
        <td class="py-2.5 px-3 text-right num text-[12.5px] ${volWin ? 'cell-win' : 'text-ink'}">${pct(m.stats.annVol)}${volWin ? ' <span class="cell-win__mark">best</span>' : ''}</td>
        <td class="py-2.5 pl-3 text-right num text-[12.5px] ${shWin ? 'cell-win' : 'text-ink'}">${m.stats.sharpe.toFixed(2)}${shWin ? ' <span class="cell-win__mark">best</span>' : ''}</td>
      </tr>`;
    })
    .join('');
}

function renderCorrMatrix(d) {
  const { symbols, corr } = d;
  // Diverging scale pivoted at 0.45 — a typical large-cap equity correlation.
  // Below that a pair is genuinely diversifying (green); well above it the pair
  // is moving together (clay). A flat green/red split at zero would paint every
  // ordinary 0.5 correlation as alarming.
  const GREEN = [47, 125, 79];
  const NEUTRAL = [238, 240, 228];
  const CLAY = [176, 84, 47];
  const lerp = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const cellColor = (v) => {
    const c = v <= 0.45
      ? lerp(GREEN, NEUTRAL, Math.max(0, Math.min(1, (v + 1) / 1.45)))
      : lerp(NEUTRAL, CLAY, Math.max(0, Math.min(1, (v - 0.45) / 0.55)));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };

  const head = `<tr><th class="corr__corner"></th>${symbols
    .map(s => `<th scope="col" class="corr__head">${escapeHtml(s)}</th>`)
    .join('')}</tr>`;

  const body = symbols
    .map(
      (si, i) => `<tr>
        <th scope="row" class="corr__row-head">${escapeHtml(si)}</th>
        ${symbols
          .map((sj, j) => {
            const v = corr[i][j];
            const self = i === j;
            return `<td class="corr__cell${self ? ' is-self' : ''}" style="${self ? '' : `background:${cellColor(v)}`}"
              title="${escapeHtml(si)} vs ${escapeHtml(sj)}: ${v.toFixed(2)}">${v.toFixed(2)}</td>`;
          })
          .join('')}
      </tr>`
    )
    .join('');

  const offDiag = [];
  corr.forEach((row, i) => row.forEach((v, j) => { if (i < j) offDiag.push(v); }));
  const meanCorr = offDiag.length ? avg(offDiag) : 0;

  el.corrMatrix.innerHTML = `<table class="corr"><caption class="sr-only">Correlation of daily returns between basket members</caption>${head}${body}</table>
    <p class="text-[11.5px] text-ink-mute mt-3">
      Average pairwise correlation <strong class="font-mono text-ink">${meanCorr.toFixed(2)}</strong>.
      Lower is better for diversification.
    </p>`;
}

function syncPairSelects(d) {
  if (!el.corrA || !el.corrB) return;
  if (!d.symbols.includes(pf.pairA)) pf.pairA = d.symbols[0];
  if (!d.symbols.includes(pf.pairB) || pf.pairB === pf.pairA) {
    pf.pairB = d.symbols.find(s => s !== pf.pairA) || d.symbols[0];
  }
  const opts = (sel) =>
    d.symbols.map(s => `<option value="${escapeHtml(s)}"${s === sel ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('');
  el.corrA.innerHTML = opts(pf.pairA);
  el.corrB.innerHTML = opts(pf.pairB);
}

function renderRollingChart(d) {
  if (!el.rollingCanvas) return;
  const labels = d.gen.dates.slice(1).map(x => x.slice(2, 7));
  const C = { w30: '#d08b1f', w90: '#24693b', zero: 'rgba(20,53,42,0.25)', grid: 'rgba(20,53,42,0.07)', tick: '#516652' };

  let datasets = [];
  let note = '';
  let suggested = {};

  if (pf.rollingMetric === 'correlation') {
    const a = d.returns[pf.pairA];
    const b = d.returns[pf.pairB];
    datasets = [
      { label: '30-day', data: rollingCorrelation(a, b, 30), borderColor: C.w30, borderWidth: 1.4, pointRadius: 0, tension: 0.15, spanGaps: false },
      { label: '90-day', data: rollingCorrelation(a, b, 90), borderColor: C.w90, borderWidth: 2.4, pointRadius: 0, tension: 0.15, spanGaps: false }
    ];
    note = `Rolling correlation of ${pf.pairA} against ${pf.pairB}. The 30-day window is reactive and noisy; the 90-day window is smooth and slow. Watch both climb in the stressed second half — correlations drift toward 1 exactly when diversification is needed most, which a single averaged number never reveals.`;
    suggested = { min: -1, max: 1 };
  } else if (pf.rollingMetric === 'sharpe') {
    const eq = d.methods.find(m => m.key === 'equal');
    const mv = d.methods.find(m => m.key === 'minvar');
    datasets = [
      { label: 'Equal weight', data: rollingSharpe(eq.daily, d.rf, 90), borderColor: C.w30, borderWidth: 1.6, pointRadius: 0, tension: 0.15 },
      { label: 'Minimum variance', data: rollingSharpe(mv.daily, d.rf, 90), borderColor: C.w90, borderWidth: 2.4, pointRadius: 0, tension: 0.15 }
    ];
    note = 'Rolling 90-day Sharpe, annualised by √252. A reading near or below zero means the portfolio was not being paid for the risk it carried.';
  } else {
    const eq = d.methods.find(m => m.key === 'equal');
    const mv = d.methods.find(m => m.key === 'minvar');
    datasets = [
      { label: 'Equal weight', data: rollingBeta(eq.daily, d.marketReturns, 90), borderColor: C.w30, borderWidth: 1.6, pointRadius: 0, tension: 0.15 },
      { label: 'Minimum variance', data: rollingBeta(mv.daily, d.marketReturns, 90), borderColor: C.w90, borderWidth: 2.4, pointRadius: 0, tension: 0.15 }
    ];
    note = 'Rolling 90-day beta against SPY. 1.0 moves with the market, above is more volatile, below is calmer. Beta drifting while your holdings sit still means your risk profile is changing underneath you.';
  }

  if (el.rollingNote) el.rollingNote.textContent = note;
  if (el.rollingControls) el.rollingControls.classList.toggle('hidden', pf.rollingMetric !== 'correlation');
  if (el.rollingControls && pf.rollingMetric === 'correlation') el.rollingControls.classList.add('flex');

  if (rollingChartInstance) rollingChartInstance.destroy();
  rollingChartInstance = new Chart(el.rollingCanvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded',
                    color: '#46574c', font: { family: 'Archivo', size: 11 } }
        },
        tooltip: {
          backgroundColor: '#14352a', titleFont: { family: 'JetBrains Mono', size: 11 },
          bodyFont: { family: 'JetBrains Mono', size: 11 }, padding: 9, displayColors: true,
          callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y === null ? '—' : c.parsed.y.toFixed(2)}` }
        }
      },
      scales: {
        x: {
          grid: { color: C.grid, drawTicks: false },
          border: { display: false },
          ticks: { color: C.tick, font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 10, padding: 6 }
        },
        y: {
          position: 'right',
          ...suggested,
          grid: { color: C.grid, drawTicks: false },
          border: { display: false },
          ticks: { color: C.tick, font: { family: 'JetBrains Mono', size: 11 }, padding: 8,
                   callback: (v) => Number(v).toFixed(1) }
        }
      }
    }
  });
}

/* ------------------------------------------------------------ view routing --- */

function currentView() {
  return window.location.hash.replace('#', '') === 'portfolio' ? 'portfolio' : 'markets';
}

function setView(view, { push = true } = {}) {
  const target = view === 'portfolio' ? 'portfolio' : 'markets';
  el.viewMarkets?.classList.toggle('hidden', target !== 'markets');
  el.viewPortfolio?.classList.toggle('hidden', target !== 'portfolio');

  el.viewNav?.querySelectorAll('button').forEach(b => {
    const active = b.getAttribute('data-view') === target;
    b.className = active ? 'seg-btn is-active' : 'seg-btn';
    b.setAttribute('aria-current', active ? 'page' : 'false');
  });

  if (push) {
    const hash = target === 'portfolio' ? '#portfolio' : '';
    if ((window.location.hash || '') !== hash) {
      history.replaceState({}, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  if (target === 'portfolio' && !pf.data) renderPortfolio();
  // Chart.js needs a resize once its container stops being display:none
  if (target === 'portfolio' && rollingChartInstance) rollingChartInstance.resize();
  if (target === 'markets' && priceChartInstance) priceChartInstance.resize();
}

function setupPortfolioListeners() {
  if (!el.viewPortfolio) return;

  el.viewNav?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) setView(btn.getAttribute('data-view'));
  });

  window.addEventListener('hashchange', () => setView(currentView(), { push: false }));

  el.basketChips?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn || pf.basket.length <= 2) return;
    pf.basket = pf.basket.filter(s => s !== btn.getAttribute('data-remove'));
    saveBasket();
    renderPortfolio();
  });

  el.basketAdd?.addEventListener('change', () => {
    const sym = el.basketAdd.value;
    if (!sym) return;
    if (pf.basket.length >= 8) {
      showToast('Basket is capped at 8 names', 'error');
    } else if (!pf.basket.includes(sym)) {
      pf.basket.push(sym);
      saveBasket();
      renderPortfolio();
    }
    el.basketAdd.value = '';
  });

  el.btnBasketReset?.addEventListener('click', () => {
    pf.basket = [...DEFAULT_BASKET];
    saveBasket();
    renderPortfolio();
    showToast('Basket reset');
  });

  let debounce = null;
  const reRender = () => {
    clearTimeout(debounce);
    debounce = setTimeout(renderPortfolio, 220);
  };
  el.rfRate?.addEventListener('input', reRender);
  el.weightCap?.addEventListener('input', reRender);

  el.rollingTabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-roll]');
    if (!btn) return;
    pf.rollingMetric = btn.getAttribute('data-roll');
    el.rollingTabs.querySelectorAll('button').forEach(b => {
      const active = b === btn;
      b.className = active ? 'seg-btn is-active' : 'seg-btn';
      b.setAttribute('aria-pressed', String(active));
    });
    if (pf.data) renderRollingChart(pf.data);
  });

  el.corrA?.addEventListener('change', () => { pf.pairA = el.corrA.value; if (pf.data) renderRollingChart(pf.data); });
  el.corrB?.addEventListener('change', () => { pf.pairB = el.corrB.value; if (pf.data) renderRollingChart(pf.data); });

  setView(currentView(), { push: false });
}
