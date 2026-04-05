import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/registerSW'
import { reportWebVitals } from './utils/reportWebVitals'

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Performance monitoring — Web Vitals (CLS, FID, LCP, FCP, TTFB, INP)
reportWebVitals();
