import { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  BookOpen,
  Zap,
  Clock,
  ExternalLink,
  Copy,
  Check,
  BarChart3,
  Target,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import {
  scenarios,
  sectors,
  confidenceColors,
  sectorColors,
  type StockMapping,
  type RoundInfo,
} from './data/stocks';

function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [expandedStock, setExpandedStock] = useState<number | null>(null);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stocks' | 'rounds' | 'guide'>('stocks');
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0],
    [selectedScenarioId]
  );

  const filteredStocks = useMemo(() => {
    return scenario.stocks.filter((stock) => {
      const matchesSearch =
        searchQuery === '' ||
        stock.stukentTicker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.stukentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.realTicker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector = selectedSector === 'All Sectors' || stock.sector === selectedSector;

      const matchesConfidence = confidenceFilter === 'all' || stock.confidence === confidenceFilter;

      return matchesSearch && matchesSector && matchesConfidence;
    });
  }, [scenario.stocks, searchQuery, selectedSector, confidenceFilter]);

  const copyTicker = (ticker: string) => {
    navigator.clipboard.writeText(ticker).then(() => {
      setCopiedTicker(ticker);
      setTimeout(() => setCopiedTicker(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-gray-800/50 bg-[#0d1117]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="text-emerald-400">Stukent</span>{' '}
                  <span className="text-gray-100">Stock Predictor</span>
                </h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                  Community Research Tool
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50 font-mono">
                v2.0.0
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Important Notice Banner */}
        <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">Important Disclaimer</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                These mappings are compiled from community research and may not be 100% accurate for your specific
                simulation scenario. Stukent may use different stock sets for different classes and semesters.
                Always verify mappings by comparing price patterns in your simulation with real historical data.
                This tool is for <strong className="text-gray-300">educational purposes only</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
            Simulation Scenario
          </label>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenarioId(s.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedScenarioId === s.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:bg-gray-800/50 hover:text-gray-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{scenario.description}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-800/30 rounded-xl p-1 border border-gray-700/30">
          {[
            { id: 'stocks' as const, label: 'Stock Mappings', icon: Target },
            { id: 'rounds' as const, label: 'Round Timeline', icon: Clock },
            { id: 'guide' as const, label: 'How to Use', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gray-700/50 text-emerald-400 shadow-md'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* STOCKS TAB */}
        {activeTab === 'stocks' && (
          <div>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by ticker, company name, or sector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/30 border border-gray-700/30 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Sector Filter */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-gray-800/30 border border-gray-700/30 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer min-w-[180px]"
              >
                {sectors.map((sector) => (
                  <option key={sector} value={sector} className="bg-gray-800">
                    {sector}
                  </option>
                ))}
              </select>

              {/* Confidence Filter */}
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-gray-800/30 border border-gray-700/30 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="all" className="bg-gray-800">All Confidence</option>
                <option value="high" className="bg-gray-800">🟢 High Confidence</option>
                <option value="medium" className="bg-gray-800">🟡 Medium Confidence</option>
                <option value="low" className="bg-gray-800">🔴 Low Confidence</option>
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500">
                Showing <span className="text-emerald-400 font-semibold">{filteredStocks.length}</span> of{' '}
                <span className="text-gray-400">{scenario.stocks.length}</span> stocks
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Low
                </span>
              </div>
            </div>

            {/* Stock Cards */}
            <div className="space-y-3">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock.id}
                  stock={stock}
                  isExpanded={expandedStock === stock.id}
                  onToggle={() => setExpandedStock(expandedStock === stock.id ? null : stock.id)}
                  onCopy={copyTicker}
                  copiedTicker={copiedTicker}
                />
              ))}

              {filteredStocks.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No stocks match your search criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSector('All Sectors');
                      setConfidenceFilter('all');
                    }}
                    className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROUNDS TAB */}
        {activeTab === 'rounds' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-100 mb-1">Round Timeline</h2>
              <p className="text-sm text-gray-400">
                Each round in the simulation corresponds to a real-world time period. Knowing what happens in the real
                market during each period lets you predict stock movements.
              </p>
            </div>

            <div className="space-y-3">
              {scenario.rounds.map((round) => (
                <RoundCard
                  key={round.round}
                  round={round}
                  isExpanded={expandedRound === round.round}
                  onToggle={() => setExpandedRound(expandedRound === round.round ? null : round.round)}
                />
              ))}
            </div>
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === 'guide' && <GuideSection />}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-600">
            Community research tool for educational purposes only. Not affiliated with Stukent Inc.
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Stock mappings are community-sourced and may not be accurate for all simulation scenarios.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ============ Stock Card Component ============ */
function StockCard({
  stock,
  isExpanded,
  onToggle,
  onCopy,
  copiedTicker,
}: {
  stock: StockMapping;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (ticker: string) => void;
  copiedTicker: string | null;
}) {
  const conf = confidenceColors[stock.confidence];
  const sectorColor = sectorColors[stock.sector] || 'bg-gray-500/20 text-gray-400';

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? 'bg-gray-800/40 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
          : 'bg-gray-800/20 border-gray-700/20 hover:bg-gray-800/30 hover:border-gray-700/40'
      }`}
    >
      <button onClick={onToggle} className="w-full px-4 sm:px-5 py-4 text-left">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Confidence dot */}
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            stock.confidence === 'high' ? 'bg-emerald-500' :
            stock.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-500'
          }`} />

          {/* Stukent Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold text-emerald-400 tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stock.stukentTicker}
              </span>
              <span className="text-sm text-gray-300 font-medium truncate">{stock.stukentName}</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 hidden sm:block">
            <ArrowRight className="w-4 h-4 text-gray-600" />
          </div>

          {/* Real Info */}
          <div className="min-w-0 flex-1 text-right sm:text-left">
            <div className="flex items-center gap-2 justify-end sm:justify-start">
              <span
                className="text-sm font-bold text-blue-400 tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stock.realTicker}
              </span>
              <span className="text-sm text-gray-300 font-medium truncate hidden sm:inline">
                {stock.realName}
              </span>
            </div>
          </div>

          {/* Sector badge */}
          <span className={`hidden md:inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium ${sectorColor}`}>
            {stock.sector}
          </span>

          {/* Confidence badge */}
          <span className={`hidden lg:inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium ${conf.bg} ${conf.text} border ${conf.border}`}>
            {conf.label}
          </span>

          {/* Expand icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 border-t border-gray-700/20">
          <div className="pt-4 grid sm:grid-cols-2 gap-4">
            {/* Left column */}
            <div>
              <div className="mb-3">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Stukent (Fictional)
                </h4>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-bold text-emerald-400"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stock.stukentTicker}
                  </span>
                  <span className="text-sm text-gray-300">{stock.stukentName}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(stock.stukentTicker); }}
                    className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                    title="Copy ticker"
                  >
                    {copiedTicker === stock.stukentTicker ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Real Company
                </h4>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-bold text-blue-400"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stock.realTicker}
                  </span>
                  <span className="text-sm text-gray-300">{stock.realName}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(stock.realTicker); }}
                    className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                    title="Copy ticker"
                  >
                    {copiedTicker === stock.realTicker ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${sectorColor}`}>
                  {stock.sector}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>
                  {conf.label} Confidence
                </span>
              </div>
            </div>

            {/* Right column */}
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Analysis Notes
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">{stock.notes}</p>

              <a
                href={`https://finance.yahoo.com/quote/${stock.realTicker}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                View {stock.realTicker} on Yahoo Finance
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Round Card Component ============ */
function RoundCard({
  round,
  isExpanded,
  onToggle,
}: {
  round: RoundInfo;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isDanger = round.marketEvents.includes('⚠️') || round.marketEvents.includes('COVID');
  const isGood = round.tip.toLowerCase().includes('buy') || round.tip.toLowerCase().includes('strong') || round.tip.toLowerCase().includes('excellent');

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? isDanger
            ? 'bg-red-900/10 border-red-500/20 shadow-lg shadow-red-500/5'
            : 'bg-gray-800/40 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
          : isDanger
            ? 'bg-red-900/5 border-red-500/10 hover:bg-red-900/10'
            : 'bg-gray-800/20 border-gray-700/20 hover:bg-gray-800/30'
      }`}
    >
      <button onClick={onToggle} className="w-full px-4 sm:px-5 py-4 text-left">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Round number */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              isDanger
                ? 'bg-red-500/20 text-red-400'
                : isGood
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-700/50 text-gray-300'
            }`}
          >
            R{round.round}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-200 mb-0.5">{round.realDateRange}</div>
            <div className="text-xs text-gray-500 truncate">{round.marketEvents.replace('⚠️ ', '')}</div>
          </div>

          {/* Indicator */}
          <div className="flex-shrink-0">
            {isDanger ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : isGood ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-gray-500" />
            )}
          </div>

          {/* Expand */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 border-t border-gray-700/20">
          <div className="pt-4">
            <div className="mb-3">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Market Events
              </h4>
              <p className="text-sm text-gray-300">{round.marketEvents}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDanger ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              <div className="flex items-start gap-2">
                <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDanger ? 'text-red-400' : 'text-emerald-400'}`} />
                <div>
                  <h4 className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                    Strategy Tip
                  </h4>
                  <p className="text-sm text-gray-300">{round.tip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Guide Section Component ============ */
function GuideSection() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-3">How to Use the Stock Predictor</h2>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          Stukent's Mimic Personal Finance simulation uses fictional company names and tickers, but the price data is
          based on real historical stock market data. By identifying which real company each fictional stock represents,
          you can look up real historical data to predict how stocks will move in future rounds.
        </p>
      </div>

      {/* Step-by-step */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GuideCard
          step={1}
          icon={Target}
          title="Identify Your Stocks"
          description="Look at the stocks available in your simulation. Match them to the fictional tickers in our mapping table. Note the corresponding real company ticker."
        />
        <GuideCard
          step={2}
          icon={Clock}
          title="Check the Round Timeline"
          description="Determine which round you're currently in, and check the Round Timeline tab to see what real-world dates that round corresponds to."
        />
        <GuideCard
          step={3}
          icon={BarChart3}
          title="Research Real Data"
          description="Look up the real stock's historical performance for the NEXT round's time period on Yahoo Finance, Google Finance, or any financial site."
        />
        <GuideCard
          step={4}
          icon={TrendingUp}
          title="Predict Movements"
          description="If the real stock went up 15% during that period, the Stukent stock should move similarly. Buy stocks that went up, avoid ones that went down."
        />
        <GuideCard
          step={5}
          icon={Shield}
          title="Verify Mappings"
          description="Compare the price changes in your simulation with the real stock data. If they don't match, the mapping might be wrong for your specific scenario."
        />
        <GuideCard
          step={6}
          icon={Zap}
          title="Maximize Returns"
          description="Concentrate your portfolio in the biggest winners each round. Don't diversify for safety — you know what's going to happen!"
        />
      </div>

      {/* Verification Guide */}
      <div className="rounded-xl bg-gray-800/30 border border-gray-700/20 p-5 sm:p-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          How to Verify a Mapping
        </h3>
        <div className="space-y-3">
          <VerifyStep
            number={1}
            title="Compare Price Shapes"
            description="Pull up a chart of the real stock for the simulation time period. The shape of the price chart should closely match what you see in Stukent."
          />
          <VerifyStep
            number={2}
            title="Check Percentage Changes"
            description="If your Stukent stock moved +12.3% in a round, the real stock should have moved very close to +12.3% during the corresponding real-world quarter."
          />
          <VerifyStep
            number={3}
            title="Look for Name Hints"
            description='Stukent often gives subtle hints in the company names. For example, "Edison Motors" hints at electricity → Tesla, "NexGen Search" → Google.'
          />
          <VerifyStep
            number={4}
            title="Check Sector Clues"
            description="The sector/industry classification in Stukent should match the real company. A stock listed under 'Technology' won't map to an oil company."
          />
          <VerifyStep
            number={5}
            title="Use Historical Price Data"
            description="Yahoo Finance has free historical data. Go to the stock page → Historical Data tab. Compare specific dates with your simulation rounds."
          />
        </div>
      </div>

      {/* Pro Tips */}
      <div className="rounded-xl bg-gray-800/30 border border-gray-700/20 p-5 sm:p-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Pro Tips
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <ProTip text="The COVID crash (Q1 2020) is the most important round. Selling everything before it and buying back at the bottom is the single biggest alpha generator." />
          <ProTip text="Don't spread your money across all stocks. Concentrate on the 2-3 biggest winners each round for maximum returns." />
          <ProTip text="If a mapping doesn't seem right, try comparing with similar companies in the same sector. The mapping might be slightly different for your class." />
          <ProTip text="Your instructor's scenario may use different time periods than what's shown here. Always verify the dates by checking if round 1's price movements match." />
          <ProTip text="Some scenarios include bonds and other asset classes. These follow real benchmark returns like the US Treasury yield." />
          <ProTip text="Keep track of any differences you find between our mappings and your simulation. Share corrections with your classmates!" />
        </div>
      </div>

      {/* Useful Links */}
      <div className="rounded-xl bg-gray-800/30 border border-gray-700/20 p-5 sm:p-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-emerald-400" />
          Useful Resources
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ResourceLink
            name="Yahoo Finance"
            url="https://finance.yahoo.com/"
            description="Free historical stock data and charts"
          />
          <ResourceLink
            name="Google Finance"
            url="https://www.google.com/finance/"
            description="Quick stock lookups and price history"
          />
          <ResourceLink
            name="TradingView"
            url="https://www.tradingview.com/"
            description="Advanced charting and analysis tools"
          />
          <ResourceLink
            name="Macrotrends"
            url="https://www.macrotrends.net/"
            description="Long-term historical data and charts"
          />
          <ResourceLink
            name="StockAnalysis"
            url="https://stockanalysis.com/"
            description="Free stock data and financial statements"
          />
          <ResourceLink
            name="MarketWatch"
            url="https://www.marketwatch.com/"
            description="Market news and historical quotes"
          />
        </div>
      </div>
    </div>
  );
}

/* ============ Small Sub-Components ============ */

function GuideCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-gray-800/30 border border-gray-700/20 p-5 hover:bg-gray-800/40 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
          {step}
        </div>
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h4 className="text-sm font-semibold text-gray-200 mb-1.5">{title}</h4>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function VerifyStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-0.5">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ProTip({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-start p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
      <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
    </div>
  );
}

function ResourceLink({ name, url, description }: { name: string; url: string; description: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/20 hover:bg-gray-800/50 hover:border-emerald-500/20 transition-all group"
    >
      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors">{name}</h4>
        <p className="text-[11px] text-gray-500">{description}</p>
      </div>
    </a>
  );
}

export default App;
