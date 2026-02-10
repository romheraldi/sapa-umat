import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { SectionHeader } from '@/components/ui/section-header';
import { infoGereja, lingkungan, wilayah } from '@/constants/mock-data';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function InfoGerejaScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: colors.secondary }]}>
                <ThemedText type="title" style={styles.headerTitle}>
                    {infoGereja.namaParoki}
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Pelindung: {infoGereja.namaPelindung}</ThemedText>
            </Animated.View>

            <View style={styles.content}>
                {/* Sejarah Singkat */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.section}>
                    <SectionHeader title="Sejarah Paroki" />
                    <Card variant="outlined" padding="md">
                        <ThemedText style={{ lineHeight: 22 }}>{infoGereja.sejarahSingkat}</ThemedText>
                    </Card>
                </Animated.View>

                {/* Pastor Paroki */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
                    <SectionHeader title="Pastor Paroki" />
                    <Card variant="elevated" padding="md">
                        {infoGereja.pastor.map((p, index) => (
                            <View key={index} style={styles.pastorItem}>
                                <ThemedText type="bodyMedium">{p.nama}</ThemedText>
                                <ThemedText style={[styles.pastorRole, { color: colors.textSecondary }]}>{p.jabatan}</ThemedText>
                            </View>
                        ))}
                    </Card>
                </Animated.View>

                {/* Kontak & Alamat */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.section}>
                    <SectionHeader title="Kontak & Alamat" />
                    <Card variant="outlined" padding="md">
                        <InfoRow icon="mappin.circle.fill" label="Alamat" value={infoGereja.alamatLengkap} />
                        <InfoRow icon="phone.fill" label="Telepon" value={infoGereja.telepon} />
                        <InfoRow icon="envelope.fill" label="Email" value={infoGereja.email} />
                        {infoGereja.website && <InfoRow icon="globe" label="Website" value={infoGereja.website} />}
                    </Card>
                </Animated.View>

                {/* Jam Operasional */}
                <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.section}>
                    <SectionHeader title="Jam Operasional Sekretariat" />
                    <Card variant="filled" padding="md">
                        {infoGereja.jamOperasionalSekretariat.map((item, index) => (
                            <View key={index} style={styles.scheduleRow}>
                                <ThemedText type="bodyMedium">{item.hari}</ThemedText>
                                <ThemedText style={{ color: colors.textSecondary }}>{item.jam}</ThemedText>
                            </View>
                        ))}
                    </Card>
                </Animated.View>

                {/* Wilayah & Lingkungan */}
                <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.section}>
                    <SectionHeader title="Wilayah & Lingkungan" />
                    {wilayah.map((w, idx) => {
                        const wilayahLingkungan = lingkungan.filter(l => l.wilayah === w.id);
                        return (
                            <Animated.View key={w.id} entering={FadeInDown.duration(400).delay(600 + idx * 50)}>
                                <Card variant="elevated" padding="md" style={styles.wilayahCard}>
                                    <View style={[styles.wilayahHeader, { backgroundColor: colors.tertiary + '15' }]}>
                                        <ThemedText type="bodyMedium" style={{ color: colors.tertiary }}>
                                            {w.nama}
                                        </ThemedText>
                                        <ThemedText style={[styles.ketuaText, { color: colors.tertiary }]}>Ketua: {w.ketua}</ThemedText>
                                    </View>
                                    <View style={styles.lingkunganList}>
                                        {wilayahLingkungan.map(l => (
                                            <View key={l.id} style={styles.lingkunganItem}>
                                                <View style={styles.lingkunganInfo}>
                                                    <ThemedText type="body">{l.nama}</ThemedText>
                                                    <ThemedText style={[styles.lingkunganDetail, { color: colors.textSecondary }]}>
                                                        Ketua: {l.ketua} • {l.jumlahKeluarga} keluarga
                                                    </ThemedText>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </Card>
                            </Animated.View>
                        );
                    })}
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.md,
    },
    headerTitle: {
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    headerSubtitle: {
        color: '#FFFFFF',
        opacity: 0.9,
        fontSize: 16,
    },
    content: {
        padding: Spacing.md,
        gap: Spacing.lg,
    },
    section: {
        gap: Spacing.sm,
    },
    pastorItem: {
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pastorRole: {
        fontSize: 14,
        marginTop: Spacing.xs / 2,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    wilayahCard: {
        marginBottom: Spacing.sm,
    },
    wilayahHeader: {
        padding: Spacing.sm,
        borderRadius: 8,
        marginBottom: Spacing.sm,
    },
    ketuaText: {
        fontSize: 13,
        marginTop: Spacing.xs / 2,
    },
    lingkunganList: {
        gap: Spacing.sm,
    },
    lingkunganItem: {
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    lingkunganInfo: {
        gap: Spacing.xs / 2,
    },
    lingkunganDetail: {
        fontSize: 13,
    },
});
