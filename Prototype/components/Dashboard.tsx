import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, TrendingUp, TrendingDown, BookOpen, X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
}

interface Trade {
  id: string;
  ticker: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  journalEntry?: {
    sources: string[];
    rationale: string;
  };
}

interface DashboardProps {
  user: User;
  positions: Position[];
  stocks: { [key: string]: Stock };
  portfolioValue: number;
  totalPnL: number;
  trades: Trade[];
  onOpenTradeModal: () => void;
  onViewTradeDetails: (trade: Trade) => void;
  onSellStock: (ticker: string, quantity: number) => boolean;
}

export function Dashboard({ 
  user, 
  positions, 
  stocks, 
  portfolioValue, 
  totalPnL, 
  trades,
  onOpenTradeModal,
  onViewTradeDetails,
  onSellStock
}: DashboardProps) {
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellError, setSellError] = useState('');
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculatePositionPnL = (position: Position) => {
    const currentPrice = stocks[position.ticker]?.currentPrice || 0;
    return (currentPrice - position.purchasePrice) * position.quantity;
  };

  const isSellPosition = (position: Position) => {
    return position.quantity < 0;
  };

  const getPositionType = (position: Position) => {
    return isSellPosition(position) ? 'Sell' : 'Buy';
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

    const availableShares = getAvailableShares(selectedPosition.ticker);
    if (quantity > availableShares) {
      setSellError(`You only own ${availableShares} shares of ${selectedPosition.ticker}`);
      return;
    }

    const success = onSellStock(selectedPosition.ticker, quantity);
    if (success) {
      setSellModalOpen(false);
      setSelectedPosition(null);
      setSellQuantity('');
      setSellError('');
    } else {
      setSellError('Sell operation failed');
    }
  };

  const getAvailableShares = (ticker: string) => {
    return positions
      .filter(p => p.ticker === ticker)
      .reduce((sum, p) => sum + p.quantity, 0);
  };

  const handleJournalClick = (position: Position) => {
    // Find the most recent trade for this position
    const positionTrades = trades.filter(trade => trade.ticker === position.ticker);
    const mostRecentTrade = positionTrades.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    if (mostRecentTrade) {
      onViewTradeDetails(mostRecentTrade);
    } else {
      alert(`No trade history found for ${position.ticker} position`);
    }
  };

  const isGain = totalPnL >= 0;
  const gainLossLabel = isGain ? 'Total Gain' : 'Total Loss';
  const gainLossColor = isGain ? 'text-green-600' : 'text-red-600';
  const gainLossIcon = isGain ? TrendingUp : TrendingDown;
  const GainLossIcon = gainLossIcon;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl">{formatCurrency(user.cashBalance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl">{formatCurrency(portfolioValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">{gainLossLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <p className={`text-xl sm:text-2xl ${gainLossColor}`}>
                {formatCurrency(Math.abs(totalPnL))}
              </p>
              <GainLossIcon className={`h-5 w-5 ${gainLossColor}`} />
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-900">Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No positions yet. Start trading to build your portfolio!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-0">
              {/* Mobile Card Layout */}
              <div className="sm:hidden space-y-3">
                {positions.map((position) => {
                  const stock = stocks[position.ticker];
                  const currentPrice = stock?.currentPrice || 0;
                  const pnl = calculatePositionPnL(position);
                  const isSell = isSellPosition(position);
                  
                  return (
                    <div key={position.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-blue-900">{position.ticker}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isSell ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {getPositionType(position)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{stock?.companyName || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pnl)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">{isSell ? 'Sell Price:' : 'Purchase:'}</span>
                          <span className="ml-1">{formatCurrency(position.purchasePrice)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <span className="ml-1">{formatCurrency(currentPrice)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJournalClick(position)}
                        className="w-full"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Journal
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
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
                    {positions.map((position) => {
                      const stock = stocks[position.ticker];
                      const currentPrice = stock?.currentPrice || 0;
                      const pnl = calculatePositionPnL(position);
                      const isSell = isSellPosition(position);
                      
                      return (
                        <tr key={position.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isSell ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {getPositionType(position)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-blue-900">{position.ticker}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {stock?.companyName || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-left">
                            {formatCurrency(position.purchasePrice)}
                          </td>
                          <td className="py-3 px-4 text-left">
                            {formatCurrency(currentPrice)}
                          </td>
                          <td className={`py-3 px-4 text-left ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pnl)}
                          </td>
                          <td className="py-3 px-4 text-left">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJournalClick(position)}
                            >
                              <BookOpen className="h-4 w-4 mr-1" />
                              Journal
                            </Button>
                          </td>
                          <td className="py-3 px-4 text-left">
                            {!isSellPosition(position) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSellClick(position)}
                                disabled={getAvailableShares(position.ticker) <= 0}
                              >
                                Sell
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Modal */}
      {sellModalOpen && selectedPosition && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-blue-900">Sell {selectedPosition.ticker}</h2>
              <button
                onClick={() => setSellModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Quantity to Sell</Label>
                <Input
                  type="number"
                  placeholder="Number of shares"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  min="1"
                  max={getAvailableShares(selectedPosition.ticker)}
                />
                <p className="text-sm text-gray-600">
                  Available shares: {getAvailableShares(selectedPosition.ticker)}
                </p>
              </div>

              {sellError && (
                <div className="text-red-600 text-sm">
                  {sellError}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <Button variant="outline" onClick={() => setSellModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSellSubmit} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={!sellQuantity || parseInt(sellQuantity) <= 0}
                >
                  Sell
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}