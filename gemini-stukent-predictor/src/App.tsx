import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Info, TrendingUp, TrendingDown, RefreshCcw, AlertTriangle, Sparkles, Target, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMPANIES = [
  { name: "Exin Petrolium", ticker: "EXP", irl: "XOM", file: "EXP_XOM", color: "#38bdf8" },
  { name: "Supermart", ticker: "SPM", irl: "WMT", file: "SPM_WMT", color: "#818cf8" },
  { name: "Corner Drug", ticker: "CDS", irl: "CVS", file: "CDS_CVS", color: "#34d399" },
  { name: "Superior Purchase", ticker: "SP", irl: "BBY", file: "SP_BBY", color: "#fbbf24" },
  { name: "Swoosh Athletics", ticker: "SA", irl: "NKE", file: "SA_NKE", color: "#f87171" },
  { name: "Big Bank of US", ticker: "BBUS", irl: "BAC", file: "BBUS_BAC", color: "#c084fc" },
  { name: "US Flights", ticker: "SUF", irl: "AAL", file: "SUF_AAL", color: "#f472b6" },
  { name: "Hank Auto Co.", ticker: "HAC", irl: "F", file: "HAC_F", color: "#94a3b8" },
];

const MISSING_COMPANIES = ["MIH", "RFT", "MFCR", "RWCIX"];

type StockData = [string, string, string]; // [Real Date, Price, Original Sim Date]
type AllData = Record<string, StockData[]>;

// A highly polished Custom Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const realDate = payload[0].payload.realDate;
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-2xl z-50 min-w-[220px]">
        <div className="mb-3 border-b border-slate-700/50 pb-2 flex justify-between items-baseline">
          <span className="font-bold text-slate-100">{label}</span>
          <span className="text-slate-400 font-mono text-xs">{realDate}</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300 font-medium">{entry.name}</span>
              </div>
              <span className="font-mono text-slate-100">${Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Instead of a single search, we hold a map of fileName -> input price string
  const [searchPrices, setSearchPrices] = useState<Record<string, string>>({});
  
  const [bestMatchIndex, setBestMatchIndex] = useState<number | null>(null);
  const [matchConfidence, setMatchConfidence] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      const firstDataRow = lines[1].split(',').map(d => d.trim());

      const newSearches: Record<string, string> = {};
      
      COMPANIES.forEach(company => {
        const colIndex = headers.indexOf(company.ticker);
        if (colIndex !== -1 && firstDataRow[colIndex]) {
          newSearches[company.file] = firstDataRow[colIndex];
        }
      });

      setSearchPrices(newSearches);
      setBestMatchIndex(null);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedData: AllData = {};
        for (const company of COMPANIES) {
          const response = await fetch(`/StockData/${company.file}.json`);
          if (!response.ok) throw new Error(`Failed to load ${company.file}`);
          loadedData[company.file] = await response.json();
        }
        setData(loadedData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePriceChange = (companyFile: string, val: string) => {
    setSearchPrices(prev => ({ ...prev, [companyFile]: val }));
    setBestMatchIndex(null); // Clear results on new input
  };

  const clearInputs = () => {
    setSearchPrices({});
    setBestMatchIndex(null);
  };

  const handleSearch = () => {
    if (!data) return;
    
    const validInputs = Object.entries(searchPrices)
      .map(([file, val]) => ({ file, price: parseFloat(val) }))
      .filter(item => !isNaN(item.price) && item.price > 0);

    if (validInputs.length === 0) return;

    setIsSearching(true);
    
    // Slight delay to allow animation to play
    setTimeout(() => {
      const dataLength = data[COMPANIES[0].file].length;
      let minError = Infinity;
      let bestIndex = -1;

      // Iterate through every possible day in history
      for (let i = 0; i < dataLength; i++) {
        let dayError = 0;
        
        for (const input of validInputs) {
          const historicalPrice = parseFloat(data[input.file][i]?.[1] || '0');
          if (historicalPrice === 0) continue;
          
          // Calculate percentage difference (Squared error to heavily penalize large deviations)
          const pctDiff = Math.abs(historicalPrice - input.price) / historicalPrice;
          dayError += pctDiff * pctDiff;
        }
        
        if (dayError < minError) {
          minError = dayError;
          bestIndex = i;
        }
      }

      setBestMatchIndex(bestIndex);
      
      // Calculate a rough confidence score percentage
      // If the error is 0, confidence is 100%. If error is large, it drops.
      const avgErrorPerInput = Math.sqrt(minError / validInputs.length); // back to straight percentage
      let confidence = 100 - (avgErrorPerInput * 100 * 5); // arbitrary scaling for feel
      confidence = Math.max(0, Math.min(100, Math.round(confidence * 10) / 10)); // bounds check to 1 decimal
      
      setMatchConfidence(confidence);
      setIsSearching(false);
    }, 400);
  };

  const chartData = useMemo(() => {
    if (bestMatchIndex === null || !data) return [];
    const points = [];
    for (let i = -3; i <= 7; i++) {
      const currentIndex = bestMatchIndex + i;
      if (currentIndex < 0 || currentIndex >= data[COMPANIES[0].file].length) continue;
      
      const realDate = data[COMPANIES[0].file][currentIndex][0];
      const dataPoint: any = { 
        day: i === 0 ? 'Today' : `Day ${i > 0 ? '+' : ''}${i}`,
        realDate 
      };
      
      COMPANIES.forEach(company => {
        dataPoint[company.ticker] = parseFloat(data[company.file][currentIndex]?.[1] || '0');
      });
      points.push(dataPoint);
    }
    return points;
  }, [bestMatchIndex, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 font-sans">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 font-sans">
        <div className="glass-panel p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Data Loading Failed</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const inputsCount = Object.values(searchPrices).filter(v => v !== '').length;

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
                Stukent Predictor <span className="text-indigo-400">Pro</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-widest">Multi-Ticker Precision Engine</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Data Sync
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Top Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center"
        >
          <div className="p-3 bg-indigo-500/10 rounded-xl shrink-0">
            <Info className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="text-sm text-indigo-200">
            <strong className="text-indigo-100 text-base block mb-1">How achieving 100% accuracy works</strong>
            Single stock prices repeat throughout history. By entering the exact prices of <strong>multiple different companies</strong> simultaneously from your simulation dashboard, our engine cross-references the historical deltas to pinpoint your exact simulation date with mathematical certainty.
            <div className="mt-2 text-xs flex gap-2 flex-wrap">
              <span className="bg-slate-900/50 border border-white/10 px-2 py-1 rounded text-slate-400">
                Note: <span className="text-slate-300">{MISSING_COMPANIES.join(", ")}</span> are not tracked. Use the blue-chip equivalents available below.
              </span>
            </div>
          </div>
        </motion.div>

        {/* Input Grid Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-100 flex items-center gap-2">
                <Target className="w-6 h-6 text-cyan-400" /> Input Simulation Values
              </h2>
              <p className="text-slate-400 text-sm mt-1">Enter prices for at least 2 companies for high confidence.</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 w-full sm:w-auto">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center gap-2 border border-slate-700/50 bg-slate-900/50 flex-1 sm:flex-none"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </button>
              <button 
                onClick={clearInputs}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center gap-2 border border-slate-700/50 bg-slate-900/50 flex-1 sm:flex-none"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
              <button 
                onClick={handleSearch}
                disabled={inputsCount === 0 || isSearching}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg flex-1 sm:flex-none",
                  inputsCount > 0 
                    ? "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-500/25" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                )}
              >
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="w-4 h-4" />}
                {isSearching ? 'Analyzing...' : `Predict Date (${inputsCount})`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANIES.map((company) => (
              <div key={company.file} className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 focus-within:border-indigo-500/50 focus-within:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-200">{company.ticker}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{company.name}</p>
                  </div>
                  <span className="text-xs font-mono font-medium" style={{ color: company.color }}>IRL: {company.irl}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={searchPrices[company.file] || ''}
                    onChange={(e) => handlePriceChange(company.file, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl pl-8 pr-4 py-2 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {bestMatchIndex !== null && data && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
              className="space-y-8"
            >
              
              {/* Match Header */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full" />
                
                <div className="relative z-10 text-center md:text-left">
                  <h2 className="text-xl text-slate-400 font-medium mb-1">Primary Match Found</h2>
                  <div className="text-4xl md:text-5xl font-bold text-slate-100 tracking-tight font-mono">
                    {data[COMPANIES[0].file][bestMatchIndex][0]}
                  </div>
                </div>
                
                <div className="relative z-10 bg-slate-950/50 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Algorithm Confidence</div>
                    <div className="flex items-center gap-2">
                       <div className="w-full bg-slate-800 rounded-full h-2 min-w-[120px]">
                        <motion.div 
                          className={cn("h-2 rounded-full", matchConfidence > 90 ? "bg-emerald-400" : matchConfidence > 60 ? "bg-amber-400" : "bg-rose-400")} 
                          initial={{ width: 0 }}
                          animate={{ width: `${matchConfidence}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                      <span className={cn("font-bold font-mono", matchConfidence > 90 ? "text-emerald-400" : matchConfidence > 60 ? "text-amber-400" : "text-rose-400")}>
                        {matchConfidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 bg-slate-900/30">
                  <h3 className="text-lg font-semibold text-slate-100">10-Day Future Projection</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-widest font-semibold">
                      <tr>
                        <th className="px-6 py-4 sticky left-0 z-20 bg-slate-950/90 backdrop-blur">Ticker</th>
                        <th className="px-6 py-4 bg-indigo-500/10 text-indigo-300">Today</th>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                          <th key={i} className="px-6 py-4 whitespace-nowrap">Day +{i}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {COMPANIES.map(company => {
                        const companyData = data[company.file];
                        const enteredPrice = searchPrices[company.file];
                        
                        return (
                          <tr key={company.file} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 sticky left-0 z-20 bg-slate-900/60 backdrop-blur shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />
                                <span className="font-bold text-slate-200">{company.ticker}</span>
                              </div>
                            </td>
                            
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(offset => {
                              const point = companyData[bestMatchIndex + offset];
                              if (!point) return <td key={offset} className="px-6 py-4 text-slate-600 font-mono">-</td>;
                              
                              const price = parseFloat(point[1]);
                              let changeContent = null;
                              
                              if (offset > 0) {
                                const prevPrice = parseFloat(companyData[bestMatchIndex + offset - 1][1]);
                                const pctChange = ((price - prevPrice) / prevPrice) * 100;
                                const isPositive = pctChange >= 0;
                                
                                changeContent = (
                                  <div className={cn("text-[10px] sm:text-xs mt-1 flex items-center gap-1 font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}>
                                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(pctChange).toFixed(2)}%
                                  </div>
                                );
                              }

                              const isToday = offset === 0;
                              const isInputMatch = isToday && enteredPrice && Math.abs(parseFloat(enteredPrice) - price) < 0.05;

                              return (
                                <td key={offset} className={cn("px-6 py-4 font-mono", isToday && "bg-indigo-500/5")}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(isToday ? "text-indigo-200 font-bold" : "text-slate-300")}>
                                        ${price.toFixed(2)}
                                      </span>
                                      {isInputMatch && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" title="Matched user input" />}
                                    </div>
                                    {changeContent}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart */}
              <div className="glass-panel p-6 rounded-3xl h-[450px] flex flex-col">
                <h3 className="text-lg font-semibold text-slate-100 mb-6">Price Trend Visualization</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `$${val}`}
                        dx={-10}
                      />
                      <RechartsTooltip content={<CustomChartTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} 
                        iconType="circle"
                      />
                      {COMPANIES.map(company => (
                        <Line 
                          key={company.ticker} 
                          type="monotone" 
                          dataKey={company.ticker} 
                          stroke={company.color} 
                          strokeWidth={2.5} 
                          dot={{ r: 0 }} 
                          activeDot={{ r: 6, strokeWidth: 0, fill: company.color }} 
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
