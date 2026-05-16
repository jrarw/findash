import { ICONS } from '@/lib/iconography'

export type MarketTab = 'overview' | 'list' | 'compare' | 'items' | 'stores' | 'analytics' | 'history' | 'settings'
export type MarketKind = 'atacado' | 'mercado' | 'hortifruti' | 'farmacia' | 'online'
export type MarketUnit = 'un' | 'kg' | 'g' | 'l' | 'ml'

export interface MarketStore {
  id: string
  name: string
  location: string
  kind: MarketKind
  notes: string
  active: boolean
}

export interface MarketItem {
  id: string
  name: string
  category: string
  brand?: string
  unit: MarketUnit
  quantity: number
  recurring: boolean
  active: boolean
}

export interface MarketPrice {
  id: string
  itemId: string
  storeId: string
  price: number
  date: string
  brand?: string
  packageLabel: string
  quantity: number
  unit: MarketUnit
  promo?: boolean
  note?: string
  source: 'demo' | 'import' | 'manual'
}

export interface ShoppingListItem {
  id: string
  itemId: string
  quantity: number
  priority: 'alta' | 'media' | 'baixa'
  checked: boolean
  note?: string
}

export const MARKET_TABS: Array<{ key: MarketTab; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: ICONS.nav.home },
  { key: 'list', label: 'Lista', icon: ICONS.category.groceries },
  { key: 'compare', label: 'Comparador', icon: ICONS.chart.bar },
  { key: 'analytics', label: 'Analytics', icon: ICONS.chart.area },
  { key: 'history', label: 'Histórico', icon: ICONS.health.timeline },
]

export const marketStores: MarketStore[] = [
  { id: 'atacado-norte', name: 'Atacado Norte', location: 'Exemplo', kind: 'atacado', notes: 'Demo: forte em básicos, hortifruti e embalagens maiores.', active: true },
  { id: 'mercado-online', name: 'Mercado Online', location: 'Online', kind: 'online', notes: 'Demo: bom para conveniência, nem sempre melhor preço unitário.', active: true },
  { id: 'mercado-bairro', name: 'Mercado Bairro', location: 'Exemplo', kind: 'mercado', notes: 'Demo: competitivo em carnes e itens de despensa.', active: true },
  { id: 'farmacia-local', name: 'Farmácia Local', location: 'Bairro', kind: 'farmacia', notes: 'Demo: referência para higiene e farmácia.', active: true },
]

export const marketItems: MarketItem[] = [
  { id: 'abacate', name: 'Abacate', category: 'Hortifruti', unit: 'kg', quantity: 1, recurring: true, active: true },
  { id: 'abobrinha', name: 'Abobrinha', category: 'Hortifruti', unit: 'kg', quantity: 1, recurring: true, active: true },
  { id: 'absorvente-intimus-8', name: 'Absorvente íntimo', category: 'Higiene', brand: 'Intimus', unit: 'un', quantity: 8, recurring: true, active: true },
  { id: 'absorvente-intimus-42', name: 'Absorvente íntimo', category: 'Higiene', brand: 'Intimus', unit: 'un', quantity: 42, recurring: true, active: true },
  { id: 'acai-frooty-395', name: 'Açaí', category: 'Congelados', brand: 'Frooty', unit: 'g', quantity: 395, recurring: false, active: true },
  { id: 'acai-frooty-700', name: 'Açaí', category: 'Congelados', brand: 'Frooty', unit: 'ml', quantity: 700, recurring: false, active: true },
  { id: 'acem', name: 'Acém bovino', category: 'Carnes', unit: 'kg', quantity: 1, recurring: true, active: true },
  { id: 'nescau-350', name: 'Achocolatado em pó', category: 'Despensa', brand: 'Nescau', unit: 'g', quantity: 350, recurring: true, active: true },
  { id: 'arroz-5kg', name: 'Arroz branco', category: 'Básicos', unit: 'kg', quantity: 5, recurring: true, active: true },
  { id: 'feijao-1kg', name: 'Feijão carioca', category: 'Básicos', unit: 'kg', quantity: 1, recurring: true, active: true },
  { id: 'leite-1l', name: 'Leite integral', category: 'Laticínios', unit: 'l', quantity: 1, recurring: true, active: true },
  { id: 'detergente-500', name: 'Detergente', category: 'Limpeza', unit: 'ml', quantity: 500, recurring: true, active: true },
]

export const marketPrices: MarketPrice[] = [
  { id: 'p1', itemId: 'abacate', storeId: 'atacado-norte', price: 9.9, date: '2025-08-01', packageLabel: 'kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p2', itemId: 'abacate', storeId: 'mercado-bairro', price: 11.89, date: '2025-07-01', packageLabel: 'kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p3', itemId: 'abobrinha', storeId: 'atacado-norte', price: 6.9, date: '2025-08-01', packageLabel: 'kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p4', itemId: 'abobrinha', storeId: 'mercado-bairro', price: 8.49, date: '2025-07-01', packageLabel: 'kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p5', itemId: 'absorvente-intimus-8', storeId: 'atacado-norte', price: 4.85, date: '2025-03-01', brand: 'Marca A', packageLabel: 'c/ 8 unid.', quantity: 8, unit: 'un', source: 'demo' },
  { id: 'p6', itemId: 'absorvente-intimus-8', storeId: 'mercado-online', price: 7.19, date: '2025-05-01', brand: 'Marca A', packageLabel: 'c/ 8 unid', quantity: 8, unit: 'un', source: 'demo' },
  { id: 'p7', itemId: 'absorvente-intimus-42', storeId: 'atacado-norte', price: 21.95, date: '2025-08-01', brand: 'Marca A', packageLabel: 'c/42 unid', quantity: 42, unit: 'un', source: 'demo' },
  { id: 'p8', itemId: 'acai-frooty-395', storeId: 'atacado-norte', price: 9.1, date: '2025-03-01', brand: 'Marca B', packageLabel: '395g', quantity: 395, unit: 'g', source: 'demo' },
  { id: 'p9', itemId: 'acai-frooty-700', storeId: 'mercado-online', price: 29.67, date: '2025-05-01', brand: 'Marca B', packageLabel: '700ml', quantity: 700, unit: 'ml', source: 'demo' },
  { id: 'p10', itemId: 'acem', storeId: 'mercado-bairro', price: 35.9, date: '2025-07-01', packageLabel: 'kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p11', itemId: 'acem', storeId: 'atacado-norte', price: 39.8, date: '2025-08-01', packageLabel: 'kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p12', itemId: 'nescau-350', storeId: 'mercado-bairro', price: 8.69, date: '2025-07-01', brand: 'Marca C', packageLabel: '350g', quantity: 350, unit: 'g', source: 'demo' },
  { id: 'p13', itemId: 'nescau-350', storeId: 'mercado-online', price: 10.49, date: '2025-08-01', brand: 'Marca C', packageLabel: '350g', quantity: 350, unit: 'g', source: 'demo' },
  { id: 'p14', itemId: 'arroz-5kg', storeId: 'atacado-norte', price: 24.9, date: '2025-06-01', packageLabel: '5kg', quantity: 5, unit: 'kg', source: 'demo' },
  { id: 'p15', itemId: 'arroz-5kg', storeId: 'mercado-bairro', price: 28.4, date: '2025-08-01', packageLabel: '5kg', quantity: 5, unit: 'kg', source: 'demo' },
  { id: 'p16', itemId: 'feijao-1kg', storeId: 'atacado-norte', price: 6.99, date: '2025-06-01', packageLabel: '1kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p17', itemId: 'feijao-1kg', storeId: 'mercado-bairro', price: 7.89, date: '2025-08-01', packageLabel: '1kg', quantity: 1, unit: 'kg', source: 'demo' },
  { id: 'p18', itemId: 'leite-1l', storeId: 'atacado-norte', price: 4.59, date: '2025-06-01', packageLabel: '1L', quantity: 1, unit: 'l', source: 'demo' },
  { id: 'p19', itemId: 'leite-1l', storeId: 'mercado-online', price: 5.69, date: '2025-08-01', packageLabel: '1L', quantity: 1, unit: 'l', source: 'demo' },
  { id: 'p20', itemId: 'detergente-500', storeId: 'atacado-norte', price: 2.29, date: '2025-06-01', packageLabel: '500ml', quantity: 500, unit: 'ml', source: 'demo' },
  { id: 'p21', itemId: 'detergente-500', storeId: 'farmacia-local', price: 3.79, date: '2025-08-01', packageLabel: '500ml', quantity: 500, unit: 'ml', source: 'demo' },
]

export const shoppingList: ShoppingListItem[] = [
  { id: 's1', itemId: 'arroz-5kg', quantity: 1, priority: 'alta', checked: false },
  { id: 's2', itemId: 'feijao-1kg', quantity: 3, priority: 'alta', checked: false },
  { id: 's3', itemId: 'leite-1l', quantity: 8, priority: 'media', checked: false },
  { id: 's4', itemId: 'detergente-500', quantity: 4, priority: 'media', checked: false },
  { id: 's5', itemId: 'abacate', quantity: 2, priority: 'baixa', checked: false },
  { id: 's6', itemId: 'nescau-350', quantity: 1, priority: 'baixa', checked: true },
]

export function unitBaseLabel(unit: MarketUnit) {
  if (unit === 'g') return 'kg'
  if (unit === 'ml') return 'L'
  if (unit === 'un') return 'un'
  return unit
}

export function normalizedUnitPrice(price: MarketPrice) {
  if (price.unit === 'g') return price.price / Math.max(price.quantity / 1000, 0.001)
  if (price.unit === 'ml') return price.price / Math.max(price.quantity / 1000, 0.001)
  return price.price / Math.max(price.quantity, 0.001)
}

export function getItem(id: string) {
  return marketItems.find(item => item.id === id)
}

export function getStore(id: string) {
  return marketStores.find(store => store.id === id)
}

export function latestPricesByItem() {
  const map = new Map<string, MarketPrice[]>()
  marketPrices.forEach(price => {
    const current = map.get(price.itemId) ?? []
    map.set(price.itemId, [...current, price].sort((a, b) => b.date.localeCompare(a.date)))
  })
  return map
}

export function bestPriceForItem(itemId: string) {
  return marketPrices
    .filter(price => price.itemId === itemId)
    .sort((a, b) => normalizedUnitPrice(a) - normalizedUnitPrice(b))[0]
}

export function priceComparisonRows() {
  return marketItems.map(item => {
    const prices = marketPrices.filter(price => price.itemId === item.id)
    const sorted = [...prices].sort((a, b) => normalizedUnitPrice(a) - normalizedUnitPrice(b))
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    const average = prices.length ? prices.reduce((sum, price) => sum + normalizedUnitPrice(price), 0) / prices.length : 0
    return {
      item,
      best,
      worst,
      average,
      spread: best && worst ? normalizedUnitPrice(worst) - normalizedUnitPrice(best) : 0,
      savingsPct: best && worst ? ((normalizedUnitPrice(worst) - normalizedUnitPrice(best)) / normalizedUnitPrice(worst)) * 100 : 0,
      prices,
    }
  }).filter(row => row.best)
}

export function normalizeMarketSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function searchComparisonRows(query: string, category?: string) {
  const normalizedQuery = normalizeMarketSearch(query)

  return priceComparisonRows().filter(row => {
    const haystack = normalizeMarketSearch([
      row.item.name,
      row.item.brand,
      row.item.category,
      row.item.unit,
      ...row.prices.map(price => `${price.brand ?? ''} ${price.packageLabel} ${getStore(price.storeId)?.name ?? ''}`),
    ].filter(Boolean).join(' '))
    const categoryMatches = !category || row.item.category === category
    const queryMatches = !normalizedQuery || haystack.includes(normalizedQuery) || normalizedQuery.split(/\s+/).every(token => haystack.includes(token))

    return categoryMatches && queryMatches
  })
}

export function marketCategories() {
  return Array.from(new Set(marketItems.map(item => item.category))).sort((a, b) => a.localeCompare(b))
}

export function marketImportSchema() {
  return [
    { key: 'item', label: 'Item', required: true, aliases: ['item', 'produto', 'nome'] },
    { key: 'store', label: 'Mercado', required: true, aliases: ['loja', 'mercado', 'local', 'estabelecimento'] },
    { key: 'price', label: 'Preço', required: true, aliases: ['valor', 'preço', 'valor unitário'] },
    { key: 'date', label: 'Data', required: false, aliases: ['data', 'data da compra', 'competência'] },
    { key: 'brand', label: 'Marca', required: false, aliases: ['marca', 'descrição', 'marca/descrição'] },
    { key: 'category', label: 'Categoria', required: false, aliases: ['categoria', 'grupo'] },
    { key: 'unit', label: 'Unidade', required: false, aliases: ['unidade', 'kg', 'litro'] },
    { key: 'quantity', label: 'Peso/volume', required: false, aliases: ['peso', 'volume', 'peso/volume', 'quantidade'] },
    { key: 'note', label: 'Observação', required: false, aliases: ['observação', 'obs', 'nota'] },
  ]
}

export function cartIntelligence() {
  const rows = shoppingList.map(listItem => {
    const item = getItem(listItem.itemId)
    const best = bestPriceForItem(listItem.itemId)
    const prices = marketPrices.filter(price => price.itemId === listItem.itemId)
    const byStore = marketStores.map(store => {
      const price = prices.find(candidate => candidate.storeId === store.id)
      return { store, total: price ? normalizedUnitPrice(price) * itemUnitAmount(item, listItem.quantity) : null, price }
    })
    return { listItem, item, best, byStore }
  }).filter(row => row.item && row.best)

  const splitTotal = rows.reduce((sum, row) => sum + normalizedUnitPrice(row.best!) * itemUnitAmount(row.item, row.listItem.quantity), 0)
  const storeTotals = marketStores.map(store => ({
    store,
    total: rows.reduce((sum, row) => {
      const price = marketPrices.find(candidate => candidate.itemId === row.listItem.itemId && candidate.storeId === store.id)
      return sum + (price ? normalizedUnitPrice(price) * itemUnitAmount(row.item, row.listItem.quantity) : normalizedUnitPrice(row.best!) * itemUnitAmount(row.item, row.listItem.quantity))
    }, 0),
  })).sort((a, b) => a.total - b.total)
  const bestSingle = storeTotals[0]

  return {
    rows,
    splitTotal,
    bestSingle,
    economy: bestSingle ? bestSingle.total - splitTotal : 0,
    storeTotals,
  }
}

function itemUnitAmount(item: MarketItem | undefined, listQuantity: number) {
  if (!item) return listQuantity
  return item.quantity * listQuantity
}

export function marketAnalytics() {
  const comparison = priceComparisonRows()
  const cart = cartIntelligence()
  const categoryTotals = new Map<string, number>()
  comparison.forEach(row => {
    categoryTotals.set(row.item.category, (categoryTotals.get(row.item.category) ?? 0) + (row.best?.price ?? 0))
  })
  const categoryRows = Array.from(categoryTotals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
  const storeRanking = marketStores.map(store => {
    const wins = comparison.filter(row => row.best?.storeId === store.id).length
    const coverage = marketPrices.filter(price => price.storeId === store.id).length
    return { store, wins, coverage, score: wins * 12 + coverage * 3 }
  }).sort((a, b) => b.score - a.score)
  const itemInflation = comparison.map(row => {
    const byDate = [...row.prices].sort((a, b) => a.date.localeCompare(b.date))
    const first = byDate[0]
    const last = byDate[byDate.length - 1]
    const variation = first && last && first.price > 0 ? ((normalizedUnitPrice(last) - normalizedUnitPrice(first)) / normalizedUnitPrice(first)) * 100 : 0
    return { item: row.item, first, last, variation }
  }).sort((a, b) => b.variation - a.variation)
  const recurringInflation = itemInflation.filter(row => row.item.recurring)
  const personalInflation = recurringInflation.length
    ? recurringInflation.reduce((sum, row) => sum + row.variation, 0) / recurringInflation.length
    : 0

  return {
    comparison,
    cart,
    categoryRows,
    storeRanking,
    itemInflation,
    personalInflation,
    estimatedMonthlySpend: 1116.55,
    monthlyCeiling: 1500,
    possibleEconomy: cart.economy,
    bestStore: storeRanking[0]?.store,
    mostUp: itemInflation[0],
    mostDown: [...itemInflation].sort((a, b) => a.variation - b.variation)[0],
  }
}
