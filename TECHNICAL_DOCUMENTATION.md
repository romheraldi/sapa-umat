# SAPA UMAT - Technical Documentation

> Complete Technical Specification & Architecture Guide

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Design System](#design-system)
5. [Data Models](#data-models)
6. [Component Library](#component-library)
7. [Screen Specifications](#screen-specifications)
8. [Navigation](#navigation)
9. [State Management](#state-management)
10. [Animations](#animations)
11. [Performance](#performance)
12. [Testing](#testing)
13. [Deployment](#deployment)

---

## Architecture Overview

### Application Architecture

SAPA UMAT menggunakan **Frontend-Only Architecture** dengan mock data. Aplikasi ini dirancang untuk mudah di-upgrade ke full-stack dengan backend integration.

```
┌─────────────────────────────────────┐
│         User Interface Layer         │
│  (React Native Components + Expo)    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Business Logic Layer           │
│  (React Hooks + Custom Functions)    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Data Layer (Mock)            │
│     (constants/mock-data.ts)         │
└──────────────────────────────────────┘

Future Backend Integration:
┌──────────────────────────────────────┐
│         Backend API Layer            │
│  (REST API / GraphQL - Planned)      │
└──────────────────────────────────────┘
```

### Design Patterns

1. **Component-Based Architecture**: Reusable UI components dengan separation of concerns
2. **Atomic Design**: Atoms (Button, Badge) → Molecules (InfoRow, FormField) → Organisms (ScheduleItem, AnnouncementCard)
3. **Presentational vs Container**: Components fokus pada UI, screens handle business logic
4. **Single Source of Truth**: Mock data centralized di `constants/mock-data.ts`

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Native** | 0.81.x | Mobile app framework |
| **Expo** | SDK 54 | Development platform |
| **Expo Router** | v6 | File-based navigation |
| **TypeScript** | 5.x | Type-safe development |
| **React Native Reanimated** | 3.x | Smooth animations |

### Development Tools

- **Metro Bundler**: JavaScript bundler
- **Babel**: JavaScript compiler
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Dependencies

```json
{
  "expo": "~54.0.0",
  "react": "18.3.1",
  "react-native": "0.81.0",
  "expo-router": "~6.0.0",
  "react-native-reanimated": "~3.17.0",
  "expo-linear-gradient": "~14.0.1"
}
```

---

## Project Structure

### Directory Layout

```
sapa-umat/
├── app/                          # Screens (Expo Router)
│   ├── (tabs)/                   # Tab-based screens
│   │   ├── _layout.tsx           # Tab navigation config
│   │   ├── index.tsx             # Beranda screen
│   │   ├── jadwal.tsx            # Jadwal Ibadah screen
│   │   ├── pengumuman.tsx        # Pengumuman screen
│   │   └── data-umat.tsx         # Data Umat BASIS screen
│   ├── info-gereja.tsx           # Info Gereja stack screen
│   ├── _layout.tsx               # Root layout
│   └── modal.tsx                 # Example modal
├── assets/                       # Static assets
│   ├── fonts/                    # Custom fonts
│   └── images/                   # Images & icons
│       └── church-hero.png       # Custom church photo
├── components/                   # Reusable components
│   ├── ui/                       # UI component library
│   │   ├── card.tsx              # Card container
│   │   ├── button.tsx            # Button component
│   │   ├── badge.tsx             # Badge/chip component
│   │   ├── section-header.tsx    # Section header with link
│   │   ├── schedule-item.tsx     # Schedule list item
│   │   ├── announcement-card.tsx # Announcement card
│   │   ├── info-row.tsx          # Info row (icon + label + value)
│   │   └── form-field.tsx        # Form input field
│   ├── header-banner.tsx         # Hero banner component
│   ├── themed-text.tsx           # Themed text component
│   ├── themed-view.tsx           # Themed view component
│   ├── external-link.tsx         # External link component
│   ├── hello-wave.tsx            # Example animation
│   ├── collapsible.tsx           # Collapsible section
│   └── parallax-scroll-view.tsx  # Parallax scroll
├── constants/                    # Configuration & data
│   ├── theme.ts                  # Design system (colors, spacing, shadows)
│   ├── types.ts                  # TypeScript interfaces
│   └── mock-data.ts              # Mock data (jadwal, pengumuman, families)
├── hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts       # Theme hook
│   └── use-theme-color.ts        # Color resolver hook
└── scripts/                      # Build & deployment scripts
    └── reset-project.js          # Project reset script
```

### File Naming Conventions

- **Screens**: kebab-case (e.g., `data-umat.tsx`, `info-gereja.tsx`)
- **Components**: kebab-case (e.g., `header-banner.tsx`, `themed-text.tsx`)
- **Constants**: kebab-case (e.g., `mock-data.ts`, `theme.ts`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-color-scheme.ts`)

---

## Design System

### Color Palette

#### Primary Colors (Catholic Theme)

```typescript
const Colors = {
  light: {
    primary: '#800020',      // Burgundy (Misa, liturgy)
    secondary: '#C5922E',    // Gold (Accent, highlights)
    tertiary: '#2E7D32',     // Forest Green (Life, growth)
    quaternary: '#1565C0',   // Royal Blue (Faith, sky)
    
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    border: '#E0E0E0',
    
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  dark: {
    primary: '#A02030',      // Lighter burgundy for dark mode
    secondary: '#D4A94E',    // Lighter gold
    tertiary: '#4CAF50', // Lighter green
    quaternary: '#42A5F5',   // Lighter blue
    
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: '#1F2124',
    border: '#2A2C2E',
    
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#42A5F5',
  },
};
```

#### Semantic Colors

| Color | Usage | Light | Dark |
|-------|-------|-------|------|
| **Primary** | Misa, main actions, headers | #800020 | #A02030 |
| **Secondary** | Gold accents, highlights | #C5922E | #D4A94E |
| **Tertiary** | Growth, nature, sustainability | #2E7D32 | #4CAF50 |
| **Quaternary** | Faith, trust, data | #1565C0 | #42A5F5 |

### Typography

```typescript
const Typography = {
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
};
```

### Spacing System

```typescript
const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Border Radius

```typescript
const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

### Shadows

```typescript
const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
```

---

## Data Models

### TypeScript Interfaces

#### BASIS (Family Data)

```typescript
interface Keluarga {
  id: string;
  noKartuKeluargaKatolik: string;
  namaKepalaKeluarga: string;
  alamat: string;
  wilayah: string;
  lingkungan: string;
  anggotaKeluarga: AnggotaKeluarga[];
}

interface AnggotaKeluarga {
  id: string;
  namaLengkap: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  hubunganDalamKeluarga: HubunganKeluarga;
  statusPernikahan: StatusPernikahan;
  sakramen: DataSakramen;
  statusKeanggotaan: StatusKeanggotaan;
}

interface DataSakramen {
  pembaptisan?: InfoSakramen;
  komuni?: InfoSakramen;
  krisma?: InfoSakramen;
  pernikahan?: InfoSakramen;
}

interface InfoSakramen {
  tanggal: string;
  tempatGereja: string;
  namaPastor: string;
  nomorSertifikat?: string;
}
```

#### Jadwal Ibadah

```typescript
interface JadwalMisa {
  id: string;
  jenisIbadah: JenisIbadah;
  kategori: KategoriJadwal;
  judul: string;
  hari?: HariDalamSeminggu;
  tanggal?: string;
  waktu: string;
  lokasi: string;
  bahasa?: 'Indonesia' | 'Latin' | 'Inggris';
  celebran?: string;
  keterangan?: string;
}

type JenisIbadah = 'Misa' | 'Adorasi' | 'Ibadat' | 'Sakramen' | 'Kegiatan';
type KategoriJadwal = 'Mingguan' | 'Khusus';
type HariDalamSeminggu = 'Minggu' | 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
```

#### Pengumuman

```typescript
interface Pengumuman {
  id: string;
  judul: string;
  kategori: KategoriPengumuman;
  prioritas: 'Rendah' | 'Sedang' | 'Tinggi';
  tanggalPublikasi: string;
  ringkasan: string;
  kontenLengkap: string;
  isPinned: boolean;
  gambar?: string;
  penulis: string;
  kontak?: string;
}

type KategoriPengumuman = 'Liturgi' | 'Kegiatan' | 'Sakramen' | 'Sosial' | 'Umum';
```

#### Info Gereja

```typescript
interface InfoGereja {
  namaParoki: string;
  namaPelindung: string;
  alamatLengkap: string;
  telepon: string;
  email: string;
  website?: string;
  sejarahSingkat: string;
  pastor: Pastor[];
  jamOperasionalSekretariat: JamOperasional[];
}

interface Pastor {
  nama: string;
  jabatan: 'Pastor Paroki' | 'Pastor Rekan' | 'Pastor Pembantu';
}

interface JamOperasional {
  hari: string;
  jam: string;
}
```

---

## Component Library

### Core Components

#### 1. Card

**File**: `components/ui/card.tsx`

**Props**:
```typescript
interface CardProps {
  variant: 'elevated' | 'outlined' | 'filled';
  padding: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  children: React.ReactNode;
}
```

**Variants**:
- `elevated`: Card dengan shadow
- `outlined`: Card dengan border
- `filled`: Card dengan background color

#### 2. Button

**File**: `components/ui/button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onPress: () => void;
  children: string;
}
```

**Variants**:
- `primary`: Burgundy background, white text
- `secondary`: Gold background, white text
- `outline`: Transparent dengan border
- `ghost`: Transparent tanpa border

#### 3. Badge

**File**: `components/ui/badge.tsx`

**Props**:
```typescript
interface BadgeProps {
  label: string;
  variant: JenisIbadah | KategoriPengumuman;
}
```

**Auto-colored** berdasarkan variant type

#### 4. Schedule Item

**File**: `components/ui/schedule-item.tsx`

**Props**:
```typescript
interface ScheduleItemProps {
  schedule: JadwalMisa;
  onPress?: () => void;
}
```

**Features**:
- Icon berdasarkan jenisIbadah
- Badge untuk kategori
- Time, location, celebrant info

#### 5. Announcement Card

**File**: `components/ui/announcement-card.tsx`

**Props**:
```typescript
interface AnnouncementCardProps {
  announcement: Pengumuman;
  onPress?: () => void;
}
```

**Features**:
- Optional image
- Pinned indicator
- Category badge
- Publication date
- Author info

---

## Screen Specifications

### 1. Beranda (Home)

**File**: `app/(tabs)/index.tsx`

**Sections**:
1. Hero Banner (220px height)
2. Quick Actions (4 buttons)
3. Misa Minggu Ini (horizontal scroll, 3 items)
4. Pengumuman Terbaru (2 pinned items)
5. Informasi Kontak (4 info rows)

**Data Sources**:
- `jadwalMisa.filter(m => m.hari === 'Minggu').slice(0, 3)`
- `pengumuman.filter(p => p.isPinned).slice(0, 2)`
- `infoGereja`

### 2. Jadwal Ibadah

**File**: `app/(tabs)/jadwal.tsx`

**Features**:
- 6 filter tabs (Semua, Misa, Adorasi, Ibadat, Sakramen, Kegiatan)
- Jadwal grouped by day of week
- Special schedules section
- Pull-to-refresh

**State Management**:
```typescript
const [activeFilter, setActiveFilter] = useState<JenisIbadah | 'Semua'>('Semua');
const [refreshing, setRefreshing] = useState(false);
```

### 3. Pengumuman

**File**: `app/(tabs)/pengumuman.tsx`

**Features**:
- Search bar
- 6 category filters
- Results count
- Sorted list (pinned first, then by date)
- Pull-to-refresh

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeCategory, setActiveCategory] = useState<KategoriPengumuman | 'Semua'>('Semua');
const [refreshing, setRefreshing] = useState(false);
```

### 4. Data Umat

**File**: `app/(tabs)/data-umat.tsx`

**Features**:
- Statistics dashboard (3 cards)
- Search bar (by nama KK or No. KK)
- Family list with metadata
- Pull-to-refresh

**Calculations**:
```typescript
const totalKeluarga = dataKeluarga.length;
const totalJiwa = dataKeluarga.reduce((sum, k) => sum + k.anggotaKeluarga.length, 0);
const totalLingkungan = lingkungan.length;
```

### 5. Info Gereja

**File**: `app/info-gereja.tsx`

**Sections**:
1. Sejarah Paroki
2. Pastor Paroki (list)
3. Kontak & Alamat (InfoRow components)
4. Jam Operasional
5. Wilayah & Lingkungan (3 wilayah, nested lingkungan)

---

## Navigation

### Navigation Structure

```
Root Stack
├── (tabs) - Tab Navigator
│   ├── index (Beranda)
│   ├── jadwal (Jadwal Ibadah)
│   ├── pengumuman (Pengumuman)
│   └── data-umat (Data Umat)
├── info-gereja (Stack Screen)
└── modal (Example Modal)
```

### Navigation Code

**Root Layout** (`app/_layout.tsx`):
```tsx
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen 
    name="info-gereja" 
    options={{ 
      presentation: 'card',
      title: 'Informasi Gereja',
      headerBackTitle: 'Kembali' 
    }} 
  />
</Stack>
```

**Tab Layout** (`app/(tabs)/_layout.tsx`):
```tsx
<Tabs screenOptions={{ 
  tabBarActiveTintColor: colors.primary,
  headerShown: false 
}}>
  <Tabs.Screen name="index" options={{ title: 'Beranda', ... }} />
  <Tabs.Screen name="jadwal" options={{ title: 'Jadwal', ... }} />
  <Tabs.Screen name="pengumuman" options={{ title: 'Pengumuman', ... }} />
  <Tabs.Screen name="data-umat" options={{ title: 'Data Umat', ... }} />
</Tabs>
```

---

## State Management

### Current Approach: React Hooks

Aplikasi menggunakan **React Hooks** untuk state management:

- `useState`: Local component state
- `useCallback`: Memoized callbacks untuk performance
- `useColorScheme`: Theme detection (light/dark)

### Example State Usage

```typescript
// Search & filter state
const [searchQuery, setSearchQuery] = useState('');
const [activeFilter, setActiveFilter] = useState('Semua');

// Pull-to-refresh state
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(() => {
  setRefreshing(true);
  setTimeout(() => setRefreshing(false), 1000);
}, []);

// Computed values
const filteredData = useMemo(() => 
  data.filter(item => item.title.includes(searchQuery)),
  [data, searchQuery]
);
```

### Future: Backend Integration

For backend integration, consider:
- **React Query / TanStack Query**: Server state management
- **Zustand / Jotai**: Global client state
- **Context API**: Theme, auth, user preferences

---

## Animations

### React Native Reanimated

**Library**: `react-native-reanimated` v3.x

### Animation Patterns

#### 1. Fade-In (Headers)

```typescript
<Animated.View entering={FadeIn.duration(400)}>
  <Header />
</Animated.View>
```

#### 2. Staggered Fade-Down (Sections)

```typescript
<Animated.View entering={FadeInDown.duration(500).delay(200)}>
  <Section1 />
</Animated.View>

<Animated.View entering={FadeInDown.duration(500).delay(300)}>
  <Section2 />
</Animated.View>
```

#### 3. List Item Cascade

```typescript
{items.map((item, idx) => (
  <Animated.View entering={FadeInDown.duration(400).delay(400 + idx * 50)}>
    <ListItem item={item} />
  </Animated.View>
))}
```

### Animation Timing

| Element | Animation | Duration | Delay |
|---------|-----------|----------|-------|
| Header | FadeIn | 400-600ms | 0ms |
| Section 1 | FadeInDown | 500ms | 100-200ms |
| Section 2 | FadeInDown | 500ms | 300ms |
| Section 3 | FadeInDown | 500ms | 400ms |
| List Items | FadeInDown | 400ms | 400ms + (idx × 50ms) |

---

## Performance

### Optimization Techniques

1. **Memoization**:
   - `useMemo` untuk computed values
   - `useCallback` untuk event handlers

2. **List Optimization**:
   - `FlatList` dengan `getItemLayout` (planned)
   - `windowSize` prop untuk limit rendering

3. **Image Optimization**:
   - Compressed images
   - Proper image sizing
   - Lazy loading (planned)

4. **Bundle Size**:
   - Tree-shaking unused code
   - Code splitting (future)

### Performance Metrics (Target)

- **Initial Load**: < 2s
- **Screen Transition**: < 300ms
- **List Scroll**: 60 FPS
- **Memory Usage**: < 150MB

---

## Testing

### Testing Strategy (Planned)

1. **Unit Tests**: Jest + React Native Testing Library
2. **Component Tests**: Storybook
3. **E2E Tests**: Detox
4. **Visual Regression**: Percy / Chromatic

### Test Coverage Goals

- Components: 80%
- Utils: 90%
- Screens: 60%

---

## Deployment

### Build Configuration

**Android**:
```bash
eas build --platform android --profile production
```

**iOS**:
```bash
eas build --platform ios --profile production
```

### Environment Variables

Create `.env` file:
```
API_URL=https://api.example.com
API_KEY=your_api_key
```

### App Store Submission

1. **App Name**: SAPA UMAT
2. **Bundle ID**: com.gereja.sapaumat
3. **Version**: 1.0.0
4. **Category**: Lifestyle / Religion

---

## API Integration (Planned)

### Endpoints (Future)

```
GET    /api/jadwal              - Get worship schedules
GET    /api/pengumuman          - Get announcements
GET    /api/keluarga            - Get family data
POST   /api/keluarga            - Create family
PUT    /api/keluarga/:id        - Update family
DELETE /api/keluarga/:id        - Delete family
GET    /api/wilayah             - Get wilayah list
GET    /api/lingkungan          - Get lingkungan list
```

### Authentication (Planned)

```
POST   /api/auth/login          - Admin login
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Get current user
```

---

## Security Considerations

### Current (Frontend-Only)

- No sensitive data stored
- No authentication required
- Read-only mock data

### Future (With Backend)

- JWT token authentication
- HTTPS only
- API rate limiting
- Input validation & sanitization
- Role-based access control (RBAC)
  - Admin: Full access
  - Pastor: Read/Write
  - User: Read only

---

## Maintenance & Support

### Code Standards

- **Linting**: ESLint + Prettier
- **Type Safety**: Strict TypeScript mode
- **Git Workflow**: Feature branches + PR reviews
- **Commit Convention**: Conventional Commits

### Monitoring (Future)

- **Analytics**: Firebase Analytics / Amplitude
- **Error Tracking**: Sentry
- **Performance**: Firebase Performance
- **Crash Reporting**: Crashlytics

---

## Appendix

### Useful Commands

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web

# Build
npm run build          # Build for production
eas build --platform all  # Build for both platforms

# Clean
npx expo start --clear # Clear cache and restart
npm run reset-project  # Reset to initial state
```

### External Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Expo Router](https://expo.github.io/router)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)

---

<div align="center">

**Last Updated**: February 2026  
**Maintained by**: Development Team

</div>
