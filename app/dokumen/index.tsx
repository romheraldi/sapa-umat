import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://www.sapa-umat.my.id/api';

interface Dokumen {
    id: string;
    judul: string;
    kategori: string;
    file_name: string;
    file_size: number | null;
    keterangan: string | null;
    status: string;
    created_at: string;
}

// ─── Kategori Config ──────────────────────────────────────────────────────────
const KATEGORI_CONFIG: Record<string, { color: string; icon: string; bg: string; sfIcon: string }> = {
    KTP:             { color: '#3B82F6', icon: '🪪', bg: '#EFF6FF',  sfIcon: 'creditcard.fill' },
    KK:              { color: '#10B981', icon: '👨‍👩‍👧‍👦', bg: '#ECFDF5', sfIcon: 'house.fill' },
    'Dokumen Gereja':{ color: '#800020', icon: '⛪', bg: '#FFF5F5',  sfIcon: 'building.columns.fill' },
    Umum:            { color: '#4A90E2', icon: '📄', bg: '#EFF6FF',  sfIcon: 'doc.fill' },
    Sakramen:        { color: '#9B59B6', icon: '✝️', bg: '#F5F3FF',  sfIcon: 'cross.fill' },
    Administrasi:    { color: '#27AE60', icon: '📋', bg: '#ECFDF5',  sfIcon: 'list.clipboard.fill' },
    Keuangan:        { color: '#E67E22', icon: '💰', bg: '#FFF7ED',  sfIcon: 'banknote.fill' },
    Lainnya:         { color: '#95A5A6', icon: '📁', bg: '#F9FAFB',  sfIcon: 'folder.fill' },
};

const FILTER_TABS = ['Semua', 'KTP', 'KK', 'Dokumen Gereja', 'Lainnya'] as const;

function getKategoriConfig(kategori: string) {
    return KATEGORI_CONFIG[kategori] ?? { color: '#6B7280', icon: '📄', bg: '#F9FAFB', sfIcon: 'doc.fill' };
}

function formatBytes(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string; bg: string }> = {
        aktif:    { label: 'Aktif',    color: '#16A34A', bg: '#DCFCE7' },
        pending:  { label: 'Pending',  color: '#D97706', bg: '#FEF3C7' },
        ditolak:  { label: 'Ditolak', color: '#DC2626', bg: '#FEE2E2' },
        arsip:    { label: 'Arsip',   color: '#6B7280', bg: '#F3F4F6' },
    };
    const s = config[status?.toLowerCase()] ?? config.aktif;
    return (
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <ThemedText style={[styles.statusText, { color: s.color }]}>{s.label}</ThemedText>
        </View>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '12' }]}>
                <IconSymbol name="doc.badge.plus" size={56} color={colors.primary} />
            </View>
            <ThemedText type="heading3" style={[styles.emptyTitle, { color: colors.text }]}>
                Belum Ada Dokumen
            </ThemedText>
            <ThemedText style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Upload KTP, KK, atau dokumen gereja Anda untuk menyimpannya dengan aman.
            </ThemedText>
            <Pressable
                style={({ pressed }) => [styles.emptyBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                onPress={onUpload}>
                <IconSymbol name="plus" size={16} color="#fff" />
                <ThemedText style={styles.emptyBtnText}>Upload Dokumen Pertama</ThemedText>
            </Pressable>
        </Animated.View>
    );
}

// ─── Document Card ────────────────────────────────────────────────────────────
function DokumenCard({
    item,
    index,
    onDelete,
    isDeleting,
}: {
    item: Dokumen;
    index: number;
    onDelete: (doc: Dokumen) => void;
    isDeleting: boolean;
}) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const cfg = getKategoriConfig(item.kategori);

    return (
        <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Top Row */}
                <View style={styles.cardTop}>
                    {/* Icon */}
                    <View style={[styles.docIcon, { backgroundColor: cfg.bg }]}>
                        <IconSymbol name={cfg.sfIcon as any} size={26} color={cfg.color} />
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                        <ThemedText style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.judul}
                        </ThemedText>
                        <ThemedText style={[styles.cardFileName, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.file_name}
                        </ThemedText>
                        <View style={styles.cardChips}>
                            <View style={[styles.kategoriChip, { backgroundColor: cfg.color + '18' }]}>
                                <ThemedText style={[styles.kategoriText, { color: cfg.color }]}>
                                    {item.kategori}
                                </ThemedText>
                            </View>
                            <StatusBadge status={item.status} />
                            {item.file_size ? (
                                <ThemedText style={[styles.sizeText, { color: colors.textSecondary }]}>
                                    {formatBytes(item.file_size)}
                                </ThemedText>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* Keterangan */}
                {item.keterangan ? (
                    <View style={[styles.keteranganBox, { backgroundColor: colors.backgroundSecondary }]}>
                        <IconSymbol name="text.alignleft" size={13} color={colors.textSecondary} />
                        <ThemedText style={[styles.keteranganText, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.keterangan}
                        </ThemedText>
                    </View>
                ) : null}

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.footerLeft}>
                        <IconSymbol name="calendar" size={13} color={colors.textSecondary} />
                        <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                            {formatDate(item.created_at)}
                        </ThemedText>
                    </View>
                    <Pressable
                        onPress={() => onDelete(item)}
                        disabled={isDeleting}
                        style={({ pressed }) => [styles.deleteBtn, { opacity: pressed || isDeleting ? 0.5 : 1 }]}>
                        {isDeleting
                            ? <ActivityIndicator size="small" color="#e53e3e" />
                            : (
                                <>
                                    <IconSymbol name="trash" size={14} color="#e53e3e" />
                                    <ThemedText style={styles.deleteBtnText}>Hapus</ThemedText>
                                </>
                            )}
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DokumenScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user, token, logout } = useAuth();

    const [dokumen, setDokumen] = useState<Dokumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('Semua');

    const fetchDokumen = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/dokumen`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setDokumen(json.data ?? []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => { fetchDokumen(); }, [fetchDokumen]);

    const handleDelete = (doc: Dokumen) => {
        Alert.alert(
            'Hapus Dokumen',
            `Apakah Anda yakin ingin menghapus "${doc.judul}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus', style: 'destructive', onPress: async () => {
                        setDeletingId(doc.id);
                        try {
                            const res = await fetch(`${API_BASE}/dokumen/${doc.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            const json = await res.json();
                            if (json.error) {
                                Alert.alert('Gagal', json.error);
                            } else {
                                fetchDokumen();
                            }
                        } catch {
                            Alert.alert('Gagal', 'Tidak dapat menghapus dokumen. Coba lagi.');
                        }
                        setDeletingId(null);
                    },
                },
            ]
        );
    };

    // ── Not logged in ─────────────────────────────────────────────────────────
    if (!user) {
        return (
            <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.primary }]}>
                    <ThemedText type="title" style={styles.headerTitle}>Dokumen Saya</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Paroki Santo Arnoldus Janssen</ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(500)} style={styles.notLoginWrap}>
                    <View style={[styles.lockCircle, { backgroundColor: colors.primary + '12' }]}>
                        <IconSymbol name="lock.fill" size={48} color={colors.primary} />
                    </View>
                    <ThemedText type="heading3" style={[styles.emptyTitle, { color: colors.text }]}>
                        Perlu Masuk Akun
                    </ThemedText>
                    <ThemedText style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                        Masuk untuk mengakses dan mengelola dokumen pribadi Anda.
                    </ThemedText>
                    <Pressable
                        style={({ pressed }) => [styles.emptyBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => router.push('/login')}>
                        <IconSymbol name="person.fill" size={16} color="#fff" />
                        <ThemedText style={styles.emptyBtnText}>Masuk Sekarang</ThemedText>
                    </Pressable>
                </Animated.View>

                {/* Logo footer */}
                <LogoFooter />
            </View>
        );
    }

    // ── Filtered data ─────────────────────────────────────────────────────────
    const filtered = activeFilter === 'Semua'
        ? dokumen
        : dokumen.filter(d => d.kategori === activeFilter);

    // ── Count per category ────────────────────────────────────────────────────
    const countFor = (cat: string) =>
        cat === 'Semua' ? dokumen.length : dokumen.filter(d => d.kategori === cat).length;

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
            {/* ── Header ── */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerRow}>
                    <View>
                        <ThemedText type="title" style={styles.headerTitle}>Dokumen Saya</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Paroki Santo Arnoldus Janssen</ThemedText>
                    </View>
                    <View style={styles.headerBtns}>
                        {/* Logout */}
                        <Pressable
                            style={styles.headerIconBtn}
                            onPress={() =>
                                Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
                                    { text: 'Batal', style: 'cancel' },
                                    { text: 'Keluar', style: 'destructive', onPress: logout },
                                ])
                            }>
                            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#fff" />
                        </Pressable>
                        {/* Upload */}
                        <Pressable
                            style={[styles.uploadHeaderBtn]}
                            onPress={() => router.push('/dokumen/upload' as any)}>
                            <IconSymbol name="plus" size={16} color={colors.primary} />
                            <ThemedText style={[styles.uploadHeaderText, { color: colors.primary }]}>Upload</ThemedText>
                        </Pressable>
                    </View>
                </View>

                {/* Stats strip */}
                <View style={styles.statsStrip}>
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNum}>{dokumen.length}</ThemedText>
                        <ThemedText style={styles.statLabel}>Total</ThemedText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNum}>
                            {dokumen.filter(d => d.status?.toLowerCase() === 'aktif').length}
                        </ThemedText>
                        <ThemedText style={styles.statLabel}>Aktif</ThemedText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNum}>
                            {[...new Set(dokumen.map(d => d.kategori))].length}
                        </ThemedText>
                        <ThemedText style={styles.statLabel}>Kategori</ThemedText>
                    </View>
                </View>
            </Animated.View>

            {/* ── Filter Chips ── */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={FILTER_TABS as unknown as string[]}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.filterContainer}
                    renderItem={({ item: tab }) => {
                        const active = activeFilter === tab;
                        const cfg = KATEGORI_CONFIG[tab];
                        return (
                            <Pressable
                                style={[
                                    styles.filterChip,
                                    active
                                        ? { backgroundColor: colors.primary }
                                        : { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, borderWidth: 1 },
                                ]}
                                onPress={() => setActiveFilter(tab)}>
                                {cfg && (
                                    <IconSymbol
                                        name={cfg.sfIcon as any}
                                        size={14}
                                        color={active ? '#fff' : cfg.color}
                                    />
                                )}
                                <ThemedText style={[styles.filterText, { color: active ? '#fff' : colors.text }]}>
                                    {tab}
                                </ThemedText>
                                <View style={[styles.filterBadge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.border }]}>
                                    <ThemedText style={[styles.filterBadgeText, { color: active ? '#fff' : colors.textSecondary }]}>
                                        {countFor(tab)}
                                    </ThemedText>
                                </View>
                            </Pressable>
                        );
                    }}
                />
            </Animated.View>

            {/* ── Content ── */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat dokumen...</ThemedText>
                </View>
            ) : filtered.length === 0 ? (
                <FlatList
                    data={[]}
                    renderItem={null}
                    ListEmptyComponent={
                        <EmptyState onUpload={() => router.push('/dokumen/upload' as any)} />
                    }
                    ListFooterComponent={<LogoFooter />}
                    contentContainerStyle={{ flexGrow: 1 }}
                />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => (
                        <DokumenCard
                            item={item}
                            index={index}
                            onDelete={handleDelete}
                            isDeleting={deletingId === item.id}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchDokumen(); }}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListFooterComponent={<LogoFooter />}
                />
            )}
        </View>
    );
}

// ─── Logo Footer ──────────────────────────────────────────────────────────────
function LogoFooter() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    return (
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoFooter}>
            <View style={[styles.logoDivider, { backgroundColor: colors.border }]} />
            <Image
                source={require('@/assets/images/paroki-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
            />
            <ThemedText style={[styles.logoName, { color: colors.primary }]}>
                Paroki Santo Arnoldus Janssen
            </ThemedText>
            <ThemedText style={[styles.logoSub, { color: colors.textSecondary }]}>
                Bekasi · Keuskupan Agung Jakarta
            </ThemedText>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: { flex: 1 },

    // Header
    header: {
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
    },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    headerTitle: { color: '#FFFFFF', marginBottom: 2 },
    headerSubtitle: { color: '#FFFFFF', opacity: 0.85, fontSize: 14 },
    headerBtns: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerIconBtn: {
        width: 38, height: 38,
        borderRadius: BorderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    uploadHeaderBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: Spacing.md, paddingVertical: 9,
        borderRadius: BorderRadius.md,
    },
    uploadHeaderText: { fontWeight: '700', fontSize: 14 },

    // Stats strip
    statsStrip: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
    statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },

    // Filter
    filterContainer: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: BorderRadius.full,
    },
    filterText: { fontSize: 13, fontWeight: '600' },
    filterBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    filterBadgeText: { fontSize: 11, fontWeight: '700' },

    // List
    list: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

    // Card
    card: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardTop: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
    docIcon: {
        width: 52, height: 52,
        borderRadius: BorderRadius.lg,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    cardInfo: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
    cardFileName: { fontSize: 12, fontFamily: 'monospace' },
    cardChips: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
    kategoriChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    kategoriText: { fontSize: 11, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '600' },
    sizeText: { fontSize: 11 },

    // Keterangan
    keteranganBox: {
        flexDirection: 'row', gap: 6, alignItems: 'flex-start',
        marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
        padding: Spacing.sm, borderRadius: BorderRadius.md,
    },
    keteranganText: { fontSize: 12, lineHeight: 17, flex: 1, fontStyle: 'italic' },

    // Footer
    cardFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: 10,
        borderTopWidth: 1,
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dateText: { fontSize: 12 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
    deleteBtnText: { color: '#e53e3e', fontSize: 13, fontWeight: '600' },

    // Empty / Not-logged-in
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    loadingText: { fontSize: 14, marginTop: 4 },
    notLoginWrap: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        padding: Spacing.xl, gap: Spacing.md,
    },
    emptyWrap: {
        alignItems: 'center',
        padding: Spacing.xl, paddingTop: Spacing.xxl,
        gap: Spacing.md,
    },
    lockCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    emptyIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { textAlign: 'center' },
    emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: Spacing.lg },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: Spacing.xl, paddingVertical: 13,
        borderRadius: BorderRadius.md, marginTop: Spacing.xs,
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // Logo Footer
    logoFooter: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    logoDivider: { width: 60, height: 1, marginBottom: Spacing.sm },
    logoImage: { width: 100, height: 100 },
    logoName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
    logoSub: { fontSize: 12, textAlign: 'center' },
});
