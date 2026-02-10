import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
    label: string;
    error?: string;
    required?: boolean;
}

export function FormField({ label, error, required, style, ...props }: FormFieldProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>
                {label}
                {required && <ThemedText style={{ color: colors.error }}> *</ThemedText>}
            </ThemedText>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: error ? colors.error : colors.border,
                        borderRadius: BorderRadius.md,
                        color: colors.text,
                    },
                    style,
                ]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && (
                <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.xs,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        fontSize: 16,
    },
    error: {
        fontSize: 12,
    },
});
