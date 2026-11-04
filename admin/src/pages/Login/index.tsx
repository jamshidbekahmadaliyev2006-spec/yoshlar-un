import React, { useState } from 'react';
import { ShahidlarVideoBackground } from './ShahidlarVideoBackground';
import { showToast } from '../../components/ui/Toast';
import './Login.css';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (username.trim() === 'admin' && (password === 'admin12345' || password.length >= 6)) {
        if (rememberMe) {
          localStorage.setItem('yb_auth', 'true');
        } else {
          sessionStorage.setItem('yb_auth', 'true');
        }
        showToast('Tizimga muvaffaqiyatli kirildi. Xush kelibsiz!');
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        setError('Login yoki parol noto‘g‘ri kiritildi. Iltimos, qayta tekshiring.');
      }
    }, 350);
  };

  return (
    <div className="gov-login-page light-mode">
      {/* 1. YUNUSOBOD: SHAHIDLAR XOTIRASI VA TELEBOSHKA 10s PING-PONG VIDEO FON */}
      <ShahidlarVideoBackground />

      {/* 2. O'NG TOMONDAGI TOZA, ANIQ VA SHINIQ KIRISH KARTASI */}
      <div className="gov-login-panel-wrapper">
        <div className="gov-login-card">
          <h1 className="gov-main-heading">Tizimga kirish</h1>

          {/* Xatolik xabari */}
          {error && (
            <div className="gov-error-box" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Forma */}
          <form onSubmit={handleSubmit} className="gov-form" noValidate>
            {/* Login maydoni */}
            <div className="gov-field">
              <label htmlFor="gov-username" className="gov-label">
                Login
              </label>
              <div className="gov-input-box">
                <span className="gov-input-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="gov-username"
                  type="text"
                  className="gov-input"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="admin"
                  required
                  autoComplete="username"
                />
                <span className="gov-key-badge" title="Avtomatik to'ldirish" aria-hidden="true">
                  <span className="gov-dot" />
                  <span className="gov-dot" />
                  <span className="gov-dot" />
                </span>
              </div>
            </div>

            {/* Parol maydoni */}
            <div className="gov-field">
              <label htmlFor="gov-password" className="gov-label">
                Parol
              </label>
              <div className="gov-input-box">
                <span className="gov-input-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="gov-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`gov-input ${!showPassword ? 'is-pwd-masked' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="•••••••••"
                  required
                  autoComplete="current-password"
                />
                <div className="gov-input-actions">
                  <span className="gov-key-badge" title="Avtomatik to'ldirish" aria-hidden="true">
                    <span className="gov-dot" />
                    <span className="gov-dot" />
                    <span className="gov-dot" />
                  </span>
                  <button
                    type="button"
                    className="gov-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  >
                    {showPassword ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Meni eslab qol va Parolni unutdingizmi? */}
            <div className="gov-options-row">
              <label className="gov-remember-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="gov-remember-label">Meni eslab qol</span>
              </label>
              <a
                href="#forgot"
                className="gov-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Parolni tiklash uchun ma’muriyatga murojaat qiling');
                }}
              >
                Parolni unutdingizmi?
              </a>
            </div>

            {/* Kirish tugmasi */}
            <button
              type="submit"
              className="gov-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="gov-btn-loading">
                  <span className="gov-spinner" />
                  Kirilmoqda...
                </span>
              ) : (
                <>
                  <span>Kirish</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
