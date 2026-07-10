import { HeaderBanner } from '@/components/header-banner';
import { ThemedText } from '@/components/themed-text';
import { AnnouncementCard } from '@/components/ui/announcement-card';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { InfoRow } from '@/components/ui/info-row';
import { SectionHeader } from '@/components/ui/section-header';
import { quickActions } from '@/constants/mock-data';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';
import type { Pengumuman } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Adapter: API Pengumuman -> AnnouncementCard shape
const toCardShape = (p: Pengumuman) => ({
    id: p.id,
    judul: p.judul,
    kategori: p.kategori,
    ringkasan: p.ringkasan,
    tanggalPublikasi: p.published_at,
    isPinned: p.is_pinned,
    imageUrl: p.image_url ?? undefined,
});

export default function HomeScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Fetch upcoming misa
    const { data: jadwalResp } = useQuery({
        queryKey: ['jadwal-upcoming'],
        queryFn: () => api.getJadwalUpcoming(3),
        staleTime: 5 * 60_000,
    });

    // Fetch pinned pengumuman
    const { data: pengumumanResp } = useQuery({
        queryKey: ['pengumuman-pinned'],
        queryFn: () => api.getPengumumanPinned(),
        staleTime: 5 * 60_000,
    });

    // Fetch info gereja (static, long cache)
    const { data: infoResp } = useQuery({
        queryKey: ['info-gereja'],
        queryFn: () => api.getInfoGereja(),
        staleTime: 60 * 60_000,
    });

    const upcomingMisa = jadwalResp?.data?.slice(0, 3) || [];
    const pinnedAnnouncements = pengumumanResp?.data?.slice(0, 2) || [];
    const infoGereja = infoResp?.data;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Hero Banner */}
            <Animated.View entering={FadeIn.duration(600)}>
                <HeaderBanner
                    title="Santo Arnoldus Janssen"
                    subtitle="Gereja Katolik Bekasi"
                    height={220}
                    backgroundImage={<Image source={require('@/assets/images/church-hero.png')} style={styles.heroImage} resizeMode="cover" />}
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
                {/* Jadwal Misa Mendatang */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.section}>
                    <SectionHeader title="Misa Mendatang" linkText="Lihat Semua" onPress={() => router.push('/(tabs)/jadwal')} />
                    {upcomingMisa.length === 0 ? (
                        <Card variant="filled" padding="md">
                            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>Belum ada jadwal misa tersedia.</ThemedText>
                        </Card>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {upcomingMisa.map(jadwal => (
                                <Card key={jadwal.id} variant="elevated" padding="md" style={styles.scheduleCard}>
                                    <View style={[styles.scheduleTime, { backgroundColor: colors.primary + '15' }]}>
                                        <ThemedText style={[styles.scheduleTimeText, { color: colors.primary }]}>
                                            {jadwal.waktu_mulai.slice(0, 5)}
                                        </ThemedText>
                                    </View>
                                    <ThemedText type="bodyMedium" style={styles.scheduleTitle}>{jadwal.judul}</ThemedText>
                                    <View style={styles.scheduleMeta}>
                                        <IconSymbol name="mappin" size={13} color={colors.textSecondary} />
                                        <ThemedText style={[styles.scheduleMetaText, { color: colors.textSecondary }]}>{jadwal.lokasi}</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.scheduleDate, { color: colors.textSecondary }]}>
                                        {new Date(jadwal.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </ThemedText>
                                </Card>
                            ))}
                        </ScrollView>
                    )}
                </Animated.View>

                {/* Pengumuman Terbaru */}
                <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.section}>
                    <SectionHeader
                        title="Pengumuman Terbaru"
                        linkText="Lihat Semua"
                        onPress={() => router.push('/(tabs)/pengumuman')}
                    />
                    {pinnedAnnouncements.length === 0 ? (
                        <Card variant="filled" padding="md">
                            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>Belum ada pengumuman terbaru.</ThemedText>
                        </Card>
                    ) : (
                        pinnedAnnouncements.map(p => (
                            <Pressable key={p.id} onPress={() => router.push(`/pengumuman/${p.id}` as any)}>
                                <AnnouncementCard announcement={toCardShape(p)} />
                            </Pressable>
                        ))
                    )}
                </Animated.View>

                {/* Informasi Kontak */}
                <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.section}>
                    <SectionHeader title="Informasi Kontak" />
                    <Card variant="outlined" padding="md">
                        {infoGereja ? (
                            <>
                                <InfoRow icon="mappin.circle.fill" label="Alamat" value={infoGereja.alamat} />
                                <InfoRow icon="phone.fill" label="Telepon" value={infoGereja.telepon} />
                                <InfoRow icon="envelope.fill" label="Email" value={infoGereja.email} />
                                {infoGereja.keuskupan_agung && (
                                    <InfoRow icon="building.columns.fill" label="Keuskupan Agung" value={infoGereja.keuskupan_agung} />
                                )}
                                {infoGereja.uskup_agung && (
                                    <InfoRow icon="person.fill" label="Uskup Agung" value={infoGereja.uskup_agung} />
                                )}
                                {infoGereja.jam_sekretariat?.[0] && (
                                    <InfoRow
                                        icon="clock.fill"
                                        label="Jam Sekretariat"
                                        value={`${infoGereja.jam_sekretariat[0].hari}: ${infoGereja.jam_sekretariat[0].jam}`}
                                    />
                                )}
                            </>
                        ) : (
                            <ThemedText style={{ color: colors.textSecondary }}>Memuat informasi...</ThemedText>
                        )}
                    </Card>
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    quickActionsContainer: { paddingHorizontal: Spacing.md, marginTop: -Spacing.xl },
    quickActionsCard: { ...Shadows.md, marginTop: 25 },
    quickActionsGrid: { flexDirection: 'row', gap: Spacing.sm },
    quickAction: { flex: 1, alignItems: 'center', gap: Spacing.xs },
    quickActionIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
    quickActionText: { fontSize: 12, textAlign: 'center' },
    content: { padding: Spacing.md, gap: Spacing.lg },
    section: { gap: Spacing.sm },
    horizontalScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
    scheduleCard: { width: 200, marginRight: Spacing.sm, gap: Spacing.xs },
    scheduleTime: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    scheduleTimeText: { fontSize: 16, fontWeight: 'bold' },
    scheduleTitle: { marginTop: 2 },
    scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    scheduleMetaText: { fontSize: 12, flex: 1 },
    scheduleDate: { fontSize: 12, marginTop: 2 },
});
