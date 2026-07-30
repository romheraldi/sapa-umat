import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';
import type {
    FamilyStatusType,
    GenderType,
    KeluargaLookup,
    KlaimResult,
    Lingkungan,
    MaritalStatusType,
} from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type Mode = 'pilih' | 'existing' | 'new';

const FAMILY_STATUS: FamilyStatusType[] = ['Suami', 'Istri', 'Anak', 'Lainnya'];
const MARITAL_STATUS: MaritalStatusType[] = ['Belum Menikah', 'Menikah Katolik', 'Lainnya'];

const TANGGAL_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function KlaimKeluargaScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const params = useLocalSearchParams<{ mode?: string }>();

    const [mode, setMode] = useState<Mode>(
        params.mode === 'existing' || params.mode === 'new' ? params.mode : 'pilih'
    );
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<KlaimResult | null>(null);

    // ─── Mode existing ───────────────────────────────────────────────────────
    const [noKk, setNoKk] = useState('');
    const [lookup, setLookup] = useState<KeluargaLookup | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [umatId, setUmatId] = useState<string | null>(null);
    const [tanggalLahirKlaim, setTanggalLahirKlaim] = useState('');

    // ─── Mode new ────────────────────────────────────────────────────────────
    const [lingkunganList, setLingkunganList] = useState<Lingkungan[]>([]);
    const [lingkunganId, setLingkunganId] = useState<number>(0);
    const [alamat, setAlamat] = useState('');
    const [noTelepon, setNoTelepon] = useState('');
    const [tempatLahir, setTempatLahir] = useState('');
    const [tanggalLahir, setTanggalLahir] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState<GenderType>('L');
    const [statusKeluarga, setStatusKeluarga] = useState<FamilyStatusType>('Suami');
    const [statusPerkawinan, setStatusPerkawinan] = useState<MaritalStatusType>('Belum Menikah');
    const [baptis, setBaptis] = useState(false);
    const [krisma, setKrisma] = useState(false);

    useEffect(() => {
        if (mode !== 'new' || lingkunganList.length > 0) return;
        api.getLingkungan()
            .then(res => setLingkunganList(res.data ?? []))
            .catch(() => setError('Gagal memuat daftar lingkungan.'));
    }, [mode, lingkunganList.length]);

    const handleLookup = async () => {
        if (!noKk.trim()) {
            setError('Nomor KK Katolik wajib diisi.');
            return;
        }
        setError(null);
        setLookupLoading(true);
        setLookup(null);
        setUmatId(null);
        try {
            const res = await api.lookupKeluarga(noKk.trim(), token ?? undefined);
            setLookup(res.data ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mencari keluarga.');
        } finally {
            setLookupLoading(false);
        }
    };

    const finish = (data: KlaimResult | null) => {
        setResult(data);
        // Tagihan baru saja dibuat — paksa tab iuran & data umat memuat ulang.
        queryClient.invalidateQueries({ queryKey: ['iuran'] });
        queryClient.invalidateQueries({ queryKey: ['keluarga'] });
    };

    const handleSubmitExisting = async () => {
        if (!umatId) {
            setError('Pilih nama Anda dari daftar anggota.');
            return;
        }
        if (!TANGGAL_PATTERN.test(tanggalLahirKlaim)) {
            setError('Tanggal lahir harus dalam format YYYY-MM-DD.');
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const res = await api.klaimKeluarga(
                { mode: 'existing', umat_id: umatId, tanggal_lahir: tanggalLahirKlaim },
                token ?? undefined
            );
            finish(res.data ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menautkan akun.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitNew = async () => {
        if (!lingkunganId) {
            setError('Pilih lingkungan.');
            return;
        }
        if (!alamat.trim()) {
            setError('Alamat lengkap wajib diisi.');
            return;
        }
        if (!tempatLahir.trim()) {
            setError('Tempat lahir wajib diisi.');
            return;
        }
        if (!TANGGAL_PATTERN.test(tanggalLahir)) {
            setError('Tanggal lahir harus dalam format YYYY-MM-DD.');
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const res = await api.klaimKeluarga(
                {
                    mode: 'new',
                    keluarga: {
                        lingkungan_id: lingkunganId,
                        alamat_lengkap: alamat.trim(),
                        no_telepon: noTelepon.trim() || null,
                    },
                    data_diri: {
                        tempat_lahir: tempatLahir.trim(),
                        tanggal_lahir: tanggalLahir,
                        jenis_kelamin: jenisKelamin,
                        status_dalam_keluarga: statusKeluarga,
                        status_perkawinan: statusPerkawinan,
                        status_baptis: baptis,
                        status_krisma: krisma,
                    },
                },
                token ?? undefined
            );
            finish(res.data ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mendaftarkan keluarga.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Layar hasil ─────────────────────────────────────────────────────────
    if (result) {
        const jumlah = result.tagihan?.created ?? 0;
        return (
            <View style={[styles.wrapper, styles.center, { backgroundColor: colors.background }]}>
                <Animated.View entering={FadeIn.duration(400)} style={styles.successBox}>
                    <View style={[styles.iconCircle, { backgroundColor: '#38a169' }]}>
                        <ThemedText style={styles.iconText}>✓</ThemedText>
                    </View>
                    <ThemedText type="heading1" style={{ textAlign: 'center', color: colors.text }}>
                        Data Keluarga Tersimpan
                    </ThemedText>
                    {result.no_kk_katolik && (
                        <ThemedText style={[styles.muted, { color: colors.textSecondary }]}>
                            No. KK Katolik: {result.no_kk_katolik}
                        </ThemedText>
                    )}
                    <ThemedText style={[styles.muted, { color: colors.textSecondary }]}>
                        {result.warning
                            ? 'Akun Anda sudah tertaut. Tagihan iuran belum bisa dibuat, hubungi admin paroki.'
                            : jumlah > 0
                                ? `${jumlah} tagihan iuran tahun ${result.tagihan?.tahun} sudah dibuat untuk keluarga Anda.`
                                : 'Tagihan iuran keluarga Anda sudah tersedia.'}
                    </ThemedText>
                    <Button style={{ marginTop: Spacing.md }} onPress={() => router.replace('/(tabs)/iuran')}>
                        Lihat Tagihan
                    </Button>
                </Animated.View>
            </View>
        );
    }

    // ─── Step pilih mode ─────────────────────────────────────────────────────
    if (mode === 'pilih') {
        return (
            <ScrollView
                style={[styles.wrapper, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.scroll}>
                <Animated.View entering={FadeIn.duration(400)} style={{ gap: Spacing.xs }}>
                    <ThemedText type="heading1" style={{ color: colors.text }}>
                        Lengkapi Data Keluarga
                    </ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                        Data keluarga dibutuhkan agar tagihan iuran Anda bisa dibuat.
                    </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ gap: Spacing.md }}>
                    <Pressable onPress={() => { setError(null); setMode('existing'); }}>
                        <Card variant="elevated" padding="lg" style={{ gap: Spacing.xs }}>
                            <View style={styles.optionHeader}>
                                <IconSymbol name="person.2" size={20} color={colors.primary} />
                                <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                                    Keluarga saya sudah terdaftar
                                </ThemedText>
                            </View>
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                                Masukkan No. KK Katolik, lalu pilih nama Anda dari daftar anggota keluarga.
                            </ThemedText>
                        </Card>
                    </Pressable>

                    <Pressable onPress={() => { setError(null); setMode('new'); }}>
                        <Card variant="elevated" padding="lg" style={{ gap: Spacing.xs }}>
                            <View style={styles.optionHeader}>
                                <IconSymbol name="house" size={20} color={colors.primary} />
                                <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                                    Daftarkan keluarga baru
                                </ThemedText>
                            </View>
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                                Isi data keluarga dan data diri Anda. Nomor KK Katolik dibuat otomatis dan akan
                                diverifikasi admin paroki.
                            </ThemedText>
                        </Card>
                    </Pressable>
                </Animated.View>

                <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>Nanti saja</ThemedText>
                </Pressable>
            </ScrollView>
        );
    }

    // ─── Form ────────────────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={[styles.wrapper, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {error && (
                    <View style={styles.errorBox}>
                        <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#e53e3e" />
                        <ThemedText style={styles.errorText}>{error}</ThemedText>
                    </View>
                )}

                {mode === 'existing' ? (
                    <Card variant="elevated" padding="lg" style={{ gap: Spacing.md }}>
                        <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                            Klaim Keluarga
                        </ThemedText>

                        <FormField
                            label="No. KK Katolik"
                            required
                            placeholder="mis. KK-2026-0001"
                            value={noKk}
                            onChangeText={setNoKk}
                            autoCapitalize="characters"
                        />
                        <Button variant="outline" loading={lookupLoading} onPress={handleLookup}>
                            Cari Keluarga
                        </Button>

                        {lookup && lookup.anggota_tersedia.length === 0 && (
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                                Semua anggota keluarga ini sudah tertaut ke akun lain. Hubungi admin paroki.
                            </ThemedText>
                        )}

                        {lookup && lookup.anggota_tersedia.length > 0 && (
                            <View style={{ gap: Spacing.sm }}>
                                {lookup.lingkungan && (
                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                                        Lingkungan {lookup.lingkungan.nama}
                                    </ThemedText>
                                )}
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Pilih nama Anda *
                                </ThemedText>
                                {lookup.anggota_tersedia.map(a => (
                                    <Pressable
                                        key={a.id}
                                        onPress={() => setUmatId(a.id)}
                                        style={[
                                            styles.choice,
                                            {
                                                borderColor: umatId === a.id ? colors.primary : colors.border,
                                                backgroundColor:
                                                    umatId === a.id ? colors.primary + '15' : colors.backgroundSecondary,
                                            },
                                        ]}>
                                        <ThemedText style={{ color: colors.text }}>{a.nama_lengkap}</ThemedText>
                                    </Pressable>
                                ))}

                                <FormField
                                    label="Tanggal Lahir Anda"
                                    required
                                    placeholder="YYYY-MM-DD"
                                    value={tanggalLahirKlaim}
                                    onChangeText={setTanggalLahirKlaim}
                                    autoCapitalize="none"
                                />
                                <ThemedText style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                                    Tanggal lahir dipakai untuk memastikan Anda benar anggota keluarga ini.
                                </ThemedText>

                                <Button loading={submitting} onPress={handleSubmitExisting}>
                                    Tautkan Akun
                                </Button>
                            </View>
                        )}
                    </Card>
                ) : (
                    <Card variant="elevated" padding="lg" style={{ gap: Spacing.md }}>
                        <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                            Data Keluarga
                        </ThemedText>

                        <View style={{ gap: Spacing.xs }}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Lingkungan *
                            </ThemedText>
                            {lingkunganList.length === 0 ? (
                                <ActivityIndicator color={colors.primary} />
                            ) : (
                                <View style={styles.chipWrap}>
                                    {lingkunganList.map(l => (
                                        <Pressable
                                            key={l.id}
                                            onPress={() => setLingkunganId(l.id)}
                                            style={[
                                                styles.chip,
                                                {
                                                    borderColor: lingkunganId === l.id ? colors.primary : colors.border,
                                                    backgroundColor:
                                                        lingkunganId === l.id
                                                            ? colors.primary + '15'
                                                            : colors.backgroundSecondary,
                                                },
                                            ]}>
                                            <ThemedText style={{ color: colors.text, fontSize: 13 }}>
                                                {l.wilayah ? `${l.wilayah.nama} · ${l.nama}` : l.nama}
                                            </ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>

                        <FormField
                            label="Alamat Lengkap"
                            required
                            placeholder="Jalan, nomor, RT/RW, kelurahan"
                            value={alamat}
                            onChangeText={setAlamat}
                            multiline
                        />
                        <FormField
                            label="No. Telepon"
                            placeholder="08xxxxxxxxxx"
                            value={noTelepon}
                            onChangeText={setNoTelepon}
                            keyboardType="phone-pad"
                        />

                        <ThemedText type="defaultSemiBold" style={{ color: colors.text, marginTop: Spacing.sm }}>
                            Data Diri
                        </ThemedText>

                        <FormField
                            label="Tempat Lahir"
                            required
                            placeholder="Kota kelahiran"
                            value={tempatLahir}
                            onChangeText={setTempatLahir}
                        />
                        <FormField
                            label="Tanggal Lahir"
                            required
                            placeholder="YYYY-MM-DD"
                            value={tanggalLahir}
                            onChangeText={setTanggalLahir}
                            autoCapitalize="none"
                        />

                        <ChoiceRow
                            label="Jenis Kelamin"
                            options={[
                                { value: 'L' as GenderType, label: 'Laki-laki' },
                                { value: 'P' as GenderType, label: 'Perempuan' },
                            ]}
                            selected={jenisKelamin}
                            onSelect={setJenisKelamin}
                            colors={colors}
                        />
                        <ChoiceRow
                            label="Status dalam Keluarga"
                            options={FAMILY_STATUS.map(s => ({ value: s, label: s }))}
                            selected={statusKeluarga}
                            onSelect={setStatusKeluarga}
                            colors={colors}
                        />
                        <ChoiceRow
                            label="Status Perkawinan"
                            options={MARITAL_STATUS.map(s => ({ value: s, label: s }))}
                            selected={statusPerkawinan}
                            onSelect={setStatusPerkawinan}
                            colors={colors}
                        />

                        <View style={styles.switchRow}>
                            <ThemedText style={{ color: colors.text }}>Sudah Baptis</ThemedText>
                            <Switch value={baptis} onValueChange={setBaptis} trackColor={{ true: colors.primary }} />
                        </View>
                        <View style={styles.switchRow}>
                            <ThemedText style={{ color: colors.text }}>Sudah Krisma</ThemedText>
                            <Switch value={krisma} onValueChange={setKrisma} trackColor={{ true: colors.primary }} />
                        </View>

                        <Button loading={submitting} onPress={handleSubmitNew}>
                            Simpan Data Keluarga
                        </Button>
                    </Card>
                )}

                <Pressable onPress={() => { setError(null); setMode('pilih'); }} style={styles.skipBtn}>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>Kembali</ThemedText>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Pilihan berbentuk chip, dipakai beberapa field enum ─────────────────────
function ChoiceRow<T extends string>({
    label,
    options,
    selected,
    onSelect,
    colors,
}: {
    label: string;
    options: { value: T; label: string }[];
    selected: T;
    onSelect: (value: T) => void;
    colors: typeof Colors.light;
}) {
    return (
        <View style={{ gap: Spacing.xs }}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label} *</ThemedText>
            <View style={styles.chipWrap}>
                {options.map(o => (
                    <Pressable
                        key={o.value}
                        onPress={() => onSelect(o.value)}
                        style={[
                            styles.chip,
                            {
                                borderColor: selected === o.value ? colors.primary : colors.border,
                                backgroundColor:
                                    selected === o.value ? colors.primary + '15' : colors.backgroundSecondary,
                            },
                        ]}>
                        <ThemedText style={{ color: colors.text, fontSize: 13 }}>{o.label}</ThemedText>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.lg },
    optionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    label: { fontSize: 13, fontWeight: '600' },
    choice: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#FED7D7',
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    errorText: { color: '#e53e3e', fontSize: 13, flex: 1 },
    skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
    successBox: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
    iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    iconText: { color: '#fff', fontSize: 36, lineHeight: 44 },
    muted: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
