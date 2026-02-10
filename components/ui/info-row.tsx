import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

interface InfoRowProps extends ViewProps {
    icon: string;
    label: string;
    value: string | ReactNode;
}

export function InfoRow({ icon, label, value, style, ...props }: InfoRowProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, style]} {...props}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
                <IconSymbol name={icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label}</ThemedText>
                {typeof value === 'string' ? (
                    <ThemedText type="bodyMedium">{value}</ThemedText>
                ) : (
                    value
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        gap: Spacing.xs / 2,
    },
    label: {
        fontSize: 13,
    },
});
