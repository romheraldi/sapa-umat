import { File, Paths } from 'expo-file-system';
import { JadwalIbadah, Pengumuman, Keluarga, ApiResponse, PaginatedResponse, InfoGereja, TagihanIuran, Lingkungan, KeluargaLookup, KlaimPayload, KlaimResult } from '@/types/database';

// If testing on a real device, replace localhost with your computer's local IP address
// Example: export const API_BASE_URL = 'http://192.168.1.5:3000/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://www.sapa-umat.my.id/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const json = await response.json();
    if (!response.ok || json.error) {
        throw new Error(json.error || 'Terjadi kesalahan saat mengambil data.');
    }

    return json as T;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const api = {
    // Info Gereja
    getInfoGereja: () =>
        fetchApi<ApiResponse<InfoGereja>>('/info-gereja'),

    // Jadwal
    getJadwal: (kategori: string = 'Semua') => {
        const query = kategori !== 'Semua' ? `?kategori=${encodeURIComponent(kategori)}` : '';
        return fetchApi<ApiResponse<JadwalIbadah[]>>(`/jadwal${query}`);
    },

    getJadwalUpcoming: (limit: number = 5) => {
        const today = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return fetchApi<ApiResponse<JadwalIbadah[]>>(
            `/jadwal?kategori=Misa&start_date=${today}&end_date=${end}`
        );
    },

    // Pengumuman
    getPengumuman: (kategori: string = 'Semua', search: string = '') => {
        const params = new URLSearchParams();
        if (kategori !== 'Semua') params.append('kategori', kategori);
        if (search) params.append('search', search);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchApi<PaginatedResponse<Pengumuman>>(`/pengumuman${query}`);
    },

    getPengumumanPinned: () =>
        fetchApi<PaginatedResponse<Pengumuman>>('/pengumuman?is_pinned=true&limit=3'),

    getPengumumanDetail: (id: string) =>
        fetchApi<ApiResponse<Pengumuman>>(`/pengumuman/${id}`),

    // Umat / Keluarga
    getKeluarga: (search: string = '', token?: string) => {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return fetchApi<PaginatedResponse<Keluarga>>(`/umat/keluarga${query}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },

    getKeluargaDetail: (noKk: string, token?: string) =>
        fetchApi<ApiResponse<Keluarga>>(`/umat/keluarga/${noKk}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),

    // Klaim / Registrasi Keluarga
    getLingkungan: () =>
        fetchApi<ApiResponse<Lingkungan[]>>('/umat/lingkungan'),

    lookupKeluarga: (noKk: string, token?: string) =>
        fetchApi<ApiResponse<KeluargaLookup>>(`/umat/keluarga/lookup?no_kk=${encodeURIComponent(noKk)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),

    klaimKeluarga: (payload: KlaimPayload, token?: string) =>
        fetchApi<ApiResponse<KlaimResult>>('/umat/klaim', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: JSON.stringify(payload),
        }),

    // Iuran
    getTagihanIuran: (params?: { keluarga_id?: string; bulan?: number; tahun?: number; status?: string }, token?: string) => {
        const searchParams = new URLSearchParams();
        if (params?.keluarga_id) searchParams.append('keluarga_id', params.keluarga_id);
        if (params?.bulan) searchParams.append('bulan', params.bulan.toString());
        if (params?.tahun) searchParams.append('tahun', params.tahun.toString());
        if (params?.status) searchParams.append('status', params.status);
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return fetchApi<ApiResponse<TagihanIuran[]>>(`/iuran${query}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },

    bayarIuran: (tagihanIds: string[], token?: string) =>
        fetchApi<ApiResponse<{ qr_url: string; order_id: string; expiry_time: string }>>('/iuran/bayar', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: JSON.stringify({ tagihan_ids: tagihanIds }),
        }),

    cekStatusPembayaran: (orderId: string, token?: string) =>
        fetchApi<ApiResponse<{ transaction_status: string; tagihan_status: string; paid_at: string | null }>>(
            `/iuran/status/${orderId}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        ),

    // Mengunduh nota PDF, mengembalikan URI berkas lokal.
    // Tidak lewat fetchApi karena balasannya biner, bukan JSON.
    // Nama berkas mengikuti Content-Disposition dari server, jadi jadi
    // NOTA-2026-000123.pdf. Status non-2xx otomatis melempar error.
    unduhNota: async (orderId: string, token?: string): Promise<string> => {
        const berkas = await File.downloadFileAsync(
            `${API_BASE_URL}/iuran/nota/${orderId}`,
            Paths.cache,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                idempotent: true,
            }
        );
        return berkas.uri;
    },
};
