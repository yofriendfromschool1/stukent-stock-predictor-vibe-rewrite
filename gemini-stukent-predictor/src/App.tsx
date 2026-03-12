import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Info, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const COMPANIES = [
  { name: "Exin Petrolium (EXP)", irl: "Exxon Mobil Corp. (XOM)", file: "EXP_XOM" },
  { name: "Supermart (SPM)", irl: "Walmart Inc. (WMT)", file: "SPM_WMT" },
  { name: "Corner Drug Store, Inc. (CDS)", irl: "CVS Health Services (CVS)", file: "CDS_CVS" },
  { name: "Superior Purchase (SP)", irl: "Best Buy Co., Inc. (BBY)", file: "SP_BBY" },
  { name: "Swoosh Athletics (SA)", irl: "Nike Inc. (NKE)", file: "SA_NKE" },
  { name: "Big Bank of US (BBUS)", irl: "Bank of America Corp. (BAC)", file: "BBUS_BAC" },
  { name: "US Flights (SUF)", irl: "American Airlines Group Inc. (AAL)", file: "SUF_AAL" },
  { name: "Hank Auto Co. (HAC)", irl: "Ford Motor Co. (F)", file: "HAC_F" },
];

type StockData = [string, string, string]; // [Real-world Date, Price, Original Sim Date]
type AllData = Record<string, StockData[]>;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const realDate = payload[0].payload.realDate;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg z-50 min-w-[200px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
          {label} <span className="text-slate-500 font-normal text-xs ml-1">({realDate})</span>
        </p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm py-0.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 truncate max-w-[160px]" title={entry.name}>{entry.name}:</span>
            <span className="font-medium text-slate-900 ml-auto">${Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchCompany, setSearchCompany] = useState(COMPANIES[0].file);
  const [searchPrice, setSearchPrice] = useState('');
  const [matches, setMatches] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  const handleSearch = () => {
    if (!data || !searchPrice) return;
    const priceNum = parseFloat(searchPrice);
    if (isNaN(priceNum)) return;

    const companyData = data[searchCompany];
    const foundMatches: { index: number; diff: number }[] = [];

    // Find prices within +/- $0.10
    companyData.forEach((row, index) => {
      const rowPrice = parseFloat(row[1]);
      const diff = Math.abs(rowPrice - priceNum);
      if (diff <= 0.10) {
        foundMatches.push({ index, diff });
      }
    });

    // Sort by closest match first
    foundMatches.sort((a, b) => a.diff - b.diff);

    setMatches(foundMatches.map(m => m.index));
    setSelectedIndex(null);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-xl">Loading stock data...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-500 text-xl">Error: {error}</div>;

  const renderChart = () => {
    if (selectedIndex === null || !data) return null;

    const chartData = [];
    // Center the chart view: 5 days before, 5 days after
    for (let i = -5; i <= 5; i++) {
      const currentIndex = selectedIndex + i;
      if (currentIndex < 0 || currentIndex >= data[COMPANIES[0].file].length) continue;

      const realDate = data[COMPANIES[0].file][currentIndex][0];
      const dataPoint: any = { 
        day: i === 0 ? 'Today' : `Day ${i > 0 ? '+' : ''}${i}`,
        realDate 
      };
      
      COMPANIES.forEach(company => {
        const price = parseFloat(data[company.file][currentIndex]?.[1] || '0');
        dataPoint[company.name] = price;
      });
      chartData.push(dataPoint);
    }

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

    return (
      <div className="h-96 w-full mt-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Price Trend (Centered on Selected Date)</h3>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Hover points for details</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {COMPANIES.map((company, index) => (
                <Line key={company.file} type="monotone" dataKey={company.name} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white py-6 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Stukent Stock Predictor</h1>
          <span className="text-sm text-slate-400 font-medium">Rewritten for Accuracy</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2 mb-2">
            <Info className="w-5 h-5" /> How to use this predictor
          </h2>
          <ol className="list-decimal list-inside text-blue-800 space-y-1 ml-2">
            <li>Open your Stukent simulation and pick any company.</li>
            <li>Look at its <strong>current share price</strong>.</li>
            <li>Select that company below and enter the price to find your simulation's current date.</li>
            <li>Once you find the match, select it to see the predicted prices for the next 10 days!</li>
          </ol>
        </div>

        {/* Tracked Companies */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Tracked Companies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANIES.map(company => {
              const tickerMatch = company.name.match(/\(([^)]+)\)/);
              const ticker = tickerMatch ? tickerMatch[1] : '';
              const name = company.name.replace(/\s*\([^)]+\)/, '');
              
              return (
                <div key={company.file} className="border border-slate-100 bg-slate-50 rounded-lg p-4 flex flex-col justify-between hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{ticker}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Stukent</span>
                    </div>
                    <h3 className="font-medium text-sm text-slate-700">{name}</h3>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Real World Equivalent</div>
                    <div className="text-xs text-slate-600 font-medium">{company.irl}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Find Your Simulation Date</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
              >
                {COMPANIES.map(c => (
                  <option key={c.file} value={c.file}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="e.g. 33.74"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchPrice}
                onChange={(e) => setSearchPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors h-[42px]"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          {matches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Possible Matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(index => {
                  const companyData = data![searchCompany];
                  const match = companyData[index];
                  const prev = index > 0 ? companyData[index - 1] : null;
                  const next = index < companyData.length - 1 ? companyData[index + 1] : null;
                  
                  const diff = Math.abs(parseFloat(match[1]) - parseFloat(searchPrice));
                  const isExact = diff < 0.01;
                  const isClose = diff <= 0.05 && !isExact;

                  let borderClass = 'border-slate-200 hover:border-blue-300 hover:bg-slate-50';
                  if (selectedIndex === index) {
                    borderClass = 'border-blue-500 bg-blue-50 ring-2 ring-blue-200';
                  } else if (isExact) {
                    borderClass = 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400';
                  }

                  return (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${borderClass}`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">${match[1]}</span>
                          {isExact && <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Exact</span>}
                          {isClose && <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Close</span>}
                          {!isExact && !isClose && <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Near</span>}
                        </div>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">Real Date: {match[0]}</span>
                      </div>
                      <div className="text-sm text-slate-600 grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                        <div>
                          <span className="block text-xs text-slate-400">Previous Day</span>
                          {prev ? `$${prev[1]}` : 'N/A'}
                        </div>
                        <div>
                          <span className="block text-xs text-slate-400">Next Day</span>
                          {next ? `$${next[1]}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {matches.length === 0 && searchPrice !== '' && (
            <div className="mt-6 p-4 bg-amber-50 text-amber-800 rounded-lg flex items-start gap-3 border border-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No exact matches found.</p>
                <p className="text-sm mt-1">Try checking another company's price, or ensure you entered the exact closing price from the simulation.</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {selectedIndex !== null && data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Predicted Share Prices</h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Based on real-world date: {data[COMPANIES[0].file][selectedIndex][0]}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold bg-blue-50/50">Today</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                        <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap">Day +{i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {COMPANIES.map(company => {
                      const companyData = data[company.file];
                      return (
                        <tr key={company.file} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{company.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">IRL: {company.irl}</div>
                          </td>
                          
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(offset => {
                            const point = companyData[selectedIndex + offset];
                            if (!point) return <td key={offset} className="px-4 py-3 text-slate-400">-</td>;
                            
                            const price = parseFloat(point[1]);
                            let changeStr = "";
                            let changeColor = "text-slate-500";
                            let Icon = null;
                            
                            if (offset > 0) {
                              const prevPrice = parseFloat(companyData[selectedIndex + offset - 1][1]);
                              const pctChange = ((price - prevPrice) / prevPrice) * 100;
                              changeStr = `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(2)}%`;
                              if (pctChange > 0) {
                                changeColor = "text-emerald-600";
                                Icon = TrendingUp;
                              } else if (pctChange < 0) {
                                changeColor = "text-rose-600";
                                Icon = TrendingDown;
                              }
                            }

                            return (
                              <td key={offset} className={`px-4 py-3 ${offset === 0 ? 'bg-blue-50/30 font-medium' : ''}`}>
                                <div className="text-slate-900">${price.toFixed(2)}</div>
                                {offset > 0 && (
                                  <div className={`text-xs mt-1 flex items-center gap-1 ${changeColor}`}>
                                    {Icon && <Icon className="w-3 h-3" />}
                                    {changeStr}
                                  </div>
                                )}
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

            {renderChart()}

          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-sm text-slate-500 pt-8 pb-4">
          <p>Uses real-world historical stock data from 2008-2018 to predict the Stukent Personal Finance simulation.</p>
          <p className="mt-1">Original concept by Sam Hill. Rewritten for accuracy.</p>
        </div>

      </main>
    </div>
  );
}
