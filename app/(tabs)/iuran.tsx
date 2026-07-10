import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import type { PaymentStatusType, TagihanIuran } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { router } from 'expo-router';

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const FILTER_TABS: Array<{ id: 'Semua' | PaymentStatusType; label: string }> = [
    { id: 'Semua', label: 'Semua' },
    { id: 'belum_bayar', label: 'Belum Bayar' },
    { id: 'lunas', label: 'Lunas' },
    { id: 'kadaluarsa', label: 'Kadaluarsa' },
];

const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
};

const getStatusConfig = (status: PaymentStatusType, colors: typeof Colors.light) => {
    switch (status) {
        case 'belum_bayar':
            return { label: 'Belum Bayar', color: colors.error, bgColor: colors.error + '15' };
        case 'menunggu_pembayaran':
            return { label: 'Menunggu Pembayaran', color: colors.warning, bgColor: colors.warning + '15' };
        case 'lunas':
            return { label: 'Lunas', color: colors.success, bgColor: colors.success + '15' };
        case 'kadaluarsa':
            return { label: 'Kadaluarsa', color: colors.textSecondary, bgColor: colors.textSecondary + '15' };
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IuranScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();
    const [activeFilter, setActiveFilter] = useState<'Semua' | PaymentStatusType>('Semua');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const { data: response, isLoading, refetch, isRefetching, isError } = useQuery({
        queryKey: ['iuran', activeFilter],
        queryFn: () => api.getTagihanIuran(
            activeFilter !== 'Semua' ? { status: activeFilter } : undefined,
            token ?? undefined,
        ),
    });

    const tagihanList = response?.data || [];

    // Current month's tagihan for the summary card
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentTagihan = useMemo(() => {
        return tagihanList.find(t => t.bulan === currentMonth && t.tahun === currentYear);
    }, [tagihanList, currentMonth, currentYear]);

    // Sort tagihan: most recent first
    const sortedTagihan = useMemo(() => {
        return [...tagihanList].sort((a, b) => {
            if (a.tahun !== b.tahun) return b.tahun - a.tahun;
            return b.bulan - a.bulan;
        });
    }, [tagihanList]);

    const formatPaidDate = (paidAt: string | null) => {
        if (!paidAt) return '';
        const d = new Date(paidAt);
        return `${d.getDate()} ${BULAN_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: selectedIds.size > 0 ? 100 : 0 }}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.secondary]} />}>
                {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.primary }]}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Iuran Bulanan
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Paroki Santo Arnoldus Janssen</ThemedText>
            </Animated.View>

            <View style={styles.content}>
                {/* Summary Card */}
                {currentTagihan && (
                    <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                        <Card variant="elevated" padding="md" style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                                    Tagihan Bulan Ini
                                </ThemedText>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusConfig(currentTagihan.status, colors).bgColor },
                                    ]}>
                                    <ThemedText
                                        type="smallMedium"
                                        style={{ color: getStatusConfig(currentTagihan.status, colors).color }}>
                                        {getStatusConfig(currentTagihan.status, colors).label}
                                    </ThemedText>
                                </View>
                            </View>
                            <ThemedText type="heading2" style={{ color: colors.primary, marginTop: Spacing.xs }}>
                                {formatRupiah(currentTagihan.nominal)}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                                {BULAN_NAMES[currentTagihan.bulan - 1]} {currentTagihan.tahun}
                                {currentTagihan.iuran_config ? ` • ${currentTagihan.iuran_config.nama}` : ''}
                            </ThemedText>

                            {currentTagihan.status === 'lunas' && currentTagihan.paid_at && (
                                <ThemedText type="small" style={{ color: colors.success, marginTop: Spacing.sm }}>
                                    ✓ Dibayar pada {formatPaidDate(currentTagihan.paid_at)}
                                </ThemedText>
                            )}

                            {currentTagihan.status === 'belum_bayar' && (
                                <Pressable
                                    style={[styles.payButton, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/iuran/bayar?ids=${currentTagihan.id}`)}>
                                    <ThemedText type="bodyMedium" style={{ color: '#FFFFFF' }}>
                                        Bayar Sekarang
                                    </ThemedText>
                                </Pressable>
                            )}

                            {currentTagihan.status === 'menunggu_pembayaran' && currentTagihan.midtrans_order_id && (
                                <Pressable
                                    style={[styles.payButton, { backgroundColor: colors.warning }]}
                                    onPress={() => router.push(`/iuran/bayar?ids=${currentTagihan.id}`)}>
                                    <ThemedText type="bodyMedium" style={{ color: '#FFFFFF' }}>
                                        Lihat QR Pembayaran
                                    </ThemedText>
                                </Pressable>
                            )}
                        </Card>
                    </Animated.View>
                )}

                {/* Filter Tabs */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
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

                {/* Content */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : isError ? (
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>Gagal mengambil data iuran.</ThemedText>
                        <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
                            <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Coba Lagi</ThemedText>
                        </Pressable>
                    </View>
                ) : sortedTagihan.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={[styles.emptyIcon]}>📋</ThemedText>
                        <ThemedText type="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                            Belum ada tagihan iuran.
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
                            Tagihan akan muncul di sini saat tersedia.
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Daftar Tagihan"
                            linkText="Riwayat"
                            onPress={() => router.push('/iuran/riwayat')}
                        />
                        {sortedTagihan.map((tagihan, index) => (
                            <TagihanCard
                                key={tagihan.id}
                                tagihan={tagihan}
                                colors={colors}
                                index={index}
                                isSelected={selectedIds.has(tagihan.id)}
                                onToggle={() => toggleSelection(tagihan.id)}
                            />
                        ))}
                    </View>
                )}

                {/* Info Note */}
                <Animated.View entering={FadeInDown.duration(500).delay(600)}>
                    <Card variant="filled" padding="md" style={styles.noteCard}>
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                            💡 <ThemedText type="captionMedium">Catatan:</ThemedText> Pembayaran iuran bulanan
                            menggunakan QRIS yang dapat dipindai dengan e-wallet atau mobile banking Anda.
                            Konfirmasi pembayaran otomatis.
                        </ThemedText>
                    </Card>
                </Animated.View>
            </View>
        </ScrollView>
        {selectedIds.size > 0 && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.fabContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <View style={styles.fabInner}>
                    <View>
                        <ThemedText type="captionMedium" style={{ color: colors.textSecondary }}>
                            {selectedIds.size} Tagihan Terpilih
                        </ThemedText>
                        <ThemedText type="bodySemiBold" style={{ color: colors.primary }}>
                            {formatRupiah(
                                Array.from(selectedIds).reduce((acc, selectedId) => {
                                    const t = tagihanList.find(item => item.id === selectedId);
                                    return acc + (t?.nominal || 0);
                                }, 0)
                            )}
                        </ThemedText>
                    </View>
                    <Pressable
                        style={[styles.fabButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push(`/iuran/bayar?ids=${Array.from(selectedIds).join(',')}`)}>
                        <ThemedText type="bodyMedium" style={{ color: '#FFFFFF', fontWeight: '600' }}>Bayar Terpilih</ThemedText>
                    </Pressable>
                </View>
            </Animated.View>
        )}
        </View>
    );
}

// ─── Tagihan Card ─────────────────────────────────────────────────────────────

function TagihanCard({
    tagihan,
    colors,
    index,
    isSelected,
    onToggle,
}: {
    tagihan: TagihanIuran;
    colors: typeof Colors.light;
    index: number;
    isSelected: boolean;
    onToggle: () => void;
}) {
    const statusConfig = getStatusConfig(tagihan.status, colors);
    const canPay = tagihan.status === 'belum_bayar' || tagihan.status === 'menunggu_pembayaran';

    const handlePress = () => {
        if (canPay) {
            onToggle();
        }
    };

    return (
        <Pressable onPress={canPay ? handlePress : undefined} disabled={!canPay}>
            <Card 
                variant="elevated" 
                padding="md" 
                style={[
                    styles.tagihanCard, 
                    { borderWidth: 1, borderColor: isSelected ? colors.primary : 'transparent' }
                ]}
            >
                <View style={styles.tagihanRow}>
                    <View style={styles.tagihanLeft}>
                        {canPay && (
                            <View style={[
                                styles.checkbox,
                                { 
                                    borderColor: isSelected ? colors.primary : colors.textSecondary + '50',
                                    backgroundColor: isSelected ? colors.primary : 'transparent'
                                }
                            ]}>
                                <Ionicons 
                                    name="checkmark" 
                                    size={16} 
                                    color="#FFFFFF" 
                                    style={{ opacity: isSelected ? 1 : 0 }} 
                                />
                            </View>
                        )}
                        <View style={[styles.monthIndicator, { backgroundColor: colors.primary + '15' }]}>
                            <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                                {BULAN_NAMES[tagihan.bulan - 1].substring(0, 3).toUpperCase()}
                            </ThemedText>
                            <ThemedText type="small" style={{ color: colors.primary }}>
                                {tagihan.tahun}
                            </ThemedText>
                        </View>
                        <View style={styles.tagihanInfo}>
                            <ThemedText type="bodyMedium">
                                {BULAN_NAMES[tagihan.bulan - 1]} {tagihan.tahun}
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
                    </View>
                    <View style={styles.tagihanRight}>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <ThemedText type="smallMedium" style={{ color: statusConfig.color }}>
                                {statusConfig.label}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </Card>
        </Pressable>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: Spacing.xxl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md },
    headerTitle: { color: '#FFFFFF', marginBottom: Spacing.xs },
    headerSubtitle: { color: '#FFFFFF', opacity: 0.9, fontSize: 16 },
    content: { padding: Spacing.md, gap: Spacing.lg },
    summaryCard: { borderLeftWidth: 4, borderLeftColor: '#800020' },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    payButton: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm + 4,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    filterContainer: { flexGrow: 0, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
    filterTab: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginRight: Spacing.sm },
    filterText: { fontSize: 14, fontWeight: '600' },
    section: { gap: Spacing.sm },
    tagihanCard: { marginBottom: Spacing.xs },
    tagihanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tagihanLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
    tagihanRight: { alignItems: 'flex-end' },
    tagihanInfo: { flex: 1, gap: 2 },
    monthIndicator: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteCard: { marginTop: Spacing.md },
    loadingContainer: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center' },
    errorContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    errorText: { color: 'red', textAlign: 'center' },
    retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    emptyContainer: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.md,
        paddingBottom: Spacing.xl, // Give extra padding for safe area / tab bar context
        borderTopWidth: 1,
    },
    fabInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fabButton: {
        paddingVertical: Spacing.sm + 4,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
});
