import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    icon?: ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    icon,
    style,
    disabled,
    ...props
}: ButtonProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const getBackgroundColor = () => {
        if (disabled) return colors.backgroundSecondary;
        switch (variant) {
            case 'primary':
                return colors.primary;
            case 'secondary':
                return colors.secondary;
            case 'outline':
            case 'ghost':
                return 'transparent';
            default:
                return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        switch (variant) {
            case 'primary':
                return '#FFFFFF';
            case 'secondary':
                return '#FFFFFF';
            case 'outline':
            case 'ghost':
                return colors.primary;
            default:
                return '#FFFFFF';
        }
    };

    const getPadding = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
            case 'large':
                return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
            default:
                return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg };
        }
    };

    const buttonStyle = (pressed: boolean) => [
        styles.button,
        {
            backgroundColor: getBackgroundColor(),
            borderRadius: BorderRadius.md,
            ...getPadding(),
        },
        variant === 'outline' && {
            borderWidth: 1.5,
            borderColor: colors.primary,
        },
        variant !== 'ghost' && Shadows.sm,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
    ];

    return (
        <Pressable
            style={({ pressed }) => buttonStyle(pressed)}
            disabled={disabled || loading}
            {...props}>
            {({ pressed }) => (
                <ThemedText
                    style={[
                        styles.text,
                        {
                            color: getTextColor(),
                            fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
                            opacity: pressed ? 0.8 : 1,
                        },
                    ]}>
                    {loading ? (
                        <ActivityIndicator size="small" color={getTextColor()} />
                    ) : (
                        <>
                            {icon && icon}
                            {children}
                        </>
                    )}
                </ThemedText>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    pressed: {
        opacity: 0.9,
    },
    disabled: {
        opacity: 0.5,
    },
});
