import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { JenisIbadah, KategoriPengumuman } from '@/constants/types';
import { StyleSheet, View } from 'react-native';

interface BadgeProps {
    label: string;
    variant?: KategoriPengumuman | JenisIbadah | 'default';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
    const getColor = () => {
        switch (variant) {
            // Pengumuman categories
            case 'Liturgi':
                return { bg: '#800020', text: '#FFFFFF' }; // Burgundy
            case 'Kegiatan':
                return { bg: '#2E7D32', text: '#FFFFFF' }; // Green
            case 'Sakramen':
                return { bg: '#C5922E', text: '#FFFFFF' }; // Gold
            case 'Sosial':
                return { bg: '#1565C0', text: '#FFFFFF' }; // Blue
            case 'Umum':
                return { bg: '#757575', text: '#FFFFFF' }; // Gray
            // Jadwal categories
            case 'Misa':
                return { bg: '#800020', text: '#FFFFFF' }; // Burgundy
            case 'Adorasi':
                return { bg: '#C5922E', text: '#FFFFFF' }; // Gold
            case 'Ibadat':
                return { bg: '#2E7D32', text: '#FFFFFF' }; // Green
            case 'Sakramen':
                return { bg: '#1565C0', text: '#FFFFFF' }; // Blue
            case 'Kegiatan':
                return { bg: '#F57C00', text: '#FFFFFF' }; // Orange
            default:
                return { bg: '#9E9E9E', text: '#FFFFFF' }; // Default gray
        }
    };

    const colors = getColor();

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: colors.bg,
                    borderRadius: BorderRadius.sm,
                    paddingVertical: Spacing.xs,
                    paddingHorizontal: Spacing.sm,
                },
            ]}>
            <ThemedText
                style={[
                    styles.text,
                    {
                        color: colors.text,
                    },
                ]}>
                {label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
});
