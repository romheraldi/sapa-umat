import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { PaymentStatusType, TagihanIuran } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
};

const getStatusConfig = (status: PaymentStatusType, colors: typeof Colors.light) => {
    switch (status) {
        case 'belum_bayar':
            return { label: 'Belum Bayar', color: colors.error, bgColor: colors.error + '15' };
        case 'menunggu_pembayaran':
            return { label: 'Menunggu', color: colors.warning, bgColor: colors.warning + '15' };
        case 'lunas':
            return { label: 'Lunas', color: colors.success, bgColor: colors.success + '15' };
        case 'kadaluarsa':
            return { label: 'Gagal / Kadaluarsa', color: colors.error, bgColor: colors.error + '15' };
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RiwayatIuranScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const { data: response, isLoading, refetch, isRefetching, isError } = useQuery({
        queryKey: ['iuran-riwayat', selectedYear],
        queryFn: () => api.getTagihanIuran({ tahun: selectedYear }, token ?? undefined),
    });

    const tagihanList = response?.data || [];

    // Group by month, sorted descending
    const groupedByMonth = useMemo(() => {
        const sorted = [...tagihanList].sort((a, b) => b.bulan - a.bulan);
        const groups: Record<number, TagihanIuran[]> = {};
        for (const t of sorted) {
            if (!groups[t.bulan]) groups[t.bulan] = [];
            groups[t.bulan].push(t);
        }
        return groups;
    }, [tagihanList]);

    // Summary stats
    const stats = useMemo(() => {
        const total = tagihanList.length;
        const lunas = tagihanList.filter(t => t.status === 'lunas').length;
        const totalNominal = tagihanList.reduce((sum, t) => sum + t.nominal, 0);
        const totalPaid = tagihanList.filter(t => t.status === 'lunas').reduce((sum, t) => sum + t.nominal, 0);
        return { total, lunas, totalNominal, totalPaid };
    }, [tagihanList]);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.secondary]} />}>
            <View style={styles.content}>
                {/* Year Picker */}
                <Animated.View entering={FadeIn.duration(400)}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearContainer}>
                        {years.map(year => (
                            <Pressable
                                key={year}
                                style={[
                                    styles.yearTab,
                                    {
                                        backgroundColor: selectedYear === year ? colors.primary : colors.backgroundSecondary,
                                        borderRadius: BorderRadius.full,
                                    },
                                ]}
                                onPress={() => setSelectedYear(year)}>
                                <ThemedText
                                    style={[styles.yearText, { color: selectedYear === year ? '#FFFFFF' : colors.text }]}>
                                    {year}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Summary Stats */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <Card variant="elevated" padding="md">
                        <ThemedText type="captionMedium" style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
                            Ringkasan {selectedYear}
                        </ThemedText>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <ThemedText type="heading3" style={{ color: colors.primary }}>
                                    {stats.lunas}/{stats.total}
                                </ThemedText>
                                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                                    Bulan Lunas
                                </ThemedText>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.statItem}>
                                <ThemedText type="heading3" style={{ color: colors.success }}>
                                    {formatRupiah(stats.totalPaid)}
                                </ThemedText>
                                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                                    Total Dibayar
                                </ThemedText>
                            </View>
                        </View>

                        {/* Progress bar */}
                        <View style={[styles.progressBg, { backgroundColor: colors.backgroundSecondary }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.success,
                                        width: stats.total > 0 ? `${(stats.lunas / stats.total) * 100}%` : '0%',
                                    },
                                ]}
                            />
                        </View>
                    </Card>
                </Animated.View>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : isError ? (
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>Gagal mengambil data riwayat.</ThemedText>
                        <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
                            <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Coba Lagi</ThemedText>
                        </Pressable>
                    </View>
                ) : Object.keys(groupedByMonth).length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyIcon}>📋</ThemedText>
                        <ThemedText type="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                            Tidak ada riwayat untuk tahun {selectedYear}.
                        </ThemedText>
                    </View>
                ) : (
                    <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
                        <SectionHeader title={`Riwayat ${selectedYear}`} />
                        {Object.entries(groupedByMonth).map(([bulanStr, items], idx) => {
                            const bulan = parseInt(bulanStr, 10);
                            return (
                                <Animated.View key={bulan} entering={FadeInDown.duration(400).delay(250 + idx * 50)}>
                                    <Card variant="elevated" padding="xs" style={styles.monthCard}>
                                        <View style={[styles.monthHeader, { backgroundColor: colors.primary + '10' }]}>
                                            <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                                                {BULAN_NAMES[bulan - 1]}
                                            </ThemedText>
                                        </View>
                                        {items.map((tagihan, tIndex) => {
                                            const statusConfig = getStatusConfig(tagihan.status, colors);
                                            return (
                                                <View key={tagihan.id}>
                                                    <View style={styles.tagihanRow}>
                                                        <View style={styles.tagihanInfo}>
                                                            <ThemedText type="bodyMedium">
                                                                {tagihan.iuran_config?.nama || 'Iuran Bulanan'}
                                                            </ThemedText>
                                                            <ThemedText type="bodySemiBold" style={{ color: colors.primary }}>
                                                                {formatRupiah(tagihan.nominal)}
                                                            </ThemedText>
                                                            {tagihan.status === 'lunas' && tagihan.paid_at && (
                                                                <ThemedText type="small" style={{ color: colors.success, marginTop: 2 }}>
                                                                    Dibayar {new Date(tagihan.paid_at).toLocaleDateString('id-ID')}
                                                                </ThemedText>
                                                            )}
                                                        </View>
                                                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                                            <ThemedText type="smallMedium" style={{ color: statusConfig.color }}>
                                                                {statusConfig.label}
                                                            </ThemedText>
                                                        </View>
                                                    </View>
                                                    {tIndex < items.length - 1 && (
                                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </Card>
                                </Animated.View>
                            );
                        })}
                    </Animated.View>
                )}
            </View>
        </ScrollView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.md, gap: Spacing.lg },
    yearContainer: { flexGrow: 0, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
    yearTab: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, marginRight: Spacing.sm },
    yearText: { fontSize: 15, fontWeight: '600' },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    statItem: { alignItems: 'center', flex: 1 },
    statDivider: { width: 1, height: 40 },
    progressBg: {
        height: 6,
        borderRadius: 3,
        marginTop: Spacing.md,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    section: { gap: Spacing.sm },
    monthCard: { marginBottom: Spacing.sm },
    monthHeader: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
    tagihanRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    tagihanInfo: { flex: 1, gap: 2 },
    statusBadge: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    divider: { height: 1, marginHorizontal: Spacing.md },
    loadingContainer: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center' },
    errorContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    errorText: { color: 'red', textAlign: 'center' },
    retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    emptyContainer: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
});
