import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Search } from 'lucide-react';
import { useApi } from '../api/client';

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
  onExecuteTrade: (trade: { ticker: string; quantity: number; price: number }) => void;
}

// Extra local fallback tickers (used when API is blocked/rate-limited)
const EXTRA_FALLBACK: Array<{ ticker: string; companyName: string; price: number }> = [
  { ticker: 'META', companyName: 'Meta Platforms, Inc.', price: 480 },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc. (Class A)', price: 150 },
  { ticker: 'GOOG', companyName: 'Alphabet Inc. (Class C)', price: 150 },
  { ticker: 'NFLX', companyName: 'Netflix, Inc.', price: 600 },
  { ticker: 'NVDA', companyName: 'NVIDIA Corporation', price: 900 },
  { ticker: 'AMD', companyName: 'Advanced Micro Devices, Inc.', price: 170 },
  { ticker: 'INTC', companyName: 'Intel Corporation', price: 35 },
  { ticker: 'IBM', companyName: 'International Business Machines', price: 170 },
  { ticker: 'ORCL', companyName: 'Oracle Corporation', price: 125 },
  { ticker: 'PYPL', companyName: 'PayPal Holdings, Inc.', price: 65 },
  { ticker: 'SQ', companyName: 'Block, Inc.', price: 70 },
  { ticker: 'DIS', companyName: 'The Walt Disney Company', price: 90 },
  { ticker: 'KO', companyName: 'The Coca-Cola Company', price: 60 },
  { ticker: 'PEP', companyName: 'PepsiCo, Inc.', price: 175 },
  { ticker: 'NKE', companyName: 'NIKE, Inc.', price: 95 },
  { ticker: 'JPM', companyName: 'JPMorgan Chase & Co.', price: 200 },
  { ticker: 'BAC', companyName: 'Bank of America Corporation', price: 38 },
  { ticker: 'XOM', companyName: 'Exxon Mobil Corporation', price: 110 },
  { ticker: 'CVX', companyName: 'Chevron Corporation', price: 160 },
  { ticker: 'UNH', companyName: 'UnitedHealth Group Incorporated', price: 480 },
];

export function TradeModal({ 
  isOpen, 
  onClose, 
  stocks, 
  positions, 
  cashBalance, 
  onExecuteTrade 
}: TradeModalProps) {
  const api = useApi();
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{ ticker: string; companyName: string; price: number }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const abortRef = useRef<AbortController | null>(null);

  const handleClose = () => {
    // Reset form state when closing
    setSearchTicker('');
    setSelectedStock(null);
    setQuantity('');
    setError('');
    onClose();
  };

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

    if (totalCost > cashBalance) {
      setError('Insufficient cash balance');
      return;
    }

    // Delegate execution to parent (App) which will close this modal and open Journal
    onExecuteTrade({ ticker: selectedStock.ticker, quantity: qty, price: selectedStock.currentPrice });
  };

  // Reset form state whenever the modal closes so it opens blank next time
  useEffect(() => {
    if (!isOpen) {
      setSearchTicker('');
      setSelectedStock(null);
      setQuantity('');
      setError('');
      setResults([]);
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Debounced live search via API adapter (handles RapidAPI and local fallback)
  useEffect(() => {
    const q = searchTicker.trim();
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const mapped = await api.quotes.searchTickers(q, { abortSignal: controller.signal });
        // If adapter returns empty, fallback to local merged list
        const resultList = mapped.length > 0 ? mapped : [
          ...Object.values(stocks).map(s => ({ ticker: s.ticker, companyName: s.companyName, price: s.currentPrice })),
          ...EXTRA_FALLBACK,
        ]
          .filter(s => s.ticker.includes(q.toUpperCase()) || s.companyName.toUpperCase().includes(q.toUpperCase()))
          .slice(0, 5);

        setResults(resultList);
        setShowDropdown(true);
        setIsSearching(false);
      } catch {
        setIsSearching(false);
        // Fallback to local suggestions on any error (403/429/etc.)
        const qUpper = q.toUpperCase();
        const mergedLocal = [
          ...Object.values(stocks).map(s => ({ ticker: s.ticker, companyName: s.companyName, price: s.currentPrice })),
          ...EXTRA_FALLBACK,
        ];
        const local = mergedLocal
          .filter(s => s.ticker.includes(qUpper) || s.companyName.toUpperCase().includes(qUpper))
          .slice(0, 5);
        setResults(local);
        setShowDropdown(true);
        if (local.length === 0) setError('No matches found.');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTicker, stocks, api.quotes]);

  const handleSelectResult = (item: { ticker: string; companyName: string; price: number }) => {
    setSelectedStock({ ticker: item.ticker, companyName: item.companyName, currentPrice: item.price });
    setSearchTicker(item.ticker);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setError('');
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-blue-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-blue-900 text-lg font-normal">New Trade</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Stock Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Search Stock</label>
            <div className="relative flex space-x-2">
              <Input
                placeholder="Ticker/Company Name"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showDropdown && highlightedIndex >= 0 && highlightedIndex < results.length) {
                      handleSelectResult(results[highlightedIndex]);
                    } else {
                      handleSearch();
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setShowDropdown(true);
                    setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.max(i - 1, 0));
                  }
                }}
                className="flex-1 h-8 bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              <Button 
                onClick={handleSearch} 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white h-8"
              >
                <Search className="h-4 w-4" />
              </Button>

              {showDropdown && (
                <div className="absolute left-0 right-0 top-9 z-10 bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-auto">
                  {isSearching && (
                    <div className="px-3 py-2 text-xs text-gray-500">Searching...</div>
                  )}
                  {!isSearching && results.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      No matches found. Press Enter to use "{searchTicker.toUpperCase()}".
                    </div>
                  )}
                  {!isSearching && results.map((item, idx) => (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => handleSelectResult(item)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${idx === highlightedIndex ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-900 font-medium">{item.ticker}</span>
                          <span className="text-gray-600">{item.companyName}</span>
                        </div>
                        <span className="text-sm text-gray-700">{formatCurrency(item.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Stock Info */}
          {selectedStock && (
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 mb-6">
                  <span className="text-blue-900 text-sm font-normal">{selectedStock.ticker}</span>
                  <span className="text-sm text-gray-600">-</span>
                  <span className="text-sm text-gray-600">{selectedStock.companyName}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Current Price:</span>
                    <span className="text-sm font-normal">{formatCurrency(selectedStock.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Owned Shares:</span>
                    <span className="text-sm font-normal">{getOwnedShares(selectedStock.ticker)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}



          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Quantity</label>
            <Input
              type="number"
              placeholder="Number of shares"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
                              className="h-8 bg-gray-100 border border-gray-200 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
          </div>

          {/* Order Summary */}
          {selectedStock && quantity && parseInt(quantity) > 0 && (
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 text-xs mt-6">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-600">BUY {quantity} shares of {selectedStock.ticker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-600">Price per share:</span>
                    <span className="text-xs font-normal">{formatCurrency(selectedStock.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-xs font-medium text-gray-600">Total:</span>
                    <span className="text-xs font-normal">{formatCurrency(selectedStock.currentPrice * parseInt(quantity))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 h-8 border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteTrade} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8"
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

export {};
