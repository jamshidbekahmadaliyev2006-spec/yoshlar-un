import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && (password === 'admin12345' || password.length >= 6)) {
      showToast('Tizimga muvaffaqiyatli kirildi');
      onSuccess();
    } else {
      setError('Login yoki parol noto‘g‘ri');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Card style={{ width: 'min(420px, 100%)', padding: '32px 26px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <svg width="48" height="48" viewBox="0 0 40 40" aria-hidden="true" style={{ margin: '0 auto 12px' }}>
            <path d="M20 3l15 8.5v17L20 37 5 28.5v-17z" fill="#8b5cf6" />
            <path
              d="M20 12v16M13 17l7 5 7-5"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Yunusobot — Admin Panel</h1>
          <div className="sm" style={{ marginTop: '6px' }}>
            Boshqaruv tizimiga kirish
          </div>
        </div>

        <form onSubmit={handleSubmit} className="fg">
          <div>
            <label className="lb" htmlFor="log-u">
              Login
            </label>
            <input
              id="log-u"
              className="in"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="lb" htmlFor="log-p">
              Parol
            </label>
            <input
              id="log-p"
              type="password"
              className="in"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="er">{error}</div>}

          <button type="submit" className="bt" style={{ width: '100%', marginTop: '10px' }}>
            Kirish
          </button>
        </form>
      </Card>
    </div>
  );
};

