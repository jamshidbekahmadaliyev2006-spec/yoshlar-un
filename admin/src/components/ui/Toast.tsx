import React, { useState, useEffect } from 'react';

let toastHandler: ((msg: string) => void) | null = null;

export const showToast = (msg: string) => {
  if (toastHandler) {
    toastHandler(msg);
  }
};

export const Toast: React.FC = () => {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: any;
    toastHandler = (msg: string) => {
      setMessage(msg);
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVisible(false);
      }, 2600);
    };

    return () => {
      toastHandler = null;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div id="toast" className={visible ? 'show' : ''} role="status" aria-live="polite">
      {message}
    </div>
  );
};

