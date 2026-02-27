import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

try {
  const root = document.getElementById('root');
  if (!root) {
    document.body.innerHTML = '<h1 style="color:red">Root element not found!</h1>';
    throw new Error('Root element not found');
  }

  // Removed debug log
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
  // Removed debug log
} catch (error) {
  console.error('Failed to start app:', error);
  document.body.innerHTML = `<div style="padding:20px; color:red; font-family:monospace;">
    <h1>Error starting app:</h1>
    <pre>${error}</pre>
  </div>`;
}
