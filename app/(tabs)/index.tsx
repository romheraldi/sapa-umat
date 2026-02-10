import { HeaderBanner } from '@/components/header-banner';
import { ThemedText } from '@/components/themed-text';
import { AnnouncementCard } from '@/components/ui/announcement-card';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { InfoRow } from '@/components/ui/info-row';
import { ScheduleItem } from '@/components/ui/schedule-item';
import { SectionHeader } from '@/components/ui/section-header';
import { infoGereja, jadwalMisa, pengumuman, quickActions } from '@/constants/mock-data';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get Sunday masses for preview
  const sundayMasses = jadwalMisa.filter(m => m.hari === 'Minggu').slice(0, 3);

  // Get pinned announcements
  const pinnedAnnouncements = pengumuman.filter(p => p.isPinned).slice(0, 2);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Banner */}
      <Animated.View entering={FadeIn.duration(600)}>
        <HeaderBanner
          title="Santo Arnoldus Janssen"
          subtitle="Gereja Katolik Bekasi"
          height={220}
          backgroundImage={<Image source={require('@/assets/images/church-hero.png')} style={styles.heroImage} />}
        />
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.quickActionsContainer}>
        <Card variant="elevated" padding="md" style={styles.quickActionsCard}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(action => (
              <Pressable
                key={action.id}
                style={styles.quickAction}
                onPress={() => {
                  if (action.id === '2') {
                    router.push('/info-gereja');
                  } else if (action.route.startsWith('/(tabs)')) {
                    router.push(action.route as any);
                  }
                }}>
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: action.color + '15',
                      borderRadius: BorderRadius.md,
                    },
                  ]}>
                  <IconSymbol name={action.icon as any} size={28} color={action.color} />
                </View>
                <ThemedText style={styles.quickActionText}>{action.title}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>
      </Animated.View>

      <View style={styles.content}>
        {/* Jadwal Misa Minggu Ini */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.section}>
          <SectionHeader title="Misa Minggu Ini" linkText="Lihat Semua" onPress={() => router.push('/(tabs)/jadwal')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {sundayMasses.map(schedule => (
              <View key={schedule.id} style={styles.scheduleCard}>
                <ScheduleItem schedule={schedule} />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Pengumuman Terbaru */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.section}>
          <SectionHeader
            title="Pengumuman Terbaru"
            linkText="Lihat Semua"
            onPress={() => router.push('/(tabs)/pengumuman')}
          />
          {pinnedAnnouncements.map(announcement => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </Animated.View>

        {/* Informasi Kontak */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.section}>
          <SectionHeader title="Informasi Kontak" />
          <Card variant="outlined" padding="md">
            <InfoRow icon="mappin.circle.fill" label="Alamat" value={infoGereja.alamatLengkap} />
            <InfoRow icon="phone.fill" label="Telepon" value={infoGereja.telepon} />
            <InfoRow icon="envelope.fill" label="Email" value={infoGereja.email} />
            <InfoRow
              icon="clock.fill"
              label="Jam Sekretariat"
              value={`${infoGereja.jamOperasionalSekretariat[0].hari}: ${infoGereja.jamOperasionalSekretariat[0].jam}`}
            />
          </Card>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  quickActionsContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.xl,
  },
  quickActionsCard: {
    ...Shadows.md,
    marginTop: 25,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  horizontalScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  scheduleCard: {
    width: 300,
    marginRight: Spacing.sm,
  },
});
