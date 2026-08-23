import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'
import { INFO_GEREJA } from '@/lib/gereja'
import {
  formatPeriode,
  formatRupiah,
  labelMetode,
  type NotaData,
} from '@/lib/nota/tipe'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  kop: { borderBottomWidth: 2, borderBottomColor: '#111827', paddingBottom: 10, marginBottom: 18 },
  namaGereja: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  kopKecil: { fontSize: 8, color: '#4B5563', marginTop: 2 },
  judul: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 14 },
  barisInfo: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 110, color: '#4B5563' },
  nilai: { flex: 1 },
  tabelKepala: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 16,
    fontFamily: 'Helvetica-Bold',
  },
  tabelBaris: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  kolNama: { flex: 2 },
  kolPeriode: { flex: 2 },
  kolNominal: { flex: 1, textAlign: 'right' },
  totalBaris: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
  },
  catatan: { marginTop: 28, fontSize: 8, color: '#6B7280', textAlign: 'center' },
})

function tanggalIndonesia(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function namaBerkasNota(nomor: string): string {
  return nomor.replace(/\//g, '-') + '.pdf'
}

function NotaDokumen({ nota }: { nota: NotaData }) {
  return (
    <Document title={nota.nomor}>
      <Page size="A4" style={s.page}>
        <View style={s.kop}>
          <Text style={s.namaGereja}>{INFO_GEREJA.nama}</Text>
          <Text style={s.kopKecil}>{INFO_GEREJA.alamat}</Text>
          <Text style={s.kopKecil}>
            Telp. {INFO_GEREJA.telepon} · {INFO_GEREJA.email}
          </Text>
        </View>

        <Text style={s.judul}>NOTA PEMBAYARAN IURAN</Text>

        <View style={s.barisInfo}>
          <Text style={s.label}>Nomor Nota</Text>
          <Text style={s.nilai}>{nota.nomor}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Tanggal Bayar</Text>
          <Text style={s.nilai}>{tanggalIndonesia(nota.paidAt)}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Nomor KK</Text>
          <Text style={s.nilai}>{nota.noKk}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Alamat</Text>
          <Text style={s.nilai}>{nota.alamat}</Text>
        </View>
        <View style={s.barisInfo}>
          <Text style={s.label}>Cara Bayar</Text>
          <Text style={s.nilai}>{labelMetode(nota.metode)}</Text>
        </View>

        <View style={s.tabelKepala}>
          <Text style={s.kolNama}>Jenis Iuran</Text>
          <Text style={s.kolPeriode}>Periode</Text>
          <Text style={s.kolNominal}>Nominal</Text>
        </View>

        {nota.baris.map((b, i) => (
          <View key={i} style={s.tabelBaris}>
            <Text style={s.kolNama}>{b.nama}</Text>
            <Text style={s.kolPeriode}>{formatPeriode(b.bulan, b.tahun)}</Text>
            <Text style={s.kolNominal}>{formatRupiah(b.nominal)}</Text>
          </View>
        ))}

        <View style={s.totalBaris}>
          <Text style={s.kolNama}>Total</Text>
          <Text style={s.kolPeriode}> </Text>
          <Text style={s.kolNominal}>{formatRupiah(nota.total)}</Text>
        </View>

        <Text style={s.catatan}>
          Dokumen ini dicetak otomatis oleh sistem dan sah tanpa tanda tangan.
        </Text>
        <Text style={s.catatan}>Ref: {nota.orderId}</Text>
      </Page>
    </Document>
  )
}

export async function renderNotaPdf(nota: NotaData): Promise<Buffer> {
  return renderToBuffer(<NotaDokumen nota={nota} />)
}
