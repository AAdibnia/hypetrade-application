import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { Dashboard } from './components/Dashboard';
import { TradeHistory } from './components/TradeHistory';
import { TradeModal } from './components/TradeModal';
import { JournalModal } from './components/JournalModal';
import { TrendingUp, LogOut, Plus, RefreshCcw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  cashBalance: number;
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
  };
}

interface Position {
  id: string;
  ticker: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'dashboard' | 'history'>('login');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<any>(null);
  // Listen for sell journal requests from Dashboard
  useEffect(() => {
    const handler = (e: any) => {
      const trade = e.detail?.trade;
      if (!trade) return;
      setPendingTrade(trade);
      setIsJournalModalOpen(true);
    };
    window.addEventListener('open-sell-journal', handler);
    return () => window.removeEventListener('open-sell-journal', handler);
  }, []);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [stocks, setStocks] = useState<Record<string, { ticker: string; companyName: string; currentPrice: number }>>({
    AAPL: { ticker: 'AAPL', companyName: 'Apple Inc.', currentPrice: 185.5 },
    GOOGL: { ticker: 'GOOGL', companyName: 'Alphabet Inc.', currentPrice: 138.2 },
    MSFT: { ticker: 'MSFT', companyName: 'Microsoft Corporation', currentPrice: 378.85 },
    TSLA: { ticker: 'TSLA', companyName: 'Tesla, Inc.', currentPrice: 242.64 },
    AMZN: { ticker: 'AMZN', companyName: 'Amazon.com Inc.', currentPrice: 144.05 }
  });

  // Simulate price updates every minute
  useEffect(() => {
    const id = setInterval(() => {
      setStocks(prev => {
        const next: typeof prev = { ...prev };
        Object.keys(next).forEach(t => {
          const change = (Math.random() - 0.5) * 2; // -1 to +1
          const p = Math.max(0.01, next[t].currentPrice + change);
          next[t] = { ...next[t], currentPrice: p };
        });
        return next;
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Mock trade data
  const [trades, setTrades] = useState<Trade[]>([]);

  // Local persistence helpers (per email account)
  const STORAGE_KEY = 'hypetrad_users_v1';
  const loadUsersMap = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Record<string, any> : {};
    } catch {
      return {} as Record<string, any>;
    }
  };
  const saveUsersMap = (map: Record<string, any>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  };
  const saveCurrentUserData = (email: string, data: { password?: string; cashBalance: number; positions: Position[]; trades: Trade[]; }) => {
    const map = loadUsersMap();
    map[email] = {
      password: data.password ?? map[email]?.password ?? '',
      cashBalance: data.cashBalance,
      positions: data.positions,
      trades: data.trades
    };
    saveUsersMap(map);
  };

  const handleLogin = (email: string, password: string) => {
    if (!email || password.length < 8) return;
    const map = loadUsersMap();
    const record = map[email];
    if (record && record.password === password) {
      setUser({ id: '1', email, cashBalance: record.cashBalance ?? 100000 });
      setPositions(Array.isArray(record.positions) ? record.positions : []);
      setTrades(Array.isArray(record.trades) ? record.trades : []);
      setCurrentView('dashboard');
    }
  };

  const handleSignUp = (email: string, password: string) => {
    if (email.includes('@') && password.length >= 8) {
      const starting = {
        password,
        cashBalance: 100000,
        positions: [] as Position[],
        trades: [] as Trade[]
      };
      saveCurrentUserData(email, starting);
      setUser({ id: '1', email, cashBalance: starting.cashBalance });
      setPositions([]);
      setTrades([]);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  const handleConfirmReset = () => {
    if (!user) return;
    const resetCash = 100000;
    setUser({ ...user, cashBalance: resetCash });
    setPositions([]);
    setTrades([]);
    saveCurrentUserData(user.email, {
      cashBalance: resetCash,
      positions: [],
      trades: []
    });
    setIsResetModalOpen(false);
    setCurrentView('dashboard');
  };

  const handleExecuteTrade = (tradeData: any) => {
    if (!user) return;

    // Update user's cash balance
    const totalCost = tradeData.price * tradeData.quantity;
    const updatedUser = {
      ...user,
      cashBalance: user.cashBalance - totalCost
    };
    setUser(updatedUser);
    // persist after cash change
    saveCurrentUserData(user.email, {
      cashBalance: updatedUser.cashBalance,
      positions,
      trades
    });

    // Append new position (each purchase is its own row)
    const newPosition: Position = {
      id: Date.now().toString(),
      ticker: tradeData.ticker,
      quantity: tradeData.quantity,
      purchasePrice: tradeData.price,
      purchaseDate: new Date().toISOString()
    };
    setPositions(prev => [...prev, newPosition]);
    // persist with new position
    saveCurrentUserData(user.email, {
      cashBalance: updatedUser.cashBalance,
      positions: [...positions, newPosition],
      trades
    });

    // Store pending trade for journal entry (link to position)
    setPendingTrade({ ...tradeData, positionId: newPosition.id });
    setIsTradeModalOpen(false);
    setIsJournalModalOpen(true);
  };

  const handleSaveJournalEntry = (sources: string[], rationale: string) => {
    if (!pendingTrade) return;

    // If pendingTrade has an id, update existing trade (used for sells)
    if (pendingTrade.id) {
      const updated = trades.map(t => t.id === pendingTrade.id ? { ...t, journalEntry: { sources, rationale } } : t);
      setTrades(updated);
      if (user) {
        saveCurrentUserData(user.email, {
          cashBalance: user.cashBalance,
          positions,
          trades: updated
        });
      }
      setIsJournalModalOpen(false);
      setPendingTrade(null);
      return;
    }

    // Otherwise, create a new trade (used for buys)
    const newTrade: Trade = {
      id: Date.now().toString(),
      ticker: pendingTrade.ticker,
      action: pendingTrade.action ?? 'buy',
      quantity: pendingTrade.quantity,
      price: pendingTrade.price,
      date: new Date().toISOString(),
      positionId: pendingTrade.positionId,
      journalEntry: { sources, rationale }
    };

    const updated = [newTrade, ...trades];
    setTrades(updated);
    if (user) {
      saveCurrentUserData(user.email, {
        cashBalance: user.cashBalance,
        positions,
        trades: updated
      });
    }
    setIsJournalModalOpen(false);
    setPendingTrade(null);
  };

  // Centralized sell handling
  const handleSell = (position: Position, quantity: number) => {
    if (!user) return;
    // market price fallback: stocks -> last trade -> purchasePrice
    const latestTrade = [...trades]
      .filter(t => t.ticker === position.ticker)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const marketPrice = stocks[position.ticker]?.currentPrice ?? latestTrade?.price ?? position.purchasePrice;
    const proceeds = marketPrice * quantity;

    // update cash
    const updatedUser = { ...user, cashBalance: user.cashBalance + proceeds };
    setUser(updatedUser);

    // append sell position
    const sellPosition: Position = {
      id: Date.now().toString(),
      ticker: position.ticker,
      quantity: -quantity,
      purchasePrice: position.purchasePrice,
      purchaseDate: new Date().toISOString()
    };
    const updatedPositions = [...positions, sellPosition];
    setPositions(updatedPositions);

    // create trade and open journal
    const sellTrade: Trade = {
      id: Date.now().toString(),
      ticker: position.ticker,
      action: 'sell',
      quantity,
      price: marketPrice,
      date: new Date().toISOString(),
      positionId: sellPosition.id
    };
    const updatedTrades = [sellTrade, ...trades];
    setTrades(updatedTrades);

    // persist
    saveCurrentUserData(updatedUser.email, {
      cashBalance: updatedUser.cashBalance,
      positions: updatedPositions,
      trades: updatedTrades
    });

    // open journal modal for sell
    setPendingTrade(sellTrade);
    setIsJournalModalOpen(true);
  };

  // Authentication pages
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

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {user && (
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm h-8 inline-flex items-center"
                  aria-label="Reset account"
                  title="Reset account"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  <span>Reset</span>
                </button>
              )}
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
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm inline-flex items-center"
                onClick={() => setIsTradeModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2 text-white" />
                <span>New Trade</span>
              </button>
            </nav>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {currentView === 'dashboard' ? (
          <Dashboard 
            user={user} 
            onLogout={handleLogout}
            positions={positions}
            setPositions={setPositions}
            trades={trades}
            setTrades={setTrades}
            onSell={handleSell}
          />
        ) : (
          <TradeHistory trades={trades} />
        )}
      </main>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        stocks={stocks}
        positions={positions}
        cashBalance={user?.cashBalance || 0}
        onExecuteTrade={(...args: any[]) => {
          // Support both legacy and new signatures
          if (typeof args[0] === 'object') {
            const trade = args[0] as { ticker: string; quantity: number; price: number };
            handleExecuteTrade(trade);
          } else {
            const [ticker, _action, quantity] = args as [string, 'buy' | 'sell', number];
            const price = (stocks as any)[ticker]?.currentPrice || 0;
            handleExecuteTrade({ ticker, quantity, price });
          }
        }}
      />

      {/* Journal Modal */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => {
          setIsJournalModalOpen(false);
          setPendingTrade(null);
        }}
        trade={pendingTrade}
        onSave={handleSaveJournalEntry}
      />

      {isResetModalOpen && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-blue-900 text-lg font-normal">Reset account?</h2>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-700">
                This will reset your account to its initial state: cash to $100,000 and remove all positions, trades, and journal entries. This cannot be undone.
              </p>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 h-8 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
