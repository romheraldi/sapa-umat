import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { dataKeluarga, lingkungan } from '@/constants/mock-data';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function DataUmatScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Calculate statistics
    const totalKeluarga = dataKeluarga.length;
    const totalJiwa = dataKeluarga.reduce((sum, k) => sum + k.anggotaKeluarga.length, 0);
    const totalLingkungan = lingkungan.length;

    // Filter families
    const filteredFamilies = dataKeluarga.filter(
        k =>
            k.namaKepalaKeluarga.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.noKartuKeluargaKatolik.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.lingkungan.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.quaternary }]}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Data Umat
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Basis Integrasi Data Umat Keuskupan</ThemedText>
            </Animated.View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.quaternary]} />}>
                {/* Statistics Cards */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsContainer}>
                    <Card variant="elevated" padding="md" style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                            <IconSymbol name="person.3.fill" size={24} color={colors.primary} />
                        </View>
                        <ThemedText type="heading2" style={styles.statValue}>
                            {totalKeluarga}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Keluarga</ThemedText>
                    </Card>

                    <Card variant="elevated" padding="md" style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: colors.secondary + '15' }]}>
                            <IconSymbol name="person.fill" size={24} color={colors.secondary} />
                        </View>
                        <ThemedText type="heading2" style={styles.statValue}>
                            {totalJiwa}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Jiwa</ThemedText>
                    </Card>

                    <Card variant="elevated" padding="md" style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: colors.tertiary + '15' }]}>
                            <IconSymbol name="house.fill" size={24} color={colors.tertiary} />
                        </View>
                        <ThemedText type="heading2" style={styles.statValue}>
                            {totalLingkungan}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Lingkungan</ThemedText>
                    </Card>
                </Animated.View>

                {/* Search Bar */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Cari nama KK atau No. KK..."
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
                    <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.sectionHeader}>
                        <ThemedText type="heading3">Daftar Keluarga</ThemedText>
                        <ThemedText style={[styles.count, { color: colors.textSecondary }]}>
                            {filteredFamilies.length} keluarga
                        </ThemedText>
                    </Animated.View>

                    {filteredFamilies.length === 0 ? (
                        <Animated.View entering={FadeInDown.duration(500)}>
                            <Card variant="outlined" padding="lg">
                                <View style={styles.emptyState}>
                                    <ThemedText type="heading3" style={{ color: colors.textSecondary }}>
                                        Tidak ada data
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                        {searchQuery ? 'Coba kata kunci lain' : 'Belum ada keluarga terdaftar'}
                                    </ThemedText>
                                </View>
                            </Card>
                        </Animated.View>
                    ) : (
                        filteredFamilies.map((family, idx) => (
                            <Animated.View key={family.id} entering={FadeInDown.duration(400).delay(400 + idx * 50)}>
                                <Pressable style={({ pressed }) => pressed && styles.pressed}>
                                    <Card variant="elevated" padding="md" style={styles.familyCard}>
                                        <View style={styles.familyHeader}>
                                            <View style={styles.familyInfo}>
                                                <ThemedText type="bodyMedium">{family.namaKepalaKeluarga}</ThemedText>
                                                <ThemedText style={[styles.familyMeta, { color: colors.textSecondary }]}>
                                                    No. KK: {family.noKartuKeluargaKatolik}
                                                </ThemedText>
                                            </View>
                                            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                                        </View>
                                        <View style={styles.familyDetails}>
                                            <View style={styles.detailItem}>
                                                <IconSymbol name="mappin.circle" size={16} color={colors.textSecondary} />
                                                <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                                                    {family.lingkungan} • {family.wilayah}
                                                </ThemedText>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <IconSymbol name="person.2" size={16} color={colors.textSecondary} />
                                                <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                                                    {family.anggotaKeluarga.length} anggota
                                                </ThemedText>
                                            </View>
                                        </View>
                                    </Card>
                                </Pressable>
                            </Animated.View>
                        ))
                    )}
                </View>

                {/* FAB placeholder info */}
                <Animated.View entering={FadeInDown.duration(500).delay(600)}>
                    <Card variant="filled" padding="md" style={styles.infoCard}>
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                            💡 <ThemedText type="captionMedium">Catatan:</ThemedText> Fitur penambahan keluarga baru dan form
                            pengisian data BASIS akan tersedia di update berikutnya. Data yang ditampilkan adalah contoh untuk
                            demonstrasi UI.
                        </ThemedText>
                    </Card>
                </Animated.View>
            </ScrollView>
        </View>
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
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    statValue: {
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: Spacing.xs,
    },
    section: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    count: {
        fontSize: 13,
    },
    familyCard: {
        marginBottom: Spacing.sm,
    },
    pressed: {
        opacity: 0.7,
    },
    familyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    familyInfo: {
        flex: 1,
        gap: Spacing.xs / 2,
    },
    familyMeta: {
        fontSize: 13,
    },
    familyDetails: {
        gap: Spacing.xs / 2,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailText: {
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
    },
    infoCard: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.xl,
    },
});
