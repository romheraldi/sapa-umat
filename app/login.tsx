import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Email dan password wajib diisi.');
            return;
        }
        setError(null);
        const err = await login(email.trim(), password);
        if (err) {
            setError(err);
        } else {
            router.replace('/(tabs)');
        }
    };

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
                        Masuk Akun
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Login untuk mengakses fitur umat: data keluarga, upload dokumen, dan informasi paroki.
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

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Email</ThemedText>
                            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                                <IconSymbol name="envelope" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="umat@email.com"
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
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Password</ThemedText>
                            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                                <IconSymbol name="lock" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <Pressable onPress={() => setShowPassword(!showPassword)}>
                                    <IconSymbol name={showPassword ? 'eye.slash' : 'eye'} size={18} color={colors.textSecondary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Login Button */}
                        <Pressable
                            style={({ pressed }) => [styles.loginBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                            onPress={handleLogin}
                            disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText style={styles.loginBtnText}>Masuk</ThemedText>
                            )}
                        </Pressable>

                        {/* Note */}
                        <ThemedText style={[styles.note, { color: colors.textSecondary }]}>
                            Belum punya akun? Daftar mandiri sebagai umat di bawah ini.
                        </ThemedText>
                    </Card>
                </Animated.View>

                {/* Register Link */}
                <Pressable
                    onPress={() => router.replace('/register' as any)}
                    style={[styles.registerBtn, { borderColor: colors.primary, borderWidth: 1.5 }]}>
                    <ThemedText style={[styles.registerBtnText, { color: colors.primary }]}>✨ Daftar Akun Umat Baru</ThemedText>
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
    loginBtn: { paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.sm },
    loginBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    note: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    registerBtn: { paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center' },
    registerBtnText: { fontWeight: '600', fontSize: 15 },
});
