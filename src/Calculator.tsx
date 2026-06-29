import { useMemo, useState } from 'react'
import {
  ClipboardList,
  Factory,
  HelpCircle,
  PackageCheck,
  Percent,
  Plus,
  Printer,
  // ReceiptText,
  Target,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react'

type ProductType = 'manufacturing' | 'trading'
type PricingMethod = 'margin' | 'sellingPrice' | 'profit'

type CostItem = {
  id: string
  name: string
  amount: number
}

type Product = {
  id: string
  name: string
  productType: ProductType
  pricingMethod: PricingMethod
  outputQuantity: number
  costs: CostItem[]
  margin: number
  sellingPrice: number
  profit: number
}

const maxProducts = 50

const defaultCostNames: Record<ProductType, string[]> = {
  manufacturing: [
    'Biaya bahan baku',
    'Biaya bahan pembantu',
    'Biaya overhead',
  ],
  trading: ['Harga beli barang'],
}

const helpItems = [
  [
    'Manufaktur',
    'Dipakai untuk produk yang dibuat sendiri; masukkan semua biaya produksi dan jumlah hasil agar biaya dasar per produk bisa dihitung otomatis.',
  ],
  [
    'Barang Dagang',
    'Dipakai untuk produk yang dibeli lalu dijual kembali.',
  ],
  [
    'Nama Biaya',
    'Label atau nama biaya yang ingin dicatat, misalnya bahan baku, tenaga kerja, ongkir, kemasan, atau komisi.',
  ],
  [
    'Besar Biaya',
    'Nominal biaya untuk satu komponen biaya dalam satu batch produksi atau satu paket pembelian.',
  ],
  [
    'Biaya Dibebankan',
    'Total biaya tambahan yang dialokasikan ke produk, seperti listrik, sewa, atau biaya operasional lainnya.',
  ],
  [
    'Total Biaya',
    'Jumlah keseluruhan biaya dari semua komponen yang dimasukkan, baik biaya utama maupun biaya tambahan.',
  ],
  [
    'Jumlah Produk',
    'Total unit barang yang dihasilkan atau dibeli dalam satu proses perhitungan biaya.',
  ],
  [
    'Jumlah Produk yang Dihasilkan',
    'Jumlah unit yang dihasilkan dari seluruh biaya (total biaya dibagi angka ini untuk mendapatkan biaya dasar per produk).',
  ],
  [
    'Biaya Dasar per Produk',
    'Biaya rata-rata untuk menghasilkan atau mendapatkan satu produk (dihitung dari total biaya dibagi jumlah produk).',
  ],
  [
    'Margin',
    'Persentase keuntungan yang ditambahkan dari biaya dasar per produk untuk menentukan harga jual.',
  ],
  [
    'Margin terhadap Biaya',
    'Persentase keuntungan berdasarkan selisih antara harga jual dan biaya dasar produk.',
  ],
  [
    'Margin terhadap Penjualan',
    'Persentase keuntungan dari total penjualan setelah dikurangi biaya, dibandingkan dengan harga jual.',
  ],
  [
    'Harga Jual',
    'Harga akhir produk yang akan dijual ke pelanggan setelah biaya dan margin diperhitungkan.',
  ],
  [
    'Keuntungan',
    'Nominal laba yang diperoleh dari selisih antara harga jual dan biaya dasar per produk.',
  ],
]

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const percent = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
})

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function money(value: number) {
  return rupiah.format(Math.max(0, Math.round(value)))
}

function createCosts(type: ProductType) {
  return defaultCostNames[type].map((name, index) => ({
    id: `${type}-cost-${Date.now()}-${index}`,
    name,
    amount: 0,
  }))
}

function createProduct(index: number): Product {
  return {
    id: `product-${Date.now()}-${index}`,
    name: `Produk ${index + 1}`,
    productType: 'manufacturing',
    pricingMethod: 'margin',
    outputQuantity: 0,
    costs: createCosts('manufacturing'),
    margin: 0,
    sellingPrice: 0,
    profit: 0,
  }
}

function calculateResult(product: Product) {
  const totalCost = product.costs.reduce((sum, cost) => sum + cost.amount, 0)
  const outputQuantity = product.outputQuantity
  const baseCost = outputQuantity > 0 ? totalCost / outputQuantity : 0

  let sellingPrice = baseCost
  let profit = 0

  if (product.pricingMethod === 'margin') {
    profit = baseCost * (product.margin / 100)
    sellingPrice = baseCost + profit
  }

  if (product.pricingMethod === 'sellingPrice') {
    sellingPrice = product.sellingPrice
    profit = sellingPrice - baseCost
  }

  if (product.pricingMethod === 'profit') {
    profit = product.profit
    sellingPrice = baseCost + profit
  }

  const marginOnCost = baseCost > 0 ? (profit / baseCost) * 100 : 0
  const marginOnSales = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0

  return {
    totalCost,
    baseCost,
    sellingPrice,
    profit,
    marginOnCost,
    marginOnSales,
  }
}

function NumberField({
  id,
  label,
  value,
  suffix,
  onChange,
}: {
  id: string
  label: string
  value: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="grid gap-2 text-[#706b60] text-[0.9rem] font-[750]" htmlFor={id}>
      <span>{label}</span>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border border-[#d8cdbb] rounded-lg bg-white overflow-hidden focus-within:border-[#1f7a68] focus-within:ring-[3px] focus-within:ring-[#1f7a68]/15">
        <input
          id={id}
          min="0"
          type="number"
          placeholder="0" // Tambahkan placeholder
          className="w-full min-h-[54px] border-0 outline-none px-3.5 text-[#24231f] bg-transparent text-[1.05rem] font-extrabold"
          // Jika value adalah 0, jadikan string kosong agar kursor langsung bisa mengetik tanpa angka 0 di depan
          value={value === 0 ? '' : value}
          onChange={(event) => onChange(toNumber(event.target.value))}
        />
        {suffix ? <b className="px-3.5 text-[#145a4d]">{suffix}</b> : null}
      </div>
    </label>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-[#706b60] text-[0.9rem] font-[750]" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        className="w-full min-h-[54px] border border-[#d8cdbb] rounded-lg outline-none px-3.5 text-[#24231f] bg-white text-[1.05rem] font-extrabold focus:border-[#1f7a68] focus:ring-[3px] focus:ring-[#1f7a68]/15"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export default function Calculator() {
  const [products, setProducts] = useState<Product[]>(() => [createProduct(0)])
  const [activeProductId, setActiveProductId] = useState(products[0].id)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single')

  const activeProduct = products.find((product) => product.id === activeProductId) ?? products[0]

  const updateProduct = (updates: Partial<Product>) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === activeProduct.id ? { ...product, ...updates } : product,
      ),
    )
  }

  const updateType = (productType: ProductType) => {
    updateProduct({
      productType,
      costs: createCosts(productType),
    })
  }

  const updateCost = (costId: string, updates: Partial<CostItem>) => {
    updateProduct({
      costs: activeProduct.costs.map((cost) =>
        cost.id === costId ? { ...cost, ...updates } : cost,
      ),
    })
  }

  const addCost = () => {
    updateProduct({
      costs: [
        ...activeProduct.costs,
        {
          id: `custom-cost-${Date.now()}`,
          name: 'Biaya lainnya',
          amount: 0,
        },
      ],
    })
  }

  const removeCost = (costId: string) => {
    updateProduct({
      costs: activeProduct.costs.filter((cost) => cost.id !== costId),
    })
  }

  const addProduct = () => {
    if (products.length >= maxProducts) return

    const product = createProduct(products.length)
    setProducts((current) => [...current, product])
    setActiveProductId(product.id)
  }

  const removeProduct = (productId: string) => {
    if (products.length === 1) return

    const nextProducts = products.filter((product) => product.id !== productId)
    setProducts(nextProducts)
    if (activeProductId === productId) {
      setActiveProductId(nextProducts[0].id)
    }
  }

  const result = useMemo(() => calculateResult(activeProduct), [activeProduct])

  const handlePrintSingle = () => {
    setPrintMode('single')
    setTimeout(() => window.print(), 100)
  }

  const handlePrintAll = () => {
    setPrintMode('all')
    setTimeout(() => window.print(), 100)
  }

  // Fungsi baru untuk ekspor ke Excel (Format CSV)
  const handleExportExcel = () => {
    const headers = [
      'Nama Produk',
      'Jenis Produk',
      'Metode Harga',
      'Jumlah Output (Unit)',
      'Total Biaya',
      'Biaya Dasar per Produk',
      'Harga Jual',
      'Keuntungan',
      'Margin Terhadap Biaya (%)',
      'Margin Terhadap Penjualan (%)'
    ]

    const rows = products.map((product) => {
      const prodResult = calculateResult(product)

      const typeLabel = product.productType === 'manufacturing' ? 'Manufaktur' : 'Barang Dagang'
      let methodLabel = 'Margin'
      if (product.pricingMethod === 'sellingPrice') methodLabel = 'Harga Jual'
      if (product.pricingMethod === 'profit') methodLabel = 'Keuntungan'

      return [
        `"${product.name.trim() || 'Produk tanpa nama'}"`,
        `"${typeLabel}"`,
        `"${methodLabel}"`,
        product.outputQuantity,
        prodResult.totalCost,
        prodResult.baseCost,
        prodResult.sellingPrice,
        prodResult.profit,
        prodResult.marginOnCost.toFixed(2),
        prodResult.marginOnSales.toFixed(2)
      ].join(',') // Menggunakan koma sebagai pemisah kolom
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `laporan-semua-produk-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="min-h-screen text-[#24231f] font-['Aptos','Segoe_UI',sans-serif] print:bg-white"
      style={{
        background: `
          linear-gradient(90deg, rgba(36, 35, 31, 0.045) 1px, transparent 1px) 0 0 / 44px 44px,
          linear-gradient(rgba(36, 35, 31, 0.045) 1px, transparent 1px) 0 0 / 44px 44px,
          radial-gradient(circle at 12% 18%, rgba(197, 139, 43, 0.18), transparent 28rem),
          radial-gradient(circle at 82% 12%, rgba(31, 122, 104, 0.16), transparent 26rem),
          #f7f2e9
        `,
      }}
    >
      <main className="w-[min(1180px,calc(100%-32px))] mx-auto py-[42px] max-sm:w-[calc(100%-20px)] max-sm:py-6 print:w-full print:p-0">

        {/* Intro Panel */}
        <section className="relative grid grid-cols-[auto_minmax(0,780px)_auto] max-md:grid-cols-1 gap-[22px] items-start mb-[28px] print:hidden">
          <button
            type="button"
            className="inline-grid w-[58px] h-[58px] grid-cols-[auto_auto] min-w-[58px] h-[58px] items-center justify-center gap-[3px] border border-[#24231f] rounded-lg text-[#24231f] bg-white font-black shadow-[6px_6px_0_#1f7a68] max-md:justify-self-start disabled:opacity-50"
            aria-expanded={isHelpOpen}
            aria-label="Buka penjelasan kalkulator"
            onClick={() => setIsHelpOpen((current) => !current)}
          >
            <HelpCircle size={22} />
          </button>
          <div>
            <h1 className="max-w-[860px] m-0 mb-3 font-['Georgia','Times_New_Roman',serif] text-[clamp(2.25rem,6vw,5.2rem)] leading-[0.94]">
              Kalkulator Harga Jual Produk
            </h1>
          </div>
        </section>

        {/* Help Panel */}
        {isHelpOpen && (
          <section className="grid grid-cols-2 max-md:grid-cols-1 gap-[2px] -mt-2 mb-[22px] border border-[#d8cdbb] rounded-lg overflow-hidden bg-[#d8cdbb] print:hidden" aria-label="Penjelasan kalkulator">
            {helpItems.map(([title, description]) => (
              <div key={title} className="p-4 bg-[#fffaf0]/95">
                <b className="block mb-1.5 text-[#145a4d]">{title}</b>
                <p className="m-0 text-[#706b60] text-[0.92rem] leading-[1.55]">{description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Product Bar */}
        <section className="grid grid-cols-[minmax(0,1fr)_auto] max-md:grid-cols-1 gap-3 items-start mb-[22px] print:hidden" aria-label="Daftar produk">
          <div className="flex flex-wrap gap-2">
            {products.map((product, index) => {
              const isActive = product.id === activeProduct.id
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`inline-flex min-h-[42px] max-w-[230px] items-center justify-center gap-2 px-3 border rounded-lg font-extrabold ${isActive ? 'text-white bg-[#24231f] border-[#24231f]' : 'text-[#24231f] bg-[#fffaf0]/90 border-[#d8cdbb]'
                    }`}
                  onClick={() => setActiveProductId(product.id)}
                >
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {product.name.trim() || `Produk ${index + 1}`}
                  </span>
                  {products.length > 1 && (
                    <Trash2
                      size={16}
                      onClick={(event) => {
                        event.stopPropagation()
                        removeProduct(product.id)
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

        </section>

        {/* Workspace Mode: Print Single (Tampil di browser & print single) */}
        <section className={`grid grid-cols-[minmax(0,1.05fr)_minmax(360px,0.72fr)] max-md:grid-cols-1 gap-[22px] items-start print:block ${printMode === 'all' ? 'print:hidden' : ''}`}>
          <div className="relative px-5 py-5 pt-10 h-full border border-[#d8cdbb] rounded-lg bg-[#fffaf0]/90 shadow-[0_24px_70px_rgba(36,35,31,0.12)] print:hidden">
            <button
              type="button"
              className="absolute top-4 right-5 inline-flex min-h-[42px] items-center justify-center gap-2 px-3.5 border border-[#1f7a68] rounded-lg text-white bg-[#1f7a68] font-extrabold disabled:opacity-52 disabled:cursor-not-allowed"
              disabled={products.length >= maxProducts}
              onClick={addProduct}
            >
              <Plus size={18} />
              Tambah produk
            </button>

            <div className="mb-4">
              <TextField
                id="productName"
                label="Nama produk"
                value={activeProduct.name}
                onChange={(name) => updateProduct({ name })}
              />
            </div>

            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2 mb-3" aria-label="Jenis produk">
              <button
                type="button"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 border rounded-lg font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68] ${activeProduct.productType === 'manufacturing' ? 'text-white bg-[#1f7a68] border-[#1f7a68]' : 'text-[#24231f] bg-[#f7f2e9]/68 border-[#d8cdbb]'
                  }`}
                onClick={() => updateType('manufacturing')}
              >
                <Factory size={18} /> Manufaktur
              </button>
              <button
                type="button"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 border rounded-lg font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68] ${activeProduct.productType === 'trading' ? 'text-white bg-[#1f7a68] border-[#1f7a68]' : 'text-[#24231f] bg-[#f7f2e9]/68 border-[#d8cdbb]'
                  }`}
                onClick={() => updateType('trading')}
              >
                <PackageCheck size={18} /> Barang dagang
              </button>
            </div>

            <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-2 mb-5">
              <button
                type="button"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 border rounded-lg font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68] ${activeProduct.pricingMethod === 'margin' ? 'text-white bg-[#1f7a68] border-[#1f7a68]' : 'text-[#24231f] bg-[#f7f2e9]/68 border-[#d8cdbb]'
                  }`}
                onClick={() => updateProduct({ pricingMethod: 'margin' })}
              >
                <Percent size={19} /> Margin
              </button>
              <button
                type="button"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 border rounded-lg font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68] ${activeProduct.pricingMethod === 'sellingPrice' ? 'text-white bg-[#1f7a68] border-[#1f7a68]' : 'text-[#24231f] bg-[#f7f2e9]/68 border-[#d8cdbb]'
                  }`}
                onClick={() => updateProduct({ pricingMethod: 'sellingPrice' })}
              >
                <Target size={19} /> Harga jual
              </button>
              <button
                type="button"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 border rounded-lg font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68] ${activeProduct.pricingMethod === 'profit' ? 'text-white bg-[#1f7a68] border-[#1f7a68]' : 'text-[#24231f] bg-[#f7f2e9]/68 border-[#d8cdbb]'
                  }`}
                onClick={() => updateProduct({ pricingMethod: 'profit' })}
              >
                <ClipboardList size={19} /> Keuntungan
              </button>
            </div>

            <div className="grid gap-3 mb-[18px]">
              <div className="flex gap-3 items-center justify-between">
                <h2 className="m-0 text-[1.05rem] font-bold">Rincian biaya</h2>
                <button
                  type="button"
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 px-3 border border-[#d8cdbb] rounded-lg text-[#145a4d] bg-white font-extrabold"
                  onClick={addCost}
                >
                  <Plus size={17} /> Tambah biaya
                </button>
              </div>

              {activeProduct.costs.map((cost, index) => (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(150px,0.8fr)_46px] max-sm:grid-cols-1 gap-2.5 items-end p-3 border border-[#d8cdbb] rounded-lg bg-[#f7f2e9]/50" key={cost.id}>
                  <TextField
                    id={`cost-name-${cost.id}`}
                    label={`Nama biaya ${index + 1}`}
                    value={cost.name}
                    onChange={(name) => updateCost(cost.id, { name })}
                  />
                  <NumberField
                    id={`cost-amount-${cost.id}`}
                    label="Besar biaya"
                    value={cost.amount}
                    onChange={(amount) => updateCost(cost.id, { amount })}
                  />
                  <button
                    type="button"
                    className="inline-flex w-[46px] h-[54px] max-sm:w-full items-center justify-center border border-[#d8cdbb] rounded-lg text-[#b95f49] bg-white disabled:opacity-52 disabled:cursor-not-allowed"
                    aria-label="Hapus biaya"
                    disabled={activeProduct.costs.length === 1}
                    onClick={() => removeCost(cost.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[14px]">
              <NumberField
                id="outputQuantity"
                label="Menghasilkan berapa produk"
                value={activeProduct.outputQuantity}
                onChange={(outputQuantity) => updateProduct({ outputQuantity })}
              />
              {activeProduct.pricingMethod === 'margin' && (
                <NumberField
                  id="margin"
                  label="Margin dari biaya"
                  value={activeProduct.margin}
                  suffix="%"
                  onChange={(margin) => updateProduct({ margin })}
                />
              )}
              {activeProduct.pricingMethod === 'sellingPrice' && (
                <NumberField
                  id="sellingPrice"
                  label="Harga jual ditentukan"
                  value={activeProduct.sellingPrice}
                  onChange={(sellingPrice) => updateProduct({ sellingPrice })}
                />
              )}
              {activeProduct.pricingMethod === 'profit' && (
                <NumberField
                  id="profit"
                  label="Keuntungan ditetapkan"
                  value={activeProduct.profit}
                  onChange={(profit) => updateProduct({ profit })}
                />
              )}
            </div>
          </div>

          <aside className="p-[22px] sticky top-[22px] max-md:static border border-[#d8cdbb] rounded-lg bg-[#fffaf0]/90 shadow-[0_24px_70px_rgba(36,35,31,0.12)] print:border-0 print:shadow-none print:p-0">
            <div className="flex gap-[14px] items-start justify-between pb-[18px] border-b border-[#d8cdbb] max-sm:grid">
              <div>
                <p className="m-0 mb-2 text-[#145a4d] text-[0.78rem] font-extrabold tracking-[0.08em] uppercase">Laporan harga jual</p>
                <h2 className="m-0 font-['Georgia','Times_New_Roman',serif] text-[clamp(2rem,5vw,3.65rem)] leading-[0.95]">
                  {money(result.sellingPrice)}
                </h2>
                <span className="block mt-2 text-[#706b60] font-extrabold">
                  {activeProduct.name.trim() || 'Produk tanpa nama'}
                </span>
              </div>

            </div>

            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2.5 my-[18px]">
              <div className="min-h-[92px] p-3.5 rounded-lg text-white bg-[#24231f]">
                <span className="block text-white/75 text-[0.82rem] font-[750]">Total biaya batch</span>
                <b className="block mt-3 text-[1.1rem] font-bold">{money(result.totalCost)}</b>
              </div>
              <div className="min-h-[92px] p-3.5 rounded-lg text-white bg-[#b95f49]">
                <span className="block text-white/75 text-[0.82rem] font-[750]">Keuntungan per produk</span>
                <b className="block mt-3 text-[1.1rem] font-bold">{money(result.profit)}</b>
              </div>
            </div>

            <div className="grid gap-[2px] border border-[#d8cdbb] rounded-lg overflow-hidden bg-[#d8cdbb]">
              {activeProduct.costs.map((cost) => (
                <div key={cost.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                  <span className="block text-[#706b60] text-[0.82rem] font-[750]">{cost.name.trim() || 'Biaya tanpa nama'}</span>
                  <b className="text-right font-bold">{money(cost.amount)}</b>
                </div>
              ))}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-[#efe5d5]">
                <span className="block text-[#706b60] text-[0.82rem] font-[750]">Total biaya</span>
                <b className="text-right font-bold">{money(result.totalCost)}</b>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                <span className="block text-[#706b60] text-[0.82rem] font-[750]">Jumlah produk</span>
                <b className="text-right font-bold">{percent.format(activeProduct.outputQuantity)} unit</b>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                <span className="block text-[#706b60] text-[0.82rem] font-[750]">Biaya dasar per produk</span>
                <b className="text-right font-bold">{money(result.baseCost)}</b>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                <span className="block text-[#706b60] text-[0.82rem] font-[750]">Margin terhadap biaya</span>
                <b className="text-right font-bold">{percent.format(result.marginOnCost)}%</b>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                <span className="block text-[#706b60] text-[0.82rem] font-[750]">Margin terhadap penjualan</span>
                <b className="text-right font-bold">{percent.format(result.marginOnSales)}%</b>
              </div>
            </div>

            <div className="mt-3.5 p-3.5 border-l-4 border-[#c58b2b] text-[#706b60] bg-[#efe5d5]/60 text-[0.94rem] leading-[1.55] print:hidden">
              {activeProduct.productType === 'manufacturing'
                ? 'Mode manufaktur membagi total biaya produksi dengan jumlah produk yang dihasilkan, lalu menghitung harga jual per produk.'
                : 'Mode barang dagang memakai harga beli dan biaya tambahan sebagai total biaya, lalu menghitung harga jual per produk.'}
            </div>

            <div className="flex flex-col gap-2 print:hidden mt-4">
              <button
                type="button"
                className="inline-flex min-w-[96px] min-h-[48px] items-center justify-center gap-2 px-3 border border-[#d8cdbb] rounded-lg text-[#145a4d] bg-white font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68]"
                onClick={handlePrintSingle}
                title="Cetak Produk Ini"
              >
                <Printer size={18} /> Cetak Produk Yang Dipilih
              </button>
              <button
                type="button"
                className="inline-flex min-w-[96px] min-h-[48px] items-center justify-center gap-2 px-3 border border-[#d8cdbb] rounded-lg text-[#145a4d] bg-white font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68]"
                onClick={handlePrintAll}
                title="Cetak Semua Produk"
              >
                <Printer size={18} /> Cetak Semua Produk
              </button>
              <button
                type="button"
                className="inline-flex min-w-[96px] min-h-[48px] items-center justify-center gap-2 px-3 border border-[#d8cdbb] rounded-lg text-[#145a4d] bg-white font-[750] transition-all duration-160 hover:-translate-y-[1px] hover:border-[#1f7a68]"
                onClick={handleExportExcel}
                title="Export Laporan ke CSV Excel"
              >
                <FileSpreadsheet size={18} /> Export Excel (CSV)
              </button>
            </div>
          </aside>
        </section>

        <footer className="w-fit mx-auto p-2 shadow flex bg-[#fffaf0]/90 rounded-full justify-center font-['Georgia','Times_New_Roman',serif] font-light text-xs mt-6">
          &copy; 2026 Pricing Calc | Version 1.1 | Developed by <a href="https://www.instagram.com/rembaka.bondowoso/" className='ml-1 text-[#808554] hover:underline hover:text-[#aeb388] transform'>KKN Rembaka Bondowoso</a>
        </footer>

        {/* Workspace Mode: Print All (Hanya tampil saat tombol cetak semua ditekan) */}
        <div className={printMode === 'all' ? 'hidden print:block' : 'hidden'}>
          {products.map((product, index) => {
            const prodResult = calculateResult(product)
            return (
              <div key={product.id} className="print:break-inside-avoid print:break-after-page print:mb-8">
                <div className="flex gap-[14px] items-start justify-between pb-[18px] border-b border-[#d8cdbb]">
                  <div>
                    <p className="m-0 mb-2 text-[#145a4d] text-[0.78rem] font-extrabold tracking-[0.08em] uppercase">
                      Laporan Harga Jual (Produk {index + 1} dari {products.length})
                    </p>
                    <h2 className="m-0 font-['Georgia','Times_New_Roman',serif] text-[clamp(2rem,5vw,3.65rem)] leading-[0.95]">
                      {money(prodResult.sellingPrice)}
                    </h2>
                    <span className="block mt-2 text-[#706b60] font-extrabold">
                      {product.name.trim() || 'Produk tanpa nama'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 my-[18px]">
                  <div className="min-h-[92px] p-3.5 rounded-lg text-white bg-[#24231f]">
                    <span className="block text-white/75 text-[0.82rem] font-[750]">Total biaya batch</span>
                    <b className="block mt-3 text-[1.1rem] font-bold">{money(prodResult.totalCost)}</b>
                  </div>
                  <div className="min-h-[92px] p-3.5 rounded-lg text-white bg-[#b95f49]">
                    <span className="block text-white/75 text-[0.82rem] font-[750]">Keuntungan per produk</span>
                    <b className="block mt-3 text-[1.1rem] font-bold">{money(prodResult.profit)}</b>
                  </div>
                </div>

                <div className="grid gap-[2px] border border-[#d8cdbb] rounded-lg overflow-hidden bg-[#d8cdbb]">
                  {product.costs.map((cost) => (
                    <div key={cost.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                      <span className="block text-[#706b60] text-[0.82rem] font-[750]">{cost.name.trim() || 'Biaya tanpa nama'}</span>
                      <b className="text-right font-bold">{money(cost.amount)}</b>
                    </div>
                  ))}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-[#efe5d5]">
                    <span className="block text-[#706b60] text-[0.82rem] font-[750]">Total biaya</span>
                    <b className="text-right font-bold">{money(prodResult.totalCost)}</b>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                    <span className="block text-[#706b60] text-[0.82rem] font-[750]">Jumlah produk</span>
                    <b className="text-right font-bold">{percent.format(product.outputQuantity)} unit</b>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                    <span className="block text-[#706b60] text-[0.82rem] font-[750]">Biaya dasar per produk</span>
                    <b className="text-right font-bold">{money(prodResult.baseCost)}</b>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                    <span className="block text-[#706b60] text-[0.82rem] font-[750]">Margin terhadap biaya</span>
                    <b className="text-right font-bold">{percent.format(prodResult.marginOnCost)}%</b>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center p-[13px_14px] bg-white">
                    <span className="block text-[#706b60] text-[0.82rem] font-[750]">Margin terhadap penjualan</span>
                    <b className="text-right font-bold">{percent.format(prodResult.marginOnSales)}%</b>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}