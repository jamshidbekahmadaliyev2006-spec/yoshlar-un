import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../store/themeStore';
import { fd } from '../../utils/format';
import { apiClient } from '../../api/client';
import { showToast } from '../ui/Toast';
import { DatePickerPopover } from './DatePickerPopover';

interface TopbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onBack?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ currentRoute, onNavigate, onBack }) => {
  const { theme, toggleTheme } = useTheme();
  const [bellOpen, setBellOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Global click listener to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.pw')) {
        setBellOpen(false);
        setAdminOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setBellOpen(!bellOpen);
    setBadgeCount(0);
  };

  const isEventDetail = currentRoute.startsWith('tadbir-') && currentRoute !== 'tadbir-qoshish';

  // Search results
  const events = apiClient.getEvents();
  const users = apiClient.getUsers();
  const q = searchQuery.trim().toLowerCase();
  const matchedEvents = q
    ? events.filter(e => (e.title + ' ' + e.desc).toLowerCase().includes(q)).slice(0, 4)
    : [];
  const matchedUsers = q
    ? users.filter(u => u.n.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const renderBell = () => (
    <div className={`pw ${bellOpen ? 'open' : ''}`}>
      <button
        className="ib"
        onClick={e => {
          e.stopPropagation();
          handleBellClick();
        }}
        aria-label="Bildirishnomalar"
        style={{ position: 'relative' }}
      >
        <Icon name="bell" />
        {badgeCount > 0 && <span className="bdg">{badgeCount}</span>}
      </button>
      <div className="pop" style={{ right: 0, width: '270px' }}>
        <div className="mi">
          <b>Yangi foydalanuvchi</b>
          <br />
          <span className="sm">Azizbek Karimov ro‘yxatdan o‘tdi</span>
        </div>
        <div className="mi">
          <b>Yangi tadbir</b>
          <br />
          <span className="sm">Futbol musobaqasi qo‘shildi</span>
        </div>
        <div className="mi">
          <b>Tizim</b>
          <br />
          <span className="sm">Ma’lumotlar yangilandi</span>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className={`pw ${adminOpen ? 'open' : ''}`}>
      <button
        className="adm"
        onClick={e => {
          e.stopPropagation();
          setAdminOpen(!adminOpen);
        }}
        aria-label="Admin menyusi"
      >
        <span className="av">A</span>
        <span className="t">
          <b>Admin</b>
          <span className="sm">Administrator</span>
        </span>
      </button>
      <div className="pop" style={{ right: 0, width: '190px' }}>
        <button
          className="mi"
          onClick={() => {
            setAdminOpen(false);
            onNavigate('sozlamalar');
          }}
        >
          Sozlamalar
        </button>
        <button
          className="mi"
          onClick={() => {
            setAdminOpen(false);
            showToast('Demo rejimida chiqish o‘chirilgan');
          }}
        >
          Chiqish
        </button>
      </div>
    </div>
  );

  if (currentRoute === 'dashboard') {
    return (
      <header className="top">
        <div className={`pw sq ${searchOpen ? 'open' : ''}`} style={{ flex: 1 }}>
          <label className="srch">
            <Icon name="search" />
            <input
              type="search"
              aria-label="Qidiruv"
              placeholder="Qidiruv... (tadbir, foydalanuvchi, hudud)"
              autoComplete="off"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(Boolean(e.target.value.trim()));
              }}
              onFocus={() => {
                if (searchQuery.trim()) setSearchOpen(true);
              }}
            />
          </label>
          <div className="pop" style={{ left: 0, right: 0 }}>
            {matchedEvents.map(e => (
              <a
                key={`ev-${e.id}`}
                className="mi"
                href={`#tadbir-${e.id}`}
                onClick={ev => {
                  ev.preventDefault();
                  setSearchOpen(false);
                  onNavigate(`tadbir-${e.id}`);
                }}
              >
                {e.title}
                <br />
                <span className="sm">{fd(e.date)} · Yunusobod</span>
              </a>
            ))}
            {matchedUsers.map(u => (
              <button
                key={`u-${u.id}`}
                className="mi"
                onClick={() => {
                  setSearchOpen(false);
                  onNavigate('foydalanuvchilar');
                }}
              >
                {u.n}
                <br />
                <span className="sm">Foydalanuvchi · {u.r}</span>
              </button>
            ))}
            {matchedEvents.length === 0 && matchedUsers.length === 0 && (
              <div className="mi sm">Hech narsa topilmadi</div>
            )}
          </div>
        </div>

        <div className="top-actions">
          <DatePickerPopover />
          {renderBell()}
          <button className="ib" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          {renderAdmin()}
        </div>
      </header>
    );
  }

  const getPageTitles = () => {
    if (isEventDetail) return ['Tadbir tafsilotlari', 'Tadbir haqida to‘liq ma’lumot'];
    if (currentRoute === 'foydalanuvchilar') return ['Foydalanuvchilar', 'Ro‘yxatdan o‘tgan barcha foydalanuvchilar'];
    if (currentRoute === 'tadbir-qoshish') return ['Tadbir qo‘shish', 'Yangi tadbir ma’lumotlarini kiriting'];
    if (currentRoute === 'mahalla') return ['', ''];
    if (currentRoute === 'tadbirlar') return ['Tadbirlar', 'Barcha tadbirlar ro‘yxati'];
    return ['Sozlamalar', 'Tizim sozlamalarini boshqaring'];
  };

  const [title, subtitle] = getPageTitles();

  return (
    <header className="top">
      {isEventDetail && (
        <button
          className="ib"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('tadbirlar');
          }}
          aria-label="Orqaga"
        >
          ←
        </button>
      )}
      {title ? (
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1>{title}</h1>
          {subtitle ? (
            <div className="sm" style={{ marginTop: '4px' }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div className="top-actions">
        <DatePickerPopover />
        {renderBell()}
        <button className="ib" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        {renderAdmin()}
      </div>
    </header>
  );
};

