import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global safeguard for browser Pointer Lock cooldown and permissions
if (typeof Element !== 'undefined' && Element.prototype.requestPointerLock) {
  const originalRequestPointerLock = Element.prototype.requestPointerLock;
  Element.prototype.requestPointerLock = function (this: Element, options?: PointerLockOptions): any {
    try {
      const res = originalRequestPointerLock.call(this, options);
      if (res && typeof (res as any).catch === 'function') {
        (res as any).catch(() => {
          // Gracefully suppress pointer lock cooldown / user exit rejection
        });
      }
      return res;
    } catch {
      return undefined;
    }
  };
}

// Suppress unhandled promise rejection for pointer lock exit cooldown in modern Chromium
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.name === 'WrongDocumentError' ||
     event.reason.name === 'SecurityError' ||
     event.reason.name === 'NotAllowedError' ||
     (typeof event.reason.message === 'string' && event.reason.message.includes('Pointer lock')))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

