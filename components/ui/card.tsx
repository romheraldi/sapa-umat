import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    children: ReactNode;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: keyof typeof Spacing;
}

export function Card({ children, variant = 'elevated', padding = 'md', style, ...props }: CardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    padding: Spacing[padding],
                    borderRadius: BorderRadius.lg,
                },
                variant === 'elevated' && Shadows.md,
                variant === 'outlined' && {
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                variant === 'filled' && {
                    backgroundColor: colors.backgroundSecondary,
                },
                style,
            ]}
            {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
});
