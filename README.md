# SAPA UMAT

> Sistem Aplikasi Paroki Umat - Gereja Katolik Santo Arnoldus Janssen Bekasi

<div align="center">

![Status](https://img.shields.io/badge/Status-Complete-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey)
![Framework](https://img.shields.io/badge/Framework-React%20Native-61DAFB)

</div>

---

## 📱 Tentang Aplikasi

**SAPA UMAT** adalah aplikasi mobile frontend-only untuk Gereja Katolik Santo Arnoldus Janssen Bekasi yang menyediakan informasi paroki, jadwal ibadah, pengumuman, dan data umat BASIS (Basis Integrasi Data Umat Keuskupan).

### Fitur Utama

✅ **Beranda** - Hero banner, quick actions, jadwal minggu ini, pengumuman terbaru, info kontak  
✅ **Jadwal Ibadah** - Filter 6 kategori, jadwal per hari dalam seminggu, jadwal khusus  
✅ **Pengumuman** - Search, filter kategori, pinned announcements, sorted by date  
✅ **Data Umat** - Dashboard statistik, searchable family list, BASIS integration ready  
✅ **Info Gereja** - Sejarah, pastor, kontak, jam operasional, wilayah & lingkungan  

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm atau yarn
- Expo CLI
- Android Studio (untuk Android) atau Xcode (untuk iOS)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd sapa-umat

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## 🏗️ Tech Stack

- **Framework**: React Native 0.81 + Expo SDK 54
- **Navigation**: Expo Router v6 (file-based routing)
- **Animations**: React Native Reanimated
- **Language**: TypeScript
- **Styling**: React Native StyleSheet (native CSS-in-JS)
- **State Management**: React Hooks (useState, useCallback)

---

## 📂 Project Structure

```
sapa-umat/
├── app/                      # Screens (Expo Router)
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Beranda
│   │   ├── jadwal.tsx       # Jadwal Ibadah
│   │   ├── pengumuman.tsx   # Pengumuman
│   │   └── data-umat.tsx    # Data Umat BASIS
│   ├── info-gereja.tsx      # Info Gereja (stack screen)
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── ui/                  # UI components
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── section-header.tsx
│   │   ├── schedule-item.tsx
│   │   ├── announcement-card.tsx
│   │   ├── info-row.tsx
│   │   └── form-field.tsx
│   ├── header-banner.tsx
│   └── themed-text.tsx
├── constants/               # Configuration & data
│   ├── theme.ts            # Design system (colors, spacing, typography)
│   ├── types.ts            # TypeScript interfaces
│   └── mock-data.ts        # Mock data (jadwal, pengumuman, families)
├── assets/                  # Static assets
│   └── images/
│       └── church-hero.png # Custom church photograph
└── hooks/                   # Custom React hooks
```

---

## 🎨 Design System

### Color Palette (Catholic Theme)

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** (Burgundy) | `#800020` | Misa, primary actions |
| **Secondary** (Gold) | `#C5922E` | Liturgical accent, highlights |
| **Tertiary** (Green) | `#2E7D32` | Life, growth, nature |
| **Quaternary** (Blue) | `#1565C0` | Faith, sky, trust |

### Typography Scale

- **Title**: 32px, bold
- **Heading1**: 28px, bold
- **Heading2**: 24px, semibold
- **Heading3**: 20px, semibold
- **Body**: 16px, regular
- **Caption**: 14px, regular
- **Small**: 12px, regular

### Spacing System

`xs(4) → sm(8) → md(16) → lg(24) → xl(32) → xxl(48)`

---

## 📊 Features Overview

### 1. Beranda (Home)

- **Hero Banner**: Custom church photograph dengan gradient overlay
- **Quick Actions**: 4 tombol cepat (Misa Hari Ini, Info Gereja, Pengumuman, Data Umat)
- **Jadwal Preview**: Horizontal scroll 3 misa Minggu terdekat
- **Pengumuman**: 2 pinned announcements terbaru
- **Info Kontak**: Alamat, telepon, email, jam sekretariat

### 2. Jadwal Ibadah

- **6 Filter Tabs**: Semua, Misa, Adorasi, Ibadat, Sakramen, Kegiatan
- **Grouped by Day**: Jadwal dikelompokkan per hari (Minggu-Sabtu)
- **Special Schedules**: Section khusus untuk acara spesial
- **Pull-to-Refresh**: Update jadwal terbaru

### 3. Pengumuman

- **Search Bar**: Filter by judul atau ringkasan
- **6 Category Filters**: Semua, Liturgi, Kegiatan, Sakramen, Sosial, Umum
- **Pinned Support**: Pengumuman penting di atas
- **Sorted**: By date (newest first)
- **Pull-to-Refresh**: Update pengumuman terbaru

### 4. Data Umat (BASIS)

- **Statistics Dashboard**: Total keluarga, jiwa, lingkungan
- **Search**: Filter by nama KK atau No. KK Katolik
- **Family List**: Searchable dengan metadata lengkap
- **Pull-to-Refresh**: Update data keluarga

### 5. Info Gereja

- **Sejarah Paroki**: Ringkasan sejarah singkat
- **Pastor Paroki**: Daftar pastor dengan jabatan
- **Kontak**: Alamat, telepon, email, website
- **Jam Operasional**: Sekretariat schedule
- **Wilayah & Lingkungan**: 3 wilayah, 8 lingkungan dengan struktur ketua

---

## 🎭 Animations & UX

### Fade-in Animations

- **Headers**: `FadeIn.duration(400-600ms)`
- **Sections**: `FadeInDown` dengan staggered delays (100ms-500ms)
- **List Items**: Cascade effect dengan 50ms delay per item

### Pull-to-Refresh

- Jadwal: Burgundy indicator
- Pengumuman: Green indicator  
- Data Umat: Royal blue indicator

---

## 📝 Mock Data

Aplikasi menggunakan mock data untuk demonstrasi:

- **15+ Jadwal Ibadah**: Misa Minggu (6), Misa harian (6), Adorasi (2), Novena (1)
- **5 Pengumuman**: Krisma 2026, Bakti Sosial, Retret OMK, Pernikahan, Ziarek
- **3 Wilayah**: Santo Yoseph, Santa Maria, Santo Fransiskus
- **8 Lingkungan**: Berbagai lingkungan di 3 wilayah
- **1 Sample Family**: Keluarga dengan multiple anggota dan sakramen records

---

## 🔮 Roadmap & Future Features

### Phase 9: Backend Integration (Planned)

- [ ] REST API integration
- [ ] Authentication (admin/pastor login)
- [ ] Real-time data sync
- [ ] Push notifications

### Phase 10: Advanced Features (Planned)

- [ ] Multi-step BASIS form entry
- [ ] Detail views (tap to expand)
- [ ] Calendar view untuk jadwal bulanan
- [ ] Export data (PDF/Excel)
- [ ] Offline mode dengan local storage

---

## 📄 Documentation

- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Complete technical specs
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Development plan & architecture
- [TASK_LIST.md](./TASK_LIST.md) - Development task checklist
- [WALKTHROUGH.md](./WALKTHROUGH.md) - Development progress walkthrough

---

## 🤝 Contributing

Untuk development lebih lanjut atau customization:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📜 License

Copyright © 2026 Gereja Katolik Santo Arnoldus Janssen Bekasi

---

## 👨‍💻 Development Team

**Frontend Development**: Antigravity AI Agent  
**Church Partner**: Gereja Katolik Santo Arnoldus Janssen Bekasi  
**Framework**: React Native + Expo  

---

## 📞 Support

Untuk pertanyaan atau bantuan teknis:
- Email: [paroki email]
- Telepon: [paroki phone]

---

<div align="center">

**🙏 Dibuat dengan ❤️ untuk Gereja Katolik Santo Arnoldus Janssen Bekasi**

</div>
