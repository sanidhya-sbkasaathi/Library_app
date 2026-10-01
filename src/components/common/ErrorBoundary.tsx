import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Global React ErrorBoundary caught an unhandled error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      window.location.reload();
    } catch {
      // ignore
    }
  };

  private handleClearAndRestart = () => {
    try {
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Application Rendering Protected
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                SbKasaathi Library active safeguard caught an unexpected UI error. Your local SQLite database and credentials remain secure.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 font-mono text-left text-xs space-y-1 overflow-x-auto max-h-36">
                <div className="font-bold text-[11px] text-rose-400">Error Details:</div>
                <div className="text-[11px] break-words">{this.state.error.message || String(this.state.error)}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleClearAndRestart}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
