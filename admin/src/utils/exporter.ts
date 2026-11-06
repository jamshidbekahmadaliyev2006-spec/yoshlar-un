import { UserItem, EventItem } from '../types';
import { MH, LOCS, TYPES, SN, TODAY } from './format';
import { apiClient } from '../api/client';
import { mahallasApi } from '../api/mahallas';
import { statsApi } from '../api/stats';

export type ExportLang = 'uz' | 'ru' | 'en';

const pad8 = (n: number | string) => String(n).padStart(8, '0');

// ==========================================================================
// 1. STATE STANDARD EXCEL EXPORTER (.xls / Госстандарт)
// Navy Blue #1F4E78 header, ГОСТ column numbers row, formatted numeric cells,
// centered IDs/dates, and official state status colors.
// ==========================================================================
export const downloadStyledExcel = (tableHtml: string, fileName: string) => {
  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Hisobot</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; }
        table { border-collapse: collapse; width: 100%; table-layout: auto; }
        
        /* Davlat standarti asosiy sarlavhasi (Deep State Navy Blue #1F4E78) */
        th.gov-th {
          background-color: #1f4e78;
          color: #ffffff;
          font-weight: bold;
          font-size: 10pt;
          border: 1px solid #143552;
          padding: 8px 12px;
          text-align: center;
          white-space: nowrap;
        }
        
        /* ГОСТ ustun raqamlari qatori */
        th.gov-num-th {
          background-color: #d9e1f2;
          color: #1e3a8a;
          font-weight: bold;
          font-size: 8.5pt;
          border: 1px solid #b0c4de;
          padding: 4px 6px;
          text-align: center;
        }
        
        td {
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          font-size: 9.5pt;
          vertical-align: middle;
        }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        /* Hujayralar formatlash */
        .id-cell { text-align: center; font-weight: 600; color: #1f4e78; mso-number-format: "\\@"; }
        .num { text-align: right; font-weight: 600; mso-number-format: "#,##0"; }
        .center { text-align: center; }
        .left { text-align: left; }
        .bold { font-weight: bold; }
        
        /* Davlat standarti statuslari */
        .status-ok { color: #15803d; font-weight: bold; text-align: center; }
        .status-new { color: #1d4ed8; font-weight: bold; text-align: center; }
        .status-bad { color: #b91c1c; font-weight: bold; text-align: center; }
        
        /* Jami qatori */
        tr.total-row td {
          background-color: #e9eef4;
          font-weight: bold;
          border-top: 2px solid #1f4e78;
          border-bottom: 2px solid #1f4e78;
        }
      </style>
    </head>
    <body>
      ${tableHtml}
    </body>
    </html>
  `.trim();

  const blob = new Blob(['\uFEFF' + excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ? fileName : `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// ==========================================================================
// 2. STATE STANDARD WORD EXPORTER (.doc / ГОСТ 7.0.97 / Davlat standarti)
// Times New Roman, rasmiy blank, A4 polya (30-15-20-20 mm), ГОСТ ustun raqamlari,
// 1.25 sm abzas, imzo va muhr rekvizitlari, ijrochi belgisi.
// ==========================================================================
export const downloadDoc = (htmlBody: string, fileName: string) => {
  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${fileName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: 595.3pt 841.9pt; /* A4 format */
          margin: 56.7pt 42.5pt 56.7pt 85.0pt; /* Yuqori 20mm, O'ng 15mm, Pastki 20mm, Chap 30mm (ГОСТ 7.0.97-2016) */
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.WordSection1 { page: WordSection1; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          color: #000000;
          line-height: 1.25;
        }
        
        /* Davlat organi rasmiy gerbli blankasi */
        .gov-emblem-row {
          text-align: center;
          font-size: 14pt;
          color: #1f4e78;
          letter-spacing: 4px;
          margin-bottom: 4px;
        }
        .gov-header {
          text-align: center;
          font-weight: bold;
          font-size: 11.5pt;
          text-transform: uppercase;
          line-height: 1.35;
          margin-bottom: 4px;
          color: #000000;
        }
        .gov-sub {
          text-align: center;
          font-size: 8.5pt;
          color: #333333;
          margin-bottom: 8px;
        }
        .gov-line {
          border: none;
          border-top: 2.25pt solid #000000;
          border-bottom: 0.75pt solid #000000;
          height: 3px;
          margin: 6px 0 14px 0;
        }
        
        .doc-meta-row {
          width: 100%;
          border: none;
          font-size: 11pt;
          margin-bottom: 14px;
        }
        .doc-meta-row td { border: none; padding: 2px 0; }
        
        .doc-title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 16px 0 6px 0;
          letter-spacing: 0.5px;
        }
        .doc-subtitle {
          text-align: center;
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 14px;
          line-height: 1.3;
        }
        
        .intro-p {
          text-align: justify;
          text-indent: 1.25cm; /* ГОСТ standart abzas chekinishi */
          margin-bottom: 10px;
          font-size: 12pt;
          line-height: 1.25;
        }
        
        /* ГОСТ standart jadval stili */
        table.gost-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0 20px 0;
          font-size: 10pt;
        }
        table.gost-table th.header-th {
          background-color: #f1f5f9;
          color: #000000;
          border: 1pt solid #000000;
          padding: 6pt 5pt;
          text-align: center;
          font-weight: bold;
        }
        table.gost-table tr.col-num-row th {
          background-color: #ffffff;
          color: #444444;
          font-size: 8.5pt;
          font-weight: normal;
          border: 1pt solid #000000;
          padding: 2.5pt 4pt;
          text-align: center;
        }
        table.gost-table td {
          border: 1pt solid #000000;
          padding: 5pt 5pt;
          vertical-align: middle;
        }
        
        /* Imzo va muhr rekvizitlari */
        .signature-table {
          width: 100%;
          border: none;
          margin-top: 36px;
          font-size: 12pt;
        }
        .signature-table td { border: none; padding: 4px 0; vertical-align: top; }
        
        .seal-box {
          width: 70px;
          height: 70px;
          border: 1.5px dashed #555555;
          border-radius: 50%;
          text-align: center;
          line-height: 70px;
          font-size: 8.5pt;
          font-weight: bold;
          color: #444444;
          margin-top: 6px;
        }
        
        .executor-note {
          font-size: 9pt;
          color: #444444;
          margin-top: 24px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        ${htmlBody}
      </div>
    </body>
    </html>
  `.trim();

  const blob = new Blob(['\uFEFF' + docHtml], { type: 'application/msword;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith('.doc') || fileName.endsWith('.docx') ? fileName : `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// ==========================================================================
// 3. MAHALLAS EXPORT (STARTING FROM MOST ACTIVE - EXCEL & WORD)
// ==========================================================================

export const exportMahallasToExcel = (
  lang: ExportLang = 'uz',
  fileName?: string
) => {
  const stats = mahallasApi.getStats('r'); // Eng faoldan boshlab tartiblangan
  const actualFileName = fileName || (
    lang === 'ru' ? 'yunusabad_otchet_mahalli_gosstandart.xls' :
    lang === 'en' ? 'yunusabad_mahallas_state_report.xls' :
    'yunusobod_mahallalar_davlat_standarti.xls'
  );

  const totalEvents = stats.reduce((acc, m) => acc + m.k, 0);
  const totalYouth = stats.reduce((acc, m) => acc + m.r, 0);

  const rows = stats.map((m, idx) => `
    <tr>
      <td class="id-cell">100${pad8(idx + 1).slice(3)}</td>
      <td class="center">${idx + 1}</td>
      <td class="bold">${lang === 'ru' ? `Махалля «${m.n}»` : lang === 'en' ? `Mahalla "${m.n}"` : `${m.n} mahallasi`}</td>
      <td class="center bold">${m.k}</td>
      <td class="num">${m.r.toLocaleString('ru-RU')}</td>
      <td class="num">${m.avg}</td>
      <td class="status-ok">${lang === 'ru' ? 'Активный' : lang === 'en' ? 'Active' : 'Faol'}</td>
    </tr>
  `).join('');

  const headers = lang === 'ru' ? [
    'ID', '№', 'Наименование схода граждан махалли', 'Количество мероприятий', 'Охват молодёжи (чел.)', 'Средний охват', 'Статус'
  ] : lang === 'en' ? [
    'ID', '№', 'Mahalla Citizens Assembly', 'Conducted Events', 'Youth Registered (pers.)', 'Average Coverage', 'Status'
  ] : [
    'ID', '№', 'Mahalla fuqarolar yig‘ini nomi', 'O‘tkazilgan tadbirlar soni', 'Qatnashgan yoshlar (nafar)', 'O‘rtacha qamrov', 'Holati'
  ];

  const colNums = headers.map((_, i) => `<th class="gov-num-th">${i + 1}</th>`).join('');

  const totalLabel = lang === 'ru' ? 'ИТОГО:' : lang === 'en' ? 'TOTAL:' : 'JAMI:';

  const tableHtml = `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th class="gov-th">${h}</th>`).join('')}
        </tr>
        <tr>
          ${colNums}
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="3" class="bold" style="text-align: right; padding-right: 16px;">${totalLabel}</td>
          <td class="center bold">${totalEvents}</td>
          <td class="num bold">${totalYouth.toLocaleString('ru-RU')}</td>
          <td class="num bold">${(totalYouth / (totalEvents || 1)).toFixed(1)}</td>
          <td class="center bold">—</td>
        </tr>
      </tbody>
    </table>
  `;

  downloadStyledExcel(tableHtml, actualFileName);
  return { success: true, count: stats.length, fileName: actualFileName };
};

export const exportMahallasToWord = (
  lang: ExportLang = 'uz',
  fileName?: string
) => {
  const stats = mahallasApi.getStats('r'); // Eng faoldan boshlab tartiblangan
  const overview = statsApi.getOverview(TODAY);
  const actualFileName = fileName || (
    lang === 'ru' ? 'yunusabad_otchet_mahalli_gost.doc' :
    lang === 'en' ? 'yunusabad_mahallas_report_official.doc' :
    'yunusobod_mahallalar_hisoboti_gost.doc'
  );

  const tableRows = stats.map((m, idx) => `
    <tr>
      <td style="text-align: center; width: 35px;">${idx + 1}</td>
      <td style="font-weight: bold;">${lang === 'ru' ? `«${m.n}» махалласи` : `${m.n} mahallasi`}</td>
      <td style="text-align: center; width: 85px;">${m.k}</td>
      <td style="text-align: right; width: 110px; font-weight: bold;">${m.r.toLocaleString('ru-RU')}</td>
      <td style="text-align: right; width: 90px;">${m.avg}</td>
      <td style="text-align: center; width: 75px; color: #15803d; font-weight: bold;">${lang === 'ru' ? 'Активный' : lang === 'en' ? 'Active' : 'Faol'}</td>
    </tr>
  `).join('');

  if (lang === 'ru') {
    const body = `
      <div class="gov-emblem-row">★ ★ ★</div>
      <div class="gov-header">
        РЕСПУБЛИКА УЗБЕКИСТАН<br/>
        АГЕНТСТВО ПО ДЕЛАМ МОЛОДЁЖИ<br/>
        ОТДЕЛ ЮНУСАБАДСКОГО РАЙОНА ГОРОДА ТАШКЕНТА
      </div>
      <div class="gov-sub">
        100093, г. Ташкент, Юнусабадский район • Тел: +998 (71) 200-00-00 • Эл. почта: yunusobod@yoshlar.uz
      </div>
      <div class="gov-line"></div>

      <table class="doc-meta-row">
        <tr>
          <td style="width: 50%;">«03» ноября 2026 г.</td>
          <td style="text-align: right; width: 50%;">№ АДМ-ЮН-2026/104</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 10pt; color: #333333;">г. Ташкент</td>
        </tr>
      </table>

      <div class="doc-title">СПРАВКА-ОТЧЁТ</div>
      <div class="doc-subtitle">О мониторинге активности молодёжи и проведённых мероприятиях в разрезе сходов граждан махаллей Юнусабадского района</div>

      <p class="intro-p">
        В соответствии с государственными программами по реализации государственной молодёжной политики, обеспечению содержательного досуга и трудовой занятости молодёжи в Юнусабадском районе города Ташкента на единой платформе «Yunusobod — Birga» зарегистрировано <strong>${overview.totalUsers.toLocaleString('ru-RU')} человек</strong>. Доля активных участников составляет <strong>${overview.activePct}%</strong> (${overview.activeParticipants.toLocaleString('ru-RU')} человек).
      </p>

      <p class="intro-p">
        В таблице ниже представлен детальный рейтинг всех сходов граждан махаллей района по количеству проведённых мероприятий и числу вовлечённой молодёжи, <strong>начиная с наиболее активных махаллей</strong>:
      </p>

      <table class="gost-table">
        <thead>
          <tr>
            <th class="header-th" style="width: 35px;">№</th>
            <th class="header-th">Наименование махалли</th>
            <th class="header-th" style="width: 85px;">Количество мероприятий</th>
            <th class="header-th" style="width: 110px;">Охват молодёжи (чел.)</th>
            <th class="header-th" style="width: 90px;">Средний охват</th>
            <th class="header-th" style="width: 75px;">Статус</th>
          </tr>
          <tr class="col-num-row">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 55%; font-weight: bold;">
            Начальник отдела по делам молодёжи<br/>Юнусабадского района
          </td>
          <td style="width: 20%; text-align: center; vertical-align: bottom;">
            ____________<br/>
            <span style="font-size: 8pt; font-weight: normal;">(подпись)</span>
          </td>
          <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
            А. К. Каримов
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="seal-box">М.П.</div>
          </td>
        </tr>
      </table>

      <div class="executor-note">
        Исполнитель: И. Рахимов<br/>
        Телефон для справок: +998 (71) 200-00-00
      </div>
    `;
    downloadDoc(body, actualFileName);
    return { success: true, count: stats.length, fileName: actualFileName };
  }

  if (lang === 'en') {
    const body = `
      <div class="gov-emblem-row">★ ★ ★</div>
      <div class="gov-header">
        REPUBLIC OF UZBEKISTAN<br/>
        YOUTH AFFAIRS AGENCY<br/>
        TASHKENT CITY YUNUSOBOD DISTRICT DEPARTMENT
      </div>
      <div class="gov-sub">
        100093, Tashkent city, Yunusobod district • Tel: +998 (71) 200-00-00 • E-mail: yunusobod@yoshlar.uz
      </div>
      <div class="gov-line"></div>

      <table class="doc-meta-row">
        <tr>
          <td style="width: 50%;">November 03, 2026</td>
          <td style="text-align: right; width: 50%;">Ref: ADM-YUN-2026/104-EN</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 10pt; color: #333333;">Tashkent city</td>
        </tr>
      </table>

      <div class="doc-title">OFFICIAL REPORT</div>
      <div class="doc-subtitle">On youth engagement monitoring and completed events across Mahallas of Yunusobod District</div>

      <p class="intro-p">
        In accordance with state programs on youth policy, leisure management, and employment in Yunusobod district of Tashkent city, a total of <strong>${overview.totalUsers.toLocaleString('ru-RU')} young citizens</strong> are registered on the unified «Yunusobod — Birga» digital platform. The active youth ratio stands at <strong>${overview.activePct}%</strong> (${overview.activeParticipants.toLocaleString('ru-RU')} participants).
      </p>

      <p class="intro-p">
        The table below provides a ranked performance breakdown of all neighborhood assemblies (mahallas) sorted <strong>starting from the most active mahallas</strong>:
      </p>

      <table class="gost-table">
        <thead>
          <tr>
            <th class="header-th" style="width: 35px;">No</th>
            <th class="header-th">Mahalla Name</th>
            <th class="header-th" style="width: 85px;">Events Count</th>
            <th class="header-th" style="width: 110px;">Youth Reached</th>
            <th class="header-th" style="width: 90px;">Average Coverage</th>
            <th class="header-th" style="width: 75px;">Status</th>
          </tr>
          <tr class="col-num-row">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 55%; font-weight: bold;">
            Head of Yunusobod District<br/>Youth Affairs Department
          </td>
          <td style="width: 20%; text-align: center; vertical-align: bottom;">
            ____________<br/>
            <span style="font-size: 8pt; font-weight: normal;">(signature)</span>
          </td>
          <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
            A. K. Karimov
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="seal-box">SEAL</div>
          </td>
        </tr>
      </table>

      <div class="executor-note">
        Executor: I. Rakhimov<br/>
        Inquiry phone: +998 (71) 200-00-00
      </div>
    `;
    downloadDoc(body, actualFileName);
    return { success: true, count: stats.length, fileName: actualFileName };
  }

  // Default Uzbek ГОСТ / Davlat standarti
  const body = `
    <div class="gov-emblem-row">★ ★ ★</div>
    <div class="gov-header">
      O‘ZBEKISTON RESPUBLIKASI YOSHLAR ISHLARI AGENTLIGI<br/>
      TOSHKENT SHAHAR YUNUSOBOD TUMANI BO‘LIMI
    </div>
    <div class="gov-sub">
      100093, Toshkent sh., Yunusobod tumani • Tel: +998 71 200-00-00 • E-mail: yunusobod@yoshlar.uz
    </div>
    <div class="gov-line"></div>

    <table class="doc-meta-row">
      <tr>
        <td style="width: 50%;">2026-yil "${TODAY.slice(8)}" ${TODAY.slice(5, 7)}-oy</td>
        <td style="text-align: right; width: 50%;">№ YIA-YUN-${TODAY.slice(0, 4)}/104</td>
      </tr>
      <tr>
        <td colspan="2" style="font-size: 10pt; color: #333333;">Toshkent shahri</td>
      </tr>
    </table>

    <div class="doc-title">MA’LUMOTNOMA-HISOBOT</div>
    <div class="doc-subtitle">Yunusobod tumani mahallalari kesimida yoshlar faolligi va tadbirlar monitoringi to‘g‘risida</div>

    <p class="intro-p">
      O‘zbekiston Respublikasida yoshlarga oid davlat siyosatini amalga oshirish, yoshlar bandligini ta’minlash hamda ularning bo‘sh vaqtlarini mazmunli tashkil etish doirasida Yunusobod tumanidagi 64 ta mahallada jami <strong>${overview.totalUsers.toLocaleString('ru-RU')} nafar</strong> yoshlar «Yunusobod — Birga» platformasida qamrab olingan. Ulardan <strong>${overview.activePct}%</strong> qismi (${overview.activeParticipants.toLocaleString('ru-RU')} nafar) faol ishtirokchi hisoblanadi.
    </p>

    <p class="intro-p">
      Quyidagi davlat standarti jadvalida Yunusobod tumani mahallalari o‘tkazilgan tadbirlar va ro‘yxatdan o‘tgan yoshlar soni bo‘yicha <strong>eng faol mahalladan boshlab</strong> tartiblangan holda keltirilmoqda:
    </p>

    <table class="gost-table">
      <thead>
        <tr>
          <th class="header-th" style="width: 35px;">№</th>
          <th class="header-th">Mahalla fuqarolar yig‘ini</th>
          <th class="header-th" style="width: 85px;">Tadbirlar soni</th>
          <th class="header-th" style="width: 110px;">Qatnashgan yoshlar (nafar)</th>
          <th class="header-th" style="width: 90px;">O‘rtacha qamrov</th>
          <th class="header-th" style="width: 75px;">Holati</th>
        </tr>
        <tr class="col-num-row">
          <th>1</th>
          <th>2</th>
          <th>3</th>
          <th>4</th>
          <th>5</th>
          <th>6</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <table class="signature-table">
      <tr>
        <td style="width: 55%; font-weight: bold;">
          Yunusobod tumani Yoshlar ishlari<br/>bo‘limi boshlig‘i
        </td>
        <td style="width: 20%; text-align: center; vertical-align: bottom;">
          __________<br/>
          <span style="font-size: 8pt; font-weight: normal;">(imzo)</span>
        </td>
        <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
          A. K. Karimov
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <div class="seal-box">M.O‘.</div>
        </td>
      </tr>
    </table>

    <div class="executor-note">
      Ijrochi: I. Rahimov<br/>
      Ma’lumot uchun telefon: +998 (71) 200-00-00
    </div>
  `;

  downloadDoc(body, actualFileName);
  return { success: true, count: stats.length, fileName: actualFileName };
};

// ==========================================================================
// 4. EVENTS EXPORT (EXCEL & WORD GOSSTANDART)
// ==========================================================================

export const exportEventsToExcel = (
  eventList?: EventItem[],
  lang: ExportLang = 'uz',
  fileName?: string
) => {
  const events = eventList && eventList.length > 0 ? eventList : apiClient.getEvents();
  const actualFileName = fileName || (
    lang === 'ru' ? 'yunusabad_tadbirlar_gosstandart.xls' :
    lang === 'en' ? 'yunusabad_events_state_report.xls' :
    'yunusobod_tadbirlar_davlat_standarti.xls'
  );

  const rows = events.map((e, idx) => `
    <tr>
      <td class="id-cell">200${pad8(idx + 1).slice(3)}</td>
      <td class="center">${idx + 1}</td>
      <td class="center">${e.date} ${e.time}</td>
      <td class="bold">${e.title}</td>
      <td>${TYPES[e.t] || 'Boshqa'}</td>
      <td>${LOCS[e.loc]?.n || MH[e.loc] || 'Yunusobod'}</td>
      <td class="center">${e.ages || '14-30 yosh'}</td>
      <td class="num">${(e.going || 0).toLocaleString('ru-RU')}</td>
      <td class="status-ok">${lang === 'ru' ? 'Завершено' : lang === 'en' ? 'Completed' : 'O‘tkazildi'}</td>
    </tr>
  `).join('');

  const headers = lang === 'ru' ? [
    'ID', '№', 'Дата и время', 'Наименование мероприятия', 'Направление / Тип', 'Место проведения / Махалля', 'Возрастная категория', 'Количество участников', 'Статус'
  ] : lang === 'en' ? [
    'ID', '№', 'Date & Time', 'Event Title', 'Category / Type', 'Location / Mahalla', 'Age Group', 'Participants (pers.)', 'Status'
  ] : [
    'ID', '№', 'Sana va vaqt', 'Tadbir nomi', 'Tadbir yo‘nalishi', 'O‘tkazilish joyi / Mahalla', 'Yosh toifasi', 'Qatnashuvchilar (nafar)', 'Holati'
  ];

  const colNums = headers.map((_, i) => `<th class="gov-num-th">${i + 1}</th>`).join('');

  const tableHtml = `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th class="gov-th">${h}</th>`).join('')}
        </tr>
        <tr>
          ${colNums}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  downloadStyledExcel(tableHtml, actualFileName);
  return { success: true, count: events.length, fileName: actualFileName };
};

export const exportEventsToWord = (
  lang: ExportLang = 'uz',
  fileName?: string
) => {
  const events = apiClient.getEvents();
  const overview = statsApi.getOverview(TODAY);
  const actualFileName = fileName || (
    lang === 'ru' ? 'yunusabad_otchet_meropriyatiya_gost.doc' :
    lang === 'en' ? 'yunusabad_events_report_official.doc' :
    'yunusobod_tadbirlar_hisoboti_gost.doc'
  );

  const tableRows = events.slice(0, 60).map((e, idx) => `
    <tr>
      <td style="text-align: center; width: 35px;">${idx + 1}</td>
      <td style="text-align: center; width: 110px;">${e.date} ${e.time}</td>
      <td style="font-weight: bold;">${e.title}</td>
      <td style="width: 95px;">${TYPES[e.t] || 'Boshqa'}</td>
      <td>${LOCS[e.loc]?.n || MH[e.loc] || 'Yunusobod'}</td>
      <td style="text-align: right; width: 85px; font-weight: bold;">${(e.going || 0).toLocaleString('ru-RU')}</td>
      <td style="text-align: center; width: 75px; color: #15803d; font-weight: bold;">${lang === 'ru' ? 'Завершено' : 'O‘tkazildi'}</td>
    </tr>
  `).join('');

  if (lang === 'ru') {
    const body = `
      <div class="gov-emblem-row">★ ★ ★</div>
      <div class="gov-header">
        РЕСПУБЛИКА УЗБЕКИСТАН<br/>
        АГЕНТСТВО ПО ДЕЛАМ МОЛОДЁЖИ<br/>
        ОТДЕЛ ЮНУСАБАДСКОГО РАЙОНА ГОРОДА ТАШКЕНТА
      </div>
      <div class="gov-sub">
        100093, г. Ташкент, Юнусабадский район • Тел: +998 (71) 200-00-00 • Эл. почта: yunusobod@yoshlar.uz
      </div>
      <div class="gov-line"></div>

      <table class="doc-meta-row">
        <tr>
          <td style="width: 50%;">«03» ноября 2026 г.</td>
          <td style="text-align: right; width: 50%;">№ АДМ-ЮН-2026/105</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 10pt; color: #333333;">г. Ташкент</td>
        </tr>
      </table>

      <div class="doc-title">ОТЧЁТ О МЕРОПРИЯТИЯХ</div>
      <div class="doc-subtitle">О проведённых социально-значимых, спортивных и образовательных мероприятиях для молодёжи Юнусабадского района</div>

      <p class="intro-p">
        В рамках реализации комплексных мер по всесторонней поддержке молодёжи в Юнусабадском районе за отчётный период организовано и проведено <strong>${overview.totalEvents} мероприятий</strong>. Ниже приводится официальный реестр проведённых мероприятий:
      </p>

      <table class="gost-table">
        <thead>
          <tr>
            <th class="header-th" style="width: 35px;">№</th>
            <th class="header-th" style="width: 110px;">Дата и время</th>
            <th class="header-th">Название мероприятия</th>
            <th class="header-th" style="width: 95px;">Направление</th>
            <th class="header-th">Место проведения / Махалля</th>
            <th class="header-th" style="width: 85px;">Участники</th>
            <th class="header-th" style="width: 75px;">Статус</th>
          </tr>
          <tr class="col-num-row">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 55%; font-weight: bold;">
            Начальник отдела по делам молодёжи<br/>Юнусабадского района
          </td>
          <td style="width: 20%; text-align: center; vertical-align: bottom;">
            ____________<br/>
            <span style="font-size: 8pt; font-weight: normal;">(подпись)</span>
          </td>
          <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
            А. К. Каримов
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="seal-box">М.П.</div>
          </td>
        </tr>
      </table>

      <div class="executor-note">
        Исполнитель: И. Рахимов<br/>
        Телефон для справок: +998 (71) 200-00-00
      </div>
    `;
    downloadDoc(body, actualFileName);
    return { success: true, count: events.length, fileName: actualFileName };
  }

  if (lang === 'en') {
    const body = `
      <div class="gov-emblem-row">★ ★ ★</div>
      <div class="gov-header">
        REPUBLIC OF UZBEKISTAN<br/>
        YOUTH AFFAIRS AGENCY<br/>
        TASHKENT CITY YUNUSOBOD DISTRICT DEPARTMENT
      </div>
      <div class="gov-sub">
        100093, Tashkent city, Yunusobod district • Tel: +998 (71) 200-00-00 • E-mail: yunusobod@yoshlar.uz
      </div>
      <div class="gov-line"></div>

      <table class="doc-meta-row">
        <tr>
          <td style="width: 50%;">November 03, 2026</td>
          <td style="text-align: right; width: 50%;">Ref: YAA-YUN-2026/105-EN</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 10pt; color: #333333;">Tashkent city</td>
        </tr>
      </table>

      <div class="doc-title">OFFICIAL EVENTS REGISTER</div>
      <div class="doc-subtitle">On youth events organized in Yunusobod district through the «Yunusobod — Birga» platform</div>

      <p class="intro-p">
        In accordance with the action plan of the Youth Affairs Agency in Yunusobod district, this official registry provides comprehensive data on <strong>${events.length} planned and executed events</strong> across culture, sport, IT education, and employment.
      </p>

      <table class="gost-table">
        <thead>
          <tr>
            <th class="header-th" style="width: 35px;">No</th>
            <th class="header-th" style="width: 110px;">Date & Time</th>
            <th class="header-th">Event Title</th>
            <th class="header-th" style="width: 95px;">Category</th>
            <th class="header-th">Venue / Mahalla</th>
            <th class="header-th" style="width: 85px;">Attendees</th>
            <th class="header-th" style="width: 75px;">Status</th>
          </tr>
          <tr class="col-num-row">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 55%; font-weight: bold;">
            Head of Yunusobod District<br/>Youth Affairs Department
          </td>
          <td style="width: 20%; text-align: center; vertical-align: bottom;">
            ____________<br/>
            <span style="font-size: 8pt; font-weight: normal;">(signature)</span>
          </td>
          <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
            A. K. Karimov
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="seal-box">SEAL</div>
          </td>
        </tr>
      </table>

      <div class="executor-note">
        Executor: I. Rakhimov<br/>
        Inquiry phone: +998 (71) 200-00-00
      </div>
    `;
    downloadDoc(body, actualFileName);
    return { success: true, count: events.length, fileName: actualFileName };
  }

  // Default Uzbek
  const body = `
    <div class="gov-emblem-row">★ ★ ★</div>
    <div class="gov-header">
      O‘ZBEKISTON RESPUBLIKASI YOSHLAR ISHLARI AGENTLIGI<br/>
      TOSHKENT SHAHAR YUNUSOBOD TUMANI BO‘LIMI
    </div>
    <div class="gov-sub">
      100093, Toshkent sh., Yunusobod tumani • Tel: +998 71 200-00-00 • E-mail: yunusobod@yoshlar.uz
    </div>
    <div class="gov-line"></div>

    <table class="doc-meta-row">
      <tr>
        <td style="width: 50%;">2026-yil "${TODAY.slice(8)}" ${TODAY.slice(5, 7)}-oy</td>
        <td style="text-align: right; width: 50%;">№ YIA-YUN-${TODAY.slice(0, 4)}/105</td>
      </tr>
      <tr>
        <td colspan="2" style="font-size: 10pt; color: #333333;">Toshkent shahri</td>
      </tr>
    </table>

    <div class="doc-title">HISOBOT</div>
    <div class="doc-subtitle">Yunusobod tumanida o‘tkazilgan yoshlar tadbirlari va to‘garaklari bo‘yicha</div>

    <p class="intro-p">
      Yunusobod tumanida yoshlarning iqtidorini qo‘llab-quvvatlash, sport va madaniy tadbirlarni tashkil etish doirasida jami <strong>${overview.totalEvents} ta</strong> tadbir o‘tkazildi. Tadbirlar bo‘yicha batafsil ro‘yxat quyida ilova qilinmoqda:
    </p>

    <table class="gost-table">
      <thead>
        <tr>
          <th class="header-th" style="width: 35px;">№</th>
          <th class="header-th" style="width: 110px;">Sana va vaqt</th>
          <th class="header-th">Tadbir nomi</th>
          <th class="header-th" style="width: 95px;">Turi</th>
          <th class="header-th">Manzil / Mahalla</th>
          <th class="header-th" style="width: 85px;">Qatnashganlar</th>
          <th class="header-th" style="width: 75px;">Holati</th>
        </tr>
        <tr class="col-num-row">
          <th>1</th>
          <th>2</th>
          <th>3</th>
          <th>4</th>
          <th>5</th>
          <th>6</th>
          <th>7</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <table class="signature-table">
      <tr>
        <td style="width: 55%; font-weight: bold;">
          Yunusobod tumani Yoshlar ishlari<br/>bo‘limi boshlig‘i
        </td>
        <td style="width: 20%; text-align: center; vertical-align: bottom;">
          __________<br/>
          <span style="font-size: 8pt; font-weight: normal;">(imzo)</span>
        </td>
        <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
          A. K. Karimov
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <div class="seal-box">M.O‘.</div>
        </td>
      </tr>
    </table>

    <div class="executor-note">
      Ijrochi: I. Rahimov<br/>
      Ma’lumot uchun telefon: +998 (71) 200-00-00
    </div>
  `;

  downloadDoc(body, actualFileName);
  return { success: true, count: events.length, fileName: actualFileName };
};

// ==========================================================================
// 5. USERS EXPORT (EXCEL & WORD GOSSTANDART)
// ==========================================================================

export const exportUsersToExcel = (
  userList?: UserItem[],
  lang: ExportLang = 'uz',
  fileName?: string
) => {
  const users = userList && userList.length > 0 ? userList : apiClient.getUsers();
  const actualFileName = fileName || (
    lang === 'ru' ? 'yunusabad_molodyoj_spisok_gosstandart.xls' :
    lang === 'en' ? 'yunusabad_youth_registry_state_report.xls' :
    'yunusobod_foydalanuvchilar_davlat_standarti.xls'
  );

  const rows = users.map((u, idx) => `
    <tr>
      <td class="id-cell">300${pad8(idx + 1).slice(3)}</td>
      <td class="center">${idx + 1}</td>
      <td class="center">${u.d} 09:00</td>
      <td class="bold">${u.n}</td>
      <td class="center">${u.p}</td>
      <td>${u.mahalla || 'Yunusobod tumani'}</td>
      <td>${u.r || (lang === 'ru' ? 'Молодёжь' : 'Yoshlar')}</td>
      <td class="${u.s === 0 ? 'status-ok' : u.s === 1 ? 'status-new' : 'status-bad'}">
        ${lang === 'ru' ? (u.s === 0 ? 'Активный' : u.s === 1 ? 'Новый' : 'Заблокирован') : (SN[u.s] || 'Faol')}
      </td>
    </tr>
  `).join('');

  const headers = lang === 'ru' ? [
    'ID', '№', 'Дата регистрации', 'Ф.И.О. участника', 'Номер телефона', 'Прикрепленная махалля', 'Категория', 'Статус'
  ] : lang === 'en' ? [
    'ID', '№', 'Registration Date', 'Full Name', 'Phone Number', 'Assigned Mahalla', 'Category', 'Status'
  ] : [
    'ID', '№', 'Ro‘yxatdan o‘tgan sana', 'F.I.SH (Ism va familiya)', 'Telefon raqami', 'Mahalla', 'Toifasi', 'Holati'
  ];

  const colNums = headers.map((_, i) => `<th class="gov-num-th">${i + 1}</th>`).join('');

  const tableHtml = `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th class="gov-th">${h}</th>`).join('')}
        </tr>
        <tr>
          ${colNums}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  downloadStyledExcel(tableHtml, actualFileName);
  return { success: true, count: users.length, fileName: actualFileName };
};

export const exportUsersToWord = (
  lang: ExportLang = 'uz',
  fileName?: string
) => {
  const users = apiClient.getUsers();
  const overview = statsApi.getOverview(TODAY);
  const actualFileName = fileName || (
    lang === 'ru' ? 'yunusabad_spisok_molodyoji_gost.doc' :
    lang === 'en' ? 'yunusabad_youth_registry_official.doc' :
    'yunusobod_foydalanuvchilar_royxati_gost.doc'
  );

  const tableRows = users.slice(0, 50).map((u, idx) => `
    <tr>
      <td style="text-align: center; width: 35px;">${idx + 1}</td>
      <td style="font-weight: bold;">${u.n}</td>
      <td style="width: 120px; text-align: center;">${u.p}</td>
      <td>${u.mahalla || 'Yunusobod tumani'}</td>
      <td style="width: 100px;">${u.r || (lang === 'ru' ? 'Молодёжь' : 'Yoshlar')}</td>
      <td style="text-align: center; width: 85px;">${u.d}</td>
      <td style="text-align: center; width: 75px; color: ${u.s === 0 ? '#15803d' : u.s === 1 ? '#1d4ed8' : '#b91c1c'}; font-weight: bold;">
        ${lang === 'ru' ? (u.s === 0 ? 'Активный' : u.s === 1 ? 'Новый' : 'Заблокирован') : SN[u.s]}
      </td>
    </tr>
  `).join('');

  if (lang === 'ru') {
    const body = `
      <div class="gov-emblem-row">★ ★ ★</div>
      <div class="gov-header">
        РЕСПУБЛИКА УЗБЕКИСТАН<br/>
        АГЕНТСТВО ПО ДЕЛАМ МОЛОДЁЖИ<br/>
        ОТДЕЛ ЮНУСАБАДСКОГО РАЙОНА ГОРОДА ТАШКЕНТА
      </div>
      <div class="gov-sub">
        100093, г. Ташкент, Юнусабадский район • Тел: +998 (71) 200-00-00 • Эл. почта: yunusobod@yoshlar.uz
      </div>
      <div class="gov-line"></div>

      <table class="doc-meta-row">
        <tr>
          <td style="width: 50%;">«03» ноября 2026 г.</td>
          <td style="text-align: right; width: 50%;">№ АДМ-ЮН-2026/106</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 10pt; color: #333333;">г. Ташкент</td>
        </tr>
      </table>

      <div class="doc-title">СПРАВКА-РЕЕСТР</div>
      <div class="doc-subtitle">О зарегистрированных участниках платформы «Yunusobod — Birga»</div>

      <p class="intro-p">
        По состоянию на текущую дату в информационной системе «Yunusobod — Birga» зарегистрировано <strong>${overview.totalUsers.toLocaleString('ru-RU')} молодых граждан</strong>. Из них <strong>${overview.activePct}%</strong> (${overview.activeParticipants.toLocaleString('ru-RU')} человек) имеют статус активных участников.
      </p>

      <table class="gost-table">
        <thead>
          <tr>
            <th class="header-th" style="width: 35px;">№</th>
            <th class="header-th">Ф.И.О. участника</th>
            <th class="header-th" style="width: 120px;">Номер телефона</th>
            <th class="header-th">Махалля</th>
            <th class="header-th" style="width: 100px;">Категория</th>
            <th class="header-th" style="width: 85px;">Дата</th>
            <th class="header-th" style="width: 75px;">Статус</th>
          </tr>
          <tr class="col-num-row">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 55%; font-weight: bold;">
            Начальник отдела по делам молодёжи<br/>Юнусабадского района
          </td>
          <td style="width: 20%; text-align: center; vertical-align: bottom;">
            ____________<br/>
            <span style="font-size: 8pt; font-weight: normal;">(подпись)</span>
          </td>
          <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
            А. К. Каримов
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="seal-box">М.П.</div>
          </td>
        </tr>
      </table>

      <div class="executor-note">
        Исполнитель: И. Рахимов<br/>
        Телефон для справок: +998 (71) 200-00-00
      </div>
    `;
    downloadDoc(body, actualFileName);
    return { success: true, count: users.length, fileName: actualFileName };
  }

  if (lang === 'en') {
    const body = `
      <div class="gov-emblem-row">★ ★ ★</div>
      <div class="gov-header">
        REPUBLIC OF UZBEKISTAN<br/>
        YOUTH AFFAIRS AGENCY<br/>
        TASHKENT CITY YUNUSOBOD DISTRICT DEPARTMENT
      </div>
      <div class="gov-sub">
        100093, Tashkent city, Yunusobod district • Tel: +998 (71) 200-00-00 • E-mail: yunusobod@yoshlar.uz
      </div>
      <div class="gov-line"></div>

      <table class="doc-meta-row">
        <tr>
          <td style="width: 50%;">November 03, 2026</td>
          <td style="text-align: right; width: 50%;">Ref: YAA-YUN-2026/106-EN</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 10pt; color: #333333;">Tashkent city</td>
        </tr>
      </table>

      <div class="doc-title">OFFICIAL REGISTRY</div>
      <div class="doc-subtitle">On registered youth in Yunusobod district via «Yunusobod — Birga» digital platform</div>

      <p class="intro-p">
        In accordance with the State Program on Youth Policy in Yunusobod district of Tashkent city, this document certifies the demographic and registration profile of <strong>${users.length.toLocaleString('ru-RU')} registered young citizens</strong>.
      </p>

      <table class="gost-table">
        <thead>
          <tr>
            <th class="header-th" style="width: 35px;">No</th>
            <th class="header-th">Participant Full Name</th>
            <th class="header-th" style="width: 120px;">Phone Number</th>
            <th class="header-th">Mahalla</th>
            <th class="header-th" style="width: 100px;">Role / Category</th>
            <th class="header-th" style="width: 85px;">Registration Date</th>
            <th class="header-th" style="width: 75px;">Status</th>
          </tr>
          <tr class="col-num-row">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 55%; font-weight: bold;">
            Head of Yunusobod District<br/>Youth Affairs Department
          </td>
          <td style="width: 20%; text-align: center; vertical-align: bottom;">
            ____________<br/>
            <span style="font-size: 8pt; font-weight: normal;">(signature)</span>
          </td>
          <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
            A. K. Karimov
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="seal-box">SEAL</div>
          </td>
        </tr>
      </table>

      <div class="executor-note">
        Executor: I. Rakhimov<br/>
        Inquiry phone: +998 (71) 200-00-00
      </div>
    `;
    downloadDoc(body, actualFileName);
    return { success: true, count: users.length, fileName: actualFileName };
  }

  // Default Uzbek
  const body = `
    <div class="gov-emblem-row">★ ★ ★</div>
    <div class="gov-header">
      O‘ZBEKISTON RESPUBLIKASI YOSHLAR ISHLARI AGENTLIGI<br/>
      TOSHKENT SHAHAR YUNUSOBOD TUMANI BO‘LIMI
    </div>
    <div class="gov-sub">
      100093, Toshkent sh., Yunusobod tumani • Tel: +998 71 200-00-00 • E-mail: yunusobod@yoshlar.uz
    </div>
    <div class="gov-line"></div>

    <table class="doc-meta-row">
      <tr>
        <td style="width: 50%;">2026-yil "${TODAY.slice(8)}" ${TODAY.slice(5, 7)}-oy</td>
        <td style="text-align: right; width: 50%;">№ YIA-YUN-${TODAY.slice(0, 4)}/106</td>
      </tr>
      <tr>
        <td colspan="2" style="font-size: 10pt; color: #333333;">Toshkent shahri</td>
      </tr>
    </table>

    <div class="doc-title">MA’LUMOTNOMA</div>
    <div class="doc-subtitle">Yunusobod tumanida ro‘yxatdan o‘tgan yoshlar tarkibi to‘g‘risida</div>

    <p class="intro-p">
      Hozirgi kunda «Yunusobod — Birga» yoshlar platformasida jami <strong>${overview.totalUsers.toLocaleString('ru-RU')} nafar</strong> yoshlar ro‘yxatdan o‘tgan bo‘lib, ularning <strong>${overview.activePct}%</strong> qismi (${overview.activeParticipants.toLocaleString('ru-RU')} nafar) faol holatdadir.
    </p>

    <table class="gost-table">
      <thead>
        <tr>
          <th class="header-th" style="width: 35px;">№</th>
          <th class="header-th">F.I.SH (Ism va familiya)</th>
          <th class="header-th" style="width: 120px;">Telefon raqami</th>
          <th class="header-th">Mahalla</th>
          <th class="header-th" style="width: 100px;">Toifasi</th>
          <th class="header-th" style="width: 85px;">Sana</th>
          <th class="header-th" style="width: 75px;">Holati</th>
        </tr>
        <tr class="col-num-row">
          <th>1</th>
          <th>2</th>
          <th>3</th>
          <th>4</th>
          <th>5</th>
          <th>6</th>
          <th>7</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <table class="signature-table">
      <tr>
        <td style="width: 55%; font-weight: bold;">
          Yunusobod tumani Yoshlar ishlari<br/>bo‘limi boshlig‘i
        </td>
        <td style="width: 20%; text-align: center; vertical-align: bottom;">
          __________<br/>
          <span style="font-size: 8pt; font-weight: normal;">(imzo)</span>
        </td>
        <td style="width: 25%; text-align: right; font-weight: bold; vertical-align: bottom;">
          A. K. Karimov
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <div class="seal-box">M.O‘.</div>
        </td>
      </tr>
    </table>

    <div class="executor-note">
      Ijrochi: I. Rahimov<br/>
      Ma’lumot uchun telefon: +998 (71) 200-00-00
    </div>
  `;

  downloadDoc(body, actualFileName);
  return { success: true, count: users.length, fileName: actualFileName };
};
