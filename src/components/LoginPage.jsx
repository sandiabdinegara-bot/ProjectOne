import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AUTH_KEY = 'pdam_auth';
const REMEMBER_KEY = 'pdam_remember_me';
const USERNAME_KEY = 'pdam_username';
const TOKEN_KEY = 'pdam_token';
const USER_KEY = 'pdam_user';

const LOGIN_ENDPOINT = '/user/login';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { text, type: 'success' | 'error' }

  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_KEY) === 'true';
    const savedUsername = localStorage.getItem(USERNAME_KEY);
    setRememberMe(savedRemember);
    if (savedUsername) setUsername(savedUsername);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const url = `${API_BASE_URL}${LOGIN_ENDPOINT}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          remember_me: rememberMe,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const responseMessage = data?.message ?? null;

      if (res.status === 201) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(AUTH_KEY, 'true');
        storage.setItem(TOKEN_KEY, data.access_token || '');
        if (data.user) storage.setItem(USER_KEY, JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, 'true');
          localStorage.setItem(USERNAME_KEY, username.trim());
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.removeItem(USERNAME_KEY);
        }
        if (responseMessage) setMessage({ text: responseMessage, type: 'success' });
        onLoginSuccess?.();
        return;
      }

      if (res.status === 401) {
        setMessage({
          text: responseMessage || 'Username/kata sandi salah atau akun nonaktif.',
          type: 'error',
        });
        return;
      }

      setMessage({
        text: responseMessage || `Terjadi kesalahan (${res.status}). Coba lagi.`,
        type: 'error',
      });
    } catch (err) {
      setMessage({
        text: err?.message || 'Tidak dapat menghubungi server. Periksa koneksi atau URL di .env.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="logo.png" alt="PDAM" className="login-logo" />
          <h1 className="login-title">SICATER PDAM</h1>
          <p className="login-subtitle">Smart Dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukan username anda"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukan password anda"
              autoComplete={rememberMe ? 'current-password' : 'off'}
              required
              disabled={loading}
            />
          </div>

          <div className="login-remember">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-checkbox"
                disabled={loading}
              />
              <span className="checkbox-text">Tetap Login</span>
            </label>
          </div>

          {message && (
            <div className={`login-message login-message--${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
