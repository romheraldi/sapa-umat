import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface HeaderBannerProps {
    title: string;
    subtitle?: string;
    height?: number;
    backgroundImage?: ReactNode;
}

export function HeaderBanner({ title, subtitle, height = 200, backgroundImage }: HeaderBannerProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { height }]}>
            {backgroundImage}
            <LinearGradient
                colors={[
                    colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(128,0,32,0.6)',
                    colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(128,0,32,0.8)',
                ]}
                style={styles.gradient}
            />
            <View style={styles.content}>
                <ThemedText type="title" style={styles.title}>{title}</ThemedText>
                {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.xs,
        zIndex: 1,
    },
    title: {
        color: '#FFFFFF',
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 16,
        opacity: 0.95,
    },
});
