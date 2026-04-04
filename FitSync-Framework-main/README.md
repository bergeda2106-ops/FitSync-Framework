# 🏋️ FitSync — Your Fitness Community

<div align="center">

![FitSync Banner](https://img.shields.io/badge/FitSync-Fitness%20App-orange?style=for-the-badge&logo=firebase)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%20Modules-yellow?style=for-the-badge&logo=javascript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)

**Sadece spor değil, bir topluluk.**

[🚀 Özellikler](#-özellikler) • [🛠️ Kurulum](#️-kurulum) • [📁 Proje Yapısı](#-proje-yapısı) • [🤖 AI Koç](#-ai-koç) • [🔥 Gamification](#-gamification)

</div>

---

## 📱 Nedir?

FitSync, **mobil öncelikli** tasarımıyla geliştirilmiş premium bir fitness web uygulamasıdır. Antrenman takibi, gamification sistemi, sosyal paylaşım, AI destekli fitness koçu ve çok daha fazlasını tek çatı altında sunar.

---

## 🚀 Özellikler

### 💪 Antrenman Yönetimi
- **Hazır Şablonlar** — Push, Pull, Legs, Full Body, Üst/Alt Vücut şablonları
- **Özel Şablonlar** — Kendi antrenmanını şablon olarak kaydet
- **Anlık Süre Takibi** — Antrenman başlayınca timer hemen çalışır
- **Egzersiz Kaldırma** — Yanlış eklenen egzersizi çöp kutusuyla sil
- **Set & KG Takibi** — Her egzersiz için set, tekrar ve ağırlık kaydı
- **Kişisel Rekor (PR)** — Yeni PR'da confetti animasyonu

### ⏱️ Dinlenme Zamanlayıcısı
- 60 / 90 / 120 / 180 saniye seçenekleri
- Tercih kalıcı olarak saklanır
- Set tamamlanınca otomatik başlar

### 🤖 AI Koç
- **3 Farklı Kişilik:**
  - 🎖️ **Komutan** — Askeri disiplin, sert motivasyon
  - 🤙 **Kanka** — Samimi, eğlenceli, günlük dil
  - 🏋️ **Profesyonel PT** — Bilimsel, detaylı açıklamalar
- **Hızlı Sorular** — Tek tıkla hazır sorular (form, beslenme, toparlanma...)
- **Kalıcı Geçmiş** — Sohbet localStorage'da saklanır
- **Antrenman Bağlamı** — AI son 3 antrenmanını biliyor
- **Gemini API** — Flask proxy üzerinden güvenli erişim

### 📊 Dashboard
- **Aktif Antrenman Banner** — Devam eden antrenman varsa yeşil pulse banner
- **Haftalık Hedef** — 7 günlük antrenman takip halkası
- **Challenge İlerleme** — Haftalık meydan okuma gerçek zamanlı progress bar
- **Haftalık Özet Kartı** — Geçen haftanın istatistikleri
- **Sosyal Feed** — Simüle edilmiş topluluk paylaşımları

### ⚖️ Vücut Ağırlığı Takibi
- Profil sayfasında kilo giriş modalı
- SVG tabanlı çizgi grafik (son 30 gün)
- Değişim göstergesi (↑ artış / ↓ azalış)

### 🔥 Gamification
| Özellik | Detay |
|---------|-------|
| XP Sistemi | Her set +5 XP, antrenman bitişi +50-150 XP |
| Seviye | Her seviye artan XP eşiği |
| Streak | Günlük antrenman serisi, multiplier (x1.25 → x2.0) |
| Rozetler | Otomatik kazanılan başarı rozetleri |
| Lig Sistemi | Bronze → Silver → Gold → Diamond |
| Meydan Okumalar | Haftalık XP ödüllü görevler |

### 📸 GymReal
- Kameradan spor salonu check-in fotoğrafı
- Haftalık on-time GymReal sayacı

### 🌍 Dil Desteği
- 🇹🇷 Türkçe
- 🇬🇧 İngilizce
- Onboarding'de dil seçimi, uygulama içinde anlık değiştirme

---

## 🛠️ Kurulum

### Gereksinimler
- Python 3.8+
- Gemini API anahtarı

### 1. Projeyi İndir
```bash
git clone https://github.com/bergeda2106-ops/FitSync-Framework.git
cd FitSync-Framework
```

### 2. Python Bağımlılıklarını Yükle
```bash
pip install -r requirements.txt
```

`requirements.txt` içinde **python-dotenv** bulunur; sunucu başlarken proje kökündeki `.env` dosyasını okur. API anahtarını **`server.py` içine yazmayın** — anahtar yalnızca ortam değişkeni olarak (`GEMINI_API_KEY`) verilir.

### 3. Ortam Değişkenlerini Ayarla (.env)

1. Örnek dosyayı kopyalayın:
   ```bash
   # Linux / macOS
   cp .env.example .env
   ```
   ```powershell
   # Windows (PowerShell)
   copy .env.example .env
   ```
2. `.env` dosyasını düzenleyip [Google AI Studio](https://aistudio.google.com/apikey) üzerinden aldığınız **Gemini API anahtarını** `GEMINI_API_KEY=` satırına yapıştırın.
3. Üretimde frontend farklı bir origin’deyse isteğe bağlı olarak `FITSYNC_PRODUCTION_ORIGIN` değerini ekleyin (CORS için `server.py` bunu kullanır).

`.env` git ile izlenmez (`.gitignore`); paylaşım ve repoda yalnızca **`.env.example`** kalır.

### 4. Flask Proxy Sunucusunu Başlat
```bash
python server.py
```
> Sunucu `http://localhost:5000` üzerinde çalışır.

### 5. Uygulamayı Aç
```bash
python -m http.server 8080 --directory .
```
Tarayıcıda `http://localhost:8080` adresini aç.

> **Not:** AI Koç özelliği için Flask sunucusu (`server.py`) çalışıyor olmalı.

---

## 📁 Proje Yapısı

```
FitSync-Framework/
├── index.html              # Ana HTML giriş noktası
├── style.css               # Tüm stiller (CSS Variables, Glassmorphism)
├── server.py               # Flask proxy (Gemini API güvenliği)
├── .env.example            # Örnek ortam değişkenleri (kopyalanıp .env yapılır)
├── requirements.txt        # Python bağımlılıkları
│
└── src/
    ├── app.js              # Ana uygulama, routing
    ├── store.js            # State yönetimi (localStorage + Firebase)
    ├── router.js           # Hash tabanlı router
    │
    ├── api/
    │   └── ai.js           # Gemini API çağrısı + kişilik sistemi
    │
    ├── components/
    │   ├── navbar.js       # Alt navigasyon
    │   ├── modal.js        # Genel modal bileşeni
    │   ├── toast.js        # Bildirim toastları
    │   └── confetti.js     # PR kutlama animasyonu
    │
    ├── data/
    │   ├── exercises.js    # Egzersiz veritabanı (kategorili)
    │   └── badges.js       # Rozet tanımları
    │
    ├── i18n/
    │   ├── index.js        # Dil yönetimi
    │   ├── tr.js           # Türkçe çeviriler
    │   └── en.js           # İngilizce çeviriler
    │
    ├── pages/
    │   ├── dashboard.js    # Ana sayfa
    │   ├── workout.js      # Antrenman sayfası
    │   ├── aicoach.js      # AI Koç sayfası
    │   ├── profile.js      # Profil & kilo takibi
    │   ├── gymreal.js      # GymReal check-in
    │   └── gym.js          # Spor salonu hub
    │
    └── utils/
        ├── xp.js           # XP & seviye hesaplama, streak multiplier
        └── gamification.js # Rozet kontrolü, lig sistemi, challenge
```

---

## 🔧 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Vanilla JavaScript (ES6 Modules) |
| Stil | CSS3 (Variables, Glassmorphism, Animations) |
| Yazı Tipi | Inter (Google Fonts) |
| Backend | Python Flask (proxy) |
| Veritabanı | Firebase Firestore |
| State | localStorage + Firebase sync |
| AI | Google Gemini 1.5 Flash |
| Deploy | Static (herhangi bir HTTP sunucu) |

---

## 🤖 AI Koç

Gemini API anahtarı güvenlik amacıyla doğrudan frontend'de kullanılmaz; **`server.py` içine sabit yazılmaz** — `python-dotenv` ile `.env` dosyasından `GEMINI_API_KEY` okunur. Tüm istekler Flask proxy üzerinden geçer:

```
Kullanıcı → aicoach.js → localhost:5000/api/ai → Gemini API
```

**Kişilik Sistemi:**
```javascript
// Komutan: Askeri üslup
// Kanka: Samimi/komik
// Profesyonel PT: Bilimsel/detaylı
```

---

## 🔥 Gamification Detayları

### Streak Multiplier
| Seri | Çarpan |
|------|--------|
| 1-6 gün | x1.0 |
| 7-13 gün | x1.25 |
| 14-29 gün | x1.5 |
| 30+ gün | x2.0 |

### Lig Sistemi
| Lig | Minimum XP |
|-----|-----------|
| 🥉 Bronze | 0 XP |
| 🥈 Silver | 2,000 XP |
| 🥇 Gold | 5,000 XP |
| 💎 Diamond | 10,000 XP |

---

## 📝 Geliştirme Notları

- Uygulama tamamen **offline çalışır** (AI hariç)
- Firebase senkronizasyonu cihazlar arası veri aktarımı sağlar
- Tüm veriler `fitsync_data` localStorage anahtarında tutulur
- `serve_nocache.py` ile geliştirme sırasında önbellek sorunları önlenebilir

---

## 📄 Lisans

MIT License — Özgürce kullanabilir, düzenleyebilir ve dağıtabilirsiniz.

---

<div align="center">
Made with ❤️ for the fitness community
</div>
