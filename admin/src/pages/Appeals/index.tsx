import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { showToast } from '../../components/ui/Toast';
import { appealsApi } from '../../api/appeals';
import { AppealItem } from '../../types';
import { useDateFilter } from '../../store/dateFilterStore';
import { fd, MN, pad } from '../../utils/format';

const QUICK_REPLIES = [
  'Assalomu alaykum! Murojaatingiz qabul qilindi va Yunusobod tumani Yoshlar ishlari bo‘limi mutaxassislariga yo‘naltirildi. Tez orada siz bilan bog‘lanamiz.',
  'Salom! Tanlov va kurslar bo‘yicha to‘liq jadval platformamizning «Tadbirlar» bo‘limida e’lon qilinadi. Ro‘yxatdan o‘tish bepul.',
  'Assalomu alaykum! Savolingiz yuzasidan mahallangizdagi Yoshlar yetakchisiga bevosita murojaat qilishingiz mumkin. Ular zarur hujjatlarni rasmiylashtirishda ko‘maklashadi.',
  'Assalomu alaykum! Taklifingiz uchun tashakkur. Mutasaddi tashkilotlar bilan birgalikda o‘rganib chiqilib, natijasi ma’lum qilinadi.'
];

const CATEGORY_COLORS: Record<string, string> = {
  'IT va zamonaviy ta’lim': '#3b82f6',
  'Sport to‘garaklari': '#8b5cf6',
  'Iqtidorli yoshlar': '#ec4899',
  'Bandlik va startaplar': '#10b981',
  'Ayollar va yoshlar tadbirkorligi': '#f59e0b',
  'Madaniyat va san’at': '#6366f1'
};

interface AppealsPageProps {
  onNavigate?: (route: string) => void;
}

export const AppealsPage: React.FC<AppealsPageProps> = () => {
  const { selectedDate, selectedPreset, startDate, endDate } = useDateFilter();
  const [appeals, setAppeals] = useState<AppealItem[]>(() => appealsApi.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'answered'>('all');
  const [filterByDate, setFilterByDate] = useState(true);

  // To'liq ma'lumot va javob berish modali
  const [selectedAppeal, setSelectedAppeal] = useState<AppealItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [sendSmsNotification, setSendSmsNotification] = useState(true);

  const [dYear, dMonth, dDay] = selectedDate.split('-').map(Number);
  const monthNameUz = MN[dMonth - 1] ? MN[dMonth - 1][0].toUpperCase() + MN[dMonth - 1].slice(1) : '';
  const monthSuffix = `.${pad(dMonth)}.${dYear}`;
  const dateFormatted = `${pad(dDay)}.${pad(dMonth)}.${dYear}`;

  // Serverdan so'nggi ma'lumotlarni sinxronlashtirish
  useEffect(() => {
    appealsApi.fetchFromServer().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setAppeals(data);
      }
    });

    const handleUpdate = () => {
      setAppeals(appealsApi.getAll());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAppeal(null);
      }
    };

    window.addEventListener('appeals-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('appeals-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const refreshList = () => {
    const list = appealsApi.getAll();
    setAppeals(list);
    if (selectedAppeal) {
      const updated = list.find(a => a.id === selectedAppeal.id);
      if (updated) setSelectedAppeal(updated);
    }
  };

  // Sana bo'yicha solishtirish yordamchisi
  const isDateMatch = (createdAt: string) => {
    if (!filterByDate || selectedPreset === 'all') return true;
    if (selectedPreset === 'month') return createdAt.includes(monthSuffix);
    if (selectedPreset === 'year') return createdAt.includes(String(dYear));
    if (startDate && endDate && startDate !== endDate) {
      const mDate = createdAt.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
      if (mDate) {
        const iso = `${mDate[3]}-${mDate[2]}-${mDate[1]}`;
        return iso >= startDate && iso <= endDate;
      }
      return true;
    }
    return createdAt.startsWith(dateFormatted);
  };

  // Sana bo'yicha saralangan murojaatlar
  const dateFilteredAppeals = useMemo(() => {
    return appeals.filter(item => isDateMatch(item.createdAt));
  }, [appeals, filterByDate, selectedDate, selectedPreset, startDate, endDate]);

  // Statlar (Tanlangan sana bo'yicha)
  const totalCount = dateFilteredAppeals.length;
  const newCount = dateFilteredAppeals.filter(a => a.status === 'new').length;
  const answeredCount = dateFilteredAppeals.filter(a => a.status === 'answered').length;

  // Yakuniy qidiruv va status filtri bo'yicha ro'yxat
  const filteredAppeals = useMemo(() => {
    return dateFilteredAppeals.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.userName.toLowerCase().includes(q) ||
          item.mahalla.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.text.toLowerCase().includes(q) ||
          item.phone.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [dateFilteredAppeals, statusFilter, searchQuery]);

  const handleOpenDetailModal = (item: AppealItem) => {
    setSelectedAppeal(item);
    setReplyText(item.replyText || '');
    setIsEditingReply(!item.replyText);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal) return;
    if (!replyText.trim()) {
      showToast('Iltimos, javob matnini kiriting!');
      return;
    }

    appealsApi.reply(selectedAppeal.id, replyText);
    refreshList();
    const smsMsg = sendSmsNotification ? ' (Foydalanuvchiga SMS xabar ham yo‘llandi)' : '';
    showToast(`Murojaatga rasmiy javob yuborildi!${smsMsg}`);
    setIsEditingReply(false);
  };

  const handleDeleteAppeal = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Haqiqatan ham ushbu murojaatni o‘chirmoqchimisiz?')) {
      appealsApi.delete(id);
      refreshList();
      if (selectedAppeal?.id === id) {
        setSelectedAppeal(null);
      }
      showToast('Murojaat o‘chirildi');
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* 4 ta Statistika Kartasi (Faqat nomi va sanog'i, kattaroq va toza) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '22px'
        }}
      >
        {/* 1. Jami kelib tushgan */}
        <Card
          lift
          className="sc"
          style={{
            minHeight: '110px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: statusFilter === 'all' ? '2px solid var(--pri)' : '1px solid var(--cb)',
            boxShadow: statusFilter === 'all' ? '0 8px 24px -4px rgba(23, 99, 238, 0.35)' : 'none',
            transition: 'all 0.25s ease'
          }}
          onClick={() => setStatusFilter('all')}
          title="Barcha murojaatlarni ko‘rsatish"
        >
          <div className="sm" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mut)' }}>
            Jami kelib tushgan
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.5px' }}>
            {totalCount} ta
          </div>
        </Card>

        {/* 2. Javob berilmagan */}
        <Card
          lift
          className="sc"
          style={{
            minHeight: '110px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: statusFilter === 'new' ? '2px solid #f59e0b' : '1px solid var(--cb)',
            boxShadow: statusFilter === 'new' ? '0 8px 24px -4px rgba(245, 158, 11, 0.35)' : 'none',
            transition: 'all 0.25s ease'
          }}
          onClick={() => setStatusFilter(prev => (prev === 'new' ? 'all' : 'new'))}
          title="Javob berilmagan murojaatlarni ko‘rsatish"
        >
          <div className="sm" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mut)' }}>
            Javob berilmagan
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.5px' }}>
            {newCount} ta
          </div>
        </Card>

        {/* 3. Javob berilgan */}
        <Card
          lift
          className="sc"
          style={{
            minHeight: '110px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: statusFilter === 'answered' ? '2px solid #10b981' : '1px solid var(--cb)',
            boxShadow: statusFilter === 'answered' ? '0 8px 24px -4px rgba(16, 185, 129, 0.35)' : 'none',
            transition: 'all 0.25s ease'
          }}
          onClick={() => setStatusFilter(prev => (prev === 'answered' ? 'all' : 'answered'))}
          title="Javob berilgan murojaatlarni ko‘rsatish"
        >
          <div className="sm" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mut)' }}>
            Javob berilgan
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px' }}>
            {answeredCount} ta
          </div>
        </Card>

        {/* 4. Yechilish darajasi */}
        <Card
          lift
          className="sc"
          style={{
            minHeight: '110px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: '1px solid var(--cb)',
            transition: 'all 0.25s ease'
          }}
          onClick={() => setStatusFilter('all')}
          title="Murojaatlar yechilishi foizi"
        >
          <div className="sm" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mut)' }}>
            Yechilish darajasi
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#8b5cf6', letterSpacing: '-0.5px' }}>
            {totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 100}%
          </div>
        </Card>
      </section>

      {/* Yuqori Qidiruv va Sana Bosqichi Paneli */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <label className="srch" style={{ width: '360px', maxWidth: '100%' }}>
          <Icon name="search" />
          <input
            type="search"
            aria-label="Qidirish"
            placeholder="Ism, mahalla, telefon yoki mavzu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        {/* Yuqoridagi Sanani yoqish/o'chirish filtri tugmasi */}
        <button
          type="button"
          className={`bt ${filterByDate ? '' : 'g'}`}
          onClick={() => setFilterByDate(!filterByDate)}
          style={{ height: '42px', padding: '0 16px', gap: '8px', cursor: 'pointer' }}
          title={filterByDate ? 'Barcha sanalarni ko‘rsatish' : 'Tanlangan sana bo‘yicha filtrlash'}
        >
          <Icon name="cal" />
          <span>
            {filterByDate
              ? selectedPreset === 'month'
                ? `${monthNameUz} ${dYear}`
                : selectedPreset === 'all'
                ? 'Barcha sanalar'
                : fd(selectedDate)
              : 'Barcha sanalar'}
          </span>
        </button>
      </div>

      {/* Natija Soni va Sana belgisi (Aynan Tadbirlardagidek akuratniy) */}
      <div className="sm" style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{filteredAppeals.length} ta murojaat topildi</span>
        {filterByDate && (
          <span style={{ color: 'var(--pri)', fontWeight: 600 }}>
            ·{' '}
            {selectedPreset === 'month'
              ? `${monthNameUz} ${dYear} oyi bo‘yicha`
              : selectedPreset === 'all'
              ? 'Barcha davrlar bo‘yicha'
              : `${fd(selectedDate)} sanasi bo‘yicha`}
          </span>
        )}
      </div>

      {/* Murojaatlar Katakchalari To'plami (Aynan Tadbirlar bo'limidek ixcham, kichik va akuratniy) */}
      {filteredAppeals.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mut)' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>📭</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'var(--tx)' }}>
            Ushbu sanada hech qanday murojaat topilmadi
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: 'var(--mut)' }}>
            {filterByDate
              ? `${fd(selectedDate)} sanasida murojaatlar kelib tushmagan. Barcha sanalarni ko‘rish uchun tugmani bosing.`
              : 'Qidiruv shartlarini o‘zgartirib ko‘ring.'}
          </p>
          {filterByDate && (
            <button
              type="button"
              className="bt"
              onClick={() => setFilterByDate(false)}
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon name="cal" />
              <span>Barcha sanalardagi murojaatlarni ko‘rsatish</span>
            </button>
          )}
        </Card>
      ) : (
        <div
          className="eg"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 320px))',
            gap: '16px'
          }}
        >
          {filteredAppeals.map((item, i) => {
            const isNew = item.status === 'new';
            const catColor = CATEGORY_COLORS[item.category] || '#3b82f6';
            return (
              <div
                key={item.id}
                className="card ev an"
                style={{
                  animationDelay: `${Math.min(i, 11) * 0.04}s`,
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenDetailModal(item)}
                title="Batafsil ko‘rish va javob yo‘llash uchun bosing"
              >
                {/* 1-qator: Kategoriya tegi va Status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span className="tag">
                    <i className="dot" style={{ background: catColor }} />
                    {item.category}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isNew ? '#f59e0b' : '#10b981',
                      background: isNew ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}
                  >
                    {isNew ? '● Kutilmoqda' : '✓ Javob berildi'}
                  </span>
                </div>

                {/* Sarlavha / Mavzu */}
                <h3
                  style={{
                    margin: '12px 0 8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--tx)',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '42px'
                  }}
                >
                  {item.subject}
                </h3>

                {/* 3 ta ma'lumot qatori (Tadbirlar kartasidek bir xil tartibda) */}
                <div className="ir sm">
                  <Icon name="cal" />
                  <span>{item.createdAt}</span>
                </div>

                <div className="ir sm">
                  <Icon name="pin" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.mahalla}
                  </span>
                </div>

                <div className="ir sm">
                  <Icon name="user" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.userName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TO'LIQ MA'LUMOT VA JAVOB YOZISH MODALI (Katakchaga bosilganda ochiladi) */}
      {selectedAppeal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedAppeal(null)}
        >
          <div
            style={{
              background: 'var(--pop)',
              border: '1px solid var(--line)',
              color: 'var(--tx)',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: 'var(--cs)',
              boxSizing: 'border-box'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Sarlavhasi */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    className="tag"
                    style={{
                      background: 'rgba(23, 99, 238, 0.1)',
                      color: 'var(--pri)'
                    }}
                  >
                    <i className="dot" style={{ background: CATEGORY_COLORS[selectedAppeal.category] || 'var(--pri)' }} />
                    {selectedAppeal.category}
                  </span>
                  {selectedAppeal.status === 'new' ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                      ● Javob berilmagan
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                      ✓ Javob berilgan
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--tx)', lineHeight: '1.4' }}>
                  {selectedAppeal.subject}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* O'chirish tugmasi - X ning chap tomonida */}
                <button
                  type="button"
                  className="bt g"
                  onClick={e => handleDeleteAppeal(selectedAppeal.id, e)}
                  title="Ushbu murojaatni butunlay o‘chirish"
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    height: '32px',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                >
                  🗑 O‘chirish
                </button>

                {/* Yopish (X) tugmasi - modalni silliq yopadi */}
                <button
                  type="button"
                  onClick={() => setSelectedAppeal(null)}
                  title="Yopish (Chiqish)"
                  aria-label="Modalni yopish"
                  style={{
                    background: 'var(--soft)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--tx)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon name="x" />
                </button>
              </div>
            </div>

            {/* Foydalanuvchi ma'lumotlari kartasi */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--soft)',
                border: '1px solid var(--line)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                marginBottom: '16px'
              }}
            >
              <div>
                <div className="sm" style={{ fontSize: '11px' }}>Foydalanuvchi:</div>
                <div style={{ fontWeight: 700, color: 'var(--tx)', fontSize: '14px' }}>
                  {selectedAppeal.userName}
                </div>
              </div>

              <div>
                <div className="sm" style={{ fontSize: '11px' }}>Telefon:</div>
                <a
                  href={`tel:${selectedAppeal.phone.replace(/\s+/g, '')}`}
                  style={{
                    fontWeight: 600,
                    color: 'var(--pri)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📞 {selectedAppeal.phone}
                </a>
              </div>

              <div>
                <div className="sm" style={{ fontSize: '11px' }}>Mahallasi:</div>
                <div style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '13px' }}>
                  📍 {selectedAppeal.mahalla}
                </div>
              </div>

              <div>
                <div className="sm" style={{ fontSize: '11px' }}>Yuborilgan sana va vaqt:</div>
                <div style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '13px' }}>
                  🕒 {selectedAppeal.createdAt}
                </div>
              </div>
            </div>

            {/* To'liq murojaat matni */}
            <div style={{ marginBottom: '20px' }}>
              <div className="sm" style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--tx)' }}>
                Murojaat matni:
              </div>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  fontSize: '14.5px',
                  color: 'var(--tx)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedAppeal.text}
              </div>
            </div>

            {/* Admin rasmiy javobi bloki (agar allaqachon javob berilgan bo'lsa) */}
            {selectedAppeal.replyText && !isEditingReply && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderLeft: '4px solid #10b981'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    💬 {selectedAppeal.repliedBy || 'Administrator rasmiy javobi'}:
                  </span>
                  {selectedAppeal.repliedAt && (
                    <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>{selectedAppeal.repliedAt}</span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--tx)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                  {selectedAppeal.replyText}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="bt g"
                    onClick={() => setIsEditingReply(true)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Icon name="edit" /> Javobni o‘zgartirish
                  </button>
                </div>
              </div>
            )}

            {/* Javob yozish yoki tahrirlash maydoni */}
            {(isEditingReply || !selectedAppeal.replyText) && (
              <div>
                <div className="sm" style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--tx)' }}>
                  {selectedAppeal.replyText ? 'Javobni yangilash:' : 'Rasmiy javob yozish:'}
                </div>

                {/* Tezkor javob shablonlari */}
                <div style={{ marginBottom: '12px' }}>
                  <div className="sm" style={{ fontSize: '11.5px', marginBottom: '6px' }}>
                    Tezkor shablonlar (1 klikda to‘ldirish):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {QUICK_REPLIES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(tmpl)}
                        style={{
                          textAlign: 'left',
                          fontSize: '12px',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: 'var(--soft)',
                          color: 'var(--tx)',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ {tmpl.slice(0, 95)}...
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendReply}>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Foydalanuvchiga yuboriladigan rasmiy javobingizni bu yerga kiriting..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--ibd)',
                      background: 'var(--inp)',
                      color: 'var(--tx)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      lineHeight: '1.5',
                      boxSizing: 'border-box',
                      marginBottom: '12px'
                    }}
                  />

                  {/* SMS xabar katagi */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="modalSmsCheck"
                      checked={sendSmsNotification}
                      onChange={e => setSendSmsNotification(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="modalSmsCheck" style={{ fontSize: '13px', color: 'var(--tx)', cursor: 'pointer' }}>
                      Foydalanuvchi telefoniga (<b>{selectedAppeal.phone}</b>) SMS xabarnoma ham yo‘llansin
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    {selectedAppeal.replyText && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setIsEditingReply(false)}
                        style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Bekor qilish
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="send" />
                      <span>Javobni yuborish</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
