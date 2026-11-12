import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminTabErrorBoundaryProps {
  tabName: string;
  onResetTab?: () => void;
  children: React.ReactNode;
}

interface AdminTabErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AdminTabErrorBoundary extends React.Component<
  AdminTabErrorBoundaryProps,
  AdminTabErrorBoundaryState
> {
  constructor(props: AdminTabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): AdminTabErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error in this module.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[AdminTabErrorBoundary:${this.props.tabName}]`, error, info);
  }

  componentDidUpdate(prevProps: AdminTabErrorBoundaryProps) {
    if (prevProps.tabName !== this.props.tabName && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="admin-tab-error-fallback"
          className="bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4 shadow-xs max-w-2xl mx-auto"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D71920] border border-red-200 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-neutral-900">
              {this.props.tabName} ভিউ রিলোড করতে সমস্যা হয়েছে
            </h3>
            <p className="text-xs text-neutral-500">
              {this.state.errorMessage}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Retry View</span>
            </button>
            {this.props.onResetTab && (
              <button
                type="button"
                onClick={this.props.onResetTab}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
              >
                Back to Dashboard Overview
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
