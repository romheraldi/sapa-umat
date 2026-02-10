import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import type { JadwalMisa } from '@/constants/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Pressable, StyleSheet, View } from 'react-native';

interface ScheduleItemProps {
    schedule: JadwalMisa;
    onPress?: () => void;
}

export function ScheduleItem({ schedule, onPress }: ScheduleItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="calendar" size={24} color={colors.primary} />
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <ThemedText type="bodyMedium">{schedule.judul}</ThemedText>
                    {schedule.jenisIbadah && <Badge label={schedule.jenisIbadah} variant={schedule.jenisIbadah} />}
                </View>
                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <IconSymbol name="clock.fill" size={14} color={colors.textSecondary} />
                        <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                            {schedule.hari ? `${schedule.hari}, ` : ''}{schedule.waktu}
                        </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                        <IconSymbol name="mappin.circle.fill" size={14} color={colors.textSecondary} />
                        <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                            {schedule.lokasi}
                        </ThemedText>
                    </View>
                </View>
                {schedule.celebran && (
                    <ThemedText style={[styles.celebrant, { color: colors.textSecondary }]}>
                        {schedule.celebran}
                    </ThemedText>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    pressed: {
        opacity: 0.7,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        gap: Spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    details: {
        gap: Spacing.xs / 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailText: {
        fontSize: 13,
    },
    celebrant: {
        fontSize: 13,
        fontStyle: 'italic',
    },
});
