import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAppConfig } from '../../store/authStore';
import { showToast } from '../../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { config, updateConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState(0);

  // Form states - General
  const [tuman, setTuman] = useState(config.tuman);
  const [sys, setSys] = useState(config.sys);
  const [email, setEmail] = useState(config.email);
  const [tel, setTel] = useState(config.tel);
  const [genErrors, setGenErrors] = useState<Record<string, string>>({});

  // Form states - Security
  const [login, setLogin] = useState(config.login);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secErrors, setSecErrors] = useState<Record<string, string>>({});

  // Form states - Notifications
  const [notifications, setNotifications] = useState<number[]>(config.n || [1, 1, 1]);

  const handleSaveGeneral = () => {
    const errs: Record<string, string> = {};
    if (!tuman.trim()) errs.tuman = 'Tuman nomini kiriting';
    if (!sys.trim()) errs.sys = 'Tizim nomini kiriting';
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Email noto‘g‘ri';
    if (tel.replace(/\D/g, '').length < 9) errs.tel = 'Telefon raqami noto‘g‘ri';

    if (Object.keys(errs).length > 0) {
      setGenErrors(errs);
      return;
    }

    setGenErrors({});
    updateConfig({ tuman, sys, email, tel });
    showToast('Sozlamalar saqlandi');
  };

  const handleSaveSecurity = () => {
    const errs: Record<string, string> = {};
    if (!login.trim()) errs.login = 'Login kiriting';
    if (!oldPassword) errs.oldPassword = 'Eski parolni kiriting';
    if (newPassword.length < 8) errs.newPassword = 'Kamida 8 ta belgi kiriting';
    if (newPassword && newPassword === oldPassword) {
      errs.newPassword = 'Yangi parol eskisidan farq qilishi kerak';
    }
    if (confirmPassword !== newPassword) errs.confirmPassword = 'Parollar mos kelmadi';

    if (Object.keys(errs).length > 0) {
      setSecErrors(errs);
      return;
    }

    setSecErrors({});
    updateConfig({ login });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Parol o‘zgartirildi (demo)');
  };

  const handleToggleNotification = (index: number) => {
    const updated = [...notifications];
    updated[index] = updated[index] ? 0 : 1;
    setNotifications(updated);
  };

  const handleSaveNotifications = () => {
    updateConfig({ n: notifications });
    showToast('Bildirishnoma sozlamalari saqlandi');
  };

  return (
    <Card style={{ maxWidth: '760px' }}>
      {/* Tablar */}
      <div className="tabs">
        {['Asosiy sozlamalar', 'Xavfsizlik', 'Bildirishnomalar'].map((t, i) => (
          <button
            key={t}
            className={i === activeTab ? 'on' : ''}
            onClick={() => setActiveTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 1. Asosiy Sozlamalar */}
      {activeTab === 0 && (
        <div>
          <div className="g2">
            <div>
              <label className="lb" htmlFor="st">
                Tuman nomi
              </label>
              <input
                className="in"
                id="st"
                value={tuman}
                onChange={e => setTuman(e.target.value)}
              />
              {genErrors.tuman && <div className="er">{genErrors.tuman}</div>}
            </div>

            <div>
              <label className="lb" htmlFor="ss">
                Tizim nomi
              </label>
              <input
                className="in"
                id="ss"
                value={sys}
                onChange={e => setSys(e.target.value)}
              />
              {genErrors.sys && <div className="er">{genErrors.sys}</div>}
            </div>

            <div>
              <label className="lb" htmlFor="se">
                Email
              </label>
              <input
                className="in"
                id="se"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {genErrors.email && <div className="er">{genErrors.email}</div>}
            </div>

            <div>
              <label className="lb" htmlFor="sp">
                Telefon
              </label>
              <input
                className="in"
                id="sp"
                type="tel"
                value={tel}
                onChange={e => setTel(e.target.value)}
              />
              {genErrors.tel && <div className="er">{genErrors.tel}</div>}
            </div>
          </div>

          <button
            className="bt"
            style={{ marginTop: '20px' }}
            onClick={handleSaveGeneral}
          >
            Saqlash
          </button>
        </div>
      )}

      {/* 2. Xavfsizlik */}
      {activeTab === 1 && (
        <div className="fg" style={{ maxWidth: '420px' }}>
          <div>
            <label className="lb" htmlFor="pl">
              Login
            </label>
            <input
              className="in"
              id="pl"
              value={login}
              onChange={e => setLogin(e.target.value)}
            />
            {secErrors.login && <div className="er">{secErrors.login}</div>}
          </div>

          <div>
            <label className="lb" htmlFor="po">
              Eski parol
            </label>
            <input
              className="in"
              id="po"
              type="password"
              placeholder="Eski parol"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
            />
            {secErrors.oldPassword && <div className="er">{secErrors.oldPassword}</div>}
          </div>

          <div>
            <label className="lb" htmlFor="pn">
              Yangi parol
            </label>
            <input
              className="in"
              id="pn"
              type="password"
              placeholder="Kamida 8 ta belgi"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            {secErrors.newPassword && <div className="er">{secErrors.newPassword}</div>}
          </div>

          <div>
            <label className="lb" htmlFor="pc">
              Yangi parolni tasdiqlang
            </label>
            <input
              className="in"
              id="pc"
              type="password"
              placeholder="Yangi parolni tasdiqlang"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {secErrors.confirmPassword && <div className="er">{secErrors.confirmPassword}</div>}
          </div>

          <button className="bt" onClick={handleSaveSecurity}>
            Saqlash
          </button>
        </div>
      )}

      {/* 3. Bildirishnomalar */}
      {activeTab === 2 && (
        <div style={{ maxWidth: '520px' }}>
          {[
            'Yangi foydalanuvchi ro‘yxatdan o‘tganda xabar berish',
            'Yangi tadbir qo‘shilganda xabar berish',
            'Tizim yangilanishlari haqida xabar berish'
          ].map((text, i) => (
            <label className="sw" key={i}>
              <input
                type="checkbox"
                checked={Boolean(notifications[i])}
                onChange={() => handleToggleNotification(i)}
              />
              {text}
            </label>
          ))}

          <button
            className="bt"
            style={{ marginTop: '16px' }}
            onClick={handleSaveNotifications}
          >
            Saqlash
          </button>
        </div>
      )}
    </Card>
  );
};

