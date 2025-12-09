import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Determine routing strategy based on environment
// Production (Vercel/Custom Domain) -> BrowserRouter (Clean URLs like /social)
// Development (AI Studio/Localhost/Preview) -> HashRouter (Safe URLs like /#/social to prevent iframe errors)
const isProduction = 
  window.location.hostname.endsWith('.vercel.app') || 
  window.location.hostname === 'souqstart.com' ||
  window.location.hostname === 'www.souqstart.com';

const Router = isProduction ? BrowserRouter : HashRouter;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);