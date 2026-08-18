import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://www.sapa-umat.my.id/api';
const SUPABASE_URL = 'https://pilzbulitvkdqsbzehmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbHpidWxpdHZrZHFzYnplaG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTc2OTgsImV4cCI6MjA5NDU5MzY5OH0.GZI0qtzP3tnUDcg1G2I2mbVl_jjm7SxBMW-W5tZ6JU8';

// ─── Tipe Dokumen ─────────────────────────────────────────────────────────────
interface TipeDokumen {
    id: string;
    label: string;
    icon: string;
    description: string;
    format: 'image' | 'pdf';
    mimeTypes: string[];
    maxSizeMB: number;
    color: string;
}

const TIPE_DOKUMEN: TipeDokumen[] = [
    {
        id: 'KTP',
        label: 'KTP',
        icon: '🪪',
        description: 'Kartu Tanda Penduduk',
        format: 'image',
        mimeTypes: ['image/jpeg', 'image/jpg'],
        maxSizeMB: 5,
        color: '#3B82F6',
    },
    {
        id: 'KK',
        label: 'Kartu Keluarga',
        icon: '👨‍👩‍👧‍👦',
        description: 'Kartu Keluarga (KK)',
        format: 'image',
        mimeTypes: ['image/jpeg', 'image/jpg'],
        maxSizeMB: 5,
        color: '#10B981',
    },
    {
        id: 'Dokumen Gereja',
        label: 'Dokumen Gereja',
        icon: '⛪',
        description: 'Surat baptis, krisma, dan dokumen pendukung lainnya',
        format: 'pdf',
        mimeTypes: ['application/pdf'],
        maxSizeMB: 10,
        color: '#8B5CF6',
    },
];

interface SelectedFile {
    name: string;
    uri: string;
    size: number | null | undefined;
    mimeType: string | null | undefined;
}

function formatBytes(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDokumenScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user, token, logout } = useAuth();

    const [selectedTipe, setSelectedTipe] = useState<TipeDokumen>(TIPE_DOKUMEN[0]);
    const [judul, setJudul] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [sourceType, setSourceType] = useState<'gallery' | 'camera' | 'pdf' | null>(null);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset file setiap kali tipe berubah
    const handleSelectTipe = (tipe: TipeDokumen) => {
        if (tipe.id === selectedTipe.id) return;
        setSelectedTipe(tipe);
        setSelectedFile(null);
        setSourceType(null);
        setError(null);
    };

    // Pilih dari galeri
    const handlePickGallery = async () => {
        setError(null);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setError('Izin akses galeri diperlukan untuk memilih foto.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.85,
                selectionLimit: 1,
            });
            if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileName = asset.fileName ?? `foto_${Date.now()}.jpg`;
                const sizeMB = (asset.fileSize ?? 0) / (1024 * 1024);
                if (sizeMB > selectedTipe.maxSizeMB) {
                    setError(`Ukuran file maksimal ${selectedTipe.maxSizeMB} MB. File ini ${sizeMB.toFixed(1)} MB.`);
                    return;
                }
                setSelectedFile({
                    name: fileName,
                    uri: asset.uri,
                    size: asset.fileSize,
                    mimeType: 'image/jpeg',
                });
                setSourceType('gallery');
                if (!judul) setJudul(selectedTipe.label);
            }
        } catch {
            setError('Gagal membuka galeri. Coba lagi.');
        }
    };

    // Foto dengan kamera
    const handleOpenCamera = async () => {
        setError(null);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                setError('Izin akses kamera diperlukan untuk mengambil foto.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.85,
            });
            if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileName = asset.fileName ?? `kamera_${Date.now()}.jpg`;
                const sizeMB = (asset.fileSize ?? 0) / (1024 * 1024);
                if (sizeMB > selectedTipe.maxSizeMB) {
                    setError(`Ukuran file maksimal ${selectedTipe.maxSizeMB} MB. File ini ${sizeMB.toFixed(1)} MB.`);
                    return;
                }
                setSelectedFile({
                    name: fileName,
                    uri: asset.uri,
                    size: asset.fileSize,
                    mimeType: 'image/jpeg',
                });
                setSourceType('camera');
                if (!judul) setJudul(selectedTipe.label);
            }
        } catch {
            setError('Gagal membuka kamera. Coba lagi.');
        }
    };

    // Pilih PDF
    const handlePickPDF = async () => {
        setError(null);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                const sizeMB = (asset.size ?? 0) / (1024 * 1024);
                if (sizeMB > selectedTipe.maxSizeMB) {
                    setError(`Ukuran file maksimal ${selectedTipe.maxSizeMB} MB. File ini ${sizeMB.toFixed(1)} MB.`);
                    return;
                }
                setSelectedFile({
                    name: asset.name,
                    uri: asset.uri,
                    size: asset.size,
                    mimeType: 'application/pdf',
                });
                setSourceType('pdf');
                if (!judul) setJudul(asset.name.replace(/\.pdf$/i, ''));
            }
        } catch {
            setError('Gagal membuka file picker. Coba lagi.');
        }
    };

    const handleUpload = async () => {
        if (!user || !token) {
            Alert.alert('Error', 'Anda harus login terlebih dahulu.');
            return;
        }
        if (!selectedFile) {
            setError(`Pilih file ${selectedTipe.format === 'image' ? 'foto JPG' : 'PDF'} terlebih dahulu.`);
            return;
        }
        if (!judul.trim()) {
            setError('Judul dokumen wajib diisi.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            setUploadProgress('Mengunggah file ke server...');

            const ext = selectedTipe.format === 'image' ? 'jpg' : 'pdf';
            const timestamp = Date.now();
            const safeJudul = judul.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
            const filePath = `${user.id}/${selectedTipe.id.replace(/\s/g, '_')}/${timestamp}_${safeJudul}.${ext}`;
            const contentType = selectedTipe.format === 'image' ? 'image/jpeg' : 'application/pdf';

            // Upload file ke Supabase Storage
            const fileResponse = await fetch(selectedFile.uri);
            const fileBlob = await fileResponse.blob();

            const storageResponse = await fetch(
                `${SUPABASE_URL}/storage/v1/object/dokumen-umat/${filePath}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': contentType,
                        'x-upsert': 'false',
                    },
                    body: fileBlob,
                }
            );

            if (!storageResponse.ok) {
                const errText = await storageResponse.text();
                // Tangani token kedaluwarsa secara spesifik
                if (storageResponse.status === 401 || storageResponse.status === 403) {
                    if (errText.includes('exp') || errText.includes('expired') || errText.includes('Unauthorized')) {
                        Alert.alert('Sesi Berakhir', 'Sesi Anda telah berakhir demi keamanan. Silakan masuk (login) kembali.', [
                            { text: 'Masuk Kembali', onPress: () => logout() }
                        ]);
                        return;
                    }
                }
                throw new Error(`Gagal upload file: ${errText}`);
            }

            // Simpan metadata ke API
            setUploadProgress('Menyimpan informasi dokumen...');
            const metaRes = await fetch(`${API_BASE}/dokumen`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    judul: judul.trim(),
                    kategori: selectedTipe.id,
                    file_path: filePath,
                    file_name: selectedFile.name,
                    file_size: selectedFile.size,
                    keterangan: keterangan.trim() || null,
                }),
            });
            
            if (metaRes.status === 401 || metaRes.status === 403) {
                Alert.alert('Sesi Berakhir', 'Sesi Anda telah berakhir demi keamanan. Silakan masuk (login) kembali.', [
                    { text: 'Masuk Kembali', onPress: () => logout() }
                ]);
                return;
            }

            const metaJson = await metaRes.json();
            if (metaJson.error) throw new Error(metaJson.error);

            Alert.alert(
                '✅ Berhasil!',
                `Dokumen "${judul.trim()}" berhasil diupload.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (err: any) {
            setError(err?.message ?? 'Terjadi kesalahan saat upload. Coba lagi.');
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };

    const isReady = !!selectedFile && !!judul.trim();

    return (
        <KeyboardAvoidingView
            style={[styles.wrapper, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <Animated.View entering={FadeIn.duration(400)} style={styles.headerContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: selectedTipe.color + '20' }]}>
                        <ThemedText style={styles.iconText}>{selectedTipe.icon}</ThemedText>
                    </View>
                    <ThemedText type="heading1" style={[styles.title, { color: colors.text }]}>
                        Upload Dokumen
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Pilih jenis dokumen lalu unggah file sesuai format yang ditentukan.
                    </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(400).delay(150)}>
                    <Card variant="elevated" padding="lg" style={styles.card}>

                        {/* Error */}
                        {error && (
                            <View style={styles.errorBox}>
                                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#e53e3e" />
                                <ThemedText style={styles.errorText}>{error}</ThemedText>
                            </View>
                        )}

                        {/* Pilih Jenis Dokumen */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Jenis Dokumen *
                            </ThemedText>
                            <View style={styles.tipeContainer}>
                                {TIPE_DOKUMEN.map((tipe) => {
                                    const isSelected = selectedTipe.id === tipe.id;
                                    return (
                                        <Pressable
                                            key={tipe.id}
                                            onPress={() => handleSelectTipe(tipe)}
                                            disabled={uploading}
                                            style={[
                                                styles.tipeCard,
                                                {
                                                    borderColor: isSelected ? tipe.color : colors.border,
                                                    backgroundColor: isSelected ? tipe.color + '12' : colors.backgroundSecondary,
                                                }
                                            ]}>
                                            <ThemedText style={styles.tipeIcon}>{tipe.icon}</ThemedText>
                                            <ThemedText style={[
                                                styles.tipeLabel,
                                                { color: isSelected ? tipe.color : colors.text }
                                            ]}>
                                                {tipe.label}
                                            </ThemedText>
                                            <ThemedText style={[styles.tipeFormat, {
                                                color: isSelected ? tipe.color : colors.textSecondary,
                                                backgroundColor: isSelected ? tipe.color + '20' : colors.border + '40',
                                            }]}>
                                                {tipe.format === 'image' ? 'JPG' : 'PDF'}
                                            </ThemedText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            {/* Info format */}
                            <View style={[styles.formatInfo, { backgroundColor: selectedTipe.color + '10', borderColor: selectedTipe.color + '30' }]}>
                                <ThemedText style={[styles.formatInfoText, { color: selectedTipe.color }]}>
                                    {selectedTipe.format === 'image'
                                        ? `📸 Format: JPG/JPEG • Maks ${selectedTipe.maxSizeMB} MB • Dari galeri foto`
                                        : `📄 Format: PDF • Maks ${selectedTipe.maxSizeMB} MB • Dokumen digital`
                                    }
                                </ThemedText>
                            </View>
                        </View>

                        {/* File Picker */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                {selectedTipe.format === 'image' ? 'Foto (JPG) *' : 'File PDF *'}
                            </ThemedText>

                            {selectedTipe.format === 'image' ? (
                                /* ── Opsi untuk format IMAGE: Galeri & Kamera ── */
                                <View style={styles.imagePickerContainer}>
                                    {/* Preview file terpilih */}
                                    {selectedFile && (
                                        <View style={[styles.filePreviewBox, { borderColor: selectedTipe.color, backgroundColor: selectedTipe.color + '08' }]}>
                                            <ThemedText style={{ fontSize: 28 }}>
                                                {sourceType === 'camera' ? '📷' : '🖼️'}
                                            </ThemedText>
                                            <View style={styles.filePickerInfo}>
                                                <ThemedText style={[styles.filePickerName, { color: colors.text }]} numberOfLines={1}>
                                                    {selectedFile.name}
                                                </ThemedText>
                                                <ThemedText style={[styles.filePickerSize, { color: colors.textSecondary }]}>
                                                    {sourceType === 'camera' ? '📷 Dari Kamera' : '🖼️ Dari Galeri'}
                                                    {selectedFile.size ? `  •  ${formatBytes(selectedFile.size)}` : ''}
                                                </ThemedText>
                                            </View>
                                            <IconSymbol name="checkmark.circle.fill" size={22} color={selectedTipe.color} />
                                        </View>
                                    )}

                                    {/* 2 Tombol Pilihan */}
                                    <View style={styles.imageButtonRow}>
                                        <Pressable
                                            onPress={handlePickGallery}
                                            disabled={uploading}
                                            style={({ pressed }) => [
                                                styles.imageOptionBtn,
                                                {
                                                    borderColor: sourceType === 'gallery' ? selectedTipe.color : colors.border,
                                                    backgroundColor: sourceType === 'gallery' ? selectedTipe.color + '12' : colors.backgroundSecondary,
                                                    opacity: pressed ? 0.8 : 1,
                                                }
                                            ]}>
                                            <ThemedText style={styles.imageOptionIcon}>🖼️</ThemedText>
                                            <ThemedText style={[styles.imageOptionLabel, { color: sourceType === 'gallery' ? selectedTipe.color : colors.text }]}>
                                                Galeri
                                            </ThemedText>
                                            <ThemedText style={[styles.imageOptionHint, { color: colors.textSecondary }]}>
                                                Pilih dari album foto
                                            </ThemedText>
                                        </Pressable>

                                        <Pressable
                                            onPress={handleOpenCamera}
                                            disabled={uploading}
                                            style={({ pressed }) => [
                                                styles.imageOptionBtn,
                                                {
                                                    borderColor: sourceType === 'camera' ? selectedTipe.color : colors.border,
                                                    backgroundColor: sourceType === 'camera' ? selectedTipe.color + '12' : colors.backgroundSecondary,
                                                    opacity: pressed ? 0.8 : 1,
                                                }
                                            ]}>
                                            <ThemedText style={styles.imageOptionIcon}>📷</ThemedText>
                                            <ThemedText style={[styles.imageOptionLabel, { color: sourceType === 'camera' ? selectedTipe.color : colors.text }]}>
                                                Kamera
                                            </ThemedText>
                                            <ThemedText style={[styles.imageOptionHint, { color: colors.textSecondary }]}>
                                                Foto langsung dengan HP
                                            </ThemedText>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : (
                                /* ── Opsi untuk format PDF ── */
                                <Pressable
                                    onPress={handlePickPDF}
                                    disabled={uploading}
                                    style={({ pressed }) => [
                                        styles.filePicker,
                                        {
                                            borderColor: selectedFile ? selectedTipe.color : colors.border,
                                            backgroundColor: selectedFile ? selectedTipe.color + '08' : colors.backgroundSecondary,
                                            opacity: pressed ? 0.8 : 1,
                                        }
                                    ]}>
                                    {selectedFile ? (
                                        <View style={styles.filePickerSelected}>
                                            <ThemedText style={{ fontSize: 28 }}>📄</ThemedText>
                                            <View style={styles.filePickerInfo}>
                                                <ThemedText style={[styles.filePickerName, { color: colors.text }]} numberOfLines={1}>
                                                    {selectedFile.name}
                                                </ThemedText>
                                                {selectedFile.size && (
                                                    <ThemedText style={[styles.filePickerSize, { color: colors.textSecondary }]}>
                                                        {formatBytes(selectedFile.size)}
                                                    </ThemedText>
                                                )}
                                            </View>
                                            <IconSymbol name="checkmark.circle.fill" size={22} color={selectedTipe.color} />
                                        </View>
                                    ) : (
                                        <View style={styles.filePickerEmpty}>
                                            <ThemedText style={{ fontSize: 36 }}>📄</ThemedText>
                                            <ThemedText style={[styles.filePickerEmptyText, { color: colors.text }]}>
                                                Ketuk untuk pilih file PDF
                                            </ThemedText>
                                            <ThemedText style={[styles.filePickerHint, { color: colors.textSecondary }]}>
                                                {`Format: PDF • Maks ${selectedTipe.maxSizeMB} MB`}
                                            </ThemedText>
                                        </View>
                                    )}
                                </Pressable>
                            )}
                        </View>

                        {/* Judul */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Nama/Judul Dokumen *
                            </ThemedText>
                            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                                <IconSymbol name="textformat" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={
                                        selectedTipe.id === 'KTP' ? 'KTP Atas Nama ...' :
                                            selectedTipe.id === 'KK' ? 'KK Keluarga ...' :
                                                'Mis: Surat Baptis, Sertifikat Krisma'
                                    }
                                    placeholderTextColor={colors.textSecondary}
                                    value={judul}
                                    onChangeText={setJudul}
                                    editable={!uploading}
                                />
                            </View>
                        </View>

                        {/* Keterangan */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Keterangan (opsional)
                            </ThemedText>
                            <View style={[styles.inputRow, {
                                borderColor: colors.border,
                                backgroundColor: colors.backgroundSecondary,
                                alignItems: 'flex-start',
                                minHeight: 70,
                            }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text, textAlignVertical: 'top' }]}
                                    placeholder="Catatan tambahan tentang dokumen ini..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={keterangan}
                                    onChangeText={setKeterangan}
                                    multiline
                                    numberOfLines={3}
                                    editable={!uploading}
                                />
                            </View>
                        </View>

                        {/* Progress */}
                        {uploadProgress && (
                            <View style={[styles.progressBox, { backgroundColor: colors.backgroundSecondary }]}>
                                <ActivityIndicator size="small" color={selectedTipe.color} />
                                <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
                                    {uploadProgress}
                                </ThemedText>
                            </View>
                        )}

                        {/* Upload Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.btn,
                                {
                                    backgroundColor: !isReady ? colors.border : selectedTipe.color,
                                    opacity: pressed ? 0.85 : 1,
                                }
                            ]}
                            onPress={handleUpload}
                            disabled={uploading || !isReady}>
                            {uploading
                                ? <ActivityIndicator color="#fff" />
                                : <ThemedText style={styles.btnText}>
                                    ⬆ Upload {selectedTipe.label}
                                </ThemedText>
                            }
                        </Pressable>
                    </Card>
                </Animated.View>

                <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
                    <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>Batal</ThemedText>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    scroll: { padding: Spacing.md, paddingTop: Spacing.xl, gap: Spacing.lg },
    headerContainer: { alignItems: 'center', gap: Spacing.sm },
    iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    iconText: { fontSize: 32 },
    title: { textAlign: 'center' },
    subtitle: { textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: Spacing.md },
    card: { gap: Spacing.md },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#FED7D7', padding: Spacing.sm, borderRadius: BorderRadius.sm },
    errorText: { color: '#e53e3e', fontSize: 13, flex: 1 },
    fieldGroup: { gap: Spacing.xs },
    label: { fontSize: 13, fontWeight: '600' },
    // Tipe Dokumen selector
    tipeContainer: { flexDirection: 'row', gap: Spacing.sm },
    tipeCard: { flex: 1, borderWidth: 1.5, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 4 },
    tipeIcon: { fontSize: 22 },
    tipeLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
    tipeFormat: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
    formatInfo: { borderWidth: 1, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: 4 },
    formatInfoText: { fontSize: 12, fontWeight: '500' },
    // File picker (PDF)
    filePicker: { borderWidth: 2, borderStyle: 'dashed', borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center' },
    filePickerEmpty: { alignItems: 'center', gap: Spacing.sm },
    filePickerEmptyText: { fontSize: 14, fontWeight: '500' },
    filePickerHint: { fontSize: 12 },
    filePickerSelected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: '100%' },
    filePickerInfo: { flex: 1, gap: 2 },
    filePickerName: { fontSize: 14, fontWeight: '600' },
    filePickerSize: { fontSize: 12 },
    // Image picker (Galeri & Kamera)
    imagePickerContainer: { gap: Spacing.sm },
    filePreviewBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1.5, borderRadius: BorderRadius.md, padding: Spacing.sm },
    imageButtonRow: { flexDirection: 'row', gap: Spacing.sm },
    imageOptionBtn: { flex: 1, borderWidth: 1.5, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4 },
    imageOptionIcon: { fontSize: 28 },
    imageOptionLabel: { fontSize: 13, fontWeight: '700' },
    imageOptionHint: { fontSize: 11, textAlign: 'center' },
    // Form inputs
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    input: { flex: 1, fontSize: 15 },
    progressBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.sm },
    progressText: { fontSize: 13 },
    btn: { paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.sm },
    btnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
    cancelText: { fontSize: 14 },
});
