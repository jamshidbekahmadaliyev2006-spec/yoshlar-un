import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { usersApi } from '../../api/users';
import { UserItem } from '../../types';
import { SN, MH, TODAY, nf } from '../../utils/format';
import { showToast } from '../../components/ui/Toast';
import { useDateFilter } from '../../store/dateFilterStore';

export const UsersPage: React.FC = () => {
  const { selectedDate } = useDateFilter();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'new'>('all');
  const [rerender, setRerender] = useState(0);

  // Tahrirlash modali holati
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMahalla, setEditMahalla] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [allowEvents, setAllowEvents] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  // Status hisoblagichlari (barcha foydalanuvchilar bo'yicha)
  const allUsers = usersApi.getAll();
  const activeCount = allUsers.filter(u => u.s === 0).length;
  const blockedCount = allUsers.filter(u => u.s === 2).length;
  const dateFormatted = selectedDate.split('-').reverse().join('.');
  const dateNewCount = allUsers.filter(u => u.d === dateFormatted).length;

  const filteredUsers = useMemo(() => {
    let list = usersApi.getAll(query);
    if (statusFilter === 'active') {
      list = list.filter(u => u.s === 0);
    } else if (statusFilter === 'blocked') {
      list = list.filter(u => u.s === 2);
    } else if (statusFilter === 'new') {
      list = list.filter(u => u.d === dateFormatted);
    }
    return list;
  }, [query, statusFilter, dateFormatted, rerender]);

  const total = filteredUsers.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = filteredUsers.slice(startIndex, startIndex + pageSize);

  const handleToggleStatus = (id: number, name: string) => {
    const newStatus = usersApi.toggleStatus(id);
    setRerender(prev => prev + 1);
    showToast(`${name}: ${SN[newStatus]}`);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditUser(user);
    setEditName(user.n);
    setEditPhone(user.p);
    setEditMahalla(user.mahalla || MH[user.id % MH.length]);
    setIsActive(user.s === 0);
    setAllowEvents(user.allowEvents !== false);
    setSmsNotifications(user.smsNotifications !== false);
  };

  const handleCloseEdit = () => {
    setEditUser(null);
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast('Foydalanuvchi ismini kiriting');
      return;
    }

    usersApi.update(editUser.id, {
      n: trimmedName,
      p: editPhone.trim() || editUser.p,
      mahalla: editMahalla,
      s: isActive ? 0 : 2,
      allowEvents,
      smsNotifications
    });

    setEditUser(null);
    setRerender(prev => prev + 1);
    showToast(`${trimmedName} ma'lumotlari yangilandi`);
  };

  const handleExport = () => {
    const csv = usersApi.exportCsv(filteredUsers);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(csv).then(
        () => showToast(`CSV nusxalandi (${Math.min(500, filteredUsers.length)} ta qator)`),
        () => showToast('Brauzer nusxalashga ruxsat bermadi')
      );
    } else {
      showToast('Brauzer nusxalashni qo‘llab-quvvatlamaydi');
    }
  };

  // Pagination buttons logic: 1, pc, and current +/- 1 with ellipsis
  const paginationButtons = [];
  let lastP = 0;
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - currentPage) <= 1) {
      if (p - lastP > 1) {
        paginationButtons.push(
          <span key={`el-${p}`} className="sm">
            …
          </span>
        );
      }
      paginationButtons.push(
        <button
          key={p}
          className={`ib ${p === currentPage ? 'cur' : ''}`}
          onClick={() => setPage(p)}
          aria-label={`${p}-sahifa`}
        >
          {p}
        </button>
      );
      lastP = p;
    }
  }

  return (
    <div>
      {/* Qidiruv va Eksport Paneli */}
      <div className="card tool">
        <label className="srch">
          <Icon name="search" />
          <input
            type="search"
            aria-label="Qidirish"
            placeholder="Foydalanuvchi ismi yoki telefoni..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setPage(1);
            }}
            autoComplete="off"
          />
        </label>

        <button className="bt" onClick={handleExport}>
          Eksport
        </button>
      </div>

      {/* 4 Mini Statistika */}
      <section className="sg" id="us">
        <Card
          className="sc"
          style={{
            alignItems: 'center',
            cursor: 'pointer',
            border: statusFilter === 'all' ? '2px solid var(--pri)' : '1px solid transparent'
          }}
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
        >
          <div className="ico" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d3df0)', width: 42, height: 42 }}>
            <Icon name="users" />
          </div>
          <div>
            <div className="sm">Jami</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{nf(allUsers.length)}</div>
          </div>
        </Card>

        <Card
          className="sc"
          style={{
            alignItems: 'center',
            cursor: 'pointer',
            border: statusFilter === 'active' ? '2px solid #22c9a0' : '1px solid transparent'
          }}
          onClick={() => {
            setStatusFilter(prev => (prev === 'active' ? 'all' : 'active'));
            setPage(1);
          }}
        >
          <div className="ico" style={{ background: 'linear-gradient(135deg,#22c9a0,#0e9f8f)', width: 42, height: 42 }}>
            <Icon name="users" />
          </div>
          <div>
            <div className="sm">Faol</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{nf(activeCount)}</div>
          </div>
        </Card>

        <Card
          className="sc"
          style={{
            alignItems: 'center',
            cursor: 'pointer',
            border: statusFilter === 'blocked' ? '2px solid #d92d27' : '1px solid transparent'
          }}
          onClick={() => {
            setStatusFilter(prev => (prev === 'blocked' ? 'all' : 'blocked'));
            setPage(1);
          }}
        >
          <div className="ico" style={{ background: '#d92d27', width: 42, height: 42 }}>
            <Icon name="users" />
          </div>
          <div>
            <div className="sm">Bloklangan</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{nf(blockedCount)}</div>
          </div>
        </Card>

        <Card
          className="sc"
          style={{
            alignItems: 'center',
            cursor: 'pointer',
            border: statusFilter === 'new' ? '2px solid #e07b00' : '1px solid transparent'
          }}
          onClick={() => {
            setStatusFilter(prev => (prev === 'new' ? 'all' : 'new'));
            setPage(1);
          }}
        >
          <div className="ico" style={{ background: '#e07b00', width: 42, height: 42 }}>
            <Icon name="users" />
          </div>
          <div>
            <div className="sm">{selectedDate === TODAY ? 'Yangi (bugun)' : `Yangi (${dateFormatted})`}</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{nf(dateNewCount)}</div>
          </div>
        </Card>
      </section>

      {/* Foydalanuvchilar Jadvali */}
      <Card style={{ padding: '8px 18px 18px' }}>
        <div className="ov">
          <table className="tb">
            <thead>
              <tr>
                <th>№</th>
                <th>Foydalanuvchi</th>
                <th>Telefon</th>
                <th>Ro‘yxatdan o‘tgan</th>
                <th>Status</th>
                <th style={{ width: '64px', textAlign: 'center' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u, i) => (
                <tr key={u.id}>
                  <td>{startIndex + i + 1}</td>
                  <td>
                    <b>{u.n}</b>
                  </td>
                  <td>{u.p}</td>
                  <td>{u.d}</td>
                  <td>
                    <button
                      className={`pill s${u.s}`}
                      onClick={() => handleToggleStatus(u.id, u.n)}
                      title="Holatni o‘zgartirish"
                    >
                      {SN[u.s]}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="ib-edit"
                      onClick={() => handleOpenEdit(u)}
                      title="Tahrirlash"
                      aria-label={`${u.n} ni tahrirlash`}
                    >
                      <Icon name="edit" />
                    </button>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Hech narsa topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sahifalash Boshqaruvi */}
        <div className="pgr">
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              className="ib"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              aria-label="Oldingi"
            >
              ‹
            </button>
            {paginationButtons}
            <button
              className="ib"
              onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}
              disabled={currentPage >= pageCount}
              aria-label="Keyingi"
            >
              ›
            </button>
          </div>

          <label className="sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Ko‘rsatish:
            <select
              className="in"
              style={{ width: '76px', height: '36px' }}
              value={pageSize}
              onChange={e => {
                setPageSize(+e.target.value);
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </Card>

      {/* Tahrirlash Modali (Rasmga 1-ga-1 moslashtirilgan) */}
      {editUser && (
        <div className="ov2" onClick={handleCloseEdit}>
          <div
            className="edit-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Foydalanuvchini tahrirlash"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Sarlavhasi */}
            <div className="modal-header-row">
              <div className="modal-header-left">
                <div className="modal-accent-pill" />
                <div>
                  <div className="modal-subtag">Tahrirlash</div>
                  <h3 className="modal-title-text">Foydalanuvchini tahrirlash</h3>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseEdit}
                aria-label="Yopish"
              >
                <Icon name="x" />
              </button>
            </div>

            {/* Form Maydonlari */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="lb" htmlFor="m-name">
                  F.I.SH. (Ism va familiya)
                </label>
                <input
                  id="m-name"
                  className="in"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Ism va familiya"
                />
              </div>

              <div>
                <label className="lb" htmlFor="m-phone">
                  Telefon raqami
                </label>
                <input
                  id="m-phone"
                  className="in"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div>
                <label className="lb" htmlFor="m-mahalla">
                  Mahalla
                </label>
                <select
                  id="m-mahalla"
                  className="in"
                  value={editMahalla}
                  onChange={e => setEditMahalla(e.target.value)}
                >
                  {MH.map(m => (
                    <option key={m} value={m}>
                      {m} mahallasi
                    </option>
                  ))}
                </select>
              </div>

              {/* 3 ta Zamonaviy Switch Toggle (Rasmga 1-ga-1) */}
              <div className="toggle-group">
                {/* 1. Status */}
                <div className="toggle-row">
                  <span className="toggle-label">Status</span>
                  <div
                    className="toggle-wrapper"
                    onClick={() => setIsActive(!isActive)}
                  >
                    <button
                      type="button"
                      className={`switch-track ${isActive ? 'on' : ''}`}
                      role="switch"
                      aria-checked={isActive}
                    >
                      <span className="switch-thumb" />
                    </button>
                    <span className={`switch-status-text ${isActive ? 'on' : 'off'}`}>
                      {isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                </div>

                {/* 2. Tadbirlarda qatnashish */}
                <div className="toggle-row">
                  <span className="toggle-label">Tadbirlarga ruxsat</span>
                  <div
                    className="toggle-wrapper"
                    onClick={() => setAllowEvents(!allowEvents)}
                  >
                    <button
                      type="button"
                      className={`switch-track ${allowEvents ? 'on' : ''}`}
                      role="switch"
                      aria-checked={allowEvents}
                    >
                      <span className="switch-thumb" />
                    </button>
                    <span className={`switch-status-text ${allowEvents ? 'on' : 'off'}`}>
                      {allowEvents ? 'Yoqilgan' : 'O‘chirilgan'}
                    </span>
                  </div>
                </div>

                {/* 3. SMS xabarnomalar */}
                <div className="toggle-row">
                  <span className="toggle-label">SMS bildirishnomalar</span>
                  <div
                    className="toggle-wrapper"
                    onClick={() => setSmsNotifications(!smsNotifications)}
                  >
                    <button
                      type="button"
                      className={`switch-track ${smsNotifications ? 'on' : ''}`}
                      role="switch"
                      aria-checked={smsNotifications}
                    >
                      <span className="switch-thumb" />
                    </button>
                    <span className={`switch-status-text ${smsNotifications ? 'on' : 'off'}`}>
                      {smsNotifications ? 'Yoqilgan' : 'O‘chirilgan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Tugmalari */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCloseEdit}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn-save-primary"
                onClick={handleSaveEdit}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

