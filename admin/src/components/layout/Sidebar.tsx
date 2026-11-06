import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useAppConfig } from '../../store/authStore';
import { appealsApi } from '../../api/appeals';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Bosh sahifa', icon: 'home' },
  { id: 'mahalla', label: 'Mahalla', icon: 'pin' },
  { id: 'foydalanuvchilar', label: 'Foydalanuvchilar', icon: 'users' },
  { id: 'tadbirlar', label: 'Tadbirlar', icon: 'cal' },
  { id: 'tadbir-qoshish', label: "Tadbir qo'shish", icon: 'plus' },
  { id: 'murojaatlar', label: 'Murojaatlar', icon: 'message' },
  { id: 'sozlamalar', label: 'Sozlamalar', icon: 'gear' }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { config } = useAppConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(() => appealsApi.getUnreadCount());

  useEffect(() => {
    const updateCount = () => setUnreadCount(appealsApi.getUnreadCount());
    window.addEventListener('storage', updateCount);
    window.addEventListener('appeals-updated', updateCount);
    const interval = setInterval(updateCount, 2000);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('appeals-updated', updateCount);
      clearInterval(interval);
    };
  }, []);

  const activeId = currentRoute.startsWith('tadbir-') && currentRoute !== 'tadbir-qoshish'
    ? 'tadbirlar'
    : currentRoute;

  const handleNavClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(id);
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setTimeout(() => {
        const pg = document.getElementById('pg');
        if (pg) {
          pg.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    }
  };

  return (
    <aside className="side">
      <div className="brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" style={{ flexShrink: 0 }}>
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
          <div style={{ minWidth: 0 }}>
            <b>Yunusobod</b>
            <span>{config.sys}</span>
          </div>
        </div>

        {/* Mobil uchun menyuni yig'ish / ochish tugmasi */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          aria-label={isMobileMenuOpen ? "Menyuni yashirish" : "Menyuni ko'rsatish"}
          title={isMobileMenuOpen ? "Menyuni yashirish" : "Menyuni ko'rsatish"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <polyline points="18 15 12 9 6 15" />
            ) : (
              <polyline points="6 9 12 15 18 9" />
            )}
          </svg>
        </button>
      </div>

      <nav className={`snav ${isMobileMenuOpen ? 'open' : 'closed'}`}>
        {NAV_ITEMS.map(item => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              className={`nav ${isActive ? 'on' : ''}`}
              href={`#${item.id}`}
              onClick={e => handleNavClick(item.id, e)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
};

