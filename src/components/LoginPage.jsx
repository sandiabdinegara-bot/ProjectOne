import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('sicater_remember_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('./api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem('sicater_remember_username', username);
        } else {
          localStorage.removeItem('sicater_remember_username');
        }
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Login gagal. SIlakan coba lagi.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .login-wrapper * {
          box-sizing: border-box;
        }

        .login-wrapper::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
          top: -250px;
          right: -100px;
        }

        .login-wrapper::after {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          bottom: -300px;
          left: -150px;
        }

        .login-card {
          width: 100%;
          max-width: 480px; /* Adjusted to accommodate longer footer text */
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 24px !important;
          padding: 3rem 2.5rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          position: relative;
          z-index: 10;
          animation: floatIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          height: 100px;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: white !important;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .login-subtitle {
          color: #94a3b8 !important;
          font-size: 0.9375rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: #cbd5e1 !important;
          margin-left: 0.25rem;
          display: block;
        }

        .input-container {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
        }

        .input-icon {
          position: absolute !important;
          left: 1.25rem !important;
          color: #64748b !important;
          transition: color 0.3s ease;
          pointer-events: none;
          z-index: 5;
        }

        .login-input {
          width: 100% !important;
          height: 3.5rem !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 14px !important;
          padding: 0 1rem 0 3.5rem !important;
          color: white !important;
          font-size: 1rem !important;
          transition: all 0.3s ease !important;
          outline: none !important;
        }

        .login-input:focus {
          border-color: #3b82f6 !important;
          background: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
        }

        .login-input:focus + .input-icon {
          color: #3b82f6 !important;
        }
        .password-toggle {
          position: absolute;
          right: 1.25rem;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.3s ease;
          z-index: 5;
        }

        .password-toggle:hover {
          color: #e2e8f0;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: -0.5rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        .remember-me input {
          margin: 0;
          width: 1rem;
          height: 1rem;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          accent-color: #3b82f6;
          transform: translateY(-1px);
        }

        .remember-me label {
          font-size: 0.8125rem;
          color: #cbd5e1;
          cursor: pointer;
          user-select: none;
          line-height: 1;
          margin: 0;
          transform: translateY(0.5px);
        }

        /* Autofill Styling */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover, 
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0px 1000px #1e293b inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Hide default browser password reveal icon */
        .login-input::-ms-reveal,
        .login-input::-ms-clear {
          display: none !important;
        }

        .login-button {
          margin-top: 1rem;
          padding: 1rem !important;
          border-radius: 14px !important;
          border: none !important;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: relative !important;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3) !important;
        }

        .login-button-icon {
          position: absolute !important;
          left: 1.5rem !important;
        }


        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
          filter: brightness(1.1);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.6;
          opacity: 0.8;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2.5rem 1.5rem;
          }
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <img src="logo.png" alt="PDAM SMART" className="login-logo" />
          <h1 className="login-title">Selamat Datang</h1>
          <p className="login-subtitle">Silakan masuk ke akun SiCater Anda</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-container">
              <input
                type="text"
                className="login-input"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={18} className="input-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} className="input-icon" />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="remember-me">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Simpan Username</label>
          </div>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <LogIn size={20} className="login-button-icon" />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          &copy; {new Date().getFullYear()} PDAM SMART - Sistem Informasi Pembaca Meter Air
        </div>
      </div>
    </div>
  );
}
