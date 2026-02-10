import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Pressable, StyleSheet, View } from 'react-native';

interface SectionHeaderProps {
    title: string;
    linkText?: string;
    onPress?: () => void;
}

export function SectionHeader({ title, linkText, onPress }: SectionHeaderProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.container}>
            <ThemedText type="heading3">{title}</ThemedText>
            {linkText && onPress && (
                <Pressable onPress={onPress}>
                    <ThemedText style={[styles.link, { color: colors.primary }]}>{linkText}</ThemedText>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    link: {
        fontSize: 14,
        fontWeight: '600',
    },
});
