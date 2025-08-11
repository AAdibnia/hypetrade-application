import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (trades.length === 0) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No trades yet. Start trading to build your history!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-blue-900">Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4">Stock</th>
                <th className="text-left py-3 px-4">Quantity</th>
                <th className="text-left py-3 px-4">Total Value</th>
                <th className="text-left py-3 px-4">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade: Trade) => {
                const totalValue = trade.price * trade.quantity;
                
                return (
                  <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-900 font-medium">{trade.ticker}</span>
                        <span className={`px-2 py-1 rounded text-xs uppercase ${
                          trade.action === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      {trade.quantity} shares
                    </td>
                    <td className="py-3 px-4 text-left">
                      {formatCurrency(totalValue)}
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(trade.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(trade.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
