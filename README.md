# 📡 Roblox Username Detector

Aplikasi web (React + Vite + Tailwind) untuk mendeteksi ketersediaan **username Roblox secara real-time**,
lengkap dengan detail profil (avatar, ID, tanggal bergabung, jumlah teman/pengikut, bio, badge verifikasi, dll)
dan tampilan interaktif (validasi format live, riwayat pencarian, saran username mirip).

Proyek ini sudah disiapkan agar bisa langsung **dibungkus menjadi file APK Android lewat GitHub Actions**
menggunakan [Capacitor](https://capacitorjs.com/).

## ✨ Fitur

- Deteksi real-time saat mengetik (debounced, tanpa perlu klik tombol)
- Validasi format username langsung terlihat (3–20 karakter, karakter valid, underscore, dsb)
- Kartu profil detail saat username **sudah dipakai**: avatar, nama tampilan, badge verifikasi,
  status banned, ID, tanggal bergabung + umur akun, bio, jumlah teman/pengikut/mengikuti
- Saran akun dengan nama mirip
- Riwayat pencarian tersimpan di perangkat (localStorage)
- Tema gelap modern, animasi halus (Framer Motion)
- Sumber data langsung dari API publik Roblox (users.roblox.com, friends.roblox.com, thumbnails.roblox.com)
  lewat mekanisme proxy CORS berlapis agar tetap berfungsi di WebView APK

> ⚠️ Ini adalah alat **tidak resmi**, memakai endpoint publik Roblox. Bukan produk resmi Roblox Corporation.
> Karena bergantung pada proxy CORS publik pihak ketiga, kecepatan/keberhasilan bisa bervariasi tergantung jaringan.

## 📦 Cara mendapatkan APK lewat GitHub Actions

1. **Unduh/dapatkan seluruh folder project ini sebagai ZIP**, lalu ekstrak (atau langsung gunakan hasil
   export dari tool ini).
2. Buat repository baru di GitHub (bisa publik/privat), lalu upload semua isi project (bukan foldernya,
   tapi isinya) ke repo tersebut. Contoh lewat command line:
   ```bash
   git init
   git add .
   git commit -m "Roblox Username Detector"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA_REPO.git
   git push -u origin main
   ```
3. Buka repo di GitHub → tab **Actions** → pilih workflow **"Build Android APK"** → klik **Run workflow**
   (atau otomatis berjalan setiap kali kamu push ke branch `main`).
4. Tunggu sampai proses selesai (± 5–10 menit). Setelah hijau/selesai, buka halaman run tersebut,
   scroll ke bagian **Artifacts**, lalu unduh **`roblox-username-detector-apk.zip`**.
5. Ekstrak zip hasil unduhan → di dalamnya ada file **`app-debug.apk`**.
6. Pindahkan APK ke HP Android, aktifkan **"Izinkan instalasi dari sumber tidak dikenal"**, lalu install.

Workflow-nya ada di `.github/workflows/build-apk.yml` — sudah otomatis menjalankan:
`npm install` → `npm run build` → `npx cap add android` → `npx cap sync` → `./gradlew assembleDebug`,
lalu meng-upload APK sebagai artifact.

## 🛠️ Menjalankan secara lokal

```bash
npm install
npm run dev       # mode pengembangan
npm run build     # build production ke folder dist/
```

## 📱 Build APK secara manual (opsional, tanpa GitHub Actions)

```bash
npm run build
npx cap add android      # sekali saja
npx cap sync android
npx cap open android     # butuh Android Studio terpasang
```

## 🧩 Struktur penting

- `src/lib/roblox.ts` — logika pemanggilan API Roblox + validasi username + proxy CORS
- `src/components/` — komponen UI (search bar, kartu profil, status, riwayat, dll)
- `capacitor.config.ts` — konfigurasi aplikasi Android (App ID, nama app)
- `.github/workflows/build-apk.yml` — pipeline build APK otomatis
