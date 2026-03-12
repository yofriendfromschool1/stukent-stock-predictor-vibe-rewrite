import { useEffect, useMemo, useState } from "react";

type RiskProfile = "conservative" | "balanced" | "aggressive";

type Company = {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  description: string;
  catalyst: string;
  sentiment: number;
  prices: number[];
};

type ForecastResult = {
  currentPrice: number;
  predictedPrice: number;
  expectedMovePct: number;
  lowRange: number;
  highRange: number;
  volatilityPct: number;
  confidence: number;
  action: "Accumulate" | "Watch" | "Reduce";
  allocationPct: number;
  reasons: string[];
};

type StoredState = {
  companies: Company[];
  riskProfile: RiskProfile;
  capital: number;
  bulkInput: string;
};

const STORAGE_KEY = "market-practice-forecaster:v1";

const DEMO_IMPORT = `Apex Retail, 42.1, 42.8, 43.4, 44.2, 45.3, 46.1
BlueNova Energy, 31.5, 31.2, 30.9, 31.6, 32.7, 33.4
Crest Mobile, 58.4, 57.9, 57.2, 56.8, 57.1, 57.7
Delta Foods, 24.6, 24.9, 25.5, 25.1, 25.8, 26.3`;

const SAMPLE_COMPANIES: Company[] = [
  {
    id: "apex-retail",
    name: "Apex Retail",
    ticker: "APXR",
    sector: "Consumer",
    description: "A large consumer brand with steady sales and moderate upside from seasonal demand.",
    catalyst: "Earnings quality is improving while trend strength remains positive.",
    sentiment: 26,
    prices: [42.1, 42.8, 43.4, 44.2, 45.3, 46.1],
  },
  {
    id: "bluenova-energy",
    name: "BlueNova Energy",
    ticker: "BNRG",
    sector: "Energy",
    description: "An energy name that tends to move sharply when commodity sentiment changes.",
    catalyst: "Momentum has turned up, but volatility remains elevated.",
    sentiment: 18,
    prices: [31.5, 31.2, 30.9, 31.6, 32.7, 33.4],
  },
  {
    id: "crest-mobile",
    name: "Crest Mobile",
    ticker: "CRMB",
    sector: "Technology",
    description: "A technology hardware company with mixed sentiment and a possible rebound setup.",
    catalyst: "Short-term weakness is stabilizing near the recent average price.",
    sentiment: 4,
    prices: [58.4, 57.9, 57.2, 56.8, 57.1, 57.7],
  },
  {
    id: "delta-foods",
    name: "Delta Foods",
    ticker: "DLTF",
    sector: "Staples",
    description: "A defensive company that often performs best in lower-volatility environments.",
    catalyst: "Lower volatility and consistent gains support a steadier forecast band.",
    sentiment: 22,
    prices: [24.6, 24.9, 25.5, 25.1, 25.8, 26.3],
  },
];

const riskDescriptions: Record<RiskProfile, string> = {
  conservative: "Smaller swings, tighter forecast ranges, lower allocations.",
  balanced: "Moderate allocations with trend and volatility weighted evenly.",
  aggressive: "Larger allocations and wider ranges for higher-risk scenarios.",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "company";
}

function buildTicker(name: string, fallbackIndex: number) {
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters.slice(0, 4) || `STK${fallbackIndex + 1}`).padEnd(4, "X").slice(0, 4);
}

function computeForecast(company: Company, riskProfile: RiskProfile): ForecastResult {
  const prices = company.prices;
  const currentPrice = prices[prices.length - 1] ?? 0;
  const returns = prices.slice(1).map((price, index) => (price - prices[index]) / prices[index]);
  const shortMomentum = average(returns.slice(-3));
  const longMomentum = average(returns);
  const overallTrend = prices.length > 1 ? (currentPrice - prices[0]) / prices[0] : 0;
  const meanGap = currentPrice / average(prices) - 1;
  const volatility = stdDev(returns);
  const sentimentBoost = clamp(company.sentiment, -100, 100) / 100 * 0.018;
  const riskBias = riskProfile === "aggressive" ? 0.0035 : riskProfile === "conservative" ? -0.0015 : 0;
  const damping = 1 - clamp(volatility * 5.4, 0, 0.48);

  const rawReturn =
    shortMomentum * 0.52 +
    longMomentum * 0.24 +
    overallTrend * 0.16 -
    meanGap * 0.14 +
    sentimentBoost +
    riskBias;

  const expectedReturn = rawReturn * damping;
  const predictedPrice = currentPrice * (1 + expectedReturn);
  const rangeMultiplier =
    riskProfile === "aggressive" ? 1.95 : riskProfile === "conservative" ? 1.15 : 1.5;
  const rangePct = Math.max(0.018, volatility * rangeMultiplier + 0.012);
  const lowRange = predictedPrice * (1 - rangePct);
  const highRange = predictedPrice * (1 + rangePct);
  const confidence = clamp(
    60 + Math.abs(expectedReturn) * 1500 - volatility * 950 - Math.abs(meanGap) * 130,
    37,
    93,
  );

  const action: ForecastResult["action"] =
    expectedReturn > 0.008 && confidence >= 58
      ? "Accumulate"
      : expectedReturn < -0.004
        ? "Reduce"
        : "Watch";

  const actionMultiplier = action === "Accumulate" ? 1 : action === "Watch" ? 0.55 : 0.22;
  const baseRiskAllocation =
    riskProfile === "aggressive" ? 42 : riskProfile === "balanced" ? 28 : 18;
  const allocationPct = clamp(((confidence - 35) / 58) * baseRiskAllocation * actionMultiplier, 4, baseRiskAllocation);

  const reasons = [
    shortMomentum >= 0
      ? "Recent price momentum is positive, which supports a higher short-term forecast."
      : "Recent momentum has cooled, which reduces upside conviction.",
    Math.abs(meanGap) > 0.04
      ? meanGap > 0
        ? "Price is extended above its recent average, so some mean reversion risk is present."
        : "Price sits below its recent average, so a rebound is possible if demand stabilizes."
      : "Price is trading close to its recent average, which keeps the setup more balanced.",
    volatility > 0.03
      ? "Volatility is elevated, so forecast confidence is discounted and the range is wider."
      : "Volatility is relatively contained, which improves confidence in the forecast range.",
    company.sentiment >= 15
      ? "Qualitative sentiment is supportive and adds a modest bullish adjustment."
      : company.sentiment <= -15
        ? "Weak qualitative sentiment subtracts from the forecast bias."
        : "Qualitative sentiment is neutral and does not heavily skew the forecast.",
  ];

  return {
    currentPrice,
    predictedPrice,
    expectedMovePct: expectedReturn * 100,
    lowRange,
    highRange,
    volatilityPct: volatility * 100,
    confidence,
    action,
    allocationPct,
    reasons,
  };
}

function parseImport(text: string) {
  const errors: string[] = [];
  const sectors = ["Consumer", "Technology", "Energy", "Healthcare", "Industrial", "Staples"];
  const companies = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(",").map((part) => part.trim()).filter(Boolean);
      if (parts.length < 4) {
        errors.push(`Line ${index + 1}: enter a name followed by at least 3 prices.`);
        return null;
      }

      const [name, ...priceParts] = parts;
      const prices = priceParts
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

      if (prices.length < 3) {
        errors.push(`Line ${index + 1}: only positive numeric prices are allowed.`);
        return null;
      }

      const trend = prices[prices.length - 1] - prices[0];
      return {
        id: `${slugify(name)}-${index + 1}`,
        name,
        ticker: buildTicker(name, index),
        sector: sectors[index % sectors.length],
        description: "Imported from pasted historical pricing.",
        catalyst:
          trend >= 0
            ? "Imported trend is positive, so momentum is being rewarded in the current model."
            : "Imported trend is negative, so the model is looking for stabilization before turning bullish.",
        sentiment: clamp((trend / prices[0]) * 100, -35, 35),
        prices,
      } satisfies Company;
    })
    .filter((company): company is Company => company !== null);

  return { companies, errors };
}

function getInitialState(): StoredState {
  if (typeof window === "undefined") {
    return {
      companies: SAMPLE_COMPANIES,
      riskProfile: "balanced",
      capital: 5000,
      bulkInput: DEMO_IMPORT,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        companies: SAMPLE_COMPANIES,
        riskProfile: "balanced",
        capital: 5000,
        bulkInput: DEMO_IMPORT,
      };
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      companies: Array.isArray(parsed.companies) && parsed.companies.length ? parsed.companies : SAMPLE_COMPANIES,
      riskProfile:
        parsed.riskProfile === "conservative" || parsed.riskProfile === "aggressive"
          ? parsed.riskProfile
          : "balanced",
      capital: typeof parsed.capital === "number" && parsed.capital > 0 ? parsed.capital : 5000,
      bulkInput: typeof parsed.bulkInput === "string" ? parsed.bulkInput : DEMO_IMPORT,
    };
  } catch {
    return {
      companies: SAMPLE_COMPANIES,
      riskProfile: "balanced",
      capital: 5000,
      bulkInput: DEMO_IMPORT,
    };
  }
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const width = 220;
  const height = 74;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const rising = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full overflow-visible">
      <defs>
        <linearGradient id={`area-${values.length}-${Math.round(values[0] * 100)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={rising ? "#14b8a6" : "#f43f5e"} stopOpacity="0.32" />
          <stop offset="100%" stopColor={rising ? "#14b8a6" : "#f43f5e"} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#area-${values.length}-${Math.round(values[0] * 100)})`} />
      <polyline
        points={points}
        fill="none"
        stroke={rising ? "#14b8a6" : "#f43f5e"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

export function App() {
  const initial = getInitialState();
  const [companies, setCompanies] = useState<Company[]>(initial.companies);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(initial.riskProfile);
  const [capital, setCapital] = useState<number>(initial.capital);
  const [bulkInput, setBulkInput] = useState<string>(initial.bulkInput);
  const [selectedId, setSelectedId] = useState<string>(initial.companies[0]?.id ?? SAMPLE_COMPANIES[0].id);
  const [newPrice, setNewPrice] = useState<string>("");
  const [importMessage, setImportMessage] = useState<string>("");

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        companies,
        riskProfile,
        capital,
        bulkInput,
      } satisfies StoredState),
    );
  }, [companies, riskProfile, capital, bulkInput]);

  const ranked = useMemo(() => {
    return companies
      .map((company) => ({ company, forecast: computeForecast(company, riskProfile) }))
      .sort((a, b) => b.forecast.expectedMovePct - a.forecast.expectedMovePct);
  }, [companies, riskProfile]);

  const selectedEntry = ranked.find((entry) => entry.company.id === selectedId) ?? ranked[0];
  const selectedCompany = selectedEntry?.company;
  const selectedForecast = selectedEntry?.forecast;

  useEffect(() => {
    if (!selectedCompany && ranked[0]) {
      setSelectedId(ranked[0].company.id);
    }
  }, [ranked, selectedCompany]);

  const strongest = ranked[0];
  const averageVolatility = ranked.length
    ? average(ranked.map((entry) => entry.forecast.volatilityPct))
    : 0;
  const averageConfidence = ranked.length
    ? average(ranked.map((entry) => entry.forecast.confidence))
    : 0;
  const totalSuggested = ranked.reduce(
    (sum, entry) => sum + capital * (entry.forecast.allocationPct / 100),
    0,
  );

  function loadDemoData() {
    const { companies: imported } = parseImport(DEMO_IMPORT);
    setBulkInput(DEMO_IMPORT);
    setCompanies(imported.length ? imported : SAMPLE_COMPANIES);
    setSelectedId((imported[0] ?? SAMPLE_COMPANIES[0]).id);
    setImportMessage("Loaded the built-in demo dataset.");
  }

  function importFromText() {
    const { companies: imported, errors } = parseImport(bulkInput);
    if (!imported.length) {
      setImportMessage(errors[0] ?? "Import failed. Check the format and try again.");
      return;
    }

    setCompanies(imported);
    setSelectedId(imported[0].id);
    setImportMessage(
      errors.length
        ? `Imported ${imported.length} companies with ${errors.length} line issue(s).`
        : `Imported ${imported.length} companies successfully.`,
    );
  }

  function resetAll() {
    setCompanies(SAMPLE_COMPANIES);
    setRiskProfile("balanced");
    setCapital(5000);
    setBulkInput(DEMO_IMPORT);
    setSelectedId(SAMPLE_COMPANIES[0].id);
    setNewPrice("");
    setImportMessage("Reset to the default demo workspace.");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function addObservedPrice() {
    if (!selectedCompany) return;
    const value = Number(newPrice);
    if (!Number.isFinite(value) || value <= 0) {
      setImportMessage("Enter a positive observed price before adding a new round.");
      return;
    }

    setCompanies((current) =>
      current.map((company) =>
        company.id === selectedCompany.id
          ? { ...company, prices: [...company.prices, value] }
          : company,
      ),
    );
    setNewPrice("");
    setImportMessage(`Added a new observed price for ${selectedCompany.name}.`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-md">
          <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.9fr] lg:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-teal-200">
                Independent educational replacement
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Market Practice Forecaster
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                This rebuild is a transparent stock-practice dashboard for studying trend behavior with your own observed prices.
                It does not reproduce proprietary systems or hidden answer keys. Instead, it scores momentum, mean reversion,
                volatility, and sentiment so you can make cleaner practice decisions round by round.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                {[
                  "Paste your own price history",
                  "Get forecast ranges and confidence",
                  "Track each new observed round locally",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <MetricCard
                label="Top setup"
                value={strongest ? `${strongest.company.ticker} ${formatPercent(strongest.forecast.expectedMovePct)}` : "—"}
                helper={strongest ? strongest.forecast.action : "No companies loaded"}
              />
              <MetricCard
                label="Average confidence"
                value={`${averageConfidence.toFixed(0)} / 100`}
                helper="Higher scores imply cleaner trend structure"
              />
              <MetricCard
                label="Average volatility"
                value={`${averageVolatility.toFixed(2)}%`}
                helper="Used to widen or tighten the forecast band"
              />
              <MetricCard
                label="Suggested deployment"
                value={formatCurrency(totalSuggested)}
                helper="Based on your capital and current allocation model"
              />
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-xl shadow-black/10 backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">Workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Import or refine your own market set</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Paste one company per line using the format <span className="font-semibold text-slate-100">Name, price1, price2, price3...</span>.
                  The app turns that history into a forecast and stores it in your browser.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-400/20"
                >
                  Load demo data
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12"
                >
                  Reset workspace
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Paste price history</label>
                <textarea
                  value={bulkInput}
                  onChange={(event) => setBulkInput(event.target.value)}
                  className="min-h-[240px] w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-mono text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/40"
                  placeholder={DEMO_IMPORT}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={importFromText}
                    className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Import from text
                  </button>
                  <p className="text-sm text-slate-300">{importMessage || "Tip: add at least 3 prices per company for a usable signal."}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm font-medium text-slate-200">Capital base</p>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={capital}
                      onChange={(event) => setCapital(Math.max(100, Number(event.target.value) || 100))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Used to convert allocation percentages into dollar suggestions.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm font-medium text-slate-200">Risk profile</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(["conservative", "balanced", "aggressive"] as RiskProfile[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRiskProfile(level)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          riskProfile === level
                            ? "border-cyan-300/60 bg-cyan-300/14 text-cyan-100"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/8"
                        }`}
                      >
                        <span className="block font-semibold capitalize">{level}</span>
                        <span className="mt-1 block text-xs text-slate-400">{riskDescriptions[level]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm leading-6 text-amber-100">
                  <p className="font-semibold">Important</p>
                  <p className="mt-1">
                    This app is best used as a study aid and forecasting worksheet. It is not an official tool, not financial advice,
                    and not a guaranteed predictor of any classroom simulation or live market.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-xl shadow-black/10 backdrop-blur-md">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Transparent scoring model</h2>
            <div className="mt-5 space-y-4">
              {[
                {
                  title: "1. Momentum",
                  text: "Recent returns are weighted most heavily so the latest direction influences the next-round forecast.",
                },
                {
                  title: "2. Mean reversion",
                  text: "If a price is stretched far above or below its recent average, the model tempers the move.",
                },
                {
                  title: "3. Volatility control",
                  text: "More volatile series receive wider forecast bands and lower confidence scores.",
                },
                {
                  title: "4. Sentiment tilt",
                  text: "Each company can include a small qualitative bias, which is especially useful when you know the current narrative.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">Forecast board</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Ranked outlook by expected move</h2>
            </div>
            <p className="text-sm text-slate-400">Click any company to inspect the breakdown and add a new observed round.</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {ranked.map(({ company, forecast }) => {
              const isSelected = company.id === selectedId;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedId(company.id)}
                  className={`rounded-3xl border p-5 text-left transition ${
                    isSelected
                      ? "border-cyan-300/50 bg-cyan-300/8 shadow-lg shadow-cyan-500/10"
                      : "border-white/10 bg-white/6 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{company.sector}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{company.name}</h3>
                      <p className="text-sm text-slate-400">{company.ticker}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        forecast.action === "Accumulate"
                          ? "bg-emerald-400/14 text-emerald-200"
                          : forecast.action === "Reduce"
                            ? "bg-rose-400/14 text-rose-200"
                            : "bg-amber-400/14 text-amber-100"
                      }`}
                    >
                      {forecast.action}
                    </span>
                  </div>

                  <div className="mt-4">
                    <Sparkline values={company.prices} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                      <p className="text-slate-400">Next estimate</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(forecast.predictedPrice)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                      <p className="text-slate-400">Expected move</p>
                      <p className={`mt-1 font-semibold ${forecast.expectedMovePct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {formatPercent(forecast.expectedMovePct)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                      <p className="text-slate-400">Confidence</p>
                      <p className="mt-1 font-semibold text-white">{forecast.confidence.toFixed(0)} / 100</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                      <p className="text-slate-400">Allocation</p>
                      <p className="mt-1 font-semibold text-white">{forecast.allocationPct.toFixed(1)}%</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedCompany && selectedForecast && (
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-xl shadow-black/10 backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">Selected company</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{selectedCompany.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{selectedCompany.description}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ticker</p>
                  <p className="mt-2 text-xl font-semibold text-white">{selectedCompany.ticker}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Current price</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(selectedForecast.currentPrice)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Projected next price</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(selectedForecast.predictedPrice)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Forecast range</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCurrency(selectedForecast.lowRange)} – {formatCurrency(selectedForecast.highRange)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-sm text-slate-400">Suggested position</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCurrency(capital * (selectedForecast.allocationPct / 100))}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                  <p className="text-sm font-medium text-slate-200">Why the model says this</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedForecast.reasons.map((reason) => (
                      <li key={reason} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                    <p className="text-sm font-semibold text-cyan-100">Current catalyst</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{selectedCompany.catalyst}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                  <p className="text-sm font-medium text-slate-200">Round-by-round workflow</p>
                  <div className="mt-4 space-y-4 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="font-semibold text-white">Observed history</p>
                      <p className="mt-2 leading-6">{selectedCompany.prices.map((price) => formatCurrency(price)).join(" → ")}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="font-semibold text-white">Add the next observed price</p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={newPrice}
                          onChange={(event) => setNewPrice(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
                          placeholder="Enter next observed price"
                        />
                        <button
                          type="button"
                          onClick={addObservedPrice}
                          className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                        >
                          Add round
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        Use this after each new round to refresh the forecast with the newest data point.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="font-semibold text-white">Live signal summary</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-400">Expected move</p>
                          <p className={`mt-1 font-semibold ${selectedForecast.expectedMovePct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                            {formatPercent(selectedForecast.expectedMovePct)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Volatility</p>
                          <p className="mt-1 font-semibold text-white">{selectedForecast.volatilityPct.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Confidence</p>
                          <p className="mt-1 font-semibold text-white">{selectedForecast.confidence.toFixed(0)} / 100</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Action</p>
                          <p className="mt-1 font-semibold text-white">{selectedForecast.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-xl shadow-black/10 backdrop-blur-md">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">How to use</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Quick start guide</h2>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                {[
                  "Paste each company and its historical prices into the import box, or load the demo data to see the workflow.",
                  "Choose a capital base and risk profile so the suggested position sizes match how cautiously you want to trade.",
                  "Review the ranked board. Higher expected move plus higher confidence usually means a cleaner setup, but volatility matters.",
                  "Open one company, read the reasons, then compare the projected next price and forecast range before making your decision.",
                  "After the next round occurs, add the observed price to update the forecast. Repeating this step makes the model react to fresh data.",
                ].map((step) => (
                  <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 font-semibold text-slate-950">
                      {step[0]}
                    </span>
                    <span>{step.slice(3)}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                <p className="text-sm font-semibold text-white">Best accuracy tip</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The model becomes more useful when the prices you enter are clean, sequential, and recent. If your scenario has news events,
                  adjust the company sentiment or notes in your own copy of the data so the forecast reflects that context.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
