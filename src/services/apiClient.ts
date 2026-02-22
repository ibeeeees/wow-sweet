// ============================================================
// SweetReturns — API Client
// Centralized backend communication with connection status tracking
// ============================================================

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'fallback';

export interface BackendHealth {
  status: string;
  databricks: boolean;
  databricks_configured: boolean;
  databricks_status: string;
  gemini: boolean;
  stocks_available?: boolean;
}

type StatusListener = (status: ConnectionStatus) => void;

class ApiClient {
  private _baseUrl: string;
  private _status: ConnectionStatus = 'disconnected';
  private _listeners: StatusListener[] = [];
  private _healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private _lastHealth: BackendHealth | null = null;

  constructor() {
    this._baseUrl = import.meta.env.VITE_API_URL
      || `http://${window.location.hostname}:8000`;
  }

  get baseUrl(): string { return this._baseUrl; }
  get status(): ConnectionStatus { return this._status; }
  get lastHealth(): BackendHealth | null { return this._lastHealth; }
  get isDatabricksConnected(): boolean {
    return this._lastHealth?.databricks === true;
  }

  onStatusChange(listener: StatusListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: ConnectionStatus) {
    if (this._status !== status) {
      this._status = status;
      this._listeners.forEach(l => l(status));
    }
  }

  startHealthCheck() {
    this.checkHealth();
    this._healthCheckInterval = setInterval(() => this.checkHealth(), 30_000);
  }

  stopHealthCheck() {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }
  }

  async checkHealth(): Promise<BackendHealth | null> {
    try {
      this.setStatus('connecting');
      const res = await fetch(`${this._baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const health: BackendHealth = await res.json();
      this._lastHealth = health;
      this.setStatus(health.databricks ? 'connected' : 'fallback');
      return health;
    } catch {
      this._lastHealth = null;
      this.setStatus('disconnected');
      return null;
    }
  }

  async fetchStocks(): Promise<{ stocks: any[]; correlation_edges: any[]; source: string } | null> {
    try {
      const res = await fetch(`${this._baseUrl}/stocks`, {
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`Stocks fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data.stocks || data.stocks.length === 0) return null;
      return {
        stocks: data.stocks,
        correlation_edges: data.correlation_edges || [],
        source: data.source || 'backend',
      };
    } catch {
      return null;
    }
  }

  async fetchRegime(): Promise<any | null> {
    try {
      const res = await fetch(`${this._baseUrl}/regime`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
