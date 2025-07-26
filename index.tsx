
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AudioProvider } from './src/contexts/AudioContext';
import './src/styles/animations.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>
);