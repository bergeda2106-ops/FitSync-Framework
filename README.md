# FitSync

<p align="center">
  <img src="FitSync-Framework-main/public/icons/icon.svg" alt="FitSync icon" width="96">
</p>

**Sadece spor değil, bir topluluk.**

FitSync; antrenmanlarını planlamana, ilerlemeni takip etmene ve hedeflerini oyunlaştırmayla sürdürmene yardımcı olan mobil öncelikli bir fitness uygulamasıdır. Arayüz Türkçe ve İngilizce kullanılabilir.

> English: FitSync is a mobile-first fitness app for workout tracking, progress, and motivation.

## Neler sunuyor?

- Antrenman şablonları, set/tekrar/ağırlık kaydı ve dinlenme zamanlayıcısı
- Kişisel rekorlar, kilo takibi, haftalık özet ve ilerleme grafikleri
- XP, seviyeler, rozetler, seriler ve haftalık meydan okumalar
- Antrenman paylaşımları, topluluk akışı ve etkileşimler
- Gemini destekli AI koç ve farklı koç kişilikleri

Uygulama kaynakları [`FitSync-Framework-main/`](FitSync-Framework-main/) klasöründedir. Topluluk akışındaki bazı içerikler demo amaçlı simüle edilir.

## Hızlı başlangıç

### Windows (PowerShell)

```powershell
cd FitSync-Framework-main
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
npm ci
copy .env.example .env
```

`.env` dosyasına Gemini API anahtarını ekle:

```env
GEMINI_API_KEY=anahtarini_buraya_yaz
```

İki ayrı terminalde, ikisinde de `FitSync-Framework-main` klasöründeyken başlat:

```powershell
python server.py
```

```powershell
npm run dev -- --host localhost --port 8080
```

Ardından <http://localhost:8080> adresini aç. AI koç için Flask sunucusu ve Gemini anahtarı gerekir; temel uygulama akışları AI olmadan da kullanılabilir.

## Geliştirme kontrolleri

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
python -m pytest -q
```

## Render'da yayınlama

Depoda Render Blueprint dosyası (`render.yaml`) bulunur. Render Dashboard'da **New > Blueprint** ile depoyu bağla. İlk kurulumda şu ortam değişkenlerini gir:

- `GEMINI_API_KEY`: Google AI Studio'dan alınan Gemini anahtarı.
- `FITSYNC_PRODUCTION_ORIGIN`: yayınlanan frontend'in tam adresi (ör. `https://fitsync-web.onrender.com`).
- `VITE_API_BASE_URL`: API servisinin tam adresi (ör. `https://fitsync-api.onrender.com`).

Render servis URL'leri örneklerden farklıysa gerçek URL'leri kullan. Frontend adresi değişirse API servisindeki `FITSYNC_PRODUCTION_ORIGIN` değerini; API adresi değişirse frontend servisindeki `VITE_API_BASE_URL` değerini Dashboard'dan güncelle ve frontend'i yeniden yayınla. API anahtarını depoya veya `render.yaml` dosyasına ekleme.

## Teknoloji

Vanilla JavaScript (ES modules), Vite, Flask ve Firebase Firestore.

## Lisans

FitSync, [PolyForm Noncommercial License 1.0.0](LICENSE) ile lisanslanır. Ticari olmayan kişisel, araştırma ve eğitim kullanımına izin verilir; ticari kullanım için ayrıca hak sahibinden izin alınmalıdır. Bu lisans OSI onaylı bir açık kaynak lisansı değildir. Bu açıklama hukuki danışmanlık yerine geçmez.

## Katkıda bulunma

Hata bildirimleri ve iyileştirme önerileri için [Issues](https://github.com/bergeda2106-ops/FitSync-Framework/issues) açabilirsin. Değişiklik göndermeden önce ilgili testleri çalıştır.

Lütfen Gemini API anahtarını veya başka gizli bilgileri kaynak koda ekleme; yerel `.env` dosyasını paylaşma.
