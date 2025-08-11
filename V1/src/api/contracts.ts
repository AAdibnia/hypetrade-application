// Domain models and API contracts for a future server-backed implementation.

export interface JournalEntry {
  sources: string[];
  rationale: string;
}

export interface TradeRecord {
  id: string;
  ticker: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  positionId?: string;
  journalEntry?: JournalEntry;
}

export interface PositionRecord {
  id: string;
  ticker: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

export interface UserRecord {
  id: string;
  email: string;
  cashBalance: number;
}

export interface PortfolioSnapshot {
  user: UserRecord;
  positions: PositionRecord[];
  trades: TradeRecord[];
}

export interface AuthApi {
  signUp(email: string, password: string): Promise<UserRecord>;
  logIn(email: string, password: string): Promise<UserRecord>;
  logOut(): Promise<void>;
  getCurrentUser(): Promise<UserRecord | null>;
}

export interface PortfolioApi {
  getPortfolio(): Promise<PortfolioSnapshot>;
  resetAccount(): Promise<PortfolioSnapshot>;
  executeBuy(input: { ticker: string; quantity: number; price: number }): Promise<{ position: PositionRecord; pendingTrade: Omit<TradeRecord, 'journalEntry'> }>; 
  executeSell(input: { positionId: string; ticker: string; quantity: number; price: number }): Promise<{ position: PositionRecord; trade: TradeRecord; user: UserRecord; positions: PositionRecord[]; trades: TradeRecord[] }>; 
  saveTradeJournal(tradeId: string, entry: JournalEntry): Promise<TradeRecord>;
}

export interface QuotesApi {
  searchTickers(query: string, options?: { abortSignal?: AbortSignal }): Promise<Array<{ ticker: string; companyName: string; price: number }>>;
}

export interface AppApi extends AuthApi, PortfolioApi {
  quotes: QuotesApi;
}


