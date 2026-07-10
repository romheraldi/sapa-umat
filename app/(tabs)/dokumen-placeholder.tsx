import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// ─── Fitur / menu item ─────────────────────────────────────────────────────────
interface MenuItem {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    color: string;
    bg: string;
    route: string;
}

const MEMBER_MENU: MenuItem[] = [
    {
        id: 'upload',
        icon: 'arrow.up.doc.fill',
        title: 'Upload Dokumen',
        subtitle: 'Unggah KTP, KK, atau dokumen gereja',
        color: '#800020',
        bg: '#FFF5F5',
        route: '/dokumen/upload',
    },
    {
        id: 'dokumen',
        icon: 'doc.text.fill',
        title: 'Dokumen Saya',
        subtitle: 'Lihat dan kelola dokumen yang tersimpan',
        color: '#1565C0',
        bg: '#EFF6FF',
        route: '/dokumen',
    },
];

const FEATURES = [
    { icon: 'lock.shield.fill', text: 'Data Anda tersimpan aman & terenkripsi', color: '#10B981' },
    { icon: 'doc.badge.plus', text: 'Upload KTP, KK, dan dokumen gereja', color: '#3B82F6' },
    { icon: 'bell.badge.fill', text: 'Notifikasi status dokumen terkini', color: '#F59E0B' },
];

// ─── Guest Page (belum login) ─────────────────────────────────────────────────
function GuestView() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            {/* ── Header Banner ── */}
            <Animated.View entering={FadeIn.duration(500)} style={[styles.heroBanner, { backgroundColor: colors.primary }]}>
                <View style={styles.heroPattern}>
                    <View style={[styles.heroCircle, styles.heroCircle1]} />
                    <View style={[styles.heroCircle, styles.heroCircle2]} />
                </View>
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroContent}>
                    <Image
                        source={require('@/assets/images/paroki-logo.png')}
                        style={styles.heroLogo}
                        resizeMode="contain"
                    />
                    <ThemedText type="title" style={styles.heroTitle}>
                        Area Umat
                    </ThemedText>
                    <ThemedText style={styles.heroSubtitle}>
                        Paroki Santo Arnoldus Janssen · Bekasi
                    </ThemedText>
                </Animated.View>
            </Animated.View>

            {/* ── Promosi Login ── */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.promoSection}>
                <ThemedText type="heading3" style={[styles.promoTitle, { color: colors.text }]}>
                    Masuk untuk Mengakses Fitur Umat
                </ThemedText>
                <ThemedText style={[styles.promoDesc, { color: colors.textSecondary }]}>
                    Login atau daftar akun untuk mengelola dokumen pribadi dan mengakses layanan paroki secara digital.
                </ThemedText>

                {/* Feature list */}
                <View style={styles.featureList}>
                    {FEATURES.map((f, i) => (
                        <Animated.View
                            key={f.icon}
                            entering={FadeInDown.duration(400).delay(300 + i * 80)}
                            style={[styles.featureItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                            <View style={[styles.featureIconWrap, { backgroundColor: f.color + '18' }]}>
                                <IconSymbol name={f.icon as any} size={22} color={f.color} />
                            </View>
                            <ThemedText style={[styles.featureText, { color: colors.text }]}>{f.text}</ThemedText>
                        </Animated.View>
                    ))}
                </View>
            </Animated.View>

            {/* ── Action Buttons ── */}
            <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.actionSection}>
                {/* Masuk */}
                <Pressable
                    style={({ pressed }) => [styles.btnPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
                    onPress={() => router.push('/login' as any)}>
                    <IconSymbol name="person.fill" size={20} color="#fff" />
                    <ThemedText style={styles.btnPrimaryText}>Masuk Akun</ThemedText>
                </Pressable>

                {/* Daftar */}
                <Pressable
                    style={({ pressed }) => [styles.btnOutline, { borderColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
                    onPress={() => router.push('/register' as any)}>
                    <IconSymbol name="person.badge.plus" size={20} color={colors.primary} />
                    <ThemedText style={[styles.btnOutlineText, { color: colors.primary }]}>Daftar Akun Baru</ThemedText>
                </Pressable>

                <ThemedText style={[styles.btnNote, { color: colors.textSecondary }]}>
                    Pendaftaran gratis · Data pribadi terlindungi
                </ThemedText>
            </Animated.View>

            {/* ── Footer ── */}
            <Animated.View entering={FadeIn.duration(600).delay(700)} style={styles.footer}>
                <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                    Paroki Santo Arnoldus Janssen · Bekasi{'\n'}Keuskupan Agung Jakarta
                </ThemedText>
            </Animated.View>
        </ScrollView>
    );
}

// ─── Member Dashboard (sudah login) ──────────────────────────────────────────
function MemberView() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user, logout } = useAuth();

    const roleName: Record<string, string> = {
        umat: 'Umat',
        ketua_lingkungan: 'Ketua Lingkungan',
        ketua_wilayah: 'Ketua Wilayah',
        admin_paroki: 'Admin Paroki',
        pastor: 'Pastor',
    };

    const handleLogout = () => {
        Alert.alert(
            'Keluar Akun',
            'Apakah Anda yakin ingin keluar dari akun ini?',
            [
                { text: 'Batal', style: 'cancel' },
                { text: 'Keluar', style: 'destructive', onPress: logout },
            ]
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            {/* ── Header ── */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.memberHeader, { backgroundColor: colors.primary }]}>
                <View style={styles.heroPattern}>
                    <View style={[styles.heroCircle, styles.heroCircle1]} />
                    <View style={[styles.heroCircle, styles.heroCircle2]} />
                </View>

                {/* Avatar + Salam */}
                <View style={styles.memberHeaderContent}>
                    <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <IconSymbol name="person.fill" size={40} color="#fff" />
                    </View>
                    <View style={styles.memberInfo}>
                        <ThemedText style={styles.memberGreeting}>Selamat datang,</ThemedText>
                        <ThemedText type="title" style={styles.memberName} numberOfLines={1}>
                            {user?.nama_lengkap || user?.email || 'Umat'}
                        </ThemedText>
                        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                            <IconSymbol name="checkmark.seal.fill" size={13} color="rgba(255,255,255,0.9)" />
                            <ThemedText style={styles.roleText}>
                                {roleName[user?.role ?? 'umat'] ?? 'Umat'}
                            </ThemedText>
                        </View>
                    </View>
                    {/* Logout icon */}
                    <Pressable style={styles.logoutIconBtn} onPress={handleLogout}>
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={22} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                </View>

                {/* Tagline */}
                <View style={[styles.memberTaglineWrap, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <IconSymbol name="building.columns.fill" size={14} color="rgba(255,255,255,0.8)" />
                    <ThemedText style={styles.memberTagline}>
                        Paroki Santo Arnoldus Janssen · Bekasi
                    </ThemedText>
                </View>
            </Animated.View>

            {/* ── Menu Dokumen ── */}
            <Animated.View entering={FadeInDown.duration(450).delay(150)} style={styles.menuSection}>
                <ThemedText type="heading3" style={[styles.sectionTitle, { color: colors.text }]}>
                    📂 Layanan Dokumen
                </ThemedText>

                {MEMBER_MENU.map((item, idx) => (
                    <Animated.View key={item.id} entering={FadeInDown.duration(400).delay(200 + idx * 80)}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.menuCard,
                                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
                            ]}
                            onPress={() => router.push(item.route as any)}>
                            {/* Icon */}
                            <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                                <IconSymbol name={item.icon as any} size={30} color={item.color} />
                            </View>
                            {/* Text */}
                            <View style={styles.menuText}>
                                <ThemedText style={[styles.menuTitle, { color: colors.text }]}>{item.title}</ThemedText>
                                <ThemedText style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</ThemedText>
                            </View>
                            {/* Arrow */}
                            <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
                        </Pressable>
                    </Animated.View>
                ))}
            </Animated.View>

            {/* ── Info Akun ── */}
            <Animated.View entering={FadeInDown.duration(450).delay(400)} style={styles.infoSection}>
                <ThemedText type="heading3" style={[styles.sectionTitle, { color: colors.text }]}>
                    👤 Informasi Akun
                </ThemedText>
                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <InfoRow icon="envelope.fill" label="Email" value={user?.email ?? '-'} color={colors} />
                    <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="person.badge.key.fill" label="Role" value={roleName[user?.role ?? 'umat'] ?? 'Umat'} color={colors} />
                    <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="number" label="ID Akun" value={user?.id?.slice(0, 16) + '…' ?? '-'} color={colors} />
                </View>
            </Animated.View>

            {/* ── Logout Button ── */}
            <Animated.View entering={FadeInDown.duration(450).delay(550)} style={styles.logoutSection}>
                <Pressable
                    style={({ pressed }) => [styles.logoutBtn, { borderColor: '#e53e3e', opacity: pressed ? 0.75 : 1 }]}
                    onPress={handleLogout}>
                    <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#e53e3e" />
                    <ThemedText style={styles.logoutBtnText}>Keluar dari Akun</ThemedText>
                </Pressable>
            </Animated.View>

            {/* ── Footer Logo ── */}
            <Animated.View entering={FadeIn.duration(600).delay(700)} style={styles.footer}>
                <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
                <Image
                    source={require('@/assets/images/paroki-logo.png')}
                    style={styles.footerLogo}
                    resizeMode="contain"
                />
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                    Paroki Santo Arnoldus Janssen · Bekasi{'\n'}Keuskupan Agung Jakarta
                </ThemedText>
            </Animated.View>
        </ScrollView>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: any }) {
    return (
        <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: color.primary + '12' }]}>
                <IconSymbol name={icon as any} size={16} color={color.primary} />
            </View>
            <View style={styles.infoRowText}>
                <ThemedText style={[styles.infoLabel, { color: color.textSecondary }]}>{label}</ThemedText>
                <ThemedText style={[styles.infoValue, { color: color.text }]} numberOfLines={1}>{value}</ThemedText>
            </View>
        </View>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AkunScreen() {
    const { user } = useAuth();
    return user ? <MemberView /> : <GuestView />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: Spacing.xxl },

    // Hero / Header
    heroBanner: {
        paddingTop: Spacing.xxl + Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        overflow: 'hidden',
        position: 'relative',
    },
    heroPattern: { ...StyleSheet.absoluteFillObject },
    heroCircle: {
        position: 'absolute',
        borderRadius: 9999,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    heroCircle1: { width: 200, height: 200, top: -60, right: -40 },
    heroCircle2: { width: 140, height: 140, bottom: -30, left: -20 },
    heroContent: { alignItems: 'center', gap: Spacing.sm },
    heroLogo: { width: 90, height: 90 },
    heroTitle: { color: '#fff', textAlign: 'center' },
    heroSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 14, textAlign: 'center' },

    // Promo (guest)
    promoSection: { padding: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },
    promoTitle: { textAlign: 'center' },
    promoDesc: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
    featureList: { gap: Spacing.sm, marginTop: Spacing.xs },
    featureItem: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
    },
    featureIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    featureText: { fontSize: 14, flex: 1, lineHeight: 20 },

    // Action buttons (guest)
    actionSection: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingTop: Spacing.sm },
    btnPrimary: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        paddingVertical: 15, borderRadius: BorderRadius.lg,
    },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnOutline: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        paddingVertical: 14, borderRadius: BorderRadius.lg, borderWidth: 2,
    },
    btnOutlineText: { fontWeight: '700', fontSize: 16 },
    btnNote: { textAlign: 'center', fontSize: 12 },

    // Member header
    memberHeader: {
        paddingTop: Spacing.xxl + Spacing.md,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.md,
        overflow: 'hidden',
        gap: Spacing.md,
    },
    memberHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    memberInfo: { flex: 1, gap: 3 },
    memberGreeting: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
    memberName: { color: '#fff', fontSize: 22 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    roleText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    logoutIconBtn: { padding: 8 },
    memberTaglineWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
    memberTagline: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

    // Menu cards
    menuSection: { padding: Spacing.md, gap: Spacing.md },
    sectionTitle: { marginBottom: Spacing.xs },
    menuCard: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1,
    },
    menuIcon: { width: 58, height: 58, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    menuText: { flex: 1, gap: 3 },
    menuTitle: { fontSize: 16, fontWeight: '700' },
    menuSubtitle: { fontSize: 13, lineHeight: 18 },

    // Info card
    infoSection: { paddingHorizontal: Spacing.md, gap: Spacing.md },
    infoCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
    infoIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    infoRowText: { flex: 1, gap: 1 },
    infoLabel: { fontSize: 12 },
    infoValue: { fontSize: 14, fontWeight: '600' },
    infoDivider: { height: 1, marginHorizontal: Spacing.md },

    // Logout button
    logoutSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        paddingVertical: 13, borderRadius: BorderRadius.lg, borderWidth: 1.5,
    },
    logoutBtnText: { color: '#e53e3e', fontWeight: '700', fontSize: 15 },

    // Footer
    footer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
    footerDivider: { width: 50, height: 1, marginBottom: Spacing.sm },
    footerLogo: { width: 72, height: 72 },
    footerText: { fontSize: 12, textAlign: 'center', lineHeight: 19 },
});
