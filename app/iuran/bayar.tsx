import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import type { PaymentStatusType } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { api } from '@/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const SUPPORTED_APPS = ['GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja', 'Mobile Banking'];

const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
};

type ScreenState = 'loading' | 'qr' | 'success' | 'expired' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BayarIuranScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();
    const { ids } = useLocalSearchParams<{ ids: string }>();

    const [state, setState] = useState<ScreenState>('loading');
    const [qrUrl, setQrUrl] = useState<string>('');
    const [orderId, setOrderId] = useState<string>('');
    const [expiryTime, setExpiryTime] = useState<string>('');
    const [countdown, setCountdown] = useState<string>('');
    const [paidAt, setPaidAt] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Initiate Payment ─────────────────────────────────────────────────────

    const initPayment = useCallback(async () => {
        if (!ids) {
            setErrorMessage('ID tagihan tidak ditemukan.');
            setState('error');
            return;
        }

        setState('loading');
        try {
            const response = await api.bayarIuran(ids.split(','), token ?? undefined);
            if (response.data) {
                setQrUrl(response.data.qr_url);
                setOrderId(response.data.order_id);
                setExpiryTime(response.data.expiry_time);
                setState('qr');
            } else {
                throw new Error('Gagal membuat pembayaran.');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Terjadi kesalahan saat membuat pembayaran.');
            setState('error');
        }
    }, [ids, token]);

    useEffect(() => {
        initPayment();
    }, [initPayment]);

    // ─── Copy QR URL ──────────────────────────────────────────────────────────

    const handleCopyQr = async () => {
        if (!qrUrl) return;
        await Clipboard.setStringAsync(qrUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ─── Countdown Timer ──────────────────────────────────────────────────────

    useEffect(() => {
        if (state !== 'qr' || !expiryTime) return;

        const updateCountdown = () => {
            const now = Date.now();
            const expiry = new Date(expiryTime).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setCountdown('00:00');
                setState('expired');
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setCountdown(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateCountdown();
        countdownIntervalRef.current = setInterval(updateCountdown, 1000);

        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [state, expiryTime]);

    // ─── Polling Payment Status ───────────────────────────────────────────────

    useEffect(() => {
        if (state !== 'qr' || !orderId) return;

        const checkStatus = async () => {
            try {
                const response = await api.cekStatusPembayaran(orderId, token ?? undefined);
                if (response.data) {
                    const { transaction_status, tagihan_status, paid_at } = response.data;
                    if (transaction_status === 'settlement' || tagihan_status === 'lunas') {
                        setPaidAt(paid_at);
                        setState('success');
                    } else if (transaction_status === 'expire') {
                        Alert.alert('Info', 'Waktu pembayaran telah habis. Silakan buat pembayaran baru.');
                        setState('expired');
                    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
                        Alert.alert('Gagal', 'Pembayaran gagal atau ditolak. Silakan coba lagi.');
                        setErrorMessage('Pembayaran gagal diproses oleh sistem.');
                        setState('error');
                    }
                }
            } catch {
                // Silently ignore polling errors
            }
        };

        pollIntervalRef.current = setInterval(checkStatus, 5000);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [state, orderId, token]);

    // ─── Cleanup on unmount ───────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, []);

    // ─── Render States ────────────────────────────────────────────────────────

    if (state === 'loading') {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText type="bodyMedium" style={{ marginTop: Spacing.md, color: colors.textSecondary }}>
                    Mempersiapkan pembayaran...
                </ThemedText>
            </View>
        );
    }

    if (state === 'error') {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
                    <ThemedText style={styles.stateIcon}>❌</ThemedText>
                    <ThemedText type="heading3" style={{ textAlign: 'center' }}>
                        Gagal Memproses
                    </ThemedText>
                    <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                        {errorMessage}
                    </ThemedText>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={initPayment}>
                        <ThemedText type="bodyMedium" style={{ color: '#FFFFFF' }}>Coba Lagi</ThemedText>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary, marginTop: Spacing.sm }]}
                        onPress={() => router.back()}>
                        <ThemedText type="bodyMedium" style={{ color: colors.text }}>Kembali</ThemedText>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    if (state === 'success') {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Animated.View entering={FadeIn.duration(500)} style={styles.stateContainer}>
                    <View style={[styles.successCircle, { backgroundColor: colors.success + '15' }]}>
                        <ThemedText style={styles.successIcon}>✓</ThemedText>
                    </View>
                    <ThemedText type="heading2" style={{ color: colors.success, textAlign: 'center' }}>
                        Pembayaran Berhasil!
                    </ThemedText>
                    <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                        Iuran yang dipilih telah berhasil dibayar.
                    </ThemedText>
                    {paidAt && (
                        <ThemedText type="caption" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
                            Dibayar pada {new Date(paidAt).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </ThemedText>
                    )}
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.back()}>
                        <ThemedText type="bodyMedium" style={{ color: '#FFFFFF' }}>Kembali</ThemedText>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    if (state === 'expired') {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
                    <ThemedText style={styles.stateIcon}>⏰</ThemedText>
                    <ThemedText type="heading3" style={{ textAlign: 'center' }}>
                        QR Code Kadaluarsa
                    </ThemedText>
                    <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                        Waktu pembayaran telah habis. Silakan buat pembayaran baru.
                    </ThemedText>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={initPayment}>
                        <ThemedText type="bodyMedium" style={{ color: '#FFFFFF' }}>Coba Lagi</ThemedText>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary, marginTop: Spacing.sm }]}
                        onPress={() => router.back()}>
                        <ThemedText type="bodyMedium" style={{ color: colors.text }}>Kembali</ThemedText>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    // ─── QR State ─────────────────────────────────────────────────────────────

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* QR Code Card */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <Card variant="elevated" padding="lg" style={styles.qrCard}>
                        <ThemedText type="heading3" style={{ textAlign: 'center', color: colors.primary }}>
                            Scan untuk Membayar
                        </ThemedText>

                        <View style={[styles.qrContainer, { borderColor: colors.border }]}>
                            <Image
                                source={{ uri: qrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        </View>

                        <Pressable 
                            style={[styles.copyButton, { backgroundColor: colors.backgroundSecondary }]}
                            onPress={handleCopyQr}>
                            <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                                {copied ? 'Berhasil Disalin!' : 'Copy QR String (Simulator)'}
                            </ThemedText>
                        </Pressable>

                        {/* Countdown */}
                        <View style={[styles.countdownContainer, { backgroundColor: colors.warning + '15' }]}>
                            <ThemedText type="small" style={{ color: colors.warning }}>
                                Berlaku selama
                            </ThemedText>
                            <ThemedText type="heading3" style={{ color: colors.warning }}>
                                {countdown}
                            </ThemedText>
                        </View>
                    </Card>
                </Animated.View>

                {/* Instructions */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <Card variant="filled" padding="md">
                        <ThemedText type="captionMedium" style={{ marginBottom: Spacing.sm }}>
                            Cara Pembayaran:
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textSecondary, lineHeight: 22 }}>
                            Scan QR code di atas menggunakan aplikasi e-wallet atau mobile banking Anda.
                            Pembayaran akan dikonfirmasi secara otomatis.
                        </ThemedText>
                    </Card>
                </Animated.View>

                {/* Supported Apps */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                    <Card variant="outlined" padding="md">
                        <ThemedText type="captionMedium" style={{ marginBottom: Spacing.sm }}>
                            Aplikasi yang Didukung:
                        </ThemedText>
                        <View style={styles.appGrid}>
                            {SUPPORTED_APPS.map(app => (
                                <View
                                    key={app}
                                    style={[styles.appBadge, { backgroundColor: colors.backgroundSecondary }]}>
                                    <ThemedText type="small" style={{ color: colors.text }}>
                                        {app}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    </Card>
                </Animated.View>

                {/* Polling Indicator */}
                <Animated.View entering={FadeInDown.duration(500).delay(400)}>
                    <View style={styles.pollingIndicator}>
                        <ActivityIndicator size="small" color={colors.secondary} />
                        <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.sm }}>
                            Menunggu pembayaran...
                        </ThemedText>
                    </View>
                </Animated.View>
            </View>
        </ScrollView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    content: { padding: Spacing.md, gap: Spacing.lg },
    stateContainer: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
    stateIcon: { fontSize: 56, marginBottom: Spacing.sm },
    successCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    successIcon: { fontSize: 48, color: '#388E3C' },
    actionButton: {
        width: '100%',
        paddingVertical: Spacing.sm + 4,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    qrCard: { alignItems: 'center' },
    qrContainer: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderWidth: 2,
        borderRadius: BorderRadius.lg,
        borderStyle: 'dashed',
    },
    qrImage: { width: 260, height: 260 },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.md,
    },
    copyButton: {
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.sm,
    },
    appGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    appBadge: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
    },
    pollingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
    },
});
