// Portfolio construction and rolling diagnostics.
//
// Mirrors the Day-2 handout: prices -> simple returns -> covariance matrix ->
// weights, plus rolling correlation / Sharpe / beta.
//
// The handout notes that the browser cannot easily run a quadratic program and
// therefore leans on inverse-volatility weighting. That heuristic is here and
// clearly labelled, but minimum-variance and maximum-Sharpe are also solved
// properly — by projected gradient descent onto the simplex {w : Σw = 1, w ≥ 0},
// which is small enough to run instantly for a handful of assets. That lets the
// comparison table show what inverse volatility actually gives up.

import { getSp500CompanyDetails } from './sp500.js';
import { solveQP } from 'quadprog';

export const TRADING_DAYS = 252;
export const MARKET_SYMBOL = 'SPY';

/* ------------------------------------------------------------------ data --- */

/** Deterministic PRNG so a basket produces the same series on every render. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSymbol(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Box–Muller standard normal from a uniform generator. */
function gauss(rand) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Generate correlated daily series for a basket via a single-factor model:
 *
 *   r_i,t = alpha_i + beta_i * r_market,t + eps_i,t
 *
 * Independent random walks (what the dashboard generator produces) would leave
 * every pair near zero correlation, which makes the covariance matrix — and so
 * the entire diversification argument — meaningless. Driving each name off a
 * shared market factor with its own published beta produces realistic
 * correlation structure, and makes rolling beta against the market meaningful.
 */
export function generateBasketSeries(symbols, days = 500) {
  const marketRand = mulberry32(0x5eed);
  const marketDaily = [];
  for (let t = 0; t < days; t++) {
    marketDaily.push(0.0003 + gauss(marketRand) * 0.0085);
  }

  // A calm first half and a stressed second half, so rolling views have
  // something real to show: in the stressed regime the factor dominates and
  // correlations drift toward 1, exactly as the handout warns.
  const stressStart = Math.floor(days * 0.62);
  const stressFactor = marketDaily.map((r, t) => (t >= stressStart ? r * 2.05 : r));

  const dates = [];
  const start = new Date('2026-08-03');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - Math.round(i * 1.4)); // ~1.4 calendar days per session
    dates.push(d.toISOString().slice(0, 10));
  }

  const series = {};
  for (const sym of symbols) {
    const details = getSp500CompanyDetails(sym);
    const beta = Number(details.beta) || 1;
    const rand = mulberry32(hashSymbol(sym));

    // Idiosyncratic vol: higher-beta names also carry more stock-specific noise
    const idioVol = 0.008 + (beta - 0.5) * 0.004;
    // Keep the spread in drift small. A wide alpha spread would hand maximum
    // Sharpe one obvious winner and collapse it onto a single name, which is an
    // artefact of the generator rather than anything the method teaches.
    const alpha = 0.00010 + ((hashSymbol(sym) % 7) - 3) * 0.000012;

    const daily = stressFactor.map((rm, t) => {
      const idioScale = t >= stressStart ? 1.15 : 1;
      return alpha + beta * rm + gauss(rand) * Math.max(0.002, idioVol) * idioScale;
    });

    // Rebuild a price path ending exactly on the reference price
    const prices = [];
    let p = 1;
    for (const r of daily) {
      p *= 1 + r;
      prices.push(p);
    }
    const scale = (Number(details.price) || 100) / prices[prices.length - 1];

    series[sym] = {
      symbol: sym,
      name: details.name,
      beta,
      prices: prices.map(v => Number((v * scale).toFixed(4))),
      returns: daily
    };
  }

  // The market proxy the handout uses (SPY) is the factor itself
  const marketPrices = [];
  let mp = 1;
  for (const r of stressFactor) {
    mp *= 1 + r;
    marketPrices.push(mp);
  }

  return {
    dates,
    series,
    market: {
      symbol: MARKET_SYMBOL,
      name: 'S&P 500 ETF (reference)',
      prices: marketPrices.map(v => Number((v * 560).toFixed(4))),
      returns: stressFactor
    },
    stressStart,
    source: 'model'
  };
}

/* ------------------------------------------------------------ live data --- */

/**
 * Fetch real daily closes for a basket (plus SPY as the market proxy) from
 * Twelve Data, and align every series onto the dates they all share.
 *
 * Alignment matters: two tickers can differ in history length or miss
 * different sessions (halts, listing dates, holidays on a dual listing). Zipping
 * unaligned series would pair Monday's return for one name with Tuesday's for
 * another and quietly corrupt every covariance in the matrix.
 *
 * Throws on any failure so the caller can fall back to the model series and say so.
 */
export async function fetchBasketSeries(symbols, apiKey, outputsize = 500) {
  if (!apiKey || apiKey.trim().length < 4) throw new Error('No Twelve Data key configured');
  const wanted = [...symbols, MARKET_SYMBOL];

  const fetchOne = async (sym) => {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(sym)}` +
      `&interval=1day&outputsize=${outputsize}&apikey=${apiKey.trim()}`;
    const res = await fetch(url);
    const body = await res.json().catch(() => null);
    if (!body) throw new Error(`${sym}: response was not JSON`);
    if (body.status === 'error') throw new Error(`${sym}: ${body.message || 'Twelve Data error'}`);
    if (!Array.isArray(body.values) || body.values.length === 0) throw new Error(`${sym}: no bars returned`);
    const byDate = new Map();
    for (const b of body.values) {
      const close = Number(b.close);
      if (Number.isFinite(close)) byDate.set(b.datetime, close);
    }
    return byDate;
  };

  // Sequential: the free plan allows 8 requests a minute, and firing a basket
  // in parallel is the quickest way to trip it.
  const raw = {};
  for (const sym of wanted) {
    raw[sym] = await fetchOne(sym);
  }

  // Intersect the dates present in every series, oldest first
  let common = null;
  for (const sym of wanted) {
    const dates = new Set(raw[sym].keys());
    common = common === null ? dates : new Set([...common].filter(d => dates.has(d)));
  }
  const dates = [...common].sort();
  if (dates.length < 60) {
    throw new Error(`only ${dates.length} overlapping sessions across the basket`);
  }

  const series = {};
  for (const sym of symbols) {
    const prices = dates.map(d => raw[sym].get(d));
    series[sym] = {
      symbol: sym,
      name: getSp500CompanyDetails(sym).name,
      beta: Number(getSp500CompanyDetails(sym).beta) || 1,
      prices,
      returns: toSimpleReturns(prices)
    };
  }
  const marketPrices = dates.map(d => raw[MARKET_SYMBOL].get(d));

  return {
    dates,
    series,
    market: {
      symbol: MARKET_SYMBOL,
      name: 'SPDR S&P 500 ETF',
      prices: marketPrices,
      returns: toSimpleReturns(marketPrices)
    },
    stressStart: null,
    source: 'live'
  };
}

/* --------------------------------------------------------------- returns --- */

/** Daily simple returns: r_t = (P_t − P_{t−1}) / P_{t−1} */
export function toSimpleReturns(prices) {
  const out = [];
  for (let i = 1; i < prices.length; i++) {
    out.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return out;
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Sample standard deviation (n − 1). */
export function stdDev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

export function covariance(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / (n - 1);
}

export function correlation(a, b) {
  const sa = stdDev(a);
  const sb = stdDev(b);
  return sa === 0 || sb === 0 ? 0 : covariance(a, b) / (sa * sb);
}

/** Covariance matrix of daily returns, in the given symbol order. */
export function covarianceMatrix(returnsBySymbol, symbols) {
  return symbols.map(si => symbols.map(sj => covariance(returnsBySymbol[si], returnsBySymbol[sj])));
}

export function correlationMatrix(returnsBySymbol, symbols) {
  return symbols.map(si => symbols.map(sj => correlation(returnsBySymbol[si], returnsBySymbol[sj])));
}

/* --------------------------------------------------------------- weights --- */

const matVec = (M, v) => M.map(row => row.reduce((acc, x, j) => acc + x * v[j], 0));
const dot = (a, b) => a.reduce((acc, x, i) => acc + x * b[i], 0);

/**
 * Euclidean projection onto the probability simplex {w : Σw = 1, w ≥ 0}.
 * Duchi et al. (2008). This is what keeps the optimiser long-only and fully
 * invested at every step.
 */
function projectToSimplex(v) {
  const n = v.length;
  const u = [...v].sort((a, b) => b - a);
  let cssv = 0;
  let rho = -1;
  let theta = 0;
  for (let i = 0; i < n; i++) {
    cssv += u[i];
    const t = (cssv - 1) / (i + 1);
    if (u[i] - t > 0) {
      rho = i;
      theta = t;
    }
  }
  if (rho === -1) return new Array(n).fill(1 / n);
  return v.map(x => Math.max(0, x - theta));
}

/**
 * Projection onto {w : Σw = 1, 0 ≤ w ≤ cap}.
 *
 * Without an upper bound, maximum Sharpe reliably dumps ~100% into whichever
 * name happened to post the best realised mean — sample means over a few
 * hundred days carry enormous standard error, so the "winner" is mostly luck.
 * A position cap is the standard practical remedy and is what keeps the result
 * spread over a few names, as the handout describes.
 *
 * w(θ) = clamp(v − θ, 0, cap) is monotone non-increasing in θ, so bisect on θ.
 */
function projectToCappedSimplex(v, cap) {
  const n = v.length;
  if (!(cap > 0) || cap >= 1) return projectToSimplex(v);
  if (cap * n <= 1) return new Array(n).fill(1 / n); // only the flat portfolio is feasible

  const clampSum = (theta) =>
    v.reduce((acc, x) => acc + Math.min(cap, Math.max(0, x - theta)), 0);

  let lo = Math.min(...v) - 1;
  let hi = Math.max(...v);
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (clampSum(mid) > 1) lo = mid;
    else hi = mid;
  }
  const theta = (lo + hi) / 2;
  return v.map(x => Math.min(cap, Math.max(0, x - theta)));
}

/* ------------------------------------------------ quadratic programming --- */
/*
 * The `quadprog` package is a direct JavaScript port of the R package of the
 * same name — the same Goldfarb & Idnani (1983) dual active-set method that
 * quadprog::solve.QP() runs in the course scripts. It solves
 *
 *     min  −d'b + ½ b'Db     subject to     A'b ≥ b0
 *
 * with the first `meq` constraints treated as equalities. Being an active-set
 * method it terminates in finitely many steps at the exact KKT point, rather
 * than approaching it the way gradient descent does.
 *
 * Its arrays are 1-indexed, a leftover from the Fortran original: index 0 of
 * every vector and of every matrix row is unused. The helpers below keep that
 * quirk contained.
 */

const toQpVec = (arr) => [0, ...arr];
/** Column-major: qp[i][j] is row i, column j, both 1-indexed. */
const toQpMat = (rows) => [0, ...rows.map(r => [0, ...r])];

/**
 * Add a tiny ridge to the diagonal. quadprog requires a strictly positive
 * definite D; a sample covariance matrix can be singular or near-singular when
 * two holdings are nearly identical or the history is short.
 */
function ridged(cov, epsilon = 1e-10) {
  const n = cov.length;
  const trace = cov.reduce((acc, row, i) => acc + row[i], 0);
  const lambda = Math.max(epsilon, (trace / n) * 1e-8);
  return cov.map((row, i) => row.map((x, j) => (i === j ? x + lambda : x)));
}

/**
 * Solve  min w'Σw  s.t.  Σw = 1, 0 ≤ w ≤ cap.
 * Returns null if the solver cannot reach a solution, so callers can fall back.
 */
export function minVarianceQP(cov, cap = 1) {
  const n = cov.length;
  if (n === 1) return [1];
  if (cap * n < 1 - 1e-12) return null; // infeasible: cap too tight to reach Σw = 1

  const useCap = cap < 1 - 1e-12;
  // Columns: [Σw = 1] [w_i ≥ 0]×n [−w_i ≥ −cap]×n
  const cols = [];
  cols.push(new Array(n).fill(1));
  for (let i = 0; i < n; i++) cols.push(Array.from({ length: n }, (_, k) => (k === i ? 1 : 0)));
  if (useCap) {
    for (let i = 0; i < n; i++) cols.push(Array.from({ length: n }, (_, k) => (k === i ? -1 : 0)));
  }
  const bvec = [1, ...new Array(n).fill(0), ...(useCap ? new Array(n).fill(-cap) : [])];

  // Amat[i][j] = coefficient of variable i in constraint j
  const Amat = Array.from({ length: n }, (_, i) => cols.map(c => c[i]));

  try {
    const res = solveQP(
      toQpMat(ridged(cov).map(r => r.map(x => 2 * x))), // D = 2Σ  ⇒ ½b'Db = b'Σb
      toQpVec(new Array(n).fill(0)),                    // d = 0
      toQpMat(Amat),
      toQpVec(bvec),
      1                                                 // first constraint is the equality
    );
    if (!res || !res.solution || res.message) return null;
    const w = res.solution.slice(1).map(x => (Math.abs(x) < 1e-11 ? 0 : x));
    return normaliseWeights(w, cap);
  } catch {
    return null;
  }
}

/**
 * Long-only maximum Sharpe as a single QP, via the standard transformation
 * (Cornuejols & Tütüncü). With excess returns μₑ = μ − rf, solving
 *
 *     min y'Σy   s.t.   μₑ'y = 1,  y ≥ 0
 *
 * and rescaling w = y / Σy gives the exact tangency portfolio. This is the
 * "quadprog reformulation offered as optional depth" the handout mentions —
 * it sidesteps the fact that a ratio of two functions of w cannot be handed to
 * a quadratic solver directly.
 *
 * A position cap becomes linear in y: wᵢ ≤ cap ⇔ yᵢ ≤ cap·Σy.
 * Requires at least one asset with positive excess return, else there is no
 * feasible point and the tangency portfolio is undefined.
 */
export function maxSharpeQP(cov, meanDaily, riskFreeAnnual, cap = 1) {
  const n = cov.length;
  if (n === 1) return [1];
  if (cap * n < 1 - 1e-12) return null;

  const rfDaily = riskFreeAnnual / TRADING_DAYS;
  const excess = meanDaily.map(m => m - rfDaily);
  if (Math.max(...excess) <= 1e-12) return null; // no asset beats the risk-free rate

  const useCap = cap < 1 - 1e-12;
  const cols = [];
  cols.push(excess);                                                  // μₑ'y = 1
  for (let i = 0; i < n; i++) cols.push(Array.from({ length: n }, (_, k) => (k === i ? 1 : 0)));
  if (useCap) {
    // cap·Σy − yᵢ ≥ 0
    for (let i = 0; i < n; i++) cols.push(Array.from({ length: n }, (_, k) => cap - (k === i ? 1 : 0)));
  }
  const bvec = [1, ...new Array(n).fill(0), ...(useCap ? new Array(n).fill(0) : [])];
  const Amat = Array.from({ length: n }, (_, i) => cols.map(c => c[i]));

  try {
    const res = solveQP(
      toQpMat(ridged(cov).map(r => r.map(x => 2 * x))),
      toQpVec(new Array(n).fill(0)),
      toQpMat(Amat),
      toQpVec(bvec),
      1
    );
    if (!res || !res.solution || res.message) return null;
    const y = res.solution.slice(1);
    const total = y.reduce((a, b) => a + b, 0);
    if (!(total > 1e-12) || !y.every(Number.isFinite)) return null;
    const w = y.map(v => Math.max(0, v) / total);
    return normaliseWeights(w, cap);
  } catch {
    return null;
  }
}

/** Clean up solver output: clip tiny negatives, respect the cap, sum to exactly 1. */
function normaliseWeights(w, cap) {
  let out = w.map(x => Math.min(cap, Math.max(0, x)));
  const total = out.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return null;
  out = out.map(x => x / total);
  // Renormalising can nudge a holding just past the cap; settle it in a few passes
  for (let pass = 0; pass < 20; pass++) {
    const over = out.reduce((acc, x) => acc + Math.max(0, x - cap), 0);
    if (over < 1e-12) break;
    const room = out.reduce((acc, x) => acc + (x < cap - 1e-12 ? cap - x : 0), 0);
    if (room < 1e-12) break;
    out = out.map(x => (x >= cap - 1e-12 ? cap : x + over * ((cap - x) / room)));
  }
  const t2 = out.reduce((a, b) => a + b, 0);
  return out.map(x => x / t2);
}

/** Naive 1/N benchmark. */
export function equalWeights(n) {
  return new Array(n).fill(1 / n);
}

/**
 * Inverse volatility: w_i = (1/σ_i) / Σ_j (1/σ_j)
 * The handout's browser stand-in for minimum variance. Note that it reads only
 * the diagonal of the covariance matrix — it ignores correlation entirely.
 */
export function inverseVolWeights(cov) {
  const inv = cov.map((row, i) => {
    const sd = Math.sqrt(Math.max(row[i], 1e-12));
    return 1 / sd;
  });
  const total = inv.reduce((a, b) => a + b, 0);
  return inv.map(x => x / total);
}

/** Long-only minimum variance: minimise w'Σw by projected gradient descent. */
export function minVarianceWeights(cov, cap = 1, iterations = 4000) {
  const n = cov.length;
  if (n === 1) return [1];
  let w = equalWeights(n);
  // Step size scaled to the problem so it is stable across volatility regimes
  const scale = Math.max(...cov.map((r, i) => r[i])) || 1e-6;
  const lr = 1 / (4 * n * scale);

  for (let k = 0; k < iterations; k++) {
    const grad = matVec(cov, w).map(x => 2 * x);
    w = projectToCappedSimplex(w.map((x, i) => x - lr * grad[i]), cap);
  }
  return w;
}

/**
 * Long-only maximum Sharpe: maximise (w'μ − rf) / sqrt(w'Σw).
 *
 * The ratio is not quadratic, so this uses projected gradient ascent from
 * several starting points and keeps the best — the handout's note that the
 * solver "cannot maximize it head on" is about quadprog specifically.
 */
export function maxSharpeWeights(cov, meanDaily, riskFreeAnnual, cap = 1, iterations = 3000) {
  const n = cov.length;
  if (n === 1) return [1];
  const rfDaily = riskFreeAnnual / TRADING_DAYS;
  const scale = Math.max(...cov.map((r, i) => r[i])) || 1e-6;
  const lr = Math.sqrt(scale) / 8;

  const sharpeOf = (w) => {
    const variance = dot(w, matVec(cov, w));
    const sd = Math.sqrt(Math.max(variance, 1e-16));
    return (dot(w, meanDaily) - rfDaily) / sd;
  };

  const starts = [projectToCappedSimplex(equalWeights(n), cap)];
  for (let s = 0; s < n; s++) {
    const w = new Array(n).fill(0.05 / n);
    w[s] = 1 - 0.05 + 0.05 / n;
    starts.push(projectToCappedSimplex(w, cap));
  }

  let best = starts[0];
  let bestScore = -Infinity;

  for (const start of starts) {
    let w = [...start];
    for (let k = 0; k < iterations; k++) {
      const Sw = matVec(cov, w);
      const variance = Math.max(dot(w, Sw), 1e-16);
      const sd = Math.sqrt(variance);
      const excess = dot(w, meanDaily) - rfDaily;
      // ∇S = μ/σ − (excess · Σw)/σ³
      const grad = meanDaily.map((mu, i) => mu / sd - (excess * Sw[i]) / (sd * variance));
      w = projectToCappedSimplex(w.map((x, i) => x + lr * grad[i]), cap);
    }
    const score = sharpeOf(w);
    if (Number.isFinite(score) && score > bestScore) {
      bestScore = score;
      best = w;
    }
  }
  return best;
}

/* ----------------------------------------------------------- portfolio ----- */

/** Daily portfolio return series for a set of weights. */
export function portfolioReturns(returnsBySymbol, symbols, weights) {
  const len = Math.min(...symbols.map(s => returnsBySymbol[s].length));
  const out = new Array(len).fill(0);
  symbols.forEach((s, i) => {
    const r = returnsBySymbol[s];
    for (let t = 0; t < len; t++) out[t] += weights[i] * r[t];
  });
  return out;
}

/** Annualised return, volatility and Sharpe for a daily return series. */
export function portfolioStats(daily, riskFreeAnnual) {
  const annReturn = mean(daily) * TRADING_DAYS;
  const annVol = stdDev(daily) * Math.sqrt(TRADING_DAYS);
  const sharpe = annVol === 0 ? 0 : (annReturn - riskFreeAnnual) / annVol;
  return { annReturn, annVol, sharpe };
}

/* ------------------------------------------------------------- rolling ----- */
// Every rolling metric starts late: it needs a full window before its first
// value. Leading slots are null so the series still lines up with the dates.

export function rollingCorrelation(a, b, window) {
  const out = new Array(a.length).fill(null);
  for (let t = window - 1; t < a.length; t++) {
    out[t] = correlation(a.slice(t - window + 1, t + 1), b.slice(t - window + 1, t + 1));
  }
  return out;
}

export function rollingSharpe(daily, riskFreeAnnual, window) {
  const rfDaily = riskFreeAnnual / TRADING_DAYS;
  const out = new Array(daily.length).fill(null);
  for (let t = window - 1; t < daily.length; t++) {
    const slice = daily.slice(t - window + 1, t + 1);
    const sd = stdDev(slice);
    out[t] = sd === 0 ? null : ((mean(slice) - rfDaily) / sd) * Math.sqrt(TRADING_DAYS);
  }
  return out;
}

export function rollingBeta(daily, marketDaily, window) {
  const out = new Array(daily.length).fill(null);
  for (let t = window - 1; t < daily.length; t++) {
    const p = daily.slice(t - window + 1, t + 1);
    const m = marketDaily.slice(t - window + 1, t + 1);
    const varM = covariance(m, m);
    out[t] = varM === 0 ? null : covariance(p, m) / varM;
  }
  return out;
}
