import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { TODAY, pad, MN } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface DatePickerPopoverProps {
  onDateChange?: (date: string) => void;
}

interface CalendarCell {
  day: number;
  isCurrentMonth: boolean;
  month: number;
  year: number;
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({ onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectedDate, selectedTime, selectedPreset, setDate, setTime, setPreset } = useDateFilter();

  const [dYear, dMonth, dDay] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(dYear || 2026);
  const [viewMonth, setViewMonth] = useState(dMonth ? dMonth - 1 : 10);

  const [tHour, tMinute] = (selectedTime || '00:00').split(':');
  const [hour, setLocalHour] = useState(tHour || '00');
  const [minute, setLocalMinute] = useState(tMinute || '00');

  // Synchronize view month/year and hour/minute when selectedDate changes externally
  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [selectedDate]);

  useEffect(() => {
    const [h, min] = (selectedTime || '00:00').split(':');
    setLocalHour(h || '00');
    setLocalMinute(min || '00');
  }, [selectedTime]);

  // Display date on the pill button (DD.MM.YYYY)
  const formattedPillDate = `${pad(dDay)}.${pad(dMonth)}.${dYear}`;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calendar generation for viewMonth & viewYear
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Days array (42 slots: 6 rows of 7)
  const calendarCells: CalendarCell[] = [];

  // Previous month overflow days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      month: viewMonth,
      year: viewYear
    });
  }

  // Next month overflow days
  const remaining = 42 - calendarCells.length;
  for (let n = 1; n <= remaining; n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear
    });
  }

  const handleSelectDay = (cell: CalendarCell) => {
    const targetDate = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
    setDate(targetDate, `${hour}:${minute}`, 'custom');
    setViewMonth(cell.month);
    setViewYear(cell.year);
    if (onDateChange) {
      onDateChange(targetDate);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handlePresetClick = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    setPreset(preset);
  };

  const handleSelectHour = (h: string) => {
    setLocalHour(h);
    setTime(`${h}:${minute}`);
  };

  const handleSelectMinute = (m: string) => {
    setLocalMinute(m);
    setTime(`${hour}:${m}`);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutesList = Array.from({ length: 60 }, (_, i) => pad(i));

  return (
    <div className="datepicker-wrapper" ref={containerRef}>
      {/* 1. Triger Tugmasi (Rasm 1 dagi: 02.11.2026 + Kalendar belgisi) */}
      <button
        type="button"
        className={`datepicker-pill-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Sanani tanlash"
        title="Sanani tanlash"
      >
        <span>{formattedPillDate}</span>
        <Icon name="cal" className="datepicker-cal-icon" />
      </button>

      {/* 2. Ochiluvchi Katta Kalendar Modali (Rasm 1 ga 1-ga-1 mos) */}
      {isOpen && (
        <div className="datepicker-card-popover">
          {/* A. Yuqori Preset Tugmalari */}
          <div className="dp-presets-row">
            <button
              type="button"
              className={`dp-preset-btn ${selectedPreset === 'today' ? 'active' : ''}`}
              onClick={() => handlePresetClick('today')}
            >
              Bugun
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${selectedPreset === 'yesterday' ? 'active' : ''}`}
              onClick={() => handlePresetClick('yesterday')}
            >
              Kecha
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${selectedPreset === 'week' ? 'active' : ''}`}
              onClick={() => handlePresetClick('week')}
            >
              Shu hafta
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${selectedPreset === 'month' ? 'active' : ''}`}
              onClick={() => handlePresetClick('month')}
            >
              Shu oy
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${selectedPreset === 'year' ? 'active' : ''}`}
              onClick={() => handlePresetClick('year')}
            >
              Shu yil
            </button>
          </div>

          {/* B. Sana diapazoni kiritish maydonlari */}
          <div className="dp-range-row">
            <div className="dp-input-group">
              <span className="dp-input-label">Sana (dan)</span>
              <div className="dp-input-box">
                {formattedPillDate} | {hour}:{minute}
              </div>
            </div>
            <span className="dp-range-sep">-</span>
            <div className="dp-input-group">
              <span className="dp-input-label">Sana (gacha)</span>
              <div className="dp-input-box">
                {formattedPillDate} | 23:59
              </div>
            </div>
            <button
              type="button"
              className="dp-ok-sm-btn"
              onClick={() => setIsOpen(false)}
            >
              OK
            </button>
          </div>

          {/* C. Asosiy Qism: Chapda Kalendar, O'ngda Vaqt */}
          <div className="dp-main-content">
            {/* Chap tomondagi oy kalendari */}
            <div className="dp-calendar-pane">
              {/* Oy va yil navigatsiyasi */}
              <div className="dp-month-nav">
                <button
                  type="button"
                  className="dp-nav-arrow"
                  onClick={handlePrevMonth}
                  aria-label="Oldingi oy"
                >
                  ‹
                </button>

                <div className="dp-selectors">
                  <select
                    className="dp-select"
                    value={viewYear}
                    onChange={e => setViewYear(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    className="dp-select"
                    value={viewMonth}
                    onChange={e => setViewMonth(Number(e.target.value))}
                  >
                    {MN.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m[0].toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="dp-nav-arrow"
                  onClick={handleNextMonth}
                  aria-label="Keyingi oy"
                >
                  ›
                </button>
              </div>

              {/* Hafta kunlari sarlavhasi */}
              <div className="dp-weekdays-row">
                {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(w => (
                  <span key={w} className="dp-weekday">
                    {w}
                  </span>
                ))}
              </div>

              {/* Kunlar jadvali */}
              <div className="dp-days-grid">
                {calendarCells.map((cell, idx) => {
                  const isSelected =
                    cell.day === dDay &&
                    cell.month === dMonth - 1 &&
                    cell.year === dYear;

                  return (
                    <button
                      type="button"
                      key={idx}
                      className={`dp-day-cell ${cell.isCurrentMonth ? 'current' : 'overflow'} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectDay(cell)}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* O'ng tomondagi vaqt tanlagich (Vaqt) */}
            <div className="dp-time-pane">
              <div className="dp-time-header">
                <Icon name="clock" className="dp-time-icon" />
                <span>Vaqt</span>
              </div>

              <div className="dp-time-columns">
                {/* Soatlar ustuni */}
                <div className="dp-time-col">
                  <span className="dp-time-sub">SOAT</span>
                  <div className="dp-time-list">
                    {hoursList.map(h => (
                      <button
                        type="button"
                        key={h}
                        className={`dp-time-item ${h === hour ? 'active' : ''}`}
                        onClick={() => handleSelectHour(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daqiqalar ustuni */}
                <div className="dp-time-col">
                  <span className="dp-time-sub">DAQIQA</span>
                  <div className="dp-time-list">
                    {minutesList.map(m => (
                      <button
                        type="button"
                        key={m}
                        className={`dp-time-item ${m === minute ? 'active' : ''}`}
                        onClick={() => handleSelectMinute(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D. Pastki harakat tugmalari */}
          <div className="dp-footer-row">
            <button
              type="button"
              className="dp-today-btn"
              onClick={() => handlePresetClick('today')}
            >
              <Icon name="cal" />
              <span>Bugun</span>
            </button>

            <button
              type="button"
              className="dp-ok-main-btn"
              onClick={() => setIsOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
