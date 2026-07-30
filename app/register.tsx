'use client';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function RegisterScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { register, isLoading } = useAuth();

    const [namaLengkap, setNamaLengkap] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showKonfirmasi, setShowKonfirmasi] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        setError(null);

        if (!namaLengkap.trim()) {
            setError('Nama lengkap wajib diisi.');
            return;
        }
        if (!email.trim()) {
            setError('Email wajib diisi.');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }
        if (password !== konfirmasiPassword) {
            setError('Password dan konfirmasi password tidak sama.');
            return;
        }

        const err = await register(email.trim().toLowerCase(), password, namaLengkap.trim());
        if (err) {
            setError(err);
        } else {
            // Akun sudah terbuat dan sesi aktif. Lanjut ke langkah data keluarga —
            // tanpa itu tagihan iuran tidak bisa dibuat.
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <View style={[styles.wrapper, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }]}>
                <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: '#38a169' }]}>
                        <ThemedText style={styles.iconText}>✓</ThemedText>
                    </View>
                    <ThemedText type="heading1" style={[styles.title, { color: colors.text }]}>
                        Berhasil Daftar!
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Satu langkah lagi: lengkapi data keluarga Anda supaya tagihan iuran bisa dibuat.
                    </ThemedText>

                    <Pressable
                        style={({ pressed }) => [styles.btn, styles.successBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                        onPress={() => router.replace('/data-umat/klaim' as any)}>
                        <ThemedText style={styles.btnText}>Lengkapi Data Keluarga</ThemedText>
                    </Pressable>

                    <Pressable onPress={() => router.replace('/(tabs)')} style={styles.cancelBtn}>
                        <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>Nanti saja</ThemedText>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.wrapper, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.headerContainer}>
                    <Image
                        source={require('@/assets/images/paroki-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <ThemedText type="heading1" style={[styles.title, { color: colors.text }]}>
                        Daftar Akun Umat
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Buat akun untuk mengakses fitur umat: data keluarga, upload dokumen, dan informasi paroki.
                    </ThemedText>
                </Animated.View>

                {/* Form Card */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <Card variant="elevated" padding="lg" style={styles.card}>

                        {/* Error */}
                        {error && (
                            <View style={styles.errorBox}>
                                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#e53e3e" />
                                <ThemedText style={styles.errorText}>{error}</ThemedText>
                            </View>
                        )}

                        {/* Nama Lengkap */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Nama Lengkap *</ThemedText>
                            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                                <IconSymbol name="person" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Nama lengkap Anda"
                                    placeholderTextColor={colors.textSecondary}
                                    value={namaLengkap}
                                    onChangeText={setNamaLengkap}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Email *</ThemedText>
                            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                                <IconSymbol name="envelope" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="nama@email.com"
                                    placeholderTextColor={colors.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Password *</ThemedText>
                            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                                <IconSymbol name="lock" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Minimal 6 karakter"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="new-password"
                                />
                                <Pressable onPress={() => setShowPassword(!showPassword)}>
                                    <IconSymbol name={showPassword ? 'eye.slash' : 'eye'} size={18} color={colors.textSecondary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Konfirmasi Password */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Konfirmasi Password *</ThemedText>
                            <View style={[styles.inputRow, {
                                borderColor: konfirmasiPassword && konfirmasiPassword !== password ? '#e53e3e' : colors.border,
                                backgroundColor: colors.backgroundSecondary
                            }]}>
                                <IconSymbol name="lock.shield" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Ulangi password"
                                    placeholderTextColor={colors.textSecondary}
                                    value={konfirmasiPassword}
                                    onChangeText={setKonfirmasiPassword}
                                    secureTextEntry={!showKonfirmasi}
                                    autoComplete="new-password"
                                />
                                <Pressable onPress={() => setShowKonfirmasi(!showKonfirmasi)}>
                                    <IconSymbol name={showKonfirmasi ? 'eye.slash' : 'eye'} size={18} color={colors.textSecondary} />
                                </Pressable>
                            </View>
                            {konfirmasiPassword && konfirmasiPassword !== password && (
                                <ThemedText style={styles.fieldError}>Password tidak sama.</ThemedText>
                            )}
                        </View>

                        {/* Role Info */}
                        <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                                👤 Akun yang dibuat akan memiliki role <ThemedText style={{ fontWeight: '700', color: colors.primary }}>Umat</ThemedText>. Role lain (Ketua Lingkungan, Admin) diberikan oleh admin paroki.
                            </ThemedText>
                        </View>

                        {/* Register Button */}
                        <Pressable
                            style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                            onPress={handleRegister}
                            disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText style={styles.btnText}>Daftar Sekarang</ThemedText>
                            )}
                        </Pressable>
                    </Card>
                </Animated.View>

                {/* Back to Login */}
                <Pressable onPress={() => router.replace('/login' as any)} style={styles.cancelBtn}>
                    <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>
                        Sudah punya akun? <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Masuk</ThemedText>
                    </ThemedText>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    scroll: { padding: Spacing.md, paddingTop: Spacing.xl, gap: Spacing.lg },
    headerContainer: { alignItems: 'center', gap: Spacing.sm },
    logo: { width: 100, height: 100, marginBottom: Spacing.sm },
    title: { textAlign: 'center' },
    subtitle: { textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: Spacing.md },
    card: { gap: Spacing.md },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#FED7D7', padding: Spacing.sm, borderRadius: BorderRadius.sm },
    errorText: { color: '#e53e3e', fontSize: 13, flex: 1 },
    fieldGroup: { gap: Spacing.xs },
    label: { fontSize: 13, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    input: { flex: 1, fontSize: 15 },
    fieldError: { color: '#e53e3e', fontSize: 12, marginTop: 2 },
    infoBox: { borderWidth: 1, borderRadius: BorderRadius.sm, padding: Spacing.sm },
    infoText: { fontSize: 12, lineHeight: 18 },
    btn: { paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.sm },
    successBtn: { alignSelf: 'stretch', paddingHorizontal: Spacing.lg },
    btnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
    cancelText: { fontSize: 14 },
    successContainer: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
    iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    iconText: { color: '#FFFFFF', fontSize: 36, lineHeight: 44 },
});
