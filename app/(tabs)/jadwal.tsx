import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ScheduleItem } from '@/components/ui/schedule-item';
import { SectionHeader } from '@/components/ui/section-header';
import { jadwalMisa } from '@/constants/mock-data';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { HariDalamSeminggu, JenisIbadah } from '@/constants/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const FILTER_TABS: Array<{ id: JenisIbadah | 'Semua'; label: string }> = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Misa', label: 'Misa' },
    { id: 'Adorasi', label: 'Adorasi' },
    { id: 'Ibadat', label: 'Ibadat' },
    { id: 'Sakramen', label: 'Sakramen' },
    { id: 'Kegiatan', label: 'Kegiatan' },
];

const DAYS_ORDER: HariDalamSeminggu[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [activeFilter, setActiveFilter] = useState<JenisIbadah | 'Semua'>('Semua');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simulate data refresh
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Filter jadwal based on active filter
    const filteredSchedules = jadwalMisa.filter(schedule => {
        if (activeFilter === 'Semua') return schedule.kategori === 'Mingguan';
        return schedule.jenisIbadah === activeFilter && schedule.kategori === 'Mingguan';
    });

    // Group by day
    const groupedByDay = DAYS_ORDER.reduce((acc, day) => {
        const daySchedules = filteredSchedules.filter(s => s.hari === day);
        if (daySchedules.length > 0) {
            acc[day] = daySchedules;
        }
        return acc;
    }, {} as Record<HariDalamSeminggu, typeof filteredSchedules>);

    // Special schedules (Khusus category)
    const specialSchedules = jadwalMisa.filter(s => s.kategori === 'Khusus');

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
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

                {/* Jadwal Mingguan by Day */}
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
                                        <ScheduleItem schedule={schedule} />
                                        {index < schedules.length - 1 && (
                                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                        )}
                                    </View>
                                ))}
                            </Card>
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Jadwal Khusus */}
                {specialSchedules.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.section}>
                        <SectionHeader title="Jadwal Khusus" />
                        <Card variant="outlined" padding="xs">
                            {specialSchedules.map((schedule, index) => (
                                <View key={schedule.id}>
                                    <ScheduleItem schedule={schedule} />
                                    {index < specialSchedules.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    )}
                                </View>
                            ))}
                        </Card>
                    </Animated.View>
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
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.md,
    },
    headerTitle: {
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    headerSubtitle: {
        color: '#FFFFFF',
        opacity: 0.9,
        fontSize: 16,
    },
    content: {
        padding: Spacing.md,
        gap: Spacing.lg,
    },
    filterContainer: {
        flexGrow: 0,
        marginHorizontal: -Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    filterTab: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginRight: Spacing.sm,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        gap: Spacing.sm,
    },
    dayCard: {
        marginBottom: Spacing.sm,
    },
    dayHeader: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.md,
    },
    noteCard: {
        marginTop: Spacing.md,
    },
});
