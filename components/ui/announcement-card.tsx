import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import type { Pengumuman } from '@/constants/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

interface AnnouncementCardProps {
    announcement: Pengumuman;
    onPress?: () => void;
}

export function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderRadius: BorderRadius.lg,
                },
                Shadows.md,
                pressed && styles.pressed,
            ]}>
            {announcement.gambar && (
                <Image
                    source={{ uri: announcement.gambar }}
                    style={[styles.image, { borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg }]}
                />
            )}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Badge label={announcement.kategori} variant={announcement.kategori} />
                    {announcement.isPinned && (
                        <View style={[styles.pinnedBadge, { backgroundColor: colors.warning + '20' }]}>
                            <ThemedText style={[styles.pinnedText, { color: colors.warning }]}>📌 Penting</ThemedText>
                        </View>
                    )}
                </View>
                <ThemedText type="heading3" numberOfLines={2}>
                    {announcement.judul}
                </ThemedText>
                <ThemedText style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={3}>
                    {announcement.ringkasan}
                </ThemedText>
                <View style={styles.footer}>
                    <ThemedText style={[styles.date, { color: colors.textSecondary }]}>
                        {formatDate(announcement.tanggalPublikasi)}
                    </ThemedText>
                    {announcement.author && (
                        <ThemedText style={[styles.author, { color: colors.textSecondary }]}>
                            oleh {announcement.author}
                        </ThemedText>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    pressed: {
        opacity: 0.9,
    },
    image: {
        width: '100%',
        height: 180,
        backgroundColor: '#E0E0E0',
    },
    content: {
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        gap: Spacing.sm,
        alignItems: 'center',
    },
    pinnedBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs / 2,
        borderRadius: BorderRadius.sm,
    },
    pinnedText: {
        fontSize: 12,
        fontWeight: '600',
    },
    summary: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    date: {
        fontSize: 12,
    },
    author: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
