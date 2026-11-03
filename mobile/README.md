# Yunusobod — Birga (Mobil Ilova uchun Qo'llanma)

Bu papka Yunusobod tumani yoshlari uchun mo'ljallangan mobil ilova (Flutter yoki React Native) ning backend API bilan ishlash qo'llanmasidir.

---

## 🌐 Yagona API Manzili

Barcha so'rovlar yagona backend serveriga yuboriladi:
- **Base URL**: `http://<SERVER_IP>:5000/api/v1`
- **Spetsifikatsiya**: `docs/openapi.yaml` faylida to'liq keltirilgan.

---

## 📱 Autentifikatsiya (SMS OTP oqimi)

Mobil ilovada oddiy yoshlar login va parol terib o'tirmaydi. Jarayon SMS kod orqali 2 qadamda amalga oshiriladi:

### 1-qadam: SMS kod so'rash
```http
POST /api/v1/auth/otp/send
Content-Type: application/json

{
  "phone": "+998901234567"
}
```
**Javob:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi",
  "expiresInSeconds": 300
}
```

### 2-qadam: Kodni tasdiqlash va JWT olish
```http
POST /api/v1/auth/otp/verify
Content-Type: application/json

{
  "phone": "+998901234567",
  "code": "123456"
}
```
**Javob:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "name": "Azizbek Karimov",
    "phone": "+998901234567",
    "role": "USER",
    "mahallaId": 1,
    "status": "ACTIVE"
  }
}
```
Olingan token `Flutter Secure Storage` yoki `Keychain / EncryptedSharedPreferences` ga saqlanadi va keyingi barcha so'rovlarda `Authorization: Bearer <TOKEN>` sarlavhasida yuboriladi.

---

## 🎯 Asosiy ekranlar va API mosligi

| Ekran | Kerakli API | Tavsif |
|---|---|---|
| **Asosiy (Bosh sahifa)** | `GET /api/v1/events?limit=10` | Yaqinlashib kelayotgan tadbirlar |
| **Xarita (Yunusobod joylari)** | `GET /api/v1/places` | 141 ta stadion, maktab, masjid, kutubxona nuqtalari |
| **Tadbir tafsilotlari** | `GET /api/v1/events/:id` | Tadbir ma'lumotlari, yosh chegarasi, o'rindiqlar |
| **Ro'yxatdan o'tish** | `POST /api/v1/events/:id/register` | 1-bosishda yozilish |
| **Mening tadbirlarim** | `GET /api/v1/registrations/my` | Foydalanuvchi yozilgan tadbirlar va QR biletlar |
| **Profil & Mahalla** | `GET /api/v1/auth/me` | Foydalanuvchi ma'lumotlari |

---

## 🎟 QR Davomat (Check-in) mexanizmi

1. Foydalanuvchi tadbirga ro'yxatdan o'tganda unga unikal `qrToken` beriladi.
2. Tadbir joyiga borganda mobil ilovadagi QR kod ko'rsatiladi.
3. Tadbir mas'uli (admin/murabbiy) admin panel yoki tekshiruvchi skaner orqali QR kodni o'qiydi:
   ```http
   POST /api/v1/registrations/check-in
   Content-Type: application/json

   {
     "qrToken": "qr_tok_9f82d1c7..."
   }
   ```
4. Status `ATTENDED` ga o'zgaradi va real vaqtda bosh sahifadagi davomat foizlariga qo'shiladi!

