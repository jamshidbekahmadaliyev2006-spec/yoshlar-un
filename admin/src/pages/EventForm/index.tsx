import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { MapView } from '../../components/map/MapView';
import { eventsApi } from '../../api/events';
import { TYPES, LOCS, MH, TODAY } from '../../utils/format';
import { showToast } from '../../components/ui/Toast';

interface EventFormProps {
  onNavigate: (route: string) => void;
}

export const EventFormPage: React.FC<EventFormProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('0');
  const [locIndex, setLocIndex] = useState(() => {
    const hash = window.location.hash;
    const match = hash.match(/loc=(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  });
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState('15:00');
  const [desc, setDesc] = useState('');
  const [imgData, setImgData] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, img: 'Faqat PNG yoki JPG, 5MB gacha ruxsat etiladi' }));
      return;
    }

    setErrors(prev => ({ ...prev, img: '' }));
    const reader = new FileReader();
    reader.onload = () => {
      setImgData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Tadbir nomini kiriting';
    if (locIndex < 0) newErrors.loc = 'Lokatsiyani tanlang';
    if (!date.trim()) newErrors.date = 'Sanani tanlang';
    if (!desc.trim()) newErrors.desc = 'Tavsifni kiriting';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Majburiy maydonlarni to‘ldiring');
      return;
    }

    const newEvent = eventsApi.create({
      title: title.trim(),
      t: parseInt(type, 10),
      loc: locIndex,
      date,
      time: time || '09:00',
      ages: '15–25 yosh',
      desc: desc.trim(),
      img: imgData
    });

    showToast(`Tadbir ${MH[locIndex]} mahallasiga qo‘shildi!`);
    onNavigate('mahalla');
  };

  return (
    <div>
      <div className="dg">
        {/* Chap ustun: Asosiy ma'lumotlar formasi */}
        <Card>
          <div className="fg">
            <div>
              <label className="lb" htmlFor="an">
                Tadbir nomi <span className="rq">*</span>
              </label>
              <input
                className="in"
                id="an"
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="Tadbir nomini kiriting"
              />
              {errors.title && <div className="er">{errors.title}</div>}
            </div>

            <div>
              <label className="lb" htmlFor="at">
                Tadbir turi <span className="rq">*</span>
              </label>
              <select
                className="in"
                id="at"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {TYPES.map((t, i) => (
                  <option key={t} value={i}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="lb" htmlFor="al">
                Lokatsiya <span className="rq">*</span>
              </label>
              <select
                className="in"
                id="al"
                value={locIndex}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setLocIndex(val);
                  if (errors.loc) setErrors(prev => ({ ...prev, loc: '' }));
                }}
              >
                <option value={-1}>Mahalla va lokatsiyani tanlang</option>
                {LOCS.map((l, i) => (
                  <option key={l.n} value={i}>
                    {MH[i]} mahallasi — {l.n}
                  </option>
                ))}
              </select>
              {errors.loc && <div className="er">{errors.loc}</div>}
            </div>

            <div className="g2">
              <div>
                <label className="lb" htmlFor="ad">
                  Boshlanish sanasi <span className="rq">*</span>
                </label>
                <input
                  className="in"
                  id="ad"
                  type="date"
                  value={date}
                  onChange={e => {
                    setDate(e.target.value);
                    if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                  }}
                />
                {errors.date && <div className="er">{errors.date}</div>}
              </div>

              <div>
                <label className="lb" htmlFor="av">
                  Vaqt
                </label>
                <input
                  className="in"
                  id="av"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="lb" htmlFor="ax">
                Tavsif <span className="rq">*</span>
              </label>
              <textarea
                className="in"
                id="ax"
                rows={5}
                value={desc}
                onChange={e => {
                  setDesc(e.target.value);
                  if (errors.desc) setErrors(prev => ({ ...prev, desc: '' }));
                }}
                placeholder="Tadbir haqida batafsil ma’lumot..."
              />
              {errors.desc && <div className="er">{errors.desc}</div>}
            </div>
          </div>
        </Card>

        {/* O'ng ustun: Rasm yuklash va Xaritadan tanlash */}
        <div className="fg" style={{ alignContent: 'start' }}>
          <Card>
            <div className="lb">Tadbir rasmi</div>
            <label className="up2" htmlFor="af">
              <Icon name="up" />
              <div style={{ fontWeight: 600, marginTop: '6px' }}>Rasm yuklash</div>
              <div className="sm">PNG, JPG (maks. 5MB)</div>
            </label>
            <input
              className="vh"
              id="af"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
            />
            {errors.img && <div className="er">{errors.img}</div>}
            {imgData && (
              <div className="prv">
                <img src={imgData} alt="Tanlangan rasm" />
              </div>
            )}
          </Card>

          <Card>
            <div className="lb">Lokatsiya va Mahalla (kartadan tanlang)</div>
            <MapView
              selectedPin={locIndex}
              onSelectPin={idx => {
                setLocIndex(idx);
                if (errors.loc) setErrors(prev => ({ ...prev, loc: '' }));
              }}
              showZoomControls={false}
            />
            {locIndex >= 0 && (
              <div className="sm mp" style={{ marginTop: '12px' }}>
                <b style={{ color: 'var(--tx)', fontSize: '14px' }}>{MH[locIndex]} mahallasi</b>
                <div style={{ color: 'var(--mut)', marginTop: '2px' }}>{LOCS[locIndex].n}</div>
                <div style={{ color: '#00bcd4', fontWeight: 600, fontSize: '11.5px', marginTop: '6px' }}>
                  ✓ Ushbu tadbir {MH[locIndex]} mahallasi faollik ko‘rsatkichlariga avtomatik qo‘shiladi
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Saqlash va Bekor qilish Tugmalari */}
      <div className="btr">
        <button
          type="button"
          className="bt g"
          onClick={() => onNavigate('dashboard')}
        >
          Bekor qilish
        </button>
        <button type="button" className="bt" onClick={handleSave}>
          Saqlash
        </button>
      </div>
    </div>
  );
};

