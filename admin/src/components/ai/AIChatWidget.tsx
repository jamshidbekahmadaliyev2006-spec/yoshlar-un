import React, { useState, useRef, useEffect } from 'react';
import { sendAIMessage, localPlatformAssistant, ChatMessage } from '../../api/ai';
import {
  exportUsersToExcel,
  exportEventsToExcel,
  exportMahallasToExcel,
  exportUsersToWord,
  exportEventsToWord,
  exportMahallasToWord
} from '../../utils/exporter';

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, 'up' | 'down'>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Assalomu alaykum, sizga qanday yordam bera olaman?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: 'uz'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isExpanded]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendAIMessage(
        messages.map(m => ({ role: m.role, content: m.content })),
        textToSend
      );

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
        lang: response.lang
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const fallback = localPlatformAssistant(textToSend);
      setMessages(prev => [
        ...prev,
        {
          id: 'fallback-' + Date.now(),
          role: 'assistant',
          content: fallback.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: fallback.action,
          lang: fallback.lang
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Assalomu alaykum, sizga qanday yordam bera olaman?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: 'uz'
      }
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(prev => (prev === id ? null : prev));
    }, 2000);
  };

  const handleReaction = (id: string, type: 'up' | 'down') => {
    setReactions(prev => {
      const current = prev[id];
      if (current === type) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: type };
    });
  };

  /**
   * Mukammal matn va yozuvlar formatlash mexanizmi:
   * - Markdown jadvallarini to'liq HTML table formatida chiroyli va toza render qilish
   * - 1., 2., 3. raqamlangan bo'limlar uchun maxsus chiroyli nishonlar (section badges)
   * - *, -, • bilan boshlangan ro'yxatlarni toza doirachali (bullet dot) ro'yxatga aylantirish
   * - Kalit so'z va parametrlarni (Key: Value) chiroyli qalin qilib ajratish
   * - Xatolik so'zlarni (masalan, "блокнанные") avtomatik to'g'irlash
   * - Chala uzilgan xom quvur belgilarini tozalash
   */
  const renderFormattedMessage = (content: string) => {
    if (!content) return null;

    // 1. Qatorlarni normallashtirish va xatoliklarni to'g'irlash
    let sanitized = content
      .replace(/\r\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/блокнанн[ыоеа-я]*/gi, 'заблокированные')
      .replace(/блокн[а-я]*/gi, 'заблокированные')
      .replace(/^[ \t]*\|\|[ \t]*/gm, '| ')
      .replace(/[ \t]+\|[ \t]+\|[ \t]+/g, ' | ')
      .replace(/\|\s*narxi\s*\|/gi, '| Izoh |')
      .replace(/\|\s*qisqacha tavsif\s*\|/gi, '| Holati |');

    // 2. Bir qatorga yopishib qolgan markdown jadvallarini to'g'irlash (mavjud to'g'ri jadvallarni buzmasdan):
    sanitized = sanitized.replace(/(\|[^\n|]+)\s*\|\s*([-:]{3,}(?:\s*\|\s*[-:]{3,})+)\s*\|/g, '$1|\n| $2 |');
    sanitized = sanitized.replace(/(\|[-:\s|]+)\s*\|\s*(\d+\s*\|)/g, '$1\n| $2');
    sanitized = sanitized.replace(/(\|[^\n|]+)\|\s*(\d+\s*\|)/g, '$1|\n| $2');
    sanitized = sanitized.replace(/\n\s*\|{1,2}[^\n|]*$/g, '');

    const lines = sanitized.split('\n');
    const elements: React.ReactNode[] = [];

    const formatInline = (text: string): React.ReactNode => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="ai-inline-strong">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    let i = 0;
    while (i < lines.length) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        elements.push(<div key={`gap-${i}`} className="ai-line-gap" />);
        i++;
        continue;
      }

      // 1. Markdown jadvali aniqlash (| Col 1 | Col 2 | ... yoki 1 | Col 1 | ...)
      const isTableStart = line.startsWith('|') || /^(?:№|No|T\/r|\d+)\s*\|/i.test(line);
      if (isTableStart) {
        const tableLines: string[] = [];
        let cur = i;
        while (cur < lines.length) {
          let tl = lines[cur].trim();
          if (!tl) break;
          // Agar qator boshidagi | tushib qolgan bo'lsa, uni qo'shamiz
          if (!tl.startsWith('|') && (/^\d+\s*\|/.test(tl) || /^(?:№|No|T\/r)\s*\|/i.test(tl))) {
            tl = '| ' + tl;
          }
          if (!tl.startsWith('|')) break;
          if (!tl.endsWith('|')) {
            tl = tl + ' |';
          }
          tableLines.push(tl);
          cur++;
        }

        if (tableLines.length >= 2) {
          // Birinchi qator: Header ustunlar
          const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());

          // Separator qatorlarini aniqlash va o'tkazib yuborish
          let dataStartIndex = 1;
          while (dataStartIndex < tableLines.length) {
            const rowCells = tableLines[dataStartIndex].split('|').slice(1, -1).map(c => c.trim());
            const isSeparator = rowCells.length > 0 && rowCells.every(c => /^[-:\s]*$/.test(c));
            if (isSeparator) {
              dataStartIndex++;
            } else {
              break;
            }
          }

          const dataRows = tableLines.slice(dataStartIndex).map(tl =>
            tl.split('|').slice(1, -1).map(c => c.trim())
          ).filter(row => 
            row.length > 0 && 
            !row.every(cell => /^[-:\s]*$/.test(cell)) &&
            row.some(cell => cell.length > 0)
          );

          if (dataRows.length > 0) {
            i = cur;
            elements.push(
              <div key={`table-${i}`} className="ai-chat-table-wrapper">
                <table className="ai-chat-table">
                  <thead>
                    <tr>
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx} className={hIdx === 0 ? 'ai-th-num' : ''}>
                          {formatInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={cIdx === 0 ? 'ai-td-num' : ''}>
                            {formatInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }
        }
      }

      // 2. Raqamlangan bo'lim sarlavhalari (masalan: "1. Направления с минимальным количеством мероприятий:")
      const sectionMatch = line.match(/^(\d+)[\.\)]\s+(.+)$/);
      if (sectionMatch) {
        const num = sectionMatch[1];
        const title = sectionMatch[2];
        elements.push(
          <div key={`section-${i}`} className="ai-section-row">
            <span className="ai-section-pill">{num}</span>
            <div className="ai-section-title">{formatInline(title)}</div>
          </div>
        );
        i++;
        continue;
      }

      // 3. Ro'yxat bandlari (masalan: "* Tennis: 0 мероприятий." yoki "- Kurash: 1 ta")
      const bulletMatch = line.match(/^[\*\-\•]\s+(.+)$/);
      if (bulletMatch) {
        const bulletText = bulletMatch[1];
        elements.push(
          <div key={`bullet-${i}`} className="ai-bullet-row">
            <span className="ai-bullet-symbol" />
            <div className="ai-bullet-text">
              {formatInline(bulletText)}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 4. Chala uzilgan xom quvur fragmenti bo'lsa (masalan "|| a) Sport | 91 (38"), uni tashlab yuboramiz
      if (line.startsWith('|') && line.split('|').length < 3) {
        i++;
        continue;
      }
      if (/^\|{1,2}\s*[a-zA-Z0-9\(\)\'\s]+$/.test(line)) {
        i++;
        continue;
      }

      // 5. Oddiy matn paragrafi (agar adashib boshida || yoki | qolib ketgan bo'lsa, xom quvur bo'lib chiqmasin)
      const cleanLine = line.replace(/^\|{1,2}\s*/, '').replace(/\|+$/, '').trim();
      if (!cleanLine) {
        i++;
        continue;
      }

      elements.push(
        <p key={`p-${i}`} className="ai-text-paragraph">
          {formatInline(cleanLine)}
        </p>
      );
      i++;
    }

    return <div className="ai-formatted-body">{elements}</div>;
  };

  return (
    <>
      {/* 1. Ong pastki burchakdagi harakatlanuvchi robotcha tugmasi */}
      <div className="ai-robot-floating-wrap">
        <button
          className={`ai-robot-trigger-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Chatni yopish' : 'Yunusobod AI Yordamchisini ochish'}
          aria-expanded={isOpen}
        >
          {/* Animatsiyali Robotcha SVG */}
          <div className="ai-robot-avatar">
            <svg viewBox="0 0 72 72" className="ai-robot-svg" fill="none">
              {/* Antenna */}
              <circle cx="36" cy="7" r="4.5" fill="#00e5ff" className="ai-antenna-orb" />
              <line x1="36" y1="11" x2="36" y2="19" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
              
              {/* Quloqlar / Eshitgichlar */}
              <rect x="7" y="27" width="6" height="15" rx="3" fill="#2563eb" />
              <rect x="59" y="27" width="6" height="15" rx="3" fill="#2563eb" />
              
              {/* Bosh korpusi */}
              <rect x="11" y="17" width="50" height="36" rx="14" fill="url(#botGrad)" stroke="#3b82f6" strokeWidth="2" />
              
              {/* Yuz ekrani (Visor) */}
              <rect x="18" y="24" width="36" height="22" rx="9" fill="#05142e" stroke="#1d4ed8" strokeWidth="1.5" />
              
              {/* Ko'zlar - ifodali va miltillovchi */}
              <ellipse cx="27" cy="35" rx="4.5" ry="5.5" fill="#00e5ff" className="ai-eye" />
              <ellipse cx="45" cy="35" rx="4.5" ry="5.5" fill="#00e5ff" className="ai-eye" />
              
              {/* Ko'z porlashi */}
              <circle cx="28.5" cy="33" r="1.5" fill="#ffffff" />
              <circle cx="46.5" cy="33" r="1.5" fill="#ffffff" />
              
              {/* Tabassum / Og'iz */}
              <path d="M 31 41 Q 36 44 41 41" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              
              {/* Bo'yin va yelkalar */}
              <rect x="30" y="53" width="12" height="4" rx="2" fill="#3b82f6" />
              <path d="M 18 69 C 18 59, 54 59, 54 69" fill="url(#botGrad)" stroke="#3b82f6" strokeWidth="2" />
              
              {/* Gradients */}
              <defs>
                <linearGradient id="botGrad" x1="12" y1="18" x2="60" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1e40af" />
                  <stop offset="0.5" stopColor="#1d4ed8" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ai-robot-shadow" />
          </div>
        </button>
      </div>

      {/* 2. AI Suhbat Oynasi (Modal / Popover) */}
      {isOpen && (
        <div
          className={`ai-chat-window animate-slide-up ${isExpanded ? 'expanded' : ''}`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-header-robot-mini">
                <span className="ai-status-indicator" />
                <svg viewBox="0 0 36 36" width="22" height="22" fill="none">
                  <rect x="5" y="8" width="26" height="20" rx="8" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
                  <rect x="9" y="12" width="18" height="12" rx="5" fill="#05142e" />
                  <circle cx="14" cy="18" r="2.5" fill="#00e5ff" />
                  <circle cx="22" cy="18" r="2.5" fill="#00e5ff" />
                  <circle cx="18" cy="4" r="2.5" fill="#00e5ff" />
                  <line x1="18" y1="6" x2="18" y2="8" stroke="#60a5fa" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <h3 className="ai-chat-title">Yunusobod AI Assistent</h3>
              </div>
            </div>

            <div className="ai-chat-header-actions">
              {/* Tozalash tugmasi */}
              <button
                className="ai-icon-btn"
                onClick={clearChat}
                title="Suhbat tarixini tozalash"
                aria-label="Tozalash"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              </button>

              {/* X ning oldidagi to'rtburchakcha (Ekranni kattalashtirish / kichraytirish) */}
              <button
                className={`ai-icon-btn ${isExpanded ? 'active' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Kichraytirish' : 'Kattalashtirish (To‘liq ekran)'}
                aria-label={isExpanded ? 'Kichraytirish' : 'Kattalashtirish'}
              >
                {isExpanded ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="8" width="12" height="12" rx="2" />
                    <path d="M8 4h10a2 2 0 012 2v10" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2.5" />
                  </svg>
                )}
              </button>

              {/* Yopish (X) */}
              <button
                className="ai-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Yopish"
                aria-label="Yopish"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="ai-chat-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.role === 'user' ? 'ai-user' : 'ai-assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="ai-msg-avatar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="5" fill="#2563eb" />
                      <circle cx="8" cy="12" r="2" fill="#00e5ff" />
                      <circle cx="16" cy="12" r="2" fill="#00e5ff" />
                      <circle cx="12" cy="2" r="1.5" fill="#00e5ff" />
                      <line x1="12" y1="3" x2="12" y2="5" stroke="#93c5fd" strokeWidth="1.2" />
                    </svg>
                  </div>
                )}

                <div className="ai-msg-body">
                  <div className="ai-msg-bubble">
                    {renderFormattedMessage(msg.content)}

                    {/* Action download box if report was requested */}
                    {msg.action && (
                      <div className="ai-action-card">
                        <div className="ai-action-info">
                          <div className="ai-file-badges-row">
                            {(msg.action.includes('EXCEL') || msg.action.includes('BOTH')) && (
                              <div className="ai-excel-badge" title="Excel (.xls)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#107c41" />
                                  <path d="M14 2v6h6" fill="#198754" />
                                  <text x="6.5" y="17" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">XLS</text>
                                </svg>
                              </div>
                            )}
                            {(msg.action.includes('WORD') || msg.action.includes('BOTH')) && (
                              <div className="ai-word-badge" title="Word (.doc)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#1e40af" />
                                  <path d="M14 2v6h6" fill="#3b82f6" />
                                  <text x="5.5" y="17" fill="#fff" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">DOC</text>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="ai-action-title">
                              {msg.action.includes('MAHALLAS') && (
                                msg.lang === 'ru' ? 'Отчёт по махаллям района' :
                                msg.lang === 'en' ? 'Mahallas State Report' :
                                'Mahallalar bo‘yicha hisobot'
                              )}
                              {msg.action.includes('EVENTS') && (
                                msg.lang === 'ru' ? 'Отчёт по мероприятиям' :
                                msg.lang === 'en' ? 'Events State Report' :
                                'Tadbirlar hisoboti'
                              )}
                              {msg.action.includes('USERS') && (
                                msg.lang === 'ru' ? 'Список молодёжи района' :
                                msg.lang === 'en' ? 'Youth Registry Report' :
                                'Yoshlar ro‘yxati hisoboti'
                              )}
                            </div>
                            <div className="ai-action-sub">
                              {msg.action.includes('BOTH')
                                ? (msg.lang === 'ru' ? 'Файлы Word (.doc) и Excel (.xls) по госстандарту готовы' :
                                   msg.lang === 'en' ? 'Word (.doc) and Excel (.xls) state reports ready' :
                                   'Word (.doc) va Excel (.xls) davlat standarti formatlari tayyor')
                                : msg.action.includes('WORD')
                                ? (msg.lang === 'ru' ? 'Официальный документ Word (.doc) по ГОСТ готов' :
                                   msg.lang === 'en' ? 'Official Word (.doc) document ready' :
                                   'Word (.doc) davlat standarti hujjati tayyor')
                                : (msg.lang === 'ru' ? 'Таблица Excel (.xls) по госстандарту готова' :
                                   msg.lang === 'en' ? 'State Excel (.xls) table ready' :
                                   'Excel (.xls) davlat standarti jadvali tayyor')}
                            </div>
                          </div>
                        </div>

                        <div className="ai-action-btns-wrap">
                          {(msg.action.includes('WORD') || msg.action.includes('BOTH')) && (
                            <button
                              className="ai-action-btn word"
                              onClick={() => {
                                const l = msg.lang || 'uz';
                                if (msg.action?.includes('MAHALLAS')) exportMahallasToWord(l);
                                else if (msg.action?.includes('EVENTS')) exportEventsToWord(l);
                                else exportUsersToWord(l);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                              <span>
                                {msg.lang === 'ru' ? 'Скачать Word (.doc)' :
                                 msg.lang === 'en' ? 'Download Word (.doc)' :
                                 'Word (.doc) yuklab olish'}
                              </span>
                            </button>
                          )}

                          {(msg.action.includes('EXCEL') || msg.action.includes('BOTH')) && (
                            <button
                              className="ai-action-btn excel"
                              onClick={() => {
                                const l = msg.lang || 'uz';
                                if (msg.action?.includes('MAHALLAS')) exportMahallasToExcel(l);
                                else if (msg.action?.includes('EVENTS')) exportEventsToExcel(undefined, l);
                                else exportUsersToExcel(undefined, l);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                              <span>
                                {msg.lang === 'ru' ? 'Скачать Excel (.xls)' :
                                 msg.lang === 'en' ? 'Download Excel (.xls)' :
                                 'Excel (.xls) yuklab olish'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Footer: Vaqt hamda Nusxa olish (AI va Foydalanuvchi uchun), Like, Dislike tugmalari */}
                  <div className={`ai-msg-footer ${msg.role === 'user' ? 'ai-user-footer' : ''}`}>
                    <span className="ai-msg-time">{msg.timestamp}</span>

                    <div className="ai-msg-actions">
                      {/* Nusxa olish (Copy) - ham foydalanuvchi savoli, ham AI javobi uchun */}
                      <button
                        className="ai-msg-act-btn"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        title={msg.lang === 'ru' ? 'Скопировать' : msg.lang === 'en' ? 'Copy' : 'Nusxa olish'}
                        aria-label="Nusxa olish"
                      >
                        {copiedId === msg.id ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                        {copiedId === msg.id && (
                          <span className="ai-copied-toast">
                            {msg.lang === 'ru' ? 'Скопировано!' : msg.lang === 'en' ? 'Copied!' : 'Nusxa olindi!'}
                          </span>
                        )}
                      </button>

                      {/* Foydali va Foydasiz (Like / Dislike) faqat AI yordamchi xabarlari uchun */}
                      {msg.role === 'assistant' && (
                        <>
                          <button
                            className={`ai-msg-act-btn ${reactions[msg.id] === 'up' ? 'active-up' : ''}`}
                            onClick={() => handleReaction(msg.id, 'up')}
                            title={msg.lang === 'ru' ? 'Полезный ответ' : msg.lang === 'en' ? 'Helpful' : 'Foydali javob'}
                            aria-label="Like"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={reactions[msg.id] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                          </button>

                          <button
                            className={`ai-msg-act-btn ${reactions[msg.id] === 'down' ? 'active-down' : ''}`}
                            onClick={() => handleReaction(msg.id, 'down')}
                            title={msg.lang === 'ru' ? 'Не полезный ответ' : msg.lang === 'en' ? 'Unhelpful' : 'Foydasiz javob'}
                            aria-label="Dislike"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={reactions[msg.id] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message-row ai-assistant">
                <div className="ai-msg-avatar">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="5" fill="#2563eb" />
                    <circle cx="8" cy="12" r="2" fill="#00e5ff" />
                    <circle cx="16" cy="12" r="2" fill="#00e5ff" />
                  </svg>
                </div>
                <div className="ai-msg-body">
                  <div className="ai-msg-bubble ai-typing-bubble">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <div className="ai-chat-footer">
            <div className="ai-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className="ai-chat-input"
                placeholder="Savolingizni yozing..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className="ai-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                aria-label="Yuborish"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
