import { ThemedText } from '@/components/themed-text';
import { AnnouncementCard } from '@/components/ui/announcement-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { pengumuman } from '@/constants/mock-data';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { KategoriPengumuman } from '@/constants/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const CATEGORIES: Array<{ id: KategoriPengumuman | 'Semua'; label: string }> = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Liturgi', label: 'Liturgi' },
    { id: 'Kegiatan', label: 'Kegiatan' },
    { id: 'Sakramen', label: 'Sakramen' },
    { id: 'Sosial', label: 'Sosial' },
    { id: 'Umum', label: 'Umum' },
];

export default function PengumumanScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<KategoriPengumuman | 'Semua'>('Semua');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Filter announcements
    const filteredAnnouncements = pengumuman.filter(item => {
        const matchesSearch =
            searchQuery === '' ||
            item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.ringkasan.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = activeCategory === 'Semua' || item.kategori === activeCategory;

        return matchesSearch && matchesCategory;
    });

    // Sort by pinned first, then by date
    const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.tanggalPublikasi).getTime() - new Date(a.tanggalPublikasi).getTime();
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.tertiary }]}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Pengumuman
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Berita & Informasi Paroki</ThemedText>
            </Animated.View>

            <View style={styles.content}>
                {/* Search Bar */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Cari pengumuman..."
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

                {/* Category Filters */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                        {CATEGORIES.map(cat => (
                            <Pressable
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: activeCategory === cat.id ? colors.tertiary : colors.backgroundSecondary,
                                        borderRadius: BorderRadius.full,
                                    },
                                ]}
                                onPress={() => setActiveCategory(cat.id)}>
                                <ThemedText
                                    style={[styles.categoryText, { color: activeCategory === cat.id ? '#FFFFFF' : colors.text }]}>
                                    {cat.label}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Results Count */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                    <ThemedText style={[styles.resultsCount, { color: colors.textSecondary }]}>
                        {sortedAnnouncements.length} pengumuman ditemukan
                    </ThemedText>
                </Animated.View>

                {/* Announcements List */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.tertiary]} />}>
                    {sortedAnnouncements.length === 0 ? (
                        <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyState}>
                            <ThemedText type="heading3" style={{ color: colors.textSecondary }}>
                                Tidak ada pengumuman
                            </ThemedText>
                            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                {searchQuery
                                    ? 'Coba kata kunci lain atau ubah filter kategori'
                                    : 'Belum ada pengumuman untuk kategori ini'}
                            </ThemedText>
                        </Animated.View>
                    ) : (
                        sortedAnnouncements.map((announcement, idx) => (
                            <Animated.View key={announcement.id} entering={FadeInDown.duration(400).delay(400 + idx * 50)}>
                                <AnnouncementCard announcement={announcement} />
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            </View>
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
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: Spacing.xs,
    },
    categoriesContainer: {
        flexGrow: 0,
        marginBottom: Spacing.md,
    },
    categoryChip: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        marginRight: Spacing.sm,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    resultsCount: {
        fontSize: 13,
        marginBottom: Spacing.sm,
    },
    listContainer: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.sm,
    },
});
