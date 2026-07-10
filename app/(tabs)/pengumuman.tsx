import { ThemedText } from '@/components/themed-text';
import { AnnouncementCard } from '@/components/ui/announcement-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { AnnouncementCategoryType, Pengumuman } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { router } from 'expo-router';

const CATEGORIES: Array<{ id: AnnouncementCategoryType | 'Semua'; label: string }> = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Liturgi', label: 'Liturgi' },
    { id: 'Kegiatan', label: 'Kegiatan' },
    { id: 'Sakramen', label: 'Sakramen' },
    { id: 'Sosial', label: 'Sosial' },
    { id: 'Umum', label: 'Umum' },
];

// Adapter: map API Pengumuman -> AnnouncementCard shape
const toCardShape = (p: Pengumuman) => ({
    id: p.id,
    judul: p.judul,
    kategori: p.kategori,
    ringkasan: p.ringkasan,
    tanggalPublikasi: p.published_at,
    isPinned: p.is_pinned,
    gambar: p.image_url ?? undefined,
});

export default function PengumumanScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<AnnouncementCategoryType | 'Semua'>('Semua');

    const { data: response, isLoading, refetch, isRefetching, isError } = useQuery({
        queryKey: ['pengumuman', activeCategory, searchQuery],
        queryFn: () => api.getPengumuman(activeCategory, searchQuery),
        staleTime: 60_000,
    });

    const list = response?.data || [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.tertiary }]}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Berita
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Berita & Informasi Paroki</ThemedText>
            </Animated.View>

            <View style={styles.content}>
                {/* Search Bar */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Cari berita..."
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
                {!isLoading && (
                    <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                        <ThemedText style={[styles.resultsCount, { color: colors.textSecondary }]}>
                            {list.length} berita ditemukan
                        </ThemedText>
                    </Animated.View>
                )}

                {/* Announcements List */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.tertiary]} />}>

                    {isLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.tertiary} />
                        </View>
                    ) : isError ? (
                        <View style={styles.centered}>
                            <ThemedText style={{ color: 'red', textAlign: 'center', marginBottom: Spacing.md }}>
                                Gagal mengambil data pengumuman.
                            </ThemedText>
                            <Pressable style={[styles.retryBtn, { backgroundColor: colors.tertiary }]} onPress={() => refetch()}>
                                <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Coba Lagi</ThemedText>
                            </Pressable>
                        </View>
                    ) : list.length === 0 ? (
                        <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyState}>
                            <ThemedText type="heading3" style={{ color: colors.textSecondary }}>
                                Tidak ada pengumuman
                            </ThemedText>
                            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                {searchQuery
                                    ? 'Coba kata kunci lain atau ubah filter kategori'
                                    : 'Belum ada berita untuk kategori ini'}
                            </ThemedText>
                        </Animated.View>
                    ) : (
                        list.map((item, idx) => (
                            <Animated.View key={item.id} entering={FadeInDown.duration(400).delay(400 + idx * 50)}>
                                <AnnouncementCard
                                    announcement={toCardShape(item)}
                                    onPress={() => router.push(`/pengumuman/${item.id}` as any)}
                                />
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: Spacing.xxl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md },
    headerTitle: { color: '#FFFFFF', marginBottom: Spacing.xs },
    headerSubtitle: { color: '#FFFFFF', opacity: 0.9, fontSize: 16 },
    content: { flex: 1, padding: Spacing.md },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md, gap: Spacing.sm, marginBottom: Spacing.md,
    },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.xs },
    categoriesContainer: { flexGrow: 0, marginBottom: Spacing.md },
    categoryChip: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, marginRight: Spacing.sm },
    categoryText: { fontSize: 14, fontWeight: '600' },
    resultsCount: { fontSize: 13, marginBottom: Spacing.sm },
    listContainer: { flex: 1 },
    centered: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
    retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
});
