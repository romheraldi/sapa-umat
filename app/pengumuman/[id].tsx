import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function PengumumanDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const navigation = useNavigation();

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['pengumuman', id],
        queryFn: () => api.getPengumumanDetail(id),
        enabled: !!id,
    });

    const pengumuman = response?.data;

    useEffect(() => {
        if (pengumuman?.judul) {
            navigation.setOptions({ title: pengumuman.judul });
        }
    }, [pengumuman, navigation]);

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tertiary} />
            </View>
        );
    }

    if (isError || !pengumuman) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ThemedText style={{ color: 'red' }}>Pengumuman tidak ditemukan.</ThemedText>
            </View>
        );
    }

    const CATEGORY_COLORS: Record<string, string> = {
        Liturgi: '#800020',
        Kegiatan: '#1565C0',
        Sakramen: '#C5922E',
        Sosial: '#2E7D32',
        Umum: '#555',
    };
    const catColor = CATEGORY_COLORS[pengumuman.kategori] || '#555';

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Foto berita */}
            {pengumuman.image_url && (
                <Animated.View entering={FadeIn.duration(400)}>
                    <Image
                        source={{ uri: pengumuman.image_url }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                </Animated.View>
            )}

            <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
                {/* Category badge & pinned */}
                <View style={styles.badgesRow}>
                    <View style={[styles.badge, { backgroundColor: catColor + '20' }]}>
                        <ThemedText style={[styles.badgeText, { color: catColor }]}>{pengumuman.kategori}</ThemedText>
                    </View>
                    {pengumuman.is_pinned && (
                        <View style={[styles.badge, { backgroundColor: '#C5922E20' }]}>
                            <ThemedText style={[styles.badgeText, { color: '#C5922E' }]}>📌 Disematkan</ThemedText>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <ThemedText type="heading1" style={styles.title}>{pengumuman.judul}</ThemedText>
                    <ThemedText style={[styles.date, { color: colors.textSecondary }]}>
                        {new Date(pengumuman.published_at).toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                    </ThemedText>
                </Animated.View>

                {/* Summary */}
                {pengumuman.ringkasan && (
                    <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                        <Card variant="filled" padding="md" style={styles.summaryCard}>
                            <ThemedText style={[styles.summary, { color: colors.textSecondary }]}>
                                {pengumuman.ringkasan}
                            </ThemedText>
                        </Card>
                    </Animated.View>
                )}

                {/* Full content */}
                {pengumuman.konten_lengkap && (
                    <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                        <ThemedText style={[styles.fullContent, { color: colors.text, lineHeight: 24 }]}>
                            {pengumuman.konten_lengkap}
                        </ThemedText>
                    </Animated.View>
                )}
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heroImage: { width: '100%', height: 220 },
    content: { padding: Spacing.md, gap: Spacing.md },
    badgesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: Spacing.sm },
    date: { fontSize: 13, marginTop: Spacing.xs },
    summaryCard: { marginTop: Spacing.xs },
    summary: { fontSize: 15, fontStyle: 'italic' },
    fullContent: { marginTop: Spacing.sm },
});
