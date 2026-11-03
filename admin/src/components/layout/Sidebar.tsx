import React from 'react';
import { Icon } from '../ui/Icon';
import { useAppConfig } from '../../store/authStore';

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
  { id: 'sozlamalar', label: 'Sozlamalar', icon: 'gear' }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { config } = useAppConfig();

  const activeId = currentRoute.startsWith('tadbir-') && currentRoute !== 'tadbir-qoshish'
    ? 'tadbirlar'
    : currentRoute;

  return (
    <aside className="side">
      <div className="brand">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
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
        <div>
          <b>Yunusobot</b>
          <span>{config.sys}</span>
        </div>
      </div>

      <nav className="snav">
        {NAV_ITEMS.map(item => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              className={`nav ${isActive ? 'on' : ''}`}
              href={`#${item.id}`}
              onClick={e => {
                e.preventDefault();
                onNavigate(item.id);
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
};

