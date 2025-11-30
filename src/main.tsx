import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeRuntimeConfig } from '@/lib/runtime-config'

// Initialize runtime configuration before app starts
initializeRuntimeConfig()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)