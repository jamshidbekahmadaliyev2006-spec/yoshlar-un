import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { MapView } from '../../components/map/MapView';
import { eventsApi } from '../../api/events';
import { apiClient } from '../../api/client';
import { TYPES, COL, LOCS, fd, MN } from '../../utils/format';
import { showToast } from '../../components/ui/Toast';

interface EventDetailsProps {
  eventId: number;
  onNavigate: (route: string) => void;
}

const FB_FIELD = (
  <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Futbol maydoni">
    <rect width="400" height="200" fill="#3f9b4a" />
    <g fill="#4aa956">
      <rect width="50" height="200" />
      <rect x="100" width="50" height="200" />
      <rect x="200" width="50" height="200" />
      <rect x="300" width="50" height="200" />
    </g>
    <circle cx="200" cy="100" r="46" fill="none" stroke="#fff" strokeWidth="2" />
    <path d="M200 0V200" stroke="#fff" strokeWidth="2" />
    <circle cx="200" cy="100" r="16" fill="#fff" stroke="#10264d" strokeWidth="2" />
  </svg>
);

export const EventDetailsPage: React.FC<EventDetailsProps> = ({ eventId, onNavigate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [, setRerender] = useState(0);

  const event = eventsApi.getById(eventId);
  const registered = eventsApi.getRegistered();
  const isRegistered = registered.includes(eventId);

  if (!event) {
    return (
      <Card>
        Tadbir topilmadi.{' '}
        <a
          href="#dashboard"
          onClick={e => {
            e.preventDefault();
            onNavigate('dashboard');
          }}
        >
          Dashboardga qaytish
        </a>
      </Card>
    );
  }

  const loc = LOCS[event.loc] || LOCS[0];

  // Deadline calculation: 1 day before
  const dl = new Date(`${event.date}T00:00`);
  dl.setDate(dl.getDate() - 1);
  const deadlineStr = `${dl.getDate()}-${MN[dl.getMonth()]}gacha`;

  const handleToggleRegistration = () => {
    const regStatus = eventsApi.toggleReg(eventId);
    setRerender(prev => prev + 1);
    showToast(regStatus ? 'Ro‘yxatdan o‘tdingiz' : 'Ro‘yxatdan o‘tish bekor qilindi');
  };

  // Generate participant previews
  const allUsers = apiClient.getUsers();
  const participantPreviews = Array.from({ length: 4 }, (_, k) => {
    return allUsers[(event.id * 5 + k) % allUsers.length];
  });

  const modalParticipants = Array.from({ length: 12 }, (_, k) => {
    return allUsers[(event.id * 5 + k) % allUsers.length];
  });

  const renderBanner = () => {
    if (event.img) {
      return <img src={event.img} alt={event.title} />;
    }
    if (event.t === 0) {
      return FB_FIELD;
    }
    return (
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={TYPES[event.t]}>
        <rect width="400" height="200" fill={COL[event.t]} />
        <rect width="400" height="200" fill="#0b0420" opacity=".45" />
        <text x="200" y="112" textAnchor="middle" fontSize="34" fontWeight="700" fill="#fff">
          {TYPES[event.t]}
        </text>
      </svg>
    );
  };

  const totalGoing = event.going;

  return (
    <div>
      <div className="dg">
        {/* Chap blok: Tadbir tafsilotlari */}
        <Card>
          <div className="eimg">{renderBanner()}</div>
          <h2 style={{ margin: '0 0 10px', fontSize: '20px' }}>{event.title}</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <span className="tag">{TYPES[event.t]}</span>
            <span className="tag" style={{ background: 'var(--okb)', color: 'var(--ok)' }}>
              Ochiq
            </span>
          </div>

          <div className="ir">
            <Icon name="cal" />
            <span>
              {fd(event.date, true)}, {event.time}
            </span>
          </div>
          <div className="ir">
            <Icon name="pin" />
            <span>{loc.n}</span>
          </div>
          <div className="ir">
            <Icon name="users" />
            <span>{event.ages}</span>
          </div>
          <div className="ir">
            <Icon name="clock" />
            <span>Ro‘yxatdan o‘tish: {deadlineStr}</span>
          </div>

          <h3 style={{ fontSize: '14px', margin: '18px 0 6px' }}>Tadbir haqida</h3>
          <p className="sm" style={{ margin: '0 0 18px', lineHeight: 1.6 }}>
            {event.desc}
          </p>

          <button
            className="bt"
            style={{ width: '100%' }}
            onClick={handleToggleRegistration}
          >
            {isRegistered
              ? 'Ro‘yxatdan o‘tildi ✓ (bekor qilish)'
              : 'Ro‘yxatdan o‘tish'}
          </button>
        </Card>

        {/* O'ng blok: Lokatsiya xaritasi va Qatnashuvchilar */}
        <div className="fg">
          <Card>
            <h2 className="h">Lokatsiya</h2>
            <MapView onlyPin={event.loc} showZoomControls={false} />
            <div style={{ margin: '12px 0' }}>{loc.n}</div>
            <a
              className="bt g"
              style={{ width: '100%' }}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Yunusobod ' + loc.n)}`}
            >
              Yo‘l ko‘rsatish
            </a>
          </Card>

          <Card>
            <h2 className="h">Qatnashuvchilar</h2>
            <div className="avs">
              {participantPreviews.map((u, k) => (
                <i key={k} style={{ background: COL[k % COL.length] }} aria-hidden="true">
                  {u.n[0]}
                </i>
              ))}
              <span className="sm" style={{ marginLeft: '10px', fontWeight: 600 }}>
                +{totalGoing}
              </span>
            </div>
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button className="cbt" onClick={() => setModalOpen(true)}>
                Barchasini ko‘rish
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Barcha qatnashuvchilar modal oynasi */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Qatnashuvchilar (${totalGoing})`}
      >
        <div>
          {modalParticipants.map((u, idx) => (
            <div className="ir" key={idx}>
              <span className="av" style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                {u.n[0]}
              </span>
              {u.n}
              <span className="sm" style={{ marginLeft: 'auto' }}>
                {u.r}
              </span>
            </div>
          ))}
          <button
            className="bt g"
            style={{ width: '100%', marginTop: '14px' }}
            onClick={() => setModalOpen(false)}
          >
            Yopish
          </button>
        </div>
      </Modal>
    </div>
  );
};

