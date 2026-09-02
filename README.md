# Aura — Day 2: Portfolio Optimisation

Two-view single-page application. **Markets** analyses one equity at a time across a
79-name S&P 500 large-cap directory with live news; **Portfolio** builds a basket and
solves for its optimal weights with real quadratic programming, in the browser.

Built for **Generative AI in Finance**, Executive Academy WU (Aug 2026) — Day 2 repository.

**Live:** _enable GitHub Pages (Settings → Pages → Source: GitHub Actions), then the URL appears here_

> **Day 1 is the starting point** — one ticker, technical indicators, an LLM research note
> → [Day-1-StockTicker](https://github.com/HexaFluorAntimon/Day-1-StockTicker)

---

## What Day 2 adds

| | |
|---|---|
| **S&P 500 large-cap directory** | Searchable directory of 79 index constituents, replacing Day 1's nine-name reference set. Company fundamentals (P/E, growth, beta, analyst rating, target price) are a static reference snapshot, not live data — only prices and news are fetched. |
| **Live news** | NewsAPI headlines per ticker with a bullish / bearish / neutral read, replacing the curated feed. |
| **Portfolio view** | A second view, reachable from the header and deep-linkable by URL hash. |
| **Optimisation** | Minimum variance and maximum Sharpe solved with quadratic programming, plus inverse-volatility and equal-weight baselines. |
| **Risk analytics** | Covariance and correlation matrices, a diverging correlation heatmap, and rolling correlation, Sharpe and beta. |

## How the optimiser actually works

The weights are solved, not approximated. The app uses [`quadprog`](https://www.npmjs.com/package/quadprog)
— a JavaScript port of R's `quadprog`, implementing the **Goldfarb–Idnani dual active-set
method** — so both objectives are genuine constrained quadratic programs:

- **Minimum variance** — minimise `wᵀΣw` subject to `Σw = 1` and `0 ≤ wᵢ ≤ cap`.
- **Maximum Sharpe** — the Cornuejols–Tütüncü transformation turns the ratio into a QP in
  a scaled variable `y`, which is then normalised back to weights.

Because a sample covariance matrix from a short window is often only positive
*semi*-definite, a small ridge is added to Σ before solving. Solutions are verified against
the KKT conditions, and a projected-gradient fallback (Euclidean projection onto the capped
simplex) runs if the dual method fails to converge. A position cap — 40% by default — keeps
maximum Sharpe from collapsing onto a single name.

**All of it runs client-side.** There is no server and no solver service.

## The rule the app follows

**Arithmetic from the code, language from the model.** Every indicator, covariance,
weight and Sharpe ratio is computed in JavaScript. The LLM never calculates anything — it
only reads finished numbers and explains them. That split is what makes the output
checkable.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run build` produces a static `dist/`. Pushing to `main` deploys it to GitHub Pages via
`.github/workflows/deploy.yml`. **One-time setup:** Settings → Pages → Source: **GitHub
Actions**. Left on "Deploy from a branch", the build runs but its output is ignored and the
page comes out unstyled.

## API keys

All three are optional and entered in the app at run time. None is ever written to a file
or committed — they live in the browser tab only.

| Service | What it unlocks | Free key |
|---|---|---|
| Twelve Data | Real daily bars instead of the model series | [twelvedata.com](https://twelvedata.com/pricing) |
| OpenRouter | A live LLM research note instead of the offline fallback | [openrouter.ai](https://openrouter.ai/) |
| NewsAPI | Live headlines instead of the curated feed | [newsapi.org](https://newsapi.org/) |

Without keys the app is fully explorable — it labels the chart **Model dataset** and falls
back to an offline research note, rather than pretending the data is live.

> Because this is a static app with no backend, a typed key goes straight from the browser
> to the service over HTTPS. That is fine for a classroom or portfolio demo. A production
> app would proxy the calls so keys never reach the browser at all.

## Troubleshooting API errors

Failed calls surface the real reason as `(HTTP <code>) <hint> <message>`. Read the code first.

| Code | Meaning | What to do |
|---|---|---|
| 401 | Key invalid or missing | Recheck the pasted key, watch for a stray space |
| 402 | Out of credits (OpenRouter, paid model) | Add credit, or switch to a free model |
| 429 | Rate limited | Twelve Data's free plan allows 8 requests/minute, 800/day — wait and retry |
| 400 "Provider returned error" | The model provider rejected the request | Read the part after `[provider: ...]` |

The most common 400 is a reasoning model refusing a small token budget; `main.js` sets
`max_tokens: 2000` and `reasoning: { enabled: false }` to avoid it.

## Layout

```
index.html          markup, Tailwind theme tokens, both views
main.js             app state, rendering, Chart.js, view routing
style.css           design system: colour tokens and components
src/indicators.js   SMA, EMA, RSI, MACD, Bollinger, summary metrics
src/data.js         price fetch, LLM synthesis, fallback news
src/sp500.js        the S&P 500 directory and search
src/newsapi.js      live headline fetch and sentiment read
src/portfolio.js    returns, covariance, the QP solvers, rolling metrics
```

Asset paths are relative and `vite.config.js` sets `base: './'` — this is what makes the
site work under the `/<repo-name>/` subpath GitHub Pages uses. Do not give them a leading `/`.
