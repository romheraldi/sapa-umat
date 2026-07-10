import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SectionHeader } from '@/components/ui/section-header';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { Keluarga, Umat } from '@/types/database';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const SAKRAMEN_LABELS = [
    { key: 'status_baptis', label: 'Baptis', color: '#1565C0' },
    { key: 'status_krisma', label: 'Krisma', color: '#2E7D32' },
] as const;

function AnggotaCard({ umat, index }: { umat: Umat; index: number }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Animated.View entering={FadeInDown.duration(400).delay(200 + index * 60)}>
            <Card variant="elevated" padding="md" style={styles.anggotaCard}>
                <View style={styles.anggotaHeader}>
                    <View style={[styles.avatarCircle, { backgroundColor: umat.jenis_kelamin === 'L' ? '#1565C020' : '#C5922E20' }]}>
                        <ThemedText style={{ fontSize: 20 }}>{umat.jenis_kelamin === 'L' ? '👨' : '👩'}</ThemedText>
                    </View>
                    <View style={styles.anggotaInfo}>
                        <ThemedText type="bodyMedium">{umat.nama_lengkap}</ThemedText>
                        <ThemedText style={[styles.anggotaMeta, { color: colors.textSecondary }]}>
                            {umat.status_dalam_keluarga} · {umat.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </ThemedText>
                        <ThemedText style={[styles.anggotaMeta, { color: colors.textSecondary }]}>
                            {umat.tempat_lahir}, {new Date(umat.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </ThemedText>
                    </View>
                </View>
                {/* Sakramen badges */}
                <View style={styles.sakramenRow}>
                    {SAKRAMEN_LABELS.map(s => (
                        umat[s.key] && (
                            <View key={s.key} style={[styles.sakramenBadge, { backgroundColor: s.color + '15' }]}>
                                <ThemedText style={[styles.sakramenText, { color: s.color }]}>✓ {s.label}</ThemedText>
                            </View>
                        )
                    ))}
                    <View style={[styles.sakramenBadge, { backgroundColor: '#55555515' }]}>
                        <ThemedText style={[styles.sakramenText, { color: '#555' }]}>{umat.status_perkawinan}</ThemedText>
                    </View>
                </View>
            </Card>
        </Animated.View>
    );
}

export default function DataUmatDetailScreen() {
    const { no_kk } = useLocalSearchParams<{ no_kk: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['keluarga', no_kk],
        queryFn: () => api.getKeluargaDetail(no_kk),
        enabled: !!no_kk && !!user,
    });

    const keluarga = response?.data as (Keluarga & { anggota: Umat[] }) | null;

    if (!user) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md }}>
                    Anda harus login untuk melihat detail keluarga.
                </ThemedText>
                <Pressable style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/login' as any)}>
                    <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Login</ThemedText>
                </Pressable>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.quaternary} />
            </View>
        );
    }

    if (isError || !keluarga) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ThemedText style={{ color: 'red' }}>Data keluarga tidak ditemukan.</ThemedText>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Info KK */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.quaternary }]}>
                <ThemedText type="heading2" style={styles.kkNumber}>{keluarga.no_kk_katolik}</ThemedText>
                <ThemedText style={styles.headerSub}>Kartu Keluarga Katolik</ThemedText>
            </Animated.View>

            <View style={styles.content}>
                {/* Alamat & Info */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.section}>
                    <SectionHeader title="Informasi Keluarga" />
                    <Card variant="outlined" padding="md">
                        <View style={styles.infoRow}>
                            <IconSymbol name="mappin.circle.fill" size={18} color={colors.textSecondary} />
                            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>{keluarga.alamat_lengkap}</ThemedText>
                        </View>
                        {keluarga.no_telepon && (
                            <View style={styles.infoRow}>
                                <IconSymbol name="phone.fill" size={18} color={colors.textSecondary} />
                                <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>{keluarga.no_telepon}</ThemedText>
                            </View>
                        )}
                        {keluarga.lingkungan && (
                            <View style={styles.infoRow}>
                                <IconSymbol name="house.fill" size={18} color={colors.textSecondary} />
                                <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                                    {(keluarga.lingkungan as any)?.nama}
                                </ThemedText>
                            </View>
                        )}
                    </Card>
                </Animated.View>

                {/* Anggota Keluarga */}
                <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.section}>
                    <SectionHeader
                        title={`Anggota Keluarga (${keluarga.anggota?.length ?? 0})`}
                    />
                    {!keluarga.anggota || keluarga.anggota.length === 0 ? (
                        <Card variant="outlined" padding="md">
                            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                Belum ada anggota keluarga terdaftar.
                            </ThemedText>
                        </Card>
                    ) : (
                        keluarga.anggota.map((u, idx) => (
                            <AnggotaCard key={u.id} umat={u} index={idx} />
                        ))
                    )}
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    loginBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    header: { paddingTop: Spacing.xxl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md },
    kkNumber: { color: '#FFFFFF', marginBottom: 4 },
    headerSub: { color: '#FFFFFF', opacity: 0.85, fontSize: 13 },
    content: { padding: Spacing.md, gap: Spacing.lg },
    section: { gap: Spacing.sm },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
    infoText: { fontSize: 14, flex: 1, lineHeight: 20 },
    anggotaCard: { marginBottom: Spacing.sm },
    anggotaHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
    avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    anggotaInfo: { flex: 1, gap: 2 },
    anggotaMeta: { fontSize: 13 },
    sakramenRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    sakramenBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    sakramenText: { fontSize: 11, fontWeight: '600' },
});
