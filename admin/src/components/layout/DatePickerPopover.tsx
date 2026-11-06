import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { pad, MN, TODAY } from '../../utils/format';
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

  const { selectedDate, selectedPreset, setDate, setDateRange, setPreset } = useDateFilter();

  const [todayYear, todayMonth, todayDay] = TODAY.split('-').map(Number);
  const [dYear, dMonth, dDay] = selectedDate.split('-').map(Number);

  const [viewYear, setViewYear] = useState(dYear || todayYear);
  const [viewMonth, setViewMonth] = useState(dMonth ? dMonth - 1 : todayMonth - 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(
    selectedPreset === 'month' || selectedPreset === 'year' ? null : (dDay || todayDay)
  );
  const [activePreset, setActivePreset] = useState(selectedPreset);

  // Sync internal view when popover opens or selectedDate changes externally
  useEffect(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
      setSelectedDay(selectedPreset === 'month' || selectedPreset === 'year' ? null : (d || todayDay));
      setActivePreset(selectedPreset);
    }
  }, [selectedDate, selectedPreset, isOpen]);

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

  // Calculate dynamic range display for "Sana (dan)" and "Sana (gacha)"
  let rangeStartStr = '';
  let rangeEndStr = '';

  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth - 1;
  const monthMaxDay = isCurrentMonth ? Math.min(todayDay, daysInCurrentMonth) : daysInCurrentMonth;

  if (activePreset === 'all') {
    rangeStartStr = '01.01.2026';
    rangeEndStr = `${pad(todayDay)}.${pad(todayMonth)}.${todayYear}`;
  } else if (activePreset === 'month') {
    rangeStartStr = `01.${pad(viewMonth + 1)}.${viewYear}`;
    rangeEndStr = `${pad(monthMaxDay)}.${pad(viewMonth + 1)}.${viewYear}`;
  } else if (activePreset === 'year') {
    rangeStartStr = `01.01.${viewYear}`;
    const isCurrentYear = viewYear === todayYear;
    rangeEndStr = isCurrentYear ? `${pad(todayDay)}.${pad(todayMonth)}.${todayYear}` : `31.12.${viewYear}`;
  } else if (activePreset === 'today') {
    rangeStartStr = `${pad(todayDay)}.${pad(todayMonth)}.${todayYear}`;
    rangeEndStr = rangeStartStr;
  } else if (activePreset === 'yesterday') {
    const yest = new Date(todayYear, todayMonth - 1, todayDay - 1);
    rangeStartStr = `${pad(yest.getDate())}.${pad(yest.getMonth() + 1)}.${yest.getFullYear()}`;
    rangeEndStr = rangeStartStr;
  } else if (activePreset === 'week') {
    const refDay = selectedDay || Math.min(todayDay, daysInCurrentMonth);
    const d = new Date(viewYear, viewMonth, refDay);
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
    const boundedEnd = sundayStr > TODAY ? new Date(todayYear, todayMonth - 1, todayDay) : sunday;

    rangeStartStr = `${pad(monday.getDate())}.${pad(monday.getMonth() + 1)}.${monday.getFullYear()}`;
    rangeEndStr = `${pad(boundedEnd.getDate())}.${pad(boundedEnd.getMonth() + 1)}.${boundedEnd.getFullYear()}`;
  } else {
    // Custom day
    const day = selectedDay || 1;
    rangeStartStr = `${pad(day)}.${pad(viewMonth + 1)}.${viewYear}`;
    rangeEndStr = rangeStartStr;
  }

  // Month navigation: cannot go beyond current month of current year
  const canGoNext = !(viewYear >= todayYear && viewMonth >= todayMonth - 1);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
    setActivePreset('month');
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
    setActivePreset('month');
    setSelectedDay(null);
  };

  const handleYearChange = (year: number) => {
    if (year > todayYear) return;
    setViewYear(year);
    if (year === todayYear && viewMonth > todayMonth - 1) {
      setViewMonth(todayMonth - 1);
    }
    setActivePreset('month');
    setSelectedDay(null);
  };

  const handleMonthChange = (month: number) => {
    if (viewYear === todayYear && month > todayMonth - 1) return;
    setViewMonth(month);
    setActivePreset('month');
    setSelectedDay(null);
  };

  const handleSelectDay = (cell: CalendarCell) => {
    const cellDateStr = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
    if (cellDateStr > TODAY) return; // Future date blocked

    setViewYear(cell.year);
    setViewMonth(cell.month);
    setSelectedDay(cell.day);
    setActivePreset('custom');
  };

  const handleDoubleClickDay = (cell: CalendarCell) => {
    const targetDate = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
    if (targetDate > TODAY) return; // Future date blocked

    setDate(targetDate, '00:00', 'custom');
    if (onDateChange) {
      onDateChange(targetDate);
    }
    setIsOpen(false);
  };

  const handlePresetClick = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    setActivePreset(preset);
    if (preset === 'all') {
      setViewYear(todayYear);
      setViewMonth(todayMonth - 1);
      setSelectedDay(null);
    } else if (preset === 'today') {
      setViewYear(todayYear);
      setViewMonth(todayMonth - 1);
      setSelectedDay(todayDay);
    } else if (preset === 'yesterday') {
      const yest = new Date(todayYear, todayMonth - 1, todayDay - 1);
      setViewYear(yest.getFullYear());
      setViewMonth(yest.getMonth());
      setSelectedDay(yest.getDate());
    } else {
      setSelectedDay(null);
    }
  };

  // Confirm and Apply selection
  const handleApply = () => {
    let targetDate = '';
    if (activePreset === 'all') {
      const start = '2026-01-01';
      const end = TODAY;
      targetDate = TODAY;
      setDateRange(start, end, targetDate, 'all');
    } else if (activePreset === 'month') {
      const isCurM = viewYear === todayYear && viewMonth === todayMonth - 1;
      const daysInM = new Date(viewYear, viewMonth + 1, 0).getDate();
      const endD = isCurM ? Math.min(todayDay, daysInM) : daysInM;
      const start = `${viewYear}-${pad(viewMonth + 1)}-01`;
      const end = `${viewYear}-${pad(viewMonth + 1)}-${pad(endD)}`;
      targetDate = start;
      setDateRange(start, end, targetDate, 'month');
    } else if (activePreset === 'year') {
      const start = `${viewYear}-01-01`;
      const isCurY = viewYear === todayYear;
      const end = isCurY ? `${todayYear}-${pad(todayMonth)}-${pad(todayDay)}` : `${viewYear}-12-31`;
      targetDate = start;
      setDateRange(start, end, targetDate, 'year');
    } else if (activePreset === 'today') {
      targetDate = TODAY;
      setPreset('today');
    } else if (activePreset === 'yesterday') {
      const yest = new Date(todayYear, todayMonth - 1, todayDay - 1);
      targetDate = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
      setPreset('yesterday');
    } else if (activePreset === 'week') {
      const refDay = selectedDay || Math.min(todayDay, daysInCurrentMonth);
      const d = new Date(viewYear, viewMonth, refDay);
      const dayOfWeek = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const start = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      const sundayStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
      const end = sundayStr > TODAY ? TODAY : sundayStr;
      targetDate = start;
      setDateRange(start, end, targetDate, 'week');
    } else {
      // Custom single day
      const day = selectedDay || 1;
      let candidate = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
      if (candidate > TODAY) candidate = TODAY;
      targetDate = candidate;
      setDate(targetDate, '00:00', 'custom');
    }

    if (onDateChange) {
      onDateChange(targetDate);
    }
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth - 1);
    setSelectedDay(todayDay);
    setActivePreset('today');
    setPreset('today');
    if (onDateChange) {
      onDateChange(TODAY);
    }
    setIsOpen(false);
  };

  // Formatted trigger pill text
  let formattedPillText = '';
  if (selectedPreset === 'all') {
    formattedPillText = 'Barcha davr';
  } else if (selectedPreset === 'month') {
    const mName = MN[dMonth - 1] ? MN[dMonth - 1][0].toUpperCase() + MN[dMonth - 1].slice(1) : '';
    formattedPillText = `${mName} ${dYear}`;
  } else if (selectedPreset === 'year') {
    formattedPillText = `${dYear} yil`;
  } else {
    formattedPillText = `${pad(dDay)}.${pad(dMonth)}.${dYear}`;
  }

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
        <span>{formattedPillText}</span>
        <Icon name="cal" className="datepicker-cal-icon" />
      </button>

      {/* 2. Ochiluvchi Kalendar Modali */}
      {isOpen && (
        <div className="datepicker-card-popover">
          {/* A. Yuqori Preset Tugmalari */}
          <div className="dp-presets-row">
            <button
              type="button"
              className={`dp-preset-btn ${activePreset === 'all' ? 'active' : ''}`}
              onClick={() => handlePresetClick('all')}
              title="Platforma ishga tushgandan beri"
            >
              Barchasi
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${activePreset === 'today' ? 'active' : ''}`}
              onClick={() => handlePresetClick('today')}
            >
              Bugun
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${activePreset === 'yesterday' ? 'active' : ''}`}
              onClick={() => handlePresetClick('yesterday')}
            >
              Kecha
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${activePreset === 'week' ? 'active' : ''}`}
              onClick={() => handlePresetClick('week')}
            >
              Shu hafta
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${activePreset === 'month' ? 'active' : ''}`}
              onClick={() => handlePresetClick('month')}
            >
              Shu oy
            </button>
            <button
              type="button"
              className={`dp-preset-btn ${activePreset === 'year' ? 'active' : ''}`}
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
                {rangeStartStr}
              </div>
            </div>
            <span className="dp-range-sep">-</span>
            <div className="dp-input-group">
              <span className="dp-input-label">Sana (gacha)</span>
              <div className="dp-input-box">
                {rangeEndStr}
              </div>
            </div>
            <button
              type="button"
              className="dp-ok-sm-btn"
              onClick={handleApply}
              title="Filtrni qo‘llash"
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
                    onChange={e => handleYearChange(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    className="dp-select"
                    value={viewMonth}
                    onChange={e => handleMonthChange(Number(e.target.value))}
                  >
                    {MN.map((m, idx) => {
                      const isFutureM = viewYear >= todayYear && idx > todayMonth - 1;
                      return (
                        <option key={m} value={idx} disabled={isFutureM}>
                          {m[0].toUpperCase() + m.slice(1)} {isFutureM ? '(kutilmoqda)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  className="dp-nav-arrow"
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                  style={!canGoNext ? { opacity: 0.25, cursor: 'not-allowed' } : undefined}
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
                  const cellDateStr = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
                  const isFuture = cellDateStr > TODAY;
                  const isSelected =
                    !isFuture &&
                    selectedDay !== null &&
                    cell.day === selectedDay &&
                    cell.month === viewMonth &&
                    cell.year === viewYear;

                  return (
                    <button
                      type="button"
                      key={idx}
                      disabled={isFuture}
                      className={`dp-day-cell ${cell.isCurrentMonth ? 'current' : 'overflow'} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectDay(cell)}
                      onDoubleClick={() => handleDoubleClickDay(cell)}
                      title={
                        isFuture
                          ? `${cell.day}.${pad(cell.month + 1)}.${cell.year} (Hali kelmagan sana)`
                          : `${cell.day}.${pad(cell.month + 1)}.${cell.year} (Tanlash uchun bosing)`
                      }
                      style={
                        isFuture
                          ? { opacity: 0.2, cursor: 'not-allowed', pointerEvents: 'none' }
                          : undefined
                      }
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
              onClick={handleTodayClick}
            >
              <Icon name="cal" />
              <span>Bugun</span>
            </button>

            <button
              type="button"
              className="dp-ok-main-btn"
              onClick={handleApply}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
