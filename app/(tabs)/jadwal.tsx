import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ScheduleItem } from '@/components/ui/schedule-item';
import { SectionHeader } from '@/components/ui/section-header';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { ScheduleCategoryType } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

const FILTER_TABS: Array<{ id: ScheduleCategoryType | 'Semua'; label: string }> = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Misa', label: 'Misa' },
    { id: 'Adorasi', label: 'Adorasi' },
    { id: 'Ibadat', label: 'Ibadat' },
    { id: 'Sakramen', label: 'Sakramen' },
    { id: 'Kegiatan', label: 'Kegiatan' },
];

type HariDalamSeminggu = 'Minggu' | 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
const DAYS_ORDER: HariDalamSeminggu[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Helper to get day name from date string
const getDayName = (dateString: string): HariDalamSeminggu => {
    const days: HariDalamSeminggu[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateString);
    return days[d.getDay()];
};

export default function JadwalScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [activeFilter, setActiveFilter] = useState<ScheduleCategoryType | 'Semua'>('Semua');

    const { data: response, isLoading, refetch, isRefetching, isError } = useQuery({
        queryKey: ['jadwal', activeFilter],
        queryFn: () => api.getJadwal(activeFilter),
    });

    const jadwalList = response?.data || [];

    // Separate normal vs special schedules
    const regularSchedules = jadwalList.filter(s => !s.is_special);
    const specialSchedules = jadwalList.filter(s => s.is_special);

    // Group regular schedules by day
    const groupedByDay = DAYS_ORDER.reduce((acc, day) => {
        const daySchedules = regularSchedules.filter(s => getDayName(s.tanggal) === day);
        if (daySchedules.length > 0) {
            acc[day] = daySchedules;
        }
        return acc;
    }, {} as Record<HariDalamSeminggu, typeof regularSchedules>);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.primary }]}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Jadwal Ibadah
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Paroki Santo Arnoldus Janssen</ThemedText>
            </Animated.View>

            <View style={styles.content}>
                {/* Filter Tabs */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                        {FILTER_TABS.map(tab => (
                            <Pressable
                                key={tab.id}
                                style={[
                                    styles.filterTab,
                                    {
                                        backgroundColor: activeFilter === tab.id ? colors.primary : colors.backgroundSecondary,
                                        borderRadius: BorderRadius.full,
                                    },
                                ]}
                                onPress={() => setActiveFilter(tab.id)}>
                                <ThemedText
                                    style={[styles.filterText, { color: activeFilter === tab.id ? '#FFFFFF' : colors.text }]}>
                                    {tab.label}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </Animated.View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : isError ? (
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>Gagal mengambil data jadwal.</ThemedText>
                        <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
                            <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Coba Lagi</ThemedText>
                        </Pressable>
                    </View>
                ) : jadwalList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyText}>Tidak ada jadwal untuk kategori ini.</ThemedText>
                    </View>
                ) : (
                    <>
                        {/* Jadwal Mingguan by Day */}
                        {Object.keys(groupedByDay).length > 0 && (
                            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
                                <SectionHeader title="Jadwal Mingguan" />
                                {Object.entries(groupedByDay).map(([day, schedules], idx) => (
                                    <Animated.View key={day} entering={FadeInDown.duration(400).delay(300 + idx * 50)}>
                                        <Card variant="elevated" padding="xs" style={styles.dayCard}>
                                            <View style={[styles.dayHeader, { backgroundColor: colors.primary + '10' }]}>
                                                <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                                                    {day}
                                                </ThemedText>
                                            </View>
                                            {schedules.map((schedule, index) => (
                                                <View key={schedule.id}>
                                                    <ScheduleItem schedule={{
                                                        id: schedule.id,
                                                        judul: schedule.judul,
                                                        waktu: schedule.waktu_selesai
                                                            ? `${schedule.waktu_mulai.slice(0, 5)} - ${schedule.waktu_selesai.slice(0, 5)}`
                                                            : schedule.waktu_mulai.slice(0, 5),
                                                        lokasi: schedule.lokasi,
                                                        jenisIbadah: schedule.kategori as any,
                                                        hari: day as any,
                                                        kategori: 'Mingguan',
                                                        isAktif: true
                                                    }} />
                                                    {index < schedules.length - 1 && (
                                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                                    )}
                                                </View>
                                            ))}
                                        </Card>
                                    </Animated.View>
                                ))}
                            </Animated.View>
                        )}

                        {/* Jadwal Khusus */}
                        {specialSchedules.length > 0 && (
                            <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.section}>
                                <SectionHeader title="Jadwal Khusus" />
                                <Card variant="outlined" padding="xs">
                                    {specialSchedules.map((schedule, index) => (
                                        <View key={schedule.id}>
                                            <ScheduleItem schedule={{
                                                id: schedule.id,
                                                judul: schedule.judul,
                                                waktu: schedule.waktu_selesai
                                                    ? `${schedule.waktu_mulai.slice(0, 5)} - ${schedule.waktu_selesai.slice(0, 5)}`
                                                    : schedule.waktu_mulai.slice(0, 5),
                                                lokasi: schedule.lokasi,
                                                jenisIbadah: schedule.kategori as any,
                                                hari: getDayName(schedule.tanggal),
                                                tanggal: schedule.tanggal,
                                                kategori: 'Khusus',
                                                isAktif: true
                                            }} />
                                            {index < specialSchedules.length - 1 && (
                                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                            )}
                                        </View>
                                    ))}
                                </Card>
                            </Animated.View>
                        )}
                    </>
                )}

                {/* Info Note */}
                <Animated.View entering={FadeInDown.duration(500).delay(600)}>
                    <Card variant="filled" padding="md" style={styles.noteCard}>
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                            💡 <ThemedText type="captionMedium">Catatan:</ThemedText> Untuk pendaftaran misa pernikahan,
                            pembaptisan, atau sakramen lainnya, silakan hubungi sekretariat paroki.
                        </ThemedText>
                    </Card>
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: Spacing.xxl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md },
    headerTitle: { color: '#FFFFFF', marginBottom: Spacing.xs },
    headerSubtitle: { color: '#FFFFFF', opacity: 0.9, fontSize: 16 },
    content: { padding: Spacing.md, gap: Spacing.lg },
    filterContainer: { flexGrow: 0, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
    filterTab: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginRight: Spacing.sm },
    filterText: { fontSize: 14, fontWeight: '600' },
    section: { gap: Spacing.sm },
    dayCard: { marginBottom: Spacing.sm },
    dayHeader: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
    divider: { height: 1, marginHorizontal: Spacing.md },
    noteCard: { marginTop: Spacing.md },
    loadingContainer: { py: 100, alignItems: 'center', justifyContent: 'center' },
    errorContainer: { py: 60, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    errorText: { color: 'red', textAlign: 'center' },
    retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    emptyContainer: { py: 80, alignItems: 'center', justifyContent: 'center' },
    emptyText: { textAlign: 'center', color: 'gray' }
});
