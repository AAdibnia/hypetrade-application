import React, { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
  onSave: (sources: string[], rationale: string) => void;
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

  if (!isOpen || !trade) return null;

  const handleSourceChange = (source: string, checked: boolean) => {
    if (checked) {
      setSelectedSources(prev => [...prev, source]);
    } else {
      setSelectedSources(prev => prev.filter(s => s !== source));
    }
  };

  const handleSave = () => {
    onSave(selectedSources, rationale);
    // Reset form
    setSelectedSources([]);
    setRationale('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl">Trade Journal Entry</h2>
          <p className="text-sm text-gray-600 mt-1">
            Document your reasoning for this trade while it's fresh in your mind
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Trade Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Action:</span>
                  <span className="ml-2 font-medium capitalize">{trade.action}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ticker:</span>
                  <span className="ml-2 font-medium">{trade.ticker}</span>
                </div>
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <span className="ml-2 font-medium">{trade.quantity} shares</span>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-2 font-medium">{formatCurrency(trade.price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sources */}
          <div className="space-y-3">
            <Label className="text-base">What information influenced your decision? (Select all that apply)</Label>
            <div className="grid grid-cols-1 gap-3">
              {informationSources.map(source => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={source}
                    checked={selectedSources.includes(source)}
                    onCheckedChange={(checked) => handleSourceChange(source, checked as boolean)}
                  />
                  <Label htmlFor={source} className="text-sm cursor-pointer">
                    {source}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <Label htmlFor="rationale" className="text-base">
              Explain your reasoning for this trade
            </Label>
            <Textarea
              id="rationale"
              placeholder="Describe why you made this trade decision. What factors led you to buy/sell? What are your expectations?"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Skip Journal Entry
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
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