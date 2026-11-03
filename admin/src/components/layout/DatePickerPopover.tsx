import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { pad, MN } from '../../utils/format';
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

  const { selectedDate, selectedPreset, setDate, setPreset } = useDateFilter();

  const [dYear, dMonth, dDay] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(dYear || 2026);
  const [viewMonth, setViewMonth] = useState(dMonth ? dMonth - 1 : 10);

  // Synchronize view month/year when selectedDate changes externally
  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [selectedDate]);

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
    setDate(targetDate, '00:00', 'custom');
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

  return (
    <div className="datepicker-wrapper" ref={containerRef}>
      {/* 1. Triger Tugmasi */}
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

      {/* 2. Ochiluvchi Kalendar Modali */}
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

          {/* B. Sana diapazoni kiritish maydonlari (vaqtsiz, toza sana) */}
          <div className="dp-range-row">
            <div className="dp-input-group">
              <span className="dp-input-label">Sana (dan)</span>
              <div className="dp-input-box">
                {formattedPillDate}
              </div>
            </div>
            <span className="dp-range-sep">-</span>
            <div className="dp-input-group">
              <span className="dp-input-label">Sana (gacha)</span>
              <div className="dp-input-box">
                {formattedPillDate}
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

          {/* C. Asosiy Qism: Kalendar */}
          <div className="dp-main-content">
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
