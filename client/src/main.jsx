/**
 * Main Entry Point for React Application
 *
 * This file bootstraps the React application by:
 * 1. Importing React and ReactDOM
 * 2. Importing the root App component
 * 3. Importing global styles
 * 4. Rendering the App into the DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Create React root and render the App component
// StrictMode enables additional development checks and warnings
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
