export type IconClass = `ti-${string}`

export const ICONS = {
  brand: {
    app: 'ti-diamond',
    premium: 'ti-crown',
    ai: 'ti-sparkles',
    assistant: 'ti-message-bolt',
    user: 'ti-user',
  },
  nav: {
    home: 'ti-home',
    statement: 'ti-list',
    add: 'ti-circle-plus',
    import: 'ti-table-import',
    bills: 'ti-calendar-due',
    cards: 'ti-credit-card',
    cashFlow: 'ti-chart-bar',
    categories: 'ti-category',
    budget: 'ti-chart-pie',
    goals: 'ti-target',
    health: 'ti-heart-rate-monitor',
    settings: 'ti-settings',
  },
  finance: {
    balance: 'ti-wallet',
    income: 'ti-trending-up',
    expense: 'ti-trending-down',
    transaction: 'ti-arrows-exchange',
    account: 'ti-building-bank',
    savings: 'ti-pig-money',
    cash: 'ti-cash-banknote',
    wallet: 'ti-wallet',
    investment: 'ti-chart-line',
    card: 'ti-credit-card',
    invoice: 'ti-receipt',
    bill: 'ti-calendar-due',
    recurring: 'ti-repeat',
    category: 'ti-category',
    subcategory: 'ti-tags',
    budget: 'ti-chart-pie',
    goal: 'ti-target',
    reserve: 'ti-shield-check',
    safeSpend: 'ti-shield-dollar',
    dailyBurn: 'ti-flame',
    projection: 'ti-timeline-event',
    liquidity: 'ti-droplet-dollar',
    adjustment: 'ti-adjustments-horizontal',
    budgetAdjustment: 'ti-adjustments-dollar',
    debt: 'ti-receipt-off',
    overBudget: 'ti-alert-triangle',
  },
  health: {
    score: 'ti-heart-rate-monitor',
    pulse: 'ti-activity-heartbeat',
    recovery: 'ti-heartbeat',
    pressure: 'ti-gauge',
    survival: 'ti-lungs',
    radar: 'ti-radar-2',
    potential: 'ti-rocket',
    rhythm: 'ti-activity',
    forecast: 'ti-pray',
    focus: 'ti-focus-2',
    timeline: 'ti-timeline',
    trophy: 'ti-trophy',
  },
  chart: {
    area: 'ti-chart-area-line',
    bar: 'ti-chart-bar',
    pie: 'ti-chart-pie',
    dots: 'ti-chart-dots',
    trendUp: 'ti-trending-up',
    trendDown: 'ti-trending-down',
    wave: 'ti-wave-sine',
  },
  category: {
    food: 'ti-tools-kitchen-2',
    groceries: 'ti-shopping-cart',
    home: 'ti-home',
    transport: 'ti-car',
    health: 'ti-heart',
    education: 'ti-school',
    leisure: 'ti-device-gamepad-2',
    travel: 'ti-plane',
    subscriptions: 'ti-repeat',
    shopping: 'ti-shopping-bag',
    pets: 'ti-paw',
    work: 'ti-briefcase',
    taxes: 'ti-file-invoice',
    gifts: 'ti-gift',
    other: 'ti-tag',
  },
  import: {
    file: 'ti-file-spreadsheet',
    upload: 'ti-cloud-upload',
    columns: 'ti-columns-3',
    mapping: 'ti-columns',
    table: 'ti-table-import',
    duplicate: 'ti-copy',
  },
  status: {
    success: 'ti-circle-check',
    warning: 'ti-alert-triangle',
    danger: 'ti-alert-circle',
    info: 'ti-info-circle',
    paid: 'ti-circle-check',
    pending: 'ti-clock-hour-4',
    loading: 'ti-loader-2',
    calendarWeek: 'ti-calendar-week',
    calendarMonth: 'ti-calendar-month',
    notification: 'ti-bell',
    sun: 'ti-sun',
    moon: 'ti-moon',
  },
  action: {
    add: 'ti-plus',
    check: 'ti-check',
    close: 'ti-x',
    search: 'ti-search',
    send: 'ti-send',
    logout: 'ti-logout',
    menu: 'ti-menu-2',
    back: 'ti-arrow-left',
    arrowRight: 'ti-arrow-right',
    next: 'ti-chevron-right',
    expand: 'ti-chevron-down',
    copy: 'ti-copy',
    more: 'ti-dots',
  },
  empty: {
    noData: 'ti-database-off',
    noChart: 'ti-chart-dots',
    noTransactions: 'ti-receipt-off',
    noCards: 'ti-credit-card',
    noGoals: 'ti-target',
    noBudget: 'ti-chart-pie',
    noBills: 'ti-calendar-due',
  },
  admin: {
    dashboard: 'ti-layout-dashboard',
    users: 'ti-users',
    userPlus: 'ti-user-plus',
    base: 'ti-chart-bar',
    settings: 'ti-settings',
    activity: 'ti-activity',
  },
} as const satisfies Record<string, Record<string, IconClass>>

export function getCategoryIcon(name?: string | null): IconClass {
  const normalized = (name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  if (normalized.includes('aliment') || normalized.includes('mercado')) return ICONS.category.food
  if (normalized.includes('moradia') || normalized.includes('casa') || normalized.includes('aluguel')) return ICONS.category.home
  if (normalized.includes('transporte') || normalized.includes('uber') || normalized.includes('carro')) return ICONS.category.transport
  if (normalized.includes('saude') || normalized.includes('farmacia')) return ICONS.category.health
  if (normalized.includes('educ')) return ICONS.category.education
  if (normalized.includes('lazer') || normalized.includes('entreten')) return ICONS.category.leisure
  if (normalized.includes('viagem')) return ICONS.category.travel
  if (normalized.includes('assinatura')) return ICONS.category.subscriptions
  if (normalized.includes('compra')) return ICONS.category.shopping
  if (normalized.includes('pet')) return ICONS.category.pets
  if (normalized.includes('trabalho')) return ICONS.category.work
  if (normalized.includes('imposto') || normalized.includes('taxa')) return ICONS.category.taxes
  if (normalized.includes('presente')) return ICONS.category.gifts

  return ICONS.category.other
}

export function getAccountTypeIcon(type?: string | null): IconClass {
  if (type === 'poupanca') return ICONS.finance.savings
  if (type === 'carteira') return ICONS.finance.wallet
  if (type === 'investimento') return ICONS.finance.investment
  if (type === 'corrente') return ICONS.finance.account
  return ICONS.finance.wallet
}
