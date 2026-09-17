import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * Bottom-centre toaster, the same 3-second notice the previous pages showed.
 * `const toast = useToast(); toast('Profile has been updated');`
 */
const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  const show = useCallback((text) => {
    setMessage(String(text ?? ''));
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`myCustomToaster ${visible ? 'show' : ''}`} role="status" aria-live="polite">{message}</div>
    </ToastContext.Provider>
  );
}
