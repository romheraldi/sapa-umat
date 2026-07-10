import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SectionHeader } from '@/components/ui/section-header';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';
import type { Keluarga, Umat } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type KeluargaWithAnggota = Keluarga & { anggota: Umat[] };

// Guest view: show search + locked card prompting login
function GuestView() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header dengan foto gereja */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                <Image
                    source={require('@/assets/images/church-hero.png')}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(21,101,192,0.55)', 'rgba(21,101,192,0.85)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <ThemedText type="title" style={styles.headerTitle}>Data Umat</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Basis Integrasi Data Umat Keuskupan</ThemedText>
            </Animated.View>
            <ScrollView contentContainerStyle={styles.guestContent}>
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <Card variant="elevated" padding="lg" style={styles.guestCard}>
                        <View style={styles.lockIcon}>
                            <ThemedText style={{ fontSize: 40 }}>🔒</ThemedText>
                        </View>
                        <ThemedText type="heading3" style={styles.guestTitle}>
                            Login Diperlukan
                        </ThemedText>
                        <ThemedText style={[styles.guestDesc, { color: colors.textSecondary }]}>
                            Fitur Data Umat (BASIS) hanya tersedia bagi umat terdaftar. Silakan login menggunakan akun umat Anda untuk melihat dan mengelola data keluarga.
                        </ThemedText>
                        <Pressable
                            style={[styles.loginBtn, { backgroundColor: colors.quaternary }]}
                            onPress={() => router.push('/login' as any)}>
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Masuk Sekarang</ThemedText>
                        </Pressable>
                    </Card>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(500).delay(400)}>
                    <Card variant="filled" padding="md" style={styles.noteCard}>
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                            💡 <ThemedText type="captionMedium">Catatan:</ThemedText> Akun umat dibuat oleh Sekretariat Paroki. Hubungi sekretariat jika belum memiliki akun.
                        </ThemedText>
                    </Card>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// Authenticated view: show full data
function AuthenticatedView() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: response, isLoading, refetch, isRefetching, isError } = useQuery({
        queryKey: ['keluarga', searchQuery],
        queryFn: () => api.getKeluarga(searchQuery),
        staleTime: 60_000,
    });

    const list = (response?.data || []) as KeluargaWithAnggota[];
    const totalJiwa = list.reduce((sum, k) => sum + (k.anggota?.length || 0), 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header dengan foto gereja */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                <Image
                    source={require('@/assets/images/church-hero.png')}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(21,101,192,0.55)', 'rgba(21,101,192,0.88)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <ThemedText type="title" style={styles.headerTitle}>Data Umat</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Basis Integrasi Data Umat Keuskupan</ThemedText>
            </Animated.View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.quaternary]} />}>

                {/* Stats */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsContainer}>
                    <Card variant="elevated" padding="md" style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                            <IconSymbol name="person.3.fill" size={22} color={colors.primary} />
                        </View>
                        <ThemedText type="heading2" style={styles.statValue}>{list.length}</ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Keluarga</ThemedText>
                    </Card>
                    <Card variant="elevated" padding="md" style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: colors.secondary + '15' }]}>
                            <IconSymbol name="person.fill" size={22} color={colors.secondary} />
                        </View>
                        <ThemedText type="heading2" style={styles.statValue}>{totalJiwa}</ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Total Jiwa</ThemedText>
                    </Card>
                </Animated.View>

                {/* User session + Logout */}
                <Animated.View entering={FadeInDown.duration(500).delay(150)}>
                    <Card variant="filled" padding="sm" style={styles.sessionCard}>
                        <View style={styles.sessionRow}>
                            <IconSymbol name="person.circle.fill" size={18} color={colors.quaternary} />
                            <ThemedText style={[styles.sessionText, { color: colors.textSecondary }]}>
                                Login sebagai: <ThemedText type="bodyMedium">{user?.email}</ThemedText>
                            </ThemedText>
                            <Pressable onPress={logout}>
                                <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Keluar</ThemedText>
                            </Pressable>
                        </View>
                    </Card>
                </Animated.View>

                {/* Search Bar */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Cari No. KK Katolik..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
                        </Pressable>
                    )}
                </Animated.View>

                {/* Family List */}
                <View style={styles.section}>
                    <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                        <SectionHeader title="Daftar Keluarga" />
                    </Animated.View>

                    {isLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.quaternary} />
                        </View>
                    ) : isError ? (
                        <Card variant="outlined" padding="md">
                            <ThemedText style={{ color: 'red', textAlign: 'center' }}>Gagal mengambil data umat.</ThemedText>
                        </Card>
                    ) : list.length === 0 ? (
                        <Card variant="outlined" padding="lg">
                            <View style={styles.emptyState}>
                                <ThemedText type="heading3" style={{ color: colors.textSecondary }}>Tidak ada data</ThemedText>
                                <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                    {searchQuery ? 'Coba kata kunci lain' : 'Belum ada keluarga terdaftar'}
                                </ThemedText>
                            </View>
                        </Card>
                    ) : (
                        list.map((family, idx) => (
                            <Animated.View key={family.id} entering={FadeInDown.duration(400).delay(400 + idx * 50)}>
                                <Pressable
                                    onPress={() => router.push(`/data-umat/${family.no_kk_katolik}` as any)}
                                    style={({ pressed }) => pressed && styles.pressed}>
                                    <Card variant="elevated" padding="md" style={styles.familyCard}>
                                        <View style={styles.familyHeader}>
                                            <View style={styles.familyInfo}>
                                                <ThemedText type="bodyMedium">{family.no_kk_katolik}</ThemedText>
                                                <ThemedText style={[styles.familyMeta, { color: colors.textSecondary }]}>
                                                    {family.alamat_lengkap}
                                                </ThemedText>
                                            </View>
                                            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                                        </View>
                                        <View style={styles.familyDetails}>
                                            {family.lingkungan && (
                                                <View style={styles.detailItem}>
                                                    <IconSymbol name="mappin.circle" size={15} color={colors.textSecondary} />
                                                    <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                                                        {(family.lingkungan as any)?.nama}
                                                    </ThemedText>
                                                </View>
                                            )}
                                            <View style={styles.detailItem}>
                                                <IconSymbol name="person.2" size={15} color={colors.textSecondary} />
                                                <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                                                    {family.anggota?.length ?? 0} anggota
                                                </ThemedText>
                                            </View>
                                        </View>
                                    </Card>
                                </Pressable>
                            </Animated.View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

export default function DataUmatScreen() {
    const { user } = useAuth();
    return user ? <AuthenticatedView /> : <GuestView />;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.md,
        overflow: 'hidden',
        position: 'relative',
    },
    headerTitle: { color: '#FFFFFF', marginBottom: Spacing.xs },
    headerSubtitle: { color: '#FFFFFF', opacity: 0.9, fontSize: 14 },
    content: { flex: 1 },
    statsContainer: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
    statCard: { flex: 1, alignItems: 'center', gap: Spacing.xs },
    statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
    statValue: { fontWeight: '700' },
    statLabel: { fontSize: 12 },
    sessionCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sessionText: { flex: 1, fontSize: 13 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, gap: Spacing.sm },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.xs },
    section: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg },
    centered: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
    familyCard: { marginBottom: Spacing.sm },
    pressed: { opacity: 0.7 },
    familyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    familyInfo: { flex: 1, gap: Spacing.xs / 2 },
    familyMeta: { fontSize: 13 },
    familyDetails: { gap: Spacing.xs / 2 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    detailText: { fontSize: 13 },
    // Guest styles
    guestContent: { padding: Spacing.md, gap: Spacing.md },
    guestCard: { alignItems: 'center', gap: Spacing.md },
    lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
    guestTitle: { textAlign: 'center' },
    guestDesc: { textAlign: 'center', fontSize: 14, lineHeight: 22 },
    loginBtn: { width: '100%', paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.sm },
    noteCard: { marginTop: Spacing.sm },
});
