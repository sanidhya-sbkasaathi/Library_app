import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initGlobalApiLogger } from './utils/apiLogger'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Initialize unified API console logger & fetch interceptor
initGlobalApiLogger()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

