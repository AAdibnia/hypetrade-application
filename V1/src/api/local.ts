import { AppApi, JournalEntry, PortfolioSnapshot, PositionRecord, TradeRecord, UserRecord } from './contracts';

const STORAGE_KEY = 'hypetrad_users_v1';
const SESSION_KEY = 'hypetrad_session_email_v1';

type UsersMap = Record<string, {
  password: string;
  cashBalance: number;
  positions: PositionRecord[];
  trades: TradeRecord[];
}>;

function loadUsersMap(): UsersMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as UsersMap : {};
  } catch {
    return {} as UsersMap;
  }
}

function saveUsersMap(map: UsersMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function getSessionEmail(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function setSessionEmail(email: string | null): void {
  if (email) localStorage.setItem(SESSION_KEY, email); else localStorage.removeItem(SESSION_KEY);
}

function toUserRecord(email: string, map: UsersMap): UserRecord {
  const record = map[email];
  return {
    id: '1',
    email,
    cashBalance: record?.cashBalance ?? 100000
  };
}

function ensureUser(map: UsersMap, email: string, password?: string): void {
  if (!map[email]) {
    map[email] = {
      password: password ?? '',
      cashBalance: 100000,
      positions: [],
      trades: []
    };
  }
}

export function createLocalApi(): AppApi {
  return {
    async signUp(email, password) {
      const map = loadUsersMap();
      ensureUser(map, email, password);
      saveUsersMap(map);
      setSessionEmail(email);
      return toUserRecord(email, map);
    },

    async logIn(email, password) {
      const map = loadUsersMap();
      const rec = map[email];
      if (!rec || rec.password !== password) throw new Error('Invalid credentials');
      setSessionEmail(email);
      return toUserRecord(email, map);
    },

    async logOut() {
      setSessionEmail(null);
    },

    async getCurrentUser() {
      const email = getSessionEmail();
      if (!email) return null;
      const map = loadUsersMap();
      if (!map[email]) return null;
      return toUserRecord(email, map);
    },

    async getPortfolio() {
      const email = getSessionEmail();
      if (!email) throw new Error('Not authenticated');
      const map = loadUsersMap();
      const rec = map[email];
      const snapshot: PortfolioSnapshot = {
        user: toUserRecord(email, map),
        positions: Array.isArray(rec.positions) ? rec.positions : [],
        trades: Array.isArray(rec.trades) ? rec.trades : []
      };
      return snapshot;
    },

    async resetAccount() {
      const email = getSessionEmail();
      if (!email) throw new Error('Not authenticated');
      const map = loadUsersMap();
      ensureUser(map, email);
      map[email].cashBalance = 100000;
      map[email].positions = [];
      map[email].trades = [];
      saveUsersMap(map);
      return this.getPortfolio();
    },

    async executeBuy({ ticker, quantity, price }) {
      const email = getSessionEmail();
      if (!email) throw new Error('Not authenticated');
      const map = loadUsersMap();
      const rec = map[email];

      const total = price * quantity;
      rec.cashBalance = (rec.cashBalance ?? 100000) - total;

      const position: PositionRecord = {
        id: Date.now().toString(),
        ticker,
        quantity,
        purchasePrice: price,
        purchaseDate: new Date().toISOString()
      };
      rec.positions = [...(rec.positions || []), position];
      saveUsersMap(map);

      return {
        position,
        pendingTrade: {
          id: Date.now().toString(),
          ticker,
          action: 'buy',
          quantity,
          price,
          date: new Date().toISOString(),
          positionId: position.id
        }
      };
    },

    async executeSell({ positionId, ticker, quantity, price }) {
      const email = getSessionEmail();
      if (!email) throw new Error('Not authenticated');
      const map = loadUsersMap();
      const rec = map[email];

      // cash update
      const proceeds = price * quantity;
      rec.cashBalance = (rec.cashBalance ?? 100000) + proceeds;

      // append sell position row (negative quantity)
      const sellPosition: PositionRecord = {
        id: Date.now().toString(),
        ticker,
        quantity: -quantity,
        purchasePrice: rec.positions.find(p => p.id === positionId)?.purchasePrice ?? price,
        purchaseDate: new Date().toISOString()
      };
      const positions = [...(rec.positions || []), sellPosition];
      rec.positions = positions;

      const trade: TradeRecord = {
        id: Date.now().toString(),
        ticker,
        action: 'sell',
        quantity,
        price,
        date: new Date().toISOString(),
        positionId: sellPosition.id
      };
      const trades = [trade, ...(rec.trades || [])];
      rec.trades = trades;

      saveUsersMap(map);
      const user = toUserRecord(email, map);
      return { position: sellPosition, trade, user, positions, trades };
    },

    async saveTradeJournal(tradeId: string, entry: JournalEntry) {
      const email = getSessionEmail();
      if (!email) throw new Error('Not authenticated');
      const map = loadUsersMap();
      const rec = map[email];
      const trades = (rec.trades || []).map(t => t.id === tradeId ? { ...t, journalEntry: entry } : t);
      rec.trades = trades;
      saveUsersMap(map);
      const updated = trades.find(t => t.id === tradeId)!;
      return updated;
    },

    quotes: {
      async searchTickers(query: string, options?: { abortSignal?: AbortSignal }) {
        const q = query.trim();
        if (q.length < 2) return [];

        // If RapidAPI key is present, replicate the existing behavior
        const apiKey = (process as any).env.REACT_APP_RAPIDAPI_KEY || '';
        const controller = new AbortController();
        const signalToUse = options?.abortSignal ?? controller.signal;
        const tryFetch = async (baseUrl: string, host: string) => {
          const headers: Record<string, string> = {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': host
          };
          const acRes = await fetch(
            `${baseUrl}/auto-complete?q=${encodeURIComponent(q)}&region=US`,
            { headers, signal: signalToUse }
          );
          if (!acRes.ok) throw new Error('autocomplete failed');
          const acJson = await acRes.json();
          const symbols: string[] = (acJson?.quotes || [])
            .filter((it: any) => it.symbol)
            .map((it: any) => String(it.symbol).toUpperCase());
          const unique = Array.from(new Set(symbols)).slice(0, 5);
          if (unique.length === 0) return [] as Array<{ ticker: string; companyName: string; price: number }>;
          const quotesRes = await fetch(
            `${baseUrl}/market/v2/get-quotes?region=US&symbols=${encodeURIComponent(unique.join(','))}`,
            { headers, signal: signalToUse }
          );
          if (!quotesRes.ok) throw new Error('quotes failed');
          const quotesJson = await quotesRes.json();
          return (quotesJson?.quoteResponse?.result || [])
            .map((r: any) => ({
              ticker: r.symbol,
              companyName: r.shortName || r.longName || r.symbol,
              price: typeof r.regularMarketPrice === 'number' ? r.regularMarketPrice : 0
            }));
        };

        if (apiKey) {
          try {
            return await tryFetch('https://apidojo-yahoo-finance-v1.p.rapidapi.com', 'apidojo-yahoo-finance-v1.p.rapidapi.com');
          } catch {
            // fall through to local fallback
          }
        }

        // Local fallback using a small curated list
        const fallback: Array<{ ticker: string; companyName: string; price: number }> = [
          { ticker: 'AAPL', companyName: 'Apple Inc.', price: 185.5 },
          { ticker: 'GOOGL', companyName: 'Alphabet Inc.', price: 138.2 },
          { ticker: 'MSFT', companyName: 'Microsoft Corporation', price: 378.85 },
          { ticker: 'TSLA', companyName: 'Tesla, Inc.', price: 242.64 },
          { ticker: 'AMZN', companyName: 'Amazon.com Inc.', price: 144.05 },
          { ticker: 'NVDA', companyName: 'NVIDIA Corporation', price: 875.3 },
        ];
        const qUpper = q.toUpperCase();
        return fallback.filter(s => s.ticker.includes(qUpper) || s.companyName.toUpperCase().includes(qUpper)).slice(0, 5);
      }
    }
  };
}


