import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { DonutChart } from './ui/donut-chart';

import { 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  X
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  cashBalance: number;
}

interface Stock {
  ticker: string;
  companyName: string;
  currentPrice: number;
}

interface Position {
  id: string;
  ticker: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  // V1: link sell rows to their originating buy lot
  parentPositionId?: string;
}

interface Trade {
  id: string;
  ticker: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  positionId?: string;
  journalEntry?: {
    sources: string[];
    rationale: string;
    tags?: string[];
    sentiment?: 'bullish' | 'neutral' | 'bearish';
  };
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
  positions: Position[];
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  onSell: (position: Position, quantity: number) => void;
}

// Mock stock data
const mockStocks: { [key: string]: Stock } = {
  'AAPL': { ticker: 'AAPL', companyName: 'Apple Inc.', currentPrice: 185.50 },
  'GOOGL': { ticker: 'GOOGL', companyName: 'Alphabet Inc.', currentPrice: 138.20 },
  'MSFT': { ticker: 'MSFT', companyName: 'Microsoft Corporation', currentPrice: 378.85 },
  'TSLA': { ticker: 'TSLA', companyName: 'Tesla Inc.', currentPrice: 248.42 },
  'AMZN': { ticker: 'AMZN', companyName: 'Amazon.com Inc.', currentPrice: 145.86 },
  'NVDA': { ticker: 'NVDA', companyName: 'NVIDIA Corporation', currentPrice: 875.30 },
};

export function Dashboard({ user, onLogout, positions, setPositions, trades, setTrades, onSell }: DashboardProps) {

  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellError, setSellError] = useState('');
  const [selectedTradeForHistory, setSelectedTradeForHistory] = useState<Trade | null>(null);

  // Local persistence helpers (mirrors App.tsx) per email account
  // V1: persistence handled in App


  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(mockStocks).forEach(ticker => {
        const stock = mockStocks[ticker];
        const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
        stock.currentPrice = Math.max(0.01, stock.currentPrice + change);
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculatePortfolioValue = () => {
    const holdingsValue = positions.reduce((total, position) => {
      const currentPrice = mockStocks[position.ticker]?.currentPrice || 0;
      return total + (currentPrice * position.quantity);
    }, 0);
    return user.cashBalance + holdingsValue;
  };

  const calculateTotalPnL = () => {
    return positions.reduce((total, position) => {
      const currentPrice = mockStocks[position.ticker]?.currentPrice || 0;
      const pnl = (currentPrice - position.purchasePrice) * position.quantity;
      return total + pnl;
    }, 0);
  };

  const calculateAllocation = () => {
    // Aggregate holdings by ticker (ignore non-positive quantities)
    const tickerToValue: { [ticker: string]: number } = {};
    positions.forEach((position) => {
      if (position.quantity <= 0) return;
      const currentPrice = mockStocks[position.ticker]?.currentPrice || 0;
      const value = currentPrice * position.quantity;
      tickerToValue[position.ticker] = (tickerToValue[position.ticker] || 0) + value;
    });

    const holdingsValue = Object.values(tickerToValue).reduce((a, b) => a + b, 0);
    const totalPortfolioValue = user.cashBalance + holdingsValue;

    // Color palette for slices (cash + tickers)
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6366f1', '#d946ef', '#84cc16', '#64748b'];

    const chartData: { name: string; value: number; color: string }[] = [];

    // Cash slice first
    const cashPct = totalPortfolioValue > 0 ? (user.cashBalance / totalPortfolioValue) * 100 : 0;
    const cashPctRounded = Math.round(cashPct * 10) / 10;
    chartData.push({ name: 'Cash', value: cashPctRounded, color: palette[0] });

    // Ticker slices
    const tickersSorted = Object.entries(tickerToValue).sort((a, b) => b[1] - a[1]);
    tickersSorted.forEach(([ticker, value], index) => {
      const pct = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
      const pctRounded = Math.round(pct * 10) / 10;
      // Rotate palette after the first (cash) color
      const color = palette[(index + 1) % palette.length];
      chartData.push({ name: ticker, value: pctRounded, color });
    });

    return {
      chartData,
    };
  };

  const calculatePositionPnL = (position: Position) => {
    const currentPrice = mockStocks[position.ticker]?.currentPrice || 0;
    return (currentPrice - position.purchasePrice) * position.quantity;
  };

  const isSellPosition = (position: Position) => {
    return position.quantity < 0;
  };

  // removed unused helper to satisfy linter

  const getAvailableSharesForPosition = (position: Position) => {
    // For each individual position, check if it has any shares left to sell
    if (position.quantity <= 0) return 0; // Already a sell position or no shares
    
    // Count how many shares from this specific position have been sold (V1: use explicit parent link; fallback only if no links exist)
    const sellsLinked = positions.filter(p => p.quantity < 0 && p.parentPositionId === position.id);
    let soldFromThisPosition = sellsLinked.reduce((sum, p) => sum + Math.abs(p.quantity), 0);
    if (soldFromThisPosition === 0) {
      // Fallback for legacy rows without parentPositionId
      soldFromThisPosition = positions
        .filter(p => p.ticker === position.ticker && p.quantity < 0 && p.purchasePrice === position.purchasePrice)
        .reduce((sum, p) => sum + Math.abs(p.quantity), 0);
    }
    
    return Math.max(0, position.quantity - soldFromThisPosition);
  };

  const handleSellClick = (position: Position) => {
    if (isSellPosition(position)) {
      setSellError('Cannot sell a sell position');
      return;
    }
    setSelectedPosition(position);
    setSellQuantity('');
    setSellError('');
    setSellModalOpen(true);
  };

  const handleSellSubmit = () => {
    if (!selectedPosition || !sellQuantity) {
      setSellError('Please enter a quantity');
      return;
    }

    const quantity = parseInt(sellQuantity);
    if (!quantity || quantity <= 0) {
      setSellError('Please enter a valid quantity');
      return;
    }

    const availableShares = getAvailableSharesForPosition(selectedPosition);
    if (quantity > availableShares) {
      setSellError(`You only own ${availableShares} shares of ${selectedPosition.ticker}`);
      return;
    }

    // Delegate to App
    onSell(selectedPosition, quantity);

    setSellModalOpen(false);
    setSelectedPosition(null);
    setSellQuantity('');
    setSellError('');
  };

  const handleJournalClick = (position: Position) => {
    // Find the trade linked to this specific purchase row via positionId
    const linkedTrade = trades.find(trade => trade.positionId === position.id);
    if (linkedTrade && linkedTrade.journalEntry) {
      setSelectedTradeForHistory(linkedTrade);
    } else {
      alert('No journal entry yet for this position.');
    }
  };



  const isGain = calculateTotalPnL() >= 0;
  const gainLossLabel = isGain ? 'Total Gain' : 'Total Loss';
  const gainLossColor = isGain ? 'text-green-600' : 'text-red-600';
  const GainLossIcon = isGain ? TrendingUp : TrendingDown;
  const allocation = calculateAllocation();

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-light text-gray-600">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-lg sm:text-xl mt-4 font-normal">{formatCurrency(user.cashBalance)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-light text-gray-600">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-lg sm:text-xl mt-4 font-normal">{formatCurrency(calculatePortfolioValue())}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-light text-gray-600">{gainLossLabel}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center space-x-2 mt-4">
              <p className={`text-lg sm:text-xl font-normal ${gainLossColor}`}>
                {formatCurrency(Math.abs(calculateTotalPnL()))}
              </p>
              <GainLossIcon className={`h-5 w-5 ${gainLossColor}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-light text-gray-600">Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="flex flex-col items-center space-y-3 mt-2">
              <DonutChart 
                data={allocation.chartData}
                size={100}
                innerRadius={25}
                outerRadius={40}
              />
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                {allocation.chartData.map((slice) => (
                  <div key={slice.name} className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="text-gray-600">{slice.name} {slice.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table (V1: group sells under their buy lot, newest-first) */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-900 text-sm font-normal">Your Positions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No positions yet. Start trading to build your portfolio!</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-0">
                    {/* Mobile Card Layout (grouped) */}
                    <div className="sm:hidden space-y-3">
                      {(() => {
                        const buys = positions.filter(p => p.quantity > 0);
                        const sells = positions.filter(p => p.quantity < 0);
                        const sellsByParent = new Map<string, Position[]>();
                        sells.forEach(s => {
                          let parentId = s.parentPositionId;
                          if (!parentId) {
                            const candidate = buys.find(b => b.ticker === s.ticker && b.purchasePrice === s.purchasePrice);
                            if (candidate) parentId = candidate.id;
                          }
                          if (!parentId) return;
                          const arr = sellsByParent.get(parentId) || [];
                          arr.push(s);
                          sellsByParent.set(parentId, arr);
                        });
                        return buys.map(buy => {
                          const stock = mockStocks[buy.ticker];
                          const currentPrice = stock?.currentPrice || 0;
                          const pnl = calculatePositionPnL(buy);
                          const children = (sellsByParent.get(buy.id) || []).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
                          const remaining = getAvailableSharesForPosition(buy);
                          return (
                            <div key={buy.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-blue-900">{buy.ticker}</h3>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Buy</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{stock?.companyName || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500 mt-1">Remaining shares: {remaining}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(pnl)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-gray-600">Purchase:</span>
                                  <span className="ml-1">{formatCurrency(buy.purchasePrice)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Current:</span>
                                  <span className="ml-1">{formatCurrency(currentPrice)}</span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleJournalClick(buy)} className="flex-1">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Journal
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSellClick(buy)}
                                  disabled={buy.quantity <= 0}
                                  className={`flex-1 ${getAvailableSharesForPosition(buy) > 0 ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                >
                                  Sell
                                </Button>
                              </div>

                              {children.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {children.map(child => {
                                    const childStock = mockStocks[child.ticker];
                                    const childCurrent = childStock?.currentPrice || 0;
                                    const childPnl = calculatePositionPnL(child);
                                    return (
                                      <div key={child.id} className="ml-4 p-3 rounded-md border border-gray-200 bg-white">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Sell</span>
                                            <span className="text-xs text-gray-500">{new Date(child.purchaseDate).toLocaleString()}</span>
                                          </div>
                                          <div className={`${childPnl >= 0 ? 'text-green-600' : 'text-red-600'} text-sm`}>{formatCurrency(childPnl)}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                                          <div>
                                            <span className="text-gray-600">Sell Price:</span>
                                            <span className="ml-1">{formatCurrency(child.purchasePrice)}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Current:</span>
                                            <span className="ml-1">{formatCurrency(childCurrent)}</span>
                                          </div>
                                        </div>
                                        <div className="mt-2">
                                          <Button size="sm" variant="outline" onClick={() => handleJournalClick(child)} className="border-gray-200">
                                            <BookOpen className="h-4 w-4 mr-2" /> Journal
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Desktop Table Layout (grouped) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4">Type</th>
                            <th className="text-left py-3 px-4">Ticker</th>
                            <th className="text-left py-3 px-4">Company</th>
                            <th className="text-left py-3 px-4">Price</th>
                            <th className="text-left py-3 px-4">Current Price</th>
                            <th className="text-left py-3 px-4">Gain/Loss</th>
                            <th className="text-left py-3 px-4">Journal</th>
                            <th className="text-left py-3 px-4">Sell</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const buys = positions.filter(p => p.quantity > 0);
                            const sells = positions.filter(p => p.quantity < 0);
                            const sellsByParent = new Map<string, Position[]>();
                            sells.forEach(s => {
                              let parentId = s.parentPositionId;
                              if (!parentId) {
                                const candidate = buys.find(b => b.ticker === s.ticker && b.purchasePrice === s.purchasePrice);
                                if (candidate) parentId = candidate.id;
                              }
                              if (!parentId) return;
                              const arr = sellsByParent.get(parentId) || [];
                              arr.push(s);
                              sellsByParent.set(parentId, arr);
                            });
                            const rows: JSX.Element[] = [];
                            buys.forEach(buy => {
                              const stock = mockStocks[buy.ticker];
                              const currentPrice = stock?.currentPrice || 0;
                              const pnl = calculatePositionPnL(buy);
                              const remaining = getAvailableSharesForPosition(buy);
                              rows.push(
                                <tr key={buy.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Buy</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-blue-900">{buy.ticker}</span>
                                      <span className="text-xs text-gray-500">Remaining: {remaining}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">{stock?.companyName || 'Unknown'}</td>
                                  <td className="py-3 px-4 text-left">{formatCurrency(buy.purchasePrice)}</td>
                                  <td className="py-3 px-4 text-left">{formatCurrency(currentPrice)}</td>
                                  <td className={`py-3 px-4 text-left ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(pnl)}</td>
                                  <td className="py-3 px-4 text-left">
                                    <Button size="sm" variant="outline" onClick={() => handleJournalClick(buy)} className="border-gray-200">
                                      <BookOpen className="h-4 w-4 mr-1" /> Journal
                                    </Button>
                                  </td>
                                  <td className="py-3 px-4 text-left">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSellClick(buy)}
                                      disabled={buy.quantity <= 0}
                                      className={`${getAvailableSharesForPosition(buy) > 0 ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                    >
                                      Sell
                                    </Button>
                                  </td>
                                </tr>
                              );
                              const children = (sellsByParent.get(buy.id) || []).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
                              children.forEach(child => {
                                const stockC = mockStocks[child.ticker];
                                const currentC = stockC?.currentPrice || 0;
                                const pnlC = calculatePositionPnL(child);
                                rows.push(
                                  <tr key={child.id} className="border-b border-gray-100 bg-gray-50">
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Sell</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="pl-4">
                                        <span className="text-blue-900">{child.ticker}</span>
                                        <span className="ml-2 text-xs text-gray-500">{new Date(child.purchaseDate).toLocaleString()}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{stockC?.companyName || 'Unknown'}</td>
                                    <td className="py-3 px-4 text-left">{formatCurrency(child.purchasePrice)}</td>
                                    <td className="py-3 px-4 text-left">{formatCurrency(currentC)}</td>
                                    <td className={`py-3 px-4 text-left ${pnlC >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(pnlC)}</td>
                                    <td className="py-3 px-4 text-left">
                                      <Button size="sm" variant="outline" onClick={() => handleJournalClick(child)} className="border-gray-200">
                                        <BookOpen className="h-4 w-4 mr-1" /> Journal
                                      </Button>
                                    </td>
                                    <td className="py-3 px-4 text-left"></td>
                                  </tr>
                                );
                              });
                            });
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

      {/* Sell Modal */}
      {sellModalOpen && selectedPosition && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-blue-900 text-lg">Sell {selectedPosition?.ticker}</h2>
              <button
                onClick={() => setSellModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Quantity to Sell</label>
                <Input
                  type="number"
                  placeholder="Number of shares"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  min="1"
                  max={selectedPosition ? getAvailableSharesForPosition(selectedPosition) : 0}
                  className="bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <p className="text-sm text-gray-600">
                  Available shares: {selectedPosition ? getAvailableSharesForPosition(selectedPosition) : 0}
                </p>
              </div>

              {sellError && (
                <div className="text-red-600 text-sm">
                  {sellError}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <Button variant="outline" onClick={() => setSellModalOpen(false)} className="flex-1 border-gray-300">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSellSubmit} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!sellQuantity || parseInt(sellQuantity) <= 0}
                >
                  Sell
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade History Detail Modal */}
      {selectedTradeForHistory && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-blue-900">Trade Details</h2>
                <button
                  onClick={() => setSelectedTradeForHistory(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Ticker</label>
                    <p>{selectedTradeForHistory?.ticker}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Action</label>
                    <p className="capitalize">{selectedTradeForHistory?.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Quantity</label>
                    <p>{selectedTradeForHistory?.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Price</label>
                    <p>{formatCurrency(selectedTradeForHistory?.price || 0)}</p>
                  </div>
                </div>
                
                {selectedTradeForHistory?.journalEntry && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Information Sources</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTradeForHistory.journalEntry.sources.map(source => (
                          <span
                            key={source}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Rationale</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-800 text-sm">{selectedTradeForHistory.journalEntry.rationale}</p>
                      </div>
                    </div>
                    {/* Tags removed per request */}
                    {selectedTradeForHistory.journalEntry.sentiment && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Sentiment</label>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          selectedTradeForHistory.journalEntry.sentiment === 'bullish' ? 'bg-green-100 text-green-800' :
                          selectedTradeForHistory.journalEntry.sentiment === 'bearish' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTradeForHistory.journalEntry.sentiment}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
