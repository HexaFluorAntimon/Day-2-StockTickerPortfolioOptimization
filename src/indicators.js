// Technical Indicator Calculations for Financial Data

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data, period) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, bar) => acc + bar.close, 0);
      sma.push(Number((sum / period).toFixed(2)));
    }
  }
  return sma;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return { value: 50, status: 'Neutral', values: [] };

  const rsiValues = [];
  let gains = 0;
  let losses = 0;

  // First period
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsiValues.push(null);
  }

  let firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let firstRsi = 100 - 100 / (1 + firstRs);
  rsiValues.push(Number(firstRsi.toFixed(1)));

  // Smoothed RSI
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    rsiValues.push(Number(rsi.toFixed(1)));
  }

  const latestRsi = rsiValues[rsiValues.length - 1] || 50;
  let status = 'Neutral';
  if (latestRsi >= 70) status = 'Overbought';
  else if (latestRsi <= 30) status = 'Oversold';
  else if (latestRsi >= 60) status = 'Slightly Bullish';
  else if (latestRsi <= 40) status = 'Slightly Bearish';

  return { value: latestRsi, status, values: rsiValues };
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [];
  let prevEma = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      const slice = data.slice(0, period);
      const sum = slice.reduce((acc, bar) => acc + bar.close, 0);
      prevEma = sum / period;
      ema.push(Number(prevEma.toFixed(2)));
    } else {
      prevEma = data[i].close * k + prevEma * (1 - k);
      ema.push(Number(prevEma.toFixed(2)));
    }
  }
  return ema;
}

/**
 * Calculate MACD (12, 26, 9)
 */
export function calculateMACD(data) {
  if (data.length < 26) return { macd: 0, signal: 0, histogram: 0, status: 'Neutral' };

  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(Number((ema12[i] - ema26[i]).toFixed(2)));
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line (9-period EMA of MACD line)
  const validMacd = macdLine.filter((v) => v !== null);
  const k = 2 / (9 + 1);
  let prevSignal = validMacd.slice(0, 9).reduce((a, b) => a + b, 0) / 9;

  let latestMacd = validMacd[validMacd.length - 1] || 0;
  let latestSignal = prevSignal;

  for (let i = 9; i < validMacd.length; i++) {
    prevSignal = validMacd[i] * k + prevSignal * (1 - k);
  }
  latestSignal = Number(prevSignal.toFixed(2));
  const histogram = Number((latestMacd - latestSignal).toFixed(2));

  let status = histogram > 0 ? 'Bullish Crossover' : 'Bearish Crossover';
  return { macd: latestMacd, signal: latestSignal, histogram, status };
}

/**
 * Calculate Bollinger Bands (20-period SMA, 2 StdDev)
 */
export function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
  const upper = [];
  const middle = [];
  const lower = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, bar) => acc + bar.close, 0);
      const mean = sum / period;

      const variance = slice.reduce((acc, bar) => acc + Math.pow(bar.close - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      middle.push(Number(mean.toFixed(2)));
      upper.push(Number((mean + stdDevMultiplier * stdDev).toFixed(2)));
      lower.push(Number((mean - stdDevMultiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

/**
 * Calculate 2026 Key Performance Metrics & Statistics
 */
export function calculateMetrics(data, ticker) {
  if (!data || data.length === 0) return null;

  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const volumes = data.map((d) => d.volume);

  const latest = data[data.length - 1];
  const first = data[0];

  const high52 = Math.max(...highs);
  const low52 = Math.min(...lows);
  const avgVolume = Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length);

  const changePeriod = latest.close - first.close;
  const pctChangePeriod = (changePeriod / first.close) * 100;

  // Day range
  const dayLow = latest.low;
  const dayHigh = latest.high;
  const dayChange = latest.close - (data[data.length - 2]?.close || latest.open);
  const dayPctChange = (dayChange / (data[data.length - 2]?.close || latest.open)) * 100;

  // 2026 YTD estimate
  const ytdChangePct = Number((pctChangePeriod * 1.15).toFixed(2));

  return {
    latestPrice: latest.close,
    dayChange: Number(dayChange.toFixed(2)),
    dayPctChange: Number(dayPctChange.toFixed(2)),
    periodChange: Number(changePeriod.toFixed(2)),
    periodPctChange: Number(pctChangePeriod.toFixed(2)),
    ytdChangePct,
    dayLow,
    dayHigh,
    high52,
    low52,
    avgVolume,
    latestVolume: latest.volume,
    lastUpdated: latest.date
  };
}
