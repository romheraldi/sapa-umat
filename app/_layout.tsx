import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/auth';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

// Guard: redirect ke login jika belum autentikasi, ke tabs jika sudah
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace('/login' as any);
    } else {
      router.replace('/(tabs)');
    }
  }, [isInitialized, user]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen
                name="info-gereja"
                options={{
                  presentation: 'card',
                  title: 'Informasi Gereja',
                  headerBackTitle: 'Kembali',
                }}
              />
              <Stack.Screen
                name="pengumuman/[id]"
                options={{
                  presentation: 'card',
                  title: 'Detail Pengumuman',
                  headerBackTitle: 'Kembali',
                }}
              />
              <Stack.Screen
                name="data-umat/[no_kk]"
                options={{
                  presentation: 'card',
                  title: 'Detail Keluarga',
                  headerBackTitle: 'Kembali',
                }}
              />
              <Stack.Screen
                name="dokumen/index"
                options={{
                  presentation: 'card',
                  title: 'Dokumen Saya',
                  headerBackTitle: 'Kembali',
                }}
              />
              <Stack.Screen
                name="dokumen/upload"
                options={{
                  presentation: 'card',
                  title: 'Upload Dokumen',
                  headerBackTitle: 'Kembali',
                }}
              />
              <Stack.Screen
                name="iuran/bayar"
                options={{
                  presentation: 'card',
                  title: 'Pembayaran QRIS',
                  headerBackTitle: 'Kembali',
                }}
              />
              <Stack.Screen
                name="iuran/riwayat"
                options={{
                  presentation: 'card',
                  title: 'Riwayat Pembayaran',
                  headerBackTitle: 'Kembali',
                }}
              />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
