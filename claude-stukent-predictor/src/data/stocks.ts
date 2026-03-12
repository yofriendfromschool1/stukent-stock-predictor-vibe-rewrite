export interface StockMapping {
  id: number;
  stukentTicker: string;
  stukentName: string;
  realTicker: string;
  realName: string;
  sector: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

export interface RoundInfo {
  round: number;
  realDateRange: string;
  marketEvents: string;
  tip: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  timeRange: string;
  rounds: RoundInfo[];
  stocks: StockMapping[];
}

// Scenario A: The most commonly discussed scenario (2018-2020 time period)
const scenarioA: Scenario = {
  id: 'scenario-a',
  name: 'Default Scenario (2018–2020)',
  description: 'The most commonly used simulation scenario covering Q1 2018 through Q2 2020. Includes the COVID-19 crash.',
  timeRange: 'Q1 2018 – Q2 2020',
  rounds: [
    { round: 1, realDateRange: 'Jan – Mar 2018 (Q1 2018)', marketEvents: 'Market volatility from trade war fears, crypto crash begins', tip: 'Moderate quarter. Tech mostly flat, some pullbacks in February.' },
    { round: 2, realDateRange: 'Apr – Jun 2018 (Q2 2018)', marketEvents: 'Continued trade tensions with China, rising interest rates', tip: 'Mixed bag. Tech and growth stocks start recovering while energy stays volatile.' },
    { round: 3, realDateRange: 'Jul – Sep 2018 (Q3 2018)', marketEvents: 'Strong GDP growth, tech earnings boom', tip: 'Strong quarter overall. FAANG stocks hit all-time highs. Load up on tech.' },
    { round: 4, realDateRange: 'Oct – Dec 2018 (Q4 2018)', marketEvents: 'Major market sell-off, worst December since the Great Depression', tip: '⚠️ DANGER: Sell risky positions. Nearly everything drops hard. Cash is king.' },
    { round: 5, realDateRange: 'Jan – Mar 2019 (Q1 2019)', marketEvents: 'Sharp recovery, Fed pauses rate hikes', tip: 'Strong recovery! Buy the dip from Q4 2018. Almost everything rebounds.' },
    { round: 6, realDateRange: 'Apr – Jun 2019 (Q2 2019)', marketEvents: 'Trade war escalation, market volatility returns', tip: 'Choppy quarter. May sees a pullback, June recovers. Tech remains strong.' },
    { round: 7, realDateRange: 'Jul – Sep 2019 (Q3 2019)', marketEvents: 'Rate cuts begin, yield curve inversion fears', tip: 'Mixed signals. Defensive stocks (utilities, staples) outperform.' },
    { round: 8, realDateRange: 'Oct – Dec 2019 (Q4 2019)', marketEvents: 'Trade deal optimism, Santa Claus rally', tip: 'Excellent quarter. Almost everything goes up. Heavy into tech and growth.' },
    { round: 9, realDateRange: 'Jan – Mar 2020 (Q1 2020)', marketEvents: '⚠️ COVID-19 PANDEMIC CRASH – fastest bear market in history', tip: '🚨 CRITICAL: SELL EVERYTHING early. Market crashes 30%+ in March. Go to cash or short.' },
    { round: 10, realDateRange: 'Apr – Jun 2020 (Q2 2020)', marketEvents: 'Historic recovery, Fed stimulus, massive tech rally', tip: 'Buy tech aggressively! Tesla, Netflix, Amazon all surge. One of the best quarters in market history.' },
  ],
  stocks: [
    { id: 1, stukentTicker: 'APCL', stukentName: 'Apical Technologies', realTicker: 'AAPL', realName: 'Apple Inc.', sector: 'Technology', confidence: 'high', notes: 'Consumer electronics giant. Strong and steady performer. Biggest giveaway is the name similarity and its status as the largest tech company.' },
    { id: 2, stukentTicker: 'PCFS', stukentName: 'Pacific Software', realTicker: 'MSFT', realName: 'Microsoft Corp.', sector: 'Technology', confidence: 'high', notes: 'Enterprise software and cloud leader. Very stable growth stock. Usually one of the most consistent performers in the sim.' },
    { id: 3, stukentTicker: 'NXGN', stukentName: 'NexGen Search', realTicker: 'GOOGL', realName: 'Alphabet Inc. (Google)', sector: 'Technology', confidence: 'high', notes: 'Search and advertising giant. "Search" in the name is a dead giveaway. Strong performer.' },
    { id: 4, stukentTicker: 'BLSR', stukentName: 'BlueStar Retail', realTicker: 'AMZN', realName: 'Amazon.com Inc.', sector: 'Consumer Discretionary', confidence: 'high', notes: 'E-commerce and cloud services. One of the best performers in the sim, especially in 2020 rounds.' },
    { id: 5, stukentTicker: 'EDSN', stukentName: 'Edison Motors', realTicker: 'TSLA', realName: 'Tesla Inc.', sector: 'Consumer Discretionary', confidence: 'high', notes: 'Electric vehicle maker. "Edison" = electricity hint. Extremely volatile but massive gains in 2020. The biggest winner in the sim if timed right.' },
    { id: 6, stukentTicker: 'HRLW', stukentName: 'Harlow Media', realTicker: 'NFLX', realName: 'Netflix Inc.', sector: 'Communication Services', confidence: 'high', notes: 'Streaming entertainment. Strong during COVID rounds as people stayed home. Volatile but big gainer.' },
    { id: 7, stukentTicker: 'FLCN', stukentName: 'Falcon Energy', realTicker: 'XOM', realName: 'Exxon Mobil Corp.', sector: 'Energy', confidence: 'medium', notes: 'Oil & gas major. Gets crushed during COVID rounds when oil prices collapse. Avoid in rounds 9-10.' },
    { id: 8, stukentTicker: 'MRDN', stukentName: 'Meridian Financial', realTicker: 'JPM', realName: 'JPMorgan Chase & Co.', sector: 'Financial', confidence: 'medium', notes: 'Largest US bank. Performs well in rising rate environments but drops hard in market crashes.' },
    { id: 9, stukentTicker: 'CRSN', stukentName: 'Carson Industries', realTicker: 'GE', realName: 'General Electric Co.', sector: 'Industrial', confidence: 'medium', notes: 'Industrial conglomerate. Was in decline during this period. Generally a poor performer in the sim.' },
    { id: 10, stukentTicker: 'HMLT', stukentName: 'Hamilton Air', realTicker: 'DAL', realName: 'Delta Air Lines Inc.', sector: 'Industrial', confidence: 'medium', notes: 'Major airline. Gets absolutely destroyed during COVID rounds. One of the worst stocks to hold in round 9.' },
    { id: 11, stukentTicker: 'BRLY', stukentName: 'Burley Beverages', realTicker: 'KO', realName: 'The Coca-Cola Co.', sector: 'Consumer Staples', confidence: 'medium', notes: 'Beverage giant. Defensive stock – holds up better than most during downturns. Steady dividends.' },
    { id: 12, stukentTicker: 'MTRO', stukentName: 'Metro Stores', realTicker: 'WMT', realName: 'Walmart Inc.', sector: 'Consumer Staples', confidence: 'medium', notes: 'Retail giant. Another defensive name. Does well during COVID as essential business.' },
    { id: 13, stukentTicker: 'WNTR', stukentName: 'Winter Pharma', realTicker: 'PFE', realName: 'Pfizer Inc.', sector: 'Healthcare', confidence: 'medium', notes: 'Major pharmaceutical company. Relatively stable. Doesn\'t see its big COVID vaccine bump until after the sim period.' },
    { id: 14, stukentTicker: 'DRKE', stukentName: 'Drake Telecom', realTicker: 'VZ', realName: 'Verizon Communications', sector: 'Communication Services', confidence: 'medium', notes: 'Major telecom. Defensive, dividend-paying stock. Holds up okay in downturns but limited upside.' },
    { id: 15, stukentTicker: 'SLVR', stukentName: 'Silver Resources', realTicker: 'NEM', realName: 'Newmont Corp.', sector: 'Materials', confidence: 'low', notes: 'Gold/silver miner. Can be a hedge during market fear. Gold mining stocks tend to rise when markets crash.' },
    { id: 16, stukentTicker: 'PNCL', stukentName: 'Pinnacle Chips', realTicker: 'NVDA', realName: 'NVIDIA Corp.', sector: 'Technology', confidence: 'medium', notes: 'GPU and AI chip maker. Very volatile. Strong long-term but can see big swings quarter to quarter.' },
    { id: 17, stukentTicker: 'CSTL', stukentName: 'Coastal Properties', realTicker: 'SPG', realName: 'Simon Property Group', sector: 'Real Estate', confidence: 'low', notes: 'Real estate investment trust (REIT). Mall operator. Gets hit hard by COVID. Underperformer.' },
    { id: 18, stukentTicker: 'ATLS', stukentName: 'Atlas Payments', realTicker: 'V', realName: 'Visa Inc.', sector: 'Financial', confidence: 'medium', notes: 'Global payments network. Strong and stable growth stock. "Payments" in name is a hint.' },
    { id: 19, stukentTicker: 'RDWD', stukentName: 'Redwood Dining', realTicker: 'MCD', realName: "McDonald's Corp.", sector: 'Consumer Discretionary', confidence: 'low', notes: 'Fast food giant. Defensive consumer stock. Holds up relatively well in downturns.' },
    { id: 20, stukentTicker: 'IRNB', stukentName: 'Ironbridge Steel', realTicker: 'X', realName: 'United States Steel Corp.', sector: 'Materials', confidence: 'low', notes: 'Steel manufacturer. Cyclical stock affected by trade war tariffs. Very volatile.' },
  ],
};

// Scenario B: Earlier time period (2015-2017)
const scenarioB: Scenario = {
  id: 'scenario-b',
  name: 'Extended Scenario (2015–2020)',
  description: 'A longer simulation covering Q1 2015 through Q4 2020. More rounds with a broader historical perspective.',
  timeRange: 'Q1 2015 – Q4 2020',
  rounds: [
    { round: 1, realDateRange: 'Jan – Jun 2015 (H1 2015)', marketEvents: 'Greek debt crisis, China slowdown fears', tip: 'Moderate first half. Tech continues to climb. Energy struggles due to oil price decline.' },
    { round: 2, realDateRange: 'Jul – Dec 2015 (H2 2015)', marketEvents: 'China stock market crash, Fed raises rates for first time since 2008', tip: 'Volatile. August has a flash crash. Market recovers by year end but flat overall.' },
    { round: 3, realDateRange: 'Jan – Jun 2016 (H1 2016)', marketEvents: 'Oil prices hit bottom, Brexit vote shock', tip: 'Rocky start in January, then recovery. Energy stocks finally bottom out.' },
    { round: 4, realDateRange: 'Jul – Dec 2016 (H2 2016)', marketEvents: 'Trump election surprise, post-election rally', tip: 'Strong rally after November election. Banks and industrials surge on deregulation hopes.' },
    { round: 5, realDateRange: 'Jan – Jun 2017 (H1 2017)', marketEvents: 'Continued "Trump bump", tech boom', tip: 'Excellent period. Tech and growth stocks lead. Very strong first half.' },
    { round: 6, realDateRange: 'Jul – Dec 2017 (H2 2017)', marketEvents: 'Tax reform passed, Bitcoin mania, low volatility', tip: 'One of the calmest bull market periods. Almost everything goes up. Buy and hold.' },
    { round: 7, realDateRange: 'Jan – Jun 2018 (H1 2018)', marketEvents: 'Trade war begins, February volatility spike', tip: 'Mixed. Strong start, then February correction. Trade war fears weigh on markets.' },
    { round: 8, realDateRange: 'Jul – Dec 2018 (H2 2018)', marketEvents: 'Q3 rally then Q4 crash – worst December since Great Depression', tip: '⚠️ Sell before Q4! October-December is brutal. Cash is king.' },
    { round: 9, realDateRange: 'Jan – Jun 2019 (H1 2019)', marketEvents: 'Sharp recovery from Q4 2018 crash, Fed pauses hikes', tip: 'Strong recovery. Buy aggressively – almost everything rebounds hard.' },
    { round: 10, realDateRange: 'Jul – Dec 2019 (H2 2019)', marketEvents: 'Rate cuts, trade deal hopes, Santa rally', tip: 'Good period overall. Tech and growth continue to outperform.' },
    { round: 11, realDateRange: 'Jan – Jun 2020 (H1 2020)', marketEvents: '⚠️ COVID-19 CRASH then V-shaped recovery', tip: '🚨 CRITICAL: Sell in February, buy back in late March/April. Huge swing quarter.' },
    { round: 12, realDateRange: 'Jul – Dec 2020 (H2 2020)', marketEvents: 'Massive stimulus rally, vaccine news, tech boom', tip: 'Buy everything, especially tech. Tesla goes parabolic. Best rally in years.' },
  ],
  stocks: [
    { id: 1, stukentTicker: 'APCL', stukentName: 'Apical Technologies', realTicker: 'AAPL', realName: 'Apple Inc.', sector: 'Technology', confidence: 'high', notes: 'Same stock across scenarios. Steady grower, especially strong 2019-2020.' },
    { id: 2, stukentTicker: 'PCFS', stukentName: 'Pacific Software', realTicker: 'MSFT', realName: 'Microsoft Corp.', sector: 'Technology', confidence: 'high', notes: 'Cloud transformation story. Gets stronger as the sim progresses. One of the best long-term holds.' },
    { id: 3, stukentTicker: 'NXGN', stukentName: 'NexGen Search', realTicker: 'GOOGL', realName: 'Alphabet Inc. (Google)', sector: 'Technology', confidence: 'high', notes: 'Dominant search and advertising. Very strong performer throughout.' },
    { id: 4, stukentTicker: 'BLSR', stukentName: 'BlueStar Retail', realTicker: 'AMZN', realName: 'Amazon.com Inc.', sector: 'Consumer Discretionary', confidence: 'high', notes: 'One of the biggest winners across the entire time period. E-commerce dominance.' },
    { id: 5, stukentTicker: 'EDSN', stukentName: 'Edison Motors', realTicker: 'TSLA', realName: 'Tesla Inc.', sector: 'Consumer Discretionary', confidence: 'high', notes: 'Wild ride. Big drops in 2018-2019 but massive rally in 2020. High risk, highest reward.' },
    { id: 6, stukentTicker: 'HRLW', stukentName: 'Harlow Media', realTicker: 'NFLX', realName: 'Netflix Inc.', sector: 'Communication Services', confidence: 'high', notes: 'Streaming giant. Very strong 2015-2018 run. More mixed in 2019.' },
    { id: 7, stukentTicker: 'FLCN', stukentName: 'Falcon Energy', realTicker: 'XOM', realName: 'Exxon Mobil Corp.', sector: 'Energy', confidence: 'medium', notes: 'Oil major. Struggles through most of this period as oil prices remain low. Disaster in 2020.' },
    { id: 8, stukentTicker: 'MRDN', stukentName: 'Meridian Financial', realTicker: 'JPM', realName: 'JPMorgan Chase & Co.', sector: 'Financial', confidence: 'medium', notes: 'Benefits from rising rates in 2015-2018. Drops in 2020 but recovers.' },
    { id: 9, stukentTicker: 'CRSN', stukentName: 'Carson Industries', realTicker: 'GE', realName: 'General Electric Co.', sector: 'Industrial', confidence: 'medium', notes: 'In secular decline. One of the worst performers. Avoid unless looking to short.' },
    { id: 10, stukentTicker: 'HMLT', stukentName: 'Hamilton Air', realTicker: 'DAL', realName: 'Delta Air Lines Inc.', sector: 'Industrial', confidence: 'medium', notes: 'Decent 2015-2019 but obliterated by COVID. Sell before round 11.' },
    { id: 11, stukentTicker: 'BRLY', stukentName: 'Burley Beverages', realTicker: 'KO', realName: 'The Coca-Cola Co.', sector: 'Consumer Staples', confidence: 'medium', notes: 'Steady defensive stock. Good for conservative rounds.' },
    { id: 12, stukentTicker: 'MTRO', stukentName: 'Metro Stores', realTicker: 'WMT', realName: 'Walmart Inc.', sector: 'Consumer Staples', confidence: 'medium', notes: 'Retail giant. Defensive play that holds up in downturns.' },
    { id: 13, stukentTicker: 'WNTR', stukentName: 'Winter Pharma', realTicker: 'PFE', realName: 'Pfizer Inc.', sector: 'Healthcare', confidence: 'medium', notes: 'Pharma blue chip. Stable but unexciting in this period.' },
    { id: 14, stukentTicker: 'DRKE', stukentName: 'Drake Telecom', realTicker: 'VZ', realName: 'Verizon Communications', sector: 'Communication Services', confidence: 'medium', notes: 'Telecom. Defensive dividend stock.' },
    { id: 15, stukentTicker: 'SLVR', stukentName: 'Silver Resources', realTicker: 'NEM', realName: 'Newmont Corp.', sector: 'Materials', confidence: 'low', notes: 'Precious metals miner. Good hedge during fear periods.' },
    { id: 16, stukentTicker: 'PNCL', stukentName: 'Pinnacle Chips', realTicker: 'NVDA', realName: 'NVIDIA Corp.', sector: 'Technology', confidence: 'medium', notes: 'GPU maker. One of the strongest performers across the entire period.' },
    { id: 17, stukentTicker: 'CSTL', stukentName: 'Coastal Properties', realTicker: 'SPG', realName: 'Simon Property Group', sector: 'Real Estate', confidence: 'low', notes: 'REIT. In decline as malls struggle. COVID accelerates the pain.' },
    { id: 18, stukentTicker: 'ATLS', stukentName: 'Atlas Payments', realTicker: 'V', realName: 'Visa Inc.', sector: 'Financial', confidence: 'medium', notes: 'Payment network. Strong and steady grower throughout.' },
    { id: 19, stukentTicker: 'RDWD', stukentName: 'Redwood Dining', realTicker: 'MCD', realName: "McDonald's Corp.", sector: 'Consumer Discretionary', confidence: 'low', notes: 'Fast food. Defensive consumer stock with steady performance.' },
    { id: 20, stukentTicker: 'IRNB', stukentName: 'Ironbridge Steel', realTicker: 'X', realName: 'United States Steel Corp.', sector: 'Materials', confidence: 'low', notes: 'Steel company. Benefits from tariffs initially but very cyclical.' },
  ],
};

export const scenarios: Scenario[] = [scenarioA, scenarioB];

export const sectors = [
  'All Sectors',
  'Technology',
  'Consumer Discretionary',
  'Consumer Staples',
  'Communication Services',
  'Energy',
  'Financial',
  'Healthcare',
  'Industrial',
  'Materials',
  'Real Estate',
];

export const confidenceColors = {
  high: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'High' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Medium' },
  low: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Low' },
};

export const sectorColors: Record<string, string> = {
  'Technology': 'bg-blue-500/20 text-blue-400',
  'Consumer Discretionary': 'bg-purple-500/20 text-purple-400',
  'Consumer Staples': 'bg-green-500/20 text-green-400',
  'Communication Services': 'bg-pink-500/20 text-pink-400',
  'Energy': 'bg-orange-500/20 text-orange-400',
  'Financial': 'bg-yellow-500/20 text-yellow-400',
  'Healthcare': 'bg-cyan-500/20 text-cyan-400',
  'Industrial': 'bg-slate-400/20 text-slate-300',
  'Materials': 'bg-amber-600/20 text-amber-400',
  'Real Estate': 'bg-teal-500/20 text-teal-400',
};
