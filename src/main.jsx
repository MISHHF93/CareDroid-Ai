import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import AppProvider from '@/contexts/AppProvider'
import '@/index.css'

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#fee', minHeight: '100vh' }}>
          <h1 style={{ color: '#c00' }}>❌ Error Loading App</h1>
          <p><strong>Error:</strong> {this.state.error?.toString()}</p>
          <pre style={{ background: '#fff', padding: '20px', overflow: 'auto' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
); 