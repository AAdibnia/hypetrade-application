import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';

interface Trade {
  id: string;
  ticker: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
}

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onSave: (
    sources: string[],
    rationale: string,
    sentiment?: 'bullish' | 'neutral' | 'bearish'
  ) => void;
}

const informationSources = [
  'Technical Analysis',
  'Fundamental Analysis',
  'News',
  'Social Media',
  'Gut Feeling'
];

export function JournalModal({ isOpen, onClose, trade, onSave }: JournalModalProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [rationale, setRationale] = useState('');
  const [sentiment, setSentiment] = useState<'bullish' | 'neutral' | 'bearish' | undefined>(undefined);

  if (!isOpen || !trade) return null;

  const handleSourceChange = (source: string, checked: boolean) => {
    if (checked) {
      setSelectedSources(prev => [...prev, source]);
    } else {
      setSelectedSources(prev => prev.filter(s => s !== source));
    }
  };

  const handleSave = () => {
    onSave(selectedSources, rationale, sentiment);
    // Reset form
    setSelectedSources([]);
    setRationale('');
    setSentiment(undefined);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-blue-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-black text-lg font-normal">Trade Journal Entry</h2>
            <p className="text-xs font-light text-gray-600 mt-1">
              Document your reasoning for this trade while it's fresh in your mind
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Trade Summary */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">Trade Summary</CardTitle>
            </CardHeader>
                          <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <span className="font-light text-gray-600">Action:</span>
                  <span className="ml-2 font-normal capitalize">{trade.action}</span>
                </div>
                <div>
                  <span className="font-light text-gray-600">Ticker:</span>
                  <span className="ml-2 font-normal">{trade.ticker}</span>
                </div>
                <div>
                  <span className="font-light text-gray-600">Quantity:</span>
                  <span className="ml-2 font-normal">{trade.quantity} shares</span>
                </div>
                <div>
                  <span className="font-light text-gray-600">Price:</span>
                  <span className="ml-2 font-normal">{formatCurrency(trade.price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sources */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-600">
              What information influenced your decision? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 gap-3">
              {informationSources.map(source => (
                <div key={source} className="flex items-center space-x-2">
                                      <input
                      type="checkbox"
                      id={source}
                      checked={selectedSources.includes(source)}
                      onChange={(e) => handleSourceChange(source, e.target.checked)}
                      className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  <label htmlFor={source} className="text-xs font-medium text-gray-600 cursor-pointer">
                    {source}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Explain your reasoning for this trade
            </label>
            <textarea
              placeholder="Describe why you made this trade decision. What factors led you to buy/sell? What are your expectations?"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-md resize-none text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tags removed per request */}

          {/* Sentiment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Sentiment</label>
            <div className="flex gap-2">
              {([
                { key: 'bullish', label: 'Bullish', className: 'bg-green-600 hover:bg-green-700' },
                { key: 'neutral', label: 'Neutral', className: 'bg-gray-600 hover:bg-gray-700' },
                { key: 'bearish', label: 'Bearish', className: 'bg-red-600 hover:bg-red-700' },
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSentiment(opt.key)}
                  className={`px-3 h-8 rounded-md text-white text-xs ${opt.className} ${sentiment === opt.key ? 'ring-2 ring-offset-1 ring-blue-300' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-8 border-gray-300"
            >
              Skip Journal Entry
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8"
              disabled={selectedSources.length === 0 && !rationale.trim()}
            >
              Save Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
