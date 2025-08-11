import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { X, Search } from 'lucide-react';

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

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: { [key: string]: Stock };
  positions: Position[];
  cashBalance: number;
  onExecuteTrade: (ticker: string, action: 'buy' | 'sell', quantity: number) => boolean;
}

export function TradeModal({ 
  isOpen, 
  onClose, 
  stocks, 
  positions, 
  cashBalance, 
  onExecuteTrade 
}: TradeModalProps) {
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = () => {
    const ticker = searchTicker.toUpperCase();
    const stock = stocks[ticker];
    
    if (stock) {
      setSelectedStock(stock);
      setError('');
    } else {
      setError('Stock not found. Try: AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA');
      setSelectedStock(null);
    }
  };

  const handleExecuteTrade = () => {
    if (!selectedStock) {
      setError('Please select a stock first');
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const totalCost = selectedStock.currentPrice * qty;

    if (tradeAction === 'buy' && totalCost > cashBalance) {
      setError('Insufficient cash balance');
      return;
    }

    if (tradeAction === 'sell') {
      const ownedShares = positions
        .filter(p => p.ticker === selectedStock.ticker)
        .reduce((sum, p) => sum + p.quantity, 0);
      
      if (qty > ownedShares) {
        setError(`You only own ${ownedShares} shares of ${selectedStock.ticker}`);
        return;
      }
    }

    const success = onExecuteTrade(selectedStock.ticker, tradeAction, qty);
    if (success) {
      // Reset form and close modal
      setSearchTicker('');
      setSelectedStock(null);
      setQuantity('');
      setError('');
      onClose();
    } else {
      setError('Trade execution failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getOwnedShares = (ticker: string) => {
    return positions
      .filter(p => p.ticker === ticker)
      .reduce((sum, p) => sum + p.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-blue-900">New Trade</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Stock Search */}
          <div className="space-y-2">
            <Label>Search Stock</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Ticker/Company Name"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Stock Info */}
          {selectedStock && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-900">{selectedStock.ticker}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{selectedStock.companyName}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Price:</span>
                    <span>{formatCurrency(selectedStock.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Owned Shares:</span>
                    <span>{getOwnedShares(selectedStock.ticker)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trade Action */}
          <div className="space-y-2">
            <Label>Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tradeAction === 'buy' ? 'default' : 'outline'}
                onClick={() => setTradeAction('buy')}
                className={tradeAction === 'buy' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Buy
              </Button>
              <Button
                variant={tradeAction === 'sell' ? 'default' : 'outline'}
                onClick={() => setTradeAction('sell')}
                className={tradeAction === 'sell' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              placeholder="Number of shares"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>

          {/* Order Summary */}
          {selectedStock && quantity && parseInt(quantity) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{tradeAction.toUpperCase()} {quantity} shares of {selectedStock.ticker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per share:</span>
                    <span>{formatCurrency(selectedStock.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedStock.currentPrice * parseInt(quantity))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteTrade} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!selectedStock || !quantity || parseInt(quantity) <= 0}
            >
              Execute Trade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}