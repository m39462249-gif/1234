'use client';

import { useState, useEffect } from 'react';

export function useAnonToken() {
  const [token, setToken] = useState('');

  useEffect(() => {
    let currentToken = localStorage.getItem('anon_token');
    if (!currentToken) {
      currentToken = crypto.randomUUID();
      localStorage.setItem('anon_token', currentToken);
    }
    setToken(currentToken);
  }, []);

  return token;
}
