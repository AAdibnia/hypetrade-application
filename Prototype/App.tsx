import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { Dashboard } from './components/Dashboard';
import { TradeModal } from './components/TradeModal';
import { JournalModal } from './components/JournalModal';
import { TradeHistory } from './components/TradeHistory';
import { Button } from './components/ui/button';
import { LogOut, TrendingUp, Menu, Plus } from 'lucide-react';

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
  journalEntry?: JournalEntry;
}

interface JournalEntry {
  sources: string[];
  rationale: string;
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'dashboard' | 'history'>('login');
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<Trade | null>(null);
  const [selectedTradeForHistory, setSelectedTradeForHistory] = useState<Trade | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(mockStocks).forEach(ticker => {
        const stock = mockStocks[ticker];
        const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
        stock.currentPrice = Math.max(0.01, stock.currentPrice + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Mock login - in real app this would validate against backend
    if (email && password.length >= 8) {
      setUser({
        id: '1',
        email,
        cashBalance: 100000 // Starting balance
      });
      setCurrentView('dashboard');
    }
  };

  const handleSignUp = (email: string, password: string) => {
    // Mock signup - in real app this would create user in backend
    if (email.includes('@') && password.length >= 8) {
      setUser({
        id: '1',
        email,
        cashBalance: 100000 // Starting balance
      });
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPositions([]);
    setTrades([]);
    setCurrentView('login');
    setIsMobileMenuOpen(false);
  };

  const executeTrade = (ticker: string, action: 'buy' | 'sell', quantity: number) => {
    const stock = mockStocks[ticker];
    if (!stock || !user) return false;

    const totalCost = stock.currentPrice * quantity;

    if (action === 'buy') {
      if (user.cashBalance < totalCost) return false;
      
      // Update cash balance
      setUser(prev => prev ? { ...prev, cashBalance: prev.cashBalance - totalCost } : null);
      
      // Add position
      const newPosition: Position = {
        id: Date.now().toString(),
        ticker,
        quantity,
        purchasePrice: stock.currentPrice,
        purchaseDate: new Date().toISOString()
      };
      setPositions(prev => [...prev, newPosition]);
    } else {
      // Check if user owns enough shares
      const ownedShares = positions
        .filter(p => p.ticker === ticker)
        .reduce((sum, p) => sum + p.quantity, 0);
      
      if (ownedShares < quantity) return false;
      
      // Update cash balance
      setUser(prev => prev ? { ...prev, cashBalance: prev.cashBalance + totalCost } : null);
      
      // For sell trades, create a negative position instead of removing shares
      const sellPosition: Position = {
        id: Date.now().toString(),
        ticker,
        quantity: -quantity, // Negative quantity to indicate a sell
        purchasePrice: stock.currentPrice,
        purchaseDate: new Date().toISOString()
      };
      setPositions(prev => [...prev, sellPosition]);
    }

    // Create trade record
    const newTrade: Trade = {
      id: Date.now().toString(),
      ticker,
      action,
      quantity,
      price: stock.currentPrice,
      date: new Date().toISOString()
    };
    
    setPendingTrade(newTrade);
    setIsJournalModalOpen(true);
    setIsTradeModalOpen(false);
    
    return true;
  };

  const executeSellFromDashboard = (ticker: string, quantity: number) => {
    const stock = mockStocks[ticker];
    if (!stock || !user) return false;

    const totalCost = stock.currentPrice * quantity;

    // Check if user owns enough shares
    const ownedShares = positions
      .filter(p => p.ticker === ticker)
      .reduce((sum, p) => sum + p.quantity, 0);
    
    if (ownedShares < quantity) return false;
    
    // Update cash balance
    setUser(prev => prev ? { ...prev, cashBalance: prev.cashBalance + totalCost } : null);
    
    // For sell trades, create a negative position instead of removing shares
    const sellPosition: Position = {
      id: Date.now().toString(),
      ticker,
      quantity: -quantity, // Negative quantity to indicate a sell
      purchasePrice: stock.currentPrice,
      purchaseDate: new Date().toISOString()
    };
    setPositions(prev => [...prev, sellPosition]);

    // Create and save trade record directly (without journal entry)
    const newTrade: Trade = {
      id: Date.now().toString(),
      ticker,
      action: 'sell',
      quantity,
      price: stock.currentPrice,
      date: new Date().toISOString()
    };
    
    setTrades(prev => [newTrade, ...prev]);
    
    return true;
  };

  const saveJournalEntry = (sources: string[], rationale: string) => {
    if (pendingTrade) {
      const completedTrade: Trade = {
        ...pendingTrade,
        journalEntry: { sources, rationale }
      };
      setTrades(prev => [completedTrade, ...prev]);
      setPendingTrade(null);
    }
    setIsJournalModalOpen(false);
  };

  const calculatePortfolioValue = () => {
    if (!user) return 0;
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

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-blue-900 mb-2">HypeTrade</h1>
          </div>

          {currentView === 'login' ? (
            <div>
              <LoginForm onLogin={handleLogin} />
              <p className="text-center mt-4 text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentView('signup')}
                  className="text-blue-600 hover:underline"
                >
                  Sign up here
                </button>
              </p>
            </div>
          ) : (
            <div>
              <SignUpForm onSignUp={handleSignUp} />
              <p className="text-center mt-4 text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-blue-600 hover:underline"
                >
                  Log in here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:hidden">
              <TrendingUp className="h-7 w-7 text-blue-600" />
              <h1 className="text-blue-900">HypeTrade</h1>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-7 w-7 text-blue-600" />
                <h1 className="text-blue-900">HypeTrade</h1>
              </div>
              
              <nav className="flex space-x-8">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm ${
                    currentView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('history')}
                  className={`px-3 py-2 rounded-md text-sm ${
                    currentView === 'history'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  History
                </button>
                <Button
                  onClick={() => setIsTradeModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Trade
                </Button>
              </nav>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                    currentView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('history');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                    currentView === 'history'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Trade History
                </button>
                <Button
                  onClick={() => {
                    setIsTradeModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Trade
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 mt-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {currentView === 'dashboard' ? (
          <Dashboard
            user={user}
            positions={positions}
            stocks={mockStocks}
            portfolioValue={calculatePortfolioValue()}
            totalPnL={calculateTotalPnL()}
            trades={trades}
            onOpenTradeModal={() => setIsTradeModalOpen(true)}
            onViewTradeDetails={setSelectedTradeForHistory}
            onSellStock={(ticker, quantity) => executeSellFromDashboard(ticker, quantity)}
          />
        ) : (
          <TradeHistory
            trades={trades}
          />
        )}
      </main>

      {/* Modals */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        stocks={mockStocks}
        positions={positions}
        cashBalance={user.cashBalance}
        onExecuteTrade={executeTrade}
      />

      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        trade={pendingTrade}
        onSave={saveJournalEntry}
      />

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
                    <p>{selectedTradeForHistory.ticker}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Action</label>
                    <p className="capitalize">{selectedTradeForHistory.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Quantity</label>
                    <p>{selectedTradeForHistory.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Price</label>
                    <p>${selectedTradeForHistory.price.toFixed(2)}</p>
                  </div>
                </div>
                
                {selectedTradeForHistory.journalEntry && (
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