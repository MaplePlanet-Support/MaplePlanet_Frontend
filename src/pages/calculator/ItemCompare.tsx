import { useState, useEffect, useCallback, useRef } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  statCompare, damageCompare, statConv, WEAPON_OPTIONS, MAGE_WEAPON_OPTIONS,
  type WeaponType, type ItemStatFull, type ItemStat,
  type StatCompareResponse, type DamageCompareResponse, type StatConvResponse,
} from '@/api/calculator'
import { ApiError } from '@/api/client'
import { trackEvent } from '@/api/analytics'
import { savePreset, loadPreset, resetPresetPassword, type PresetConfig } from '@/api/preset'
import { setPageMeta } from '@/lib/seo'
import { Activity, Calculator, X } from 'lucide-react'

const JOB_STAT: Record<string, string> = {
  전사: 'STR', 마법사: 'INT', 궁수: 'DEX', 도적: 'LUK', '해적(바이퍼)': 'STR', '해적(캡틴)': 'DEX',
}
const JOB_SUB: Record<string, string> = {
  전사: 'DEX', 마법사: 'LUK', 궁수: 'STR', 도적: 'DEX', '해적(바이퍼)': 'DEX', '해적(캡틴)': 'STR',
}
// critDmgPP = 크리 시 추가 퍼뎀 절대값(%p, 합연산)
// 예) 크리티컬 스로우30 = +100%p, SE30 = +140%p 별도 추가
const JOB_CRIT: Record<string, { critRate: number; critDmgPP: number }> = {
  전사:       { critRate: 0,  critDmgPP: 0 },    // 크리 패시브 없음
  마법사:     { critRate: 0,  critDmgPP: 0 },
  궁수:       { critRate: 40, critDmgPP: 100 },  // 크리티컬 샷30 = +100%p
  도적:       { critRate: 50, critDmgPP: 100 },  // 크리티컬 스로우30 = +100%p
  '해적(바이퍼)': { critRate: 0, critDmgPP: 0 },
  '해적(캡틴)':   { critRate: 0, critDmgPP: 0 },
}

// 기준 스킬 계수(%p): 크리 기대값 계산 기준
const JOB_SKILL_COEFF: Record<string, number> = {
  전사: 260,    // 파워스트라이크
  마법사: 100,
  궁수: 150,    // 임시값 (연구 필요)
  도적: 150,    // 럭키세븐
  '해적(바이퍼)': 100,
  '해적(캡틴)': 100,
}

const JOB_DEFAULT_WEAPON: Record<string, WeaponType> = {
  전사: 'TWO_HAND_SWORD',
  마법사: 'STAFF',
  궁수: 'BOW',
  도적: 'CLAW',
  '해적(바이퍼)': 'KNUCKLE',
  '해적(캡틴)': 'GUN',
}

const ALL_WEAPON_OPTIONS = [...WEAPON_OPTIONS, ...MAGE_WEAPON_OPTIONS]

type AmmoItem = { name: string; img: string; atk: number }

const AMMO: Partial<Record<WeaponType, AmmoItem[]>> = {
  BOW: [
    { name: '활 전용 화살', img: '/arrow/활 전용 화살.png', atk: 0 },
    { name: '활 전용 청동화살', img: '/arrow/활 전용 청동화살.png', atk: 1 },
    { name: '활 전용 강철화살', img: '/arrow/활 전용 빨간 화살.png', atk: 2 },
  ],
  CROSSBOW: [
    { name: '석궁 전용 화살', img: '/arrow/석궁 전용 화살.png', atk: 0 },
    { name: '석궁 전용 청동화살', img: '/arrow/석궁 전용 청동화살.png', atk: 1 },
    { name: '석궁 전용 강철화살', img: '/arrow/석궁 전용 강철화살.png', atk: 2 },
  ],
  CLAW: [
    { name: '수비 표창', img: '/Shuriken/수비 표창.png', atk: 15 },
    { name: '눈덩이', img: '/Shuriken/눈덩이.png', atk: 17 },
    { name: '월비 표창', img: '/Shuriken/월비 표창.png', atk: 17 },
    { name: '나무팽이', img: '/Shuriken/나무팽이.png', atk: 19 },
    { name: '목비 표창', img: '/Shuriken/목비 표창.png', atk: 19 },
    { name: '메이플 표창', img: '/Shuriken/메이플 표창.png', atk: 21 },
    { name: '고드름', img: '/Shuriken/고드름.png', atk: 21 },
    { name: '금비 표창', img: '/Shuriken/금비 표창.png', atk: 21 },
    { name: '토비 표창', img: '/Shuriken/토비 표창.png', atk: 23 },
    { name: '뇌전 수리검', img: '/Shuriken/뇌전 수리검.png', atk: 25 },
    { name: '화비 표창', img: '/Shuriken/화비 표창.png', atk: 27 },
    { name: '일비 표창', img: '/Shuriken/일비 표창.png', atk: 27 },
  ],
  GUN: [
    { name: '불릿', img: '/bullet/불릿.webp', atk: 10 },
    { name: '스플릿 불릿', img: '/bullet/스플릿 불릿.webp', atk: 12 },
    { name: '마이티 불릿', img: '/bullet/마이티 불릿.webp', atk: 14 },
    { name: '바이탈 불릿', img: '/bullet/바이탈 불릿.png', atk: 16 },
    { name: '샤이니 불릿', img: '/bullet/샤이니 불릿.png', atk: 18 },
    { name: '이터널 불릿', img: '/bullet/이터널 불릿.png', atk: 20 },
  ],
}

const JOB_WEAPONS: Record<string, WeaponType[]> = {
  전사: ['ONE_HAND_SWORD', 'ONE_HAND_AXE', 'ONE_HAND_BLUNT', 'TWO_HAND_SWORD', 'TWO_HAND_AXE', 'TWO_HAND_BLUNT', 'SPEAR', 'POLEARM'],
  마법사: ['WAND', 'STAFF'],
  궁수: ['BOW', 'CROSSBOW'],
  도적: ['DAGGER', 'CLAW'],
  '해적(바이퍼)': ['KNUCKLE'],
  '해적(캡틴)': ['GUN'],
}

const isWeaponType = (value: unknown): value is WeaponType =>
  typeof value === 'string' && ALL_WEAPON_OPTIONS.some(o => o.value === value)

const normalizeWeaponType = (value: unknown, job: string): WeaponType => {
  const fallback = JOB_DEFAULT_WEAPON[job]
  const byValue = isWeaponType(value) ? value : undefined
  const byLabel = typeof value === 'string'
    ? ALL_WEAPON_OPTIONS.find(o => o.label === value)?.value
    : undefined
  const normalized = byValue ?? byLabel ?? fallback
  return JOB_WEAPONS[job]?.includes(normalized) ? normalized : fallback
}

const weaponLabel = (value: WeaponType) =>
  ALL_WEAPON_OPTIONS.find(o => o.value === value)?.label ?? value

const JOB_SLOTS = ['모자', '한벌옷', '상의', '하의', '장갑', '신발', '무기', '방패']
const COMMON_SLOTS = ['귀고리', '망토', '목걸이', '안경', '반지', '벨트', '훈장']
const ALL_SLOTS = [...JOB_SLOTS, ...COMMON_SLOTS]

const numberOrZero = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const numberOrFallback = (value: unknown, fallback: number) => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

const emptyFull = (): ItemStatFull => ({
  flatStat: 0, flatSubStat: 0, statPercent: 0, allStatPercent: 0,
  flatAllStat: 0, subStatPercent: 0,
  flatAtk: 0, atkPercent: 0,
  critRateBonus: 0, totalDmgPercent: 0, bossDmgPercent: 0,
})

const normalizeFull = (item?: Partial<ItemStatFull> | null): ItemStatFull => {
  const source = item ?? {}
  return {
    flatStat: numberOrZero(source.flatStat),
    flatSubStat: numberOrZero(source.flatSubStat),
    statPercent: numberOrZero(source.statPercent),
    allStatPercent: numberOrZero(source.allStatPercent),
    flatAllStat: numberOrZero(source.flatAllStat),
    subStatPercent: numberOrZero(source.subStatPercent),
    flatAtk: numberOrZero(source.flatAtk),
    atkPercent: numberOrZero(source.atkPercent),
    critRateBonus: numberOrZero(source.critRateBonus),
    totalDmgPercent: numberOrZero(source.totalDmgPercent),
    bossDmgPercent: numberOrZero(source.bossDmgPercent),
  }
}

const normalizeSlots = (slots?: Record<string, Partial<ItemStatFull>>): Record<string, ItemStatFull> =>
  Object.fromEntries(ALL_SLOTS.map(s => [s, normalizeFull(slots?.[s])]))

const withWeaponSlot = (slotNames: string[]) =>
  slotNames.includes('무기') ? slotNames : [...slotNames, '무기']

const displayMagic = (value: number) => Math.trunc(value)

type ItemSummaryOptions = {
  item: ItemStatFull
  mode: Mode
  statLabel: string
  subLabel: string
  atkLabel: string
  showFlatAtk: boolean
  showWeaponBonuses?: boolean
  flatAtkOverride?: number
}

const formatItemSummary = ({
  item,
  mode,
  statLabel,
  subLabel,
  atkLabel,
  showFlatAtk,
  showWeaponBonuses = false,
  flatAtkOverride,
}: ItemSummaryOptions) => {
  const parts = [
    `${statLabel} ${item.flatStat}`,
    `올스탯 ${item.flatAllStat}`,
    `${statLabel}% ${item.statPercent}`,
    `올스탯% ${item.allStatPercent}`,
  ]

  if (mode === 2) {
    parts.splice(1, 0, `${subLabel} ${item.flatSubStat}`)
    parts.push(`${subLabel}% ${item.subStatPercent}`)

    if (showFlatAtk) {
      parts.push(`${atkLabel} ${flatAtkOverride ?? item.flatAtk}`)
    }
  }

  if (showWeaponBonuses && mode === 2) {
    parts.push(
      `${atkLabel}% ${item.atkPercent}`,
      `크확% ${item.critRateBonus}`,
      `총뎀% ${item.totalDmgPercent}`,
      `보공% ${item.bossDmgPercent}`,
    )
  }

  return parts.join(' / ')
}

const isFlatAtkSlot = (slot: string) => slot === '무기' || slot === '장갑'
const isFlatMagicSlot = (slot: string) => slot === '귀고리' || slot === '신발'
const canUseFlatAtk = (slot: string, isMage: boolean) =>
  slot === '무기' || (isMage ? isFlatMagicSlot(slot) : isFlatAtkSlot(slot))
const EQUIP_INPUT_WIDTH = 72
const EQUIP_ATK_INPUT_WIDTH = 54

const sanitizeFull = (item: ItemStatFull, slot: string, isMage = false): ItemStatFull => {
  if (slot === '무기') return item
  return {
    ...item,
    flatAtk: canUseFlatAtk(slot, isMage) ? item.flatAtk : 0,
    atkPercent: 0,
    critRateBonus: 0,
    totalDmgPercent: 0,
    bossDmgPercent: 0,
  }
}

type Mode = 1 | 2

const GUIDE: Record<Mode, { summary: string; details: { label: string; desc: string }[] }> = {
  1: {
    summary: '주스탯만 있는 아이템을 빠르게 비교할 때 사용합니다.',
    details: [
      { label: '현재 장비 스탯', desc: '장착 중인 모든 아이템의 깡스탯 · 스탯%를 슬롯별로 입력하세요.' },
      { label: '비교 아이템', desc: '교체하려는 아이템의 스탯을 입력하면 주스탯 증감을 즉시 확인할 수 있습니다.' },
      { label: '프리셋', desc: '닉네임(+저장 코드)으로 현재 설정을 저장·불러올 수 있습니다.' },
    ],
  },
  2: {
    summary: '스공 · 실제 데미지(보공, 총뎀, 크확 등)까지 정밀하게 비교합니다.',
    details: [
      { label: '현재 장비 스탯', desc: '깡스탯·스탯%·올스탯%·공격력·크확·총뎀·보공을 슬롯별로 입력하세요.' },
      { label: '비교 아이템', desc: '교체하려는 아이템 스탯을 입력하면 스공·실질 데미지 차이를 비율(%)로 확인할 수 있습니다.' },
      { label: '스킬', desc: '정령의 축복·메용 등 현재 적용 중인 버프 레벨을 입력하세요.' },
      { label: '프리셋', desc: '닉네임(+저장 코드)으로 현재 설정을 저장·불러올 수 있습니다.' },
    ],
  },
}

function GuidePanel({
  mode, open, onToggle,
}: {
  mode: Mode
  open: boolean
  onToggle: () => void
}) {
  const g = GUIDE[mode]
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm md:text-base font-semibold text-blue-700">이 페이지 사용법 — {g.summary}</div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded border border-blue-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-white"
        >
          {open ? '설명 접기' : '설명 펼치기'}
        </button>
      </div>
      {open && g.details.map(({ label, desc }) => (
        <div key={label} className="flex gap-2 text-xs md:text-sm">
          <span className="font-semibold text-blue-700 whitespace-nowrap">{label}</span>
          <span className="text-blue-600">{desc}</span>
        </div>
      ))}
    </div>
  )
}

function NumInput({
  value, onChange, width = 64, max,
}: {
  value: number; onChange: (v: number) => void; width?: number; max?: number
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={e => {
        const v = e.target.value === '' ? 0 : Number(e.target.value)
        onChange(max !== undefined ? Math.min(v, max) : v)
      }}
      style={{ width, fontFamily: "'JetBrains Mono', monospace" }}
      className="h-7 rounded border border-border bg-background px-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

function levelValue(value: number, max: number) {
  return Math.max(0, Math.min(max, value))
}

function amplificationCoeff(level: number) {
  return level > 0 ? 110 + level : 100
}

function effectiveStat(base: number, flat: number, percent: number, mwPct: number) {
  const mwBonus = Math.floor(base * mwPct / 100)
  return Math.floor((base + flat) * (1 + percent / 100)) + mwBonus
}

function requiredBaseStat(requirement: number, flat: number, percent: number, mwPct: number) {
  const numerator = requirement - flat * (1 + percent / 100)
  const denominator = 1 + percent / 100 + mwPct / 100
  return Math.max(0, Math.ceil(numerator / denominator))
}

type ConvImpact = {
  atkEquivalent: number
  mainValue?: number
  redistributedAp: number
}

type PresetAction = 'save' | 'load' | 'reset' | null
type PresetMessage = { type: 'ok' | 'err' | 'info'; text: string }

function presetErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = error.message

    if (error.status === 429 || message.includes('Too many requests')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    }
    if (error.status === 413 || message.includes('too large')) {
      return '저장할 데이터가 너무 큽니다. 입력값을 줄인 뒤 다시 시도해주세요.'
    }
    if (message.includes('비밀번호가 틀렸')) {
      return '저장 코드가 틀렸습니다. 다시 확인해주세요.'
    }
    if (message.includes('비밀번호를 설정')) {
      return '저장하려면 저장 코드를 입력해주세요.'
    }
    if (message.includes('닉네임') || message.includes('not found')) {
      return '해당 닉네임의 프리셋을 찾을 수 없습니다.'
    }
    if (message.includes('Invalid request')) {
      return '입력값을 다시 확인해주세요.'
    }
    if (error.status >= 500) {
      return '서버에서 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
    }
    return message || fallback
  }

  if (error instanceof TypeError) {
    return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
  }

  return fallback
}

function BuffLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={`/buffs/${icon}`} alt="" className="h-5 w-5" />
      {children}
    </span>
  )
}

function AmmoDropdown({ items, value, onChange }: {
  items: AmmoItem[]
  value: AmmoItem | null
  onChange: (item: AmmoItem | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-8 min-w-[180px] items-center gap-2 rounded border border-border bg-background px-3 text-sm transition-colors hover:bg-muted/40"
      >
        {value ? (
          <>
            <img src={value.img} alt="" className="h-6 w-6 object-contain" />
            <span className="flex-1 text-left">{value.name}</span>
            <span className="text-xs font-semibold text-maple" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{value.atk}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">선택 안함</span>
        )}
        <span className="text-[10px] text-muted-foreground">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 min-w-[220px] overflow-y-auto rounded-md border border-border bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false) }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 ${!value ? 'bg-muted/20' : ''}`}
          >
            선택 안함
          </button>
          <div className="my-1 border-t border-border" />
          {items.map(item => (
            <button
              key={item.name}
              type="button"
              onClick={() => { onChange(item); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-muted/40 ${value?.name === item.name ? 'bg-maple/5 text-maple' : ''}`}
            >
              <img src={item.img} alt="" className="h-6 w-6 object-contain" />
              <span className="flex-1 text-left">{item.name}</span>
              <span className="ml-auto text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{item.atk}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpectedDmgBlock({
  title, valA, valB,
}: {
  title: string; valA: number; valB: number
}) {
  const diffPct = valA > 0 ? ((valB - valA) / valA) * 100 : 0
  const positive = diffPct > 0
  const negative = diffPct < 0
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">비교 아이템 / 장착중인 아이템</span>
        <span
          className={`text-2xl font-semibold ${positive ? 'text-win' : negative ? 'text-lose' : 'text-muted-foreground'}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {positive ? '+' : ''}{diffPct.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

function SeoContent() {
  return (
    <section className="px-4 pb-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-xl border border-black/8 bg-white px-5 py-6 shadow-sm sm:px-7">
        <div>
          <h2 className="mb-2 text-xl font-bold text-foreground">메이플 플래닛 아이템 비교와 환산 계산</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            PlanetCompare는 메이플 플래닛 아이템을 교체하기 전에 실제 효율을 확인하기 위한 계산기입니다.
            현재 장비와 비교 아이템의 스탯을 입력하면 주스탯 변화, 스공 변화, 실제 데미지 기대값, 보스 기준 데미지를 함께 비교할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-border bg-muted/20 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">메이플 플래닛 환산</h3>
            <p className="text-xs leading-6 text-muted-foreground">
              공격력 1, 보공 1%, 총뎀 1%, 올스탯 옵션이 현재 캐릭터 기준으로 주스탯 몇에 가까운지 확인합니다.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-muted/20 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">아이템 교체 효율</h3>
            <p className="text-xs leading-6 text-muted-foreground">
              모자, 한벌옷, 상의, 하의, 장갑, 신발, 무기, 방패, 장신구 슬롯별로 장착 중인 아이템과 비교 아이템을 계산합니다.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-muted/20 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">버프와 무기 반영</h3>
            <p className="text-xs leading-6 text-muted-foreground">
              메이플 용사, 샤프 아이즈, 분노, 메디테이션, 표창, 불릿, 화살 공격력을 반영해 결과 편차를 줄입니다.
            </p>
          </article>
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          이 페이지는 메이플 플래닛 유저가 장비 선택을 돕기 위해 만든 비공식 도구입니다.
          계산 결과는 입력값과 적용한 가정에 따라 달라질 수 있으므로 실제 게임 내 수치와 함께 확인해 주세요.
        </p>
      </div>
    </section>
  )
}

export default function ItemCompare() {
  const [mode, setMode] = useState<Mode>(2)
  const [isGuideOpen, setIsGuideOpen] = useState(true)
  const [job, setJob] = useState('전사')
  const [baseStat, setBaseStat] = useState(0)
  const [subStat, setSubStat] = useState(0)
  const [weaponType, setWeaponType] = useState<WeaponType>('TWO_HAND_SWORD')
  const [compareWeaponType, setCompareWeaponType] = useState<WeaponType>('TWO_HAND_SWORD')
  const [weaponAtk, setWeaponAtk] = useState(0)
  const [blessingLevel, setBlessingLevel] = useState(0)
  const [empressBlessingLevel, setEmPressBlessingLevel] = useState(0)
  const [mapleWarriorLevel, setMapleWarriorLevel] = useState(0)
  const [meditationLevel, setMeditationLevel] = useState(0)
  const [rageLevel, setRageLevel] = useState(0)
  const [sharpEyesLevel, setSharpEyesLevel] = useState(0)
  const [decentSharpEyes, setDecentSharpEyes] = useState(false)
  const [babyDragonFood, setBabyDragonFood] = useState(false)
  const [hontaleVictory, setHontaleVictory] = useState(false)
  const [selectedAmmo, setSelectedAmmo] = useState<AmmoItem | null>(null)
  const [critRate, setCritRate] = useState(0)
  const [critDmgPP, setCritDmgPP] = useState(0)
  const [skillCoeff, setSkillCoeff] = useState(150)
  const [amplificationLevel, setAmplificationLevel] = useState(0)
  const [amplificationCompareLevel, setAmplificationCompareLevel] = useState(0)
  const [useOverall, setUseOverall] = useState(false)
  const [slots, setSlots] = useState<Record<string, ItemStatFull>>(
    normalizeSlots()
  )
  const [compareSlot, setCompareSlot] = useState('모자')
  const [compareItem, setCompareItem] = useState<ItemStatFull>(emptyFull())
  const [result, setResult] = useState<StatCompareResponse | DamageCompareResponse | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [convResult, setConvResult] = useState<StatConvResponse | null>(null)
  const [convImpacts, setConvImpacts] = useState<Record<string, ConvImpact> | null>(null)

  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [presetMsg, setPresetMsg] = useState<PresetMessage | null>(null)
  const [presetAction, setPresetAction] = useState<PresetAction>(null)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)

  // AP 재분배 시뮬레이터
  const [apReverseReq, setApReverseReq] = useState(0)
  const [apTopReq1, setApTopReq1] = useState(0)
  const [apTopReq2, setApTopReq2] = useState(0)
  const [apCompareItemReq, setApCompareItemReq] = useState(0)
  const [apCompareIsTop1, setApCompareIsTop1] = useState(false)
  const [strDaggerEnabled, setStrDaggerEnabled] = useState(false)
  const [daggerStrStat, setDaggerStrStat] = useState(0)
  const [daggerStrRequirement, setDaggerStrRequirement] = useState(0)
  const [showApDetails, setShowApDetails] = useState(false)
  const [apResult, setApResult] = useState<DamageCompareResponse | null>(null)

  const isMage = job === '마법사'
  const effectiveSkillCoeff = isMage ? amplificationCoeff(amplificationLevel) : skillCoeff
  const atkColLabel = isMage ? '마력' : '공격력'
  const statLabel = JOB_STAT[job]
  const subLabel = JOB_SUB[job]
  const canUseStrDagger = job === '도적' && (weaponType === 'DAGGER' || (compareSlot === '무기' && compareWeaponType === 'DAGGER'))
  const weaponOptions = ALL_WEAPON_OPTIONS.filter(o => JOB_WEAPONS[job]?.includes(o.value))
  const ammoList = AMMO[weaponType] ?? null
  const ammoAtk = selectedAmmo?.atk ?? 0
  const usesAmmo = ammoList !== null

  const getActiveSlots = useCallback(
    () => ALL_SLOTS.filter(s => useOverall ? s !== '상의' && s !== '하의' : s !== '한벌옷'),
    [useOverall]
  )

  const getJobSlotRows = useCallback(
    () => {
      let rows = JOB_SLOTS.filter(s => useOverall ? s !== JOB_SLOTS[2] && s !== JOB_SLOTS[3] : s !== JOB_SLOTS[1])
      if (mode === 2) rows = rows.filter(s => s !== JOB_SLOTS[6])
      const gloveSlot = JOB_SLOTS[4]
      if (rows.includes(gloveSlot)) {
        rows = [...rows.filter(s => s !== gloveSlot), gloveSlot]
      }
      return rows
    },
    [useOverall, mode]
  )

  function handleJobChange(nextJob: string) {
    const d = JOB_CRIT[nextJob]
    setJob(nextJob)
    setCritRate(d.critRate)
    setCritDmgPP(d.critDmgPP)
    setSkillCoeff(JOB_SKILL_COEFF[nextJob] ?? 150)
    setAmplificationLevel(0)
    setWeaponType(JOB_DEFAULT_WEAPON[nextJob])
    setCompareWeaponType(JOB_DEFAULT_WEAPON[nextJob])
    setSelectedAmmo(null)
    if (nextJob !== '도적') setStrDaggerEnabled(false)
  }

  function handleUseOverallChange(checked: boolean) {
    const active = ALL_SLOTS.filter(s => checked ? s !== '상의' && s !== '하의' : s !== '한벌옷')
    setUseOverall(checked)
    setCompareSlot(prev => active.includes(prev) ? prev : active[0])
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const usesStrDagger = canUseStrDagger && strDaggerEnabled && daggerStrRequirement > 0
      if (mode !== 2 || baseStat <= 0 || (apTopReq1 <= 0 && !usesStrDagger)) { setApResult(null); return }
      const activeSlotsList = withWeaponSlot(getActiveSlots())
      const fSubA = activeSlotsList.reduce((s, k) => s + slots[k].flatSubStat, 0)
      const aStatA = activeSlotsList.reduce((s, k) => s + slots[k].allStatPercent + slots[k].subStatPercent, 0)
      const fSubWithoutCurrent = fSubA - slots[compareSlot].flatSubStat
      const aStatWithoutCurrent = aStatA - (slots[compareSlot].allStatPercent + slots[compareSlot].subStatPercent)
      const mwPct = mapleWarriorLevel > 0 ? Math.floor((mapleWarriorLevel + 1) / 2) : 0
      const currentSubStat = effectiveStat(subStat, fSubA, aStatA, mwPct)
      const hasDexRequirement = apTopReq1 > 0
      const topReq1 = hasDexRequirement ? Math.min(apTopReq1, currentSubStat) : 0
      const topReq2 = hasDexRequirement ? Math.min(apTopReq2, currentSubStat) : 0
      const remainingEquippedReq = apCompareIsTop1 ? topReq2 : topReq1
      const needForCompareItem = requiredBaseStat(apCompareItemReq, fSubWithoutCurrent, aStatWithoutCurrent, mwPct)
      const needForEquippedItems = requiredBaseStat(remainingEquippedReq, fSubWithoutCurrent, aStatWithoutCurrent, mwPct)
      const needB = hasDexRequirement ? Math.max(needForCompareItem, needForEquippedItems) : subStat
      const subStatShift = hasDexRequirement ? subStat - needB : 0
      const requiredPureStr = usesStrDagger ? requiredBaseStat(daggerStrRequirement, 0, 0, mwPct) : daggerStrStat
      const strStatShift = usesStrDagger
        ? daggerStrStat - requiredPureStr
        : 0
      const statShift = subStatShift + strStatShift
      const redistributedBaseStat = baseStat + statShift
      const redistributedSubStat = needB
      if (statShift === 0 || redistributedBaseStat < 0 || redistributedSubStat < 0 || requiredPureStr < 0) { setApResult(null); return }
      try {
        const isWeapon = compareSlot === '무기'
        const apiWeaponAtk = isWeapon ? 0 : weaponAtk
        const res = await damageCompare({
          job, baseStat: redistributedBaseStat, subStat: redistributedSubStat,
          weaponType, itemBWeaponType: isWeapon ? compareWeaponType : undefined, weaponAtk: apiWeaponAtk, atkPercent: 0,
          blessingLevel, empressBlessingLevel, mapleWarriorLevel, meditationLevel, rageLevel,
          sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory, ammoAtk: usesAmmo ? ammoAtk : 0,
          critRate, critDmgPP, skillCoeff: effectiveSkillCoeff,
          equippedItems: activeSlotsList.map(s => sanitizeFull(slots[s], s, isMage)),
          currentSlotItem: sanitizeFull(slots[compareSlot], compareSlot, isMage),
          itemA: isWeapon ? { ...slots['무기'], flatAtk: weaponAtk } : sanitizeFull(slots[compareSlot] ?? emptyFull(), compareSlot, isMage),
          itemB: sanitizeFull(compareItem, compareSlot, isMage),
        })
        setApResult(res)
      } catch { setApResult(null) }
    }, 400)
    return () => clearTimeout(timer)
  }, [
    apTopReq1, apTopReq2, apCompareItemReq, apCompareIsTop1,
    strDaggerEnabled, daggerStrStat, daggerStrRequirement, canUseStrDagger,
    mode, baseStat, subStat, job, weaponType, compareWeaponType, weaponAtk,
    blessingLevel, empressBlessingLevel, mapleWarriorLevel, meditationLevel, rageLevel,
    sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory, ammoAtk, usesAmmo, critRate, critDmgPP, effectiveSkillCoeff,
    slots, compareSlot, compareItem, getActiveSlots, isMage,
  ])

  function updateSlot(name: string, field: keyof ItemStatFull, value: number) {
    setSlots(prev => ({ ...prev, [name]: { ...prev[name], [field]: value } }))
  }

  function setSharpEyesLevelSafe(value: number) {
    const next = levelValue(value, 30)
    setSharpEyesLevel(next)
    if (next > 0) setDecentSharpEyes(false)
  }

  function setDecentSharpEyesSafe(checked: boolean) {
    setDecentSharpEyes(checked)
    if (checked) setSharpEyesLevel(0)
  }

  function setRageLevelSafe(value: number) {
    const next = levelValue(value, 20)
    setRageLevel(next)
    if (next > 0) setBabyDragonFood(false)
  }

  function setBabyDragonFoodSafe(checked: boolean) {
    setBabyDragonFood(checked)
    if (checked) setRageLevel(0)
  }

  function setMeditationLevelSafe(value: number) {
    const next = levelValue(value, 20)
    setMeditationLevel(next)
    if (next > 0) setHontaleVictory(false)
  }

  function setHontaleVictorySafe(checked: boolean) {
    setHontaleVictory(checked)
    if (checked) setMeditationLevel(0)
  }

  const calculate = useCallback(async () => {
    if (baseStat <= 0) { setResult(null); return }
    const activeSlots = getActiveSlots()
    setCalculating(true)
    try {
      const equippedFull = activeSlots.map(s => slots[s])
      const currentSlotFull = compareSlot ? slots[compareSlot] : null
      // itemA = 장착중인 아이템 (slots[compareSlot]), itemB = 비교 아이템
      const currentEquipped = currentSlotFull ?? emptyFull()

      if (mode === 1) {
        const toBasic = (item: ItemStatFull): ItemStat => ({
          flatStat: item.flatStat + item.flatAllStat,
          statPercent: item.statPercent + item.allStatPercent,
        })
        const res = await statCompare({
          baseStat,
          equippedItems: equippedFull.map(toBasic),
          currentSlotItem: currentSlotFull ? toBasic(currentSlotFull) : null,
          itemA: toBasic(currentEquipped),
          itemB: toBasic(compareItem),
        })
        setResult(res)
      } else {
        const equippedDamageSlots = withWeaponSlot(activeSlots)
        const equippedDamage = equippedDamageSlots.map(s => sanitizeFull(slots[s], s, isMage))
        const currentDamage = compareSlot ? sanitizeFull(slots[compareSlot], compareSlot, isMage) : null
        const isWeapon = compareSlot === '무기'
        // 무기 슬롯 비교: mode 2에서 무기 행이 테이블에 없으므로 slots['무기']는 항상 비어있음.
        // weaponAtk(현재 무기 공격력)를 itemA.flatAtk으로 넘기고, API의 weaponAtk=0으로 설정.
        const apiWeaponAtk = isWeapon ? 0 : weaponAtk
        const currentEquippedDamage = isWeapon
          ? { ...slots['무기'], flatAtk: weaponAtk }
          : sanitizeFull(currentEquipped, compareSlot, isMage)
        const compareItemDamage = sanitizeFull(compareItem, compareSlot, isMage)
        const res = await damageCompare({
          job, baseStat, subStat, weaponType, itemBWeaponType: isWeapon ? compareWeaponType : undefined, weaponAtk: apiWeaponAtk, atkPercent: 0,
          blessingLevel, empressBlessingLevel,
          mapleWarriorLevel, meditationLevel, rageLevel,
          sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory, ammoAtk: usesAmmo ? ammoAtk : 0,
          critRate, critDmgPP, skillCoeff: effectiveSkillCoeff,
          equippedItems: equippedDamage,
          currentSlotItem: currentDamage,
          itemA: currentEquippedDamage,
          itemB: compareItemDamage,
        })
        setResult(res)
      }
    } catch {
      // 이전 결과 유지
    } finally {
      setCalculating(false)
    }
  }, [
    mode, job, baseStat, subStat, weaponType, compareWeaponType, weaponAtk,
    blessingLevel, empressBlessingLevel,
    mapleWarriorLevel, meditationLevel, rageLevel,
    sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory, ammoAtk, usesAmmo,
    critRate, critDmgPP, effectiveSkillCoeff,
    slots, compareSlot, compareItem, getActiveSlots, isMage,
  ])

  useEffect(() => {
    const timer = setTimeout(calculate, 400)
    return () => clearTimeout(timer)
  }, [calculate])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (mode !== 2 || baseStat <= 0) { setConvResult(null); setConvImpacts(null); return }
      try {
        const conversionSlots = withWeaponSlot(getActiveSlots())
        const equippedItems = conversionSlots.map(s => sanitizeFull(slots[s], s, isMage))
        const res = await statConv({
          baseStat, subStat, weaponType, weaponAtk,
          mapleWarriorLevel, blessingLevel, empressBlessingLevel,
          meditationLevel, rageLevel, sharpEyesLevel, decentSharpEyes, babyDragonFood,
          hontaleVictory,
          ammoAtk: usesAmmo ? ammoAtk : 0,
          critRate,
          critDmgPP,
          skillCoeff: effectiveSkillCoeff,
          equippedItems,
        })
        setConvResult(res)

        const subFlat = conversionSlots.reduce((sum, slot) => sum + slots[slot].flatSubStat + slots[slot].flatAllStat, 0)
        const subPercent = conversionSlots.reduce((sum, slot) => sum + slots[slot].subStatPercent + slots[slot].allStatPercent, 0)
        const mwPct = mapleWarriorLevel > 0 ? Math.floor((mapleWarriorLevel + 1) / 2) : 0
        const currentSubRequirement = effectiveStat(subStat, subFlat, subPercent, mwPct)
        const allStatSubNeed = requiredBaseStat(currentSubRequirement, subFlat, subPercent + 1, mwPct)
        const redistributedAp = Math.max(0, Math.min(subStat, subStat - allStatSubNeed))

        if (!isMage) {
          const physicalMainValues = {
            statPct: res.statPct1ToMainStat,
            allStatPct: redistributedAp > 0
              ? res.statPct1ToMainStat + redistributedAp
              : res.allStatPct1ToMainStat,
            atkPct: res.atkPct1ToMainStat,
            flatAtk: res.flatAtk1ToMainStat,
            critRate: res.critRate1ToMainStat,
            bossDmgPct: res.bossDmgPct1ToMainStat,
            totalDmgPct: res.totalDmgPct1ToMainStat,
          }
          setConvImpacts(Object.fromEntries(
            Object.entries(physicalMainValues).map(([key, value]) => [
              key,
              {
                mainValue: value,
                atkEquivalent: key === 'atkPct'
                  ? res.atkPct1
                  : res.flatAtk1ToMainStat > 0 ? value / res.flatAtk1ToMainStat : 0,
                redistributedAp: key === 'allStatPct' ? redistributedAp : 0,
              },
            ]),
          ))
          return
        }

        const baseRequest = {
          job, weaponType, weaponAtk, atkPercent: 0,
          blessingLevel, empressBlessingLevel, mapleWarriorLevel, meditationLevel, rageLevel,
          sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory, ammoAtk: usesAmmo ? ammoAtk : 0,
          critRate, critDmgPP, skillCoeff: effectiveSkillCoeff,
          equippedItems,
          currentSlotItem: null,
          itemA: emptyFull(),
        }
        const impactOptions: { key: string; item: ItemStatFull; redistributedAp?: number }[] = [
          { key: 'statPct', item: { ...emptyFull(), statPercent: 1 } },
          { key: 'allStatPct', item: { ...emptyFull(), allStatPercent: 1 }, redistributedAp },
          { key: 'atkPct', item: { ...emptyFull(), atkPercent: 1 } },
          { key: 'flatAtk', item: { ...emptyFull(), flatAtk: 1 } },
          { key: 'critRate', item: { ...emptyFull(), critRateBonus: 1 } },
          { key: 'bossDmgPct', item: { ...emptyFull(), bossDmgPercent: 1 } },
          { key: 'totalDmgPct', item: { ...emptyFull(), totalDmgPercent: 1 } },
        ]
        const [baseline, flatAtkBaseline, ...impactResults] = await Promise.all([
          damageCompare({
            ...baseRequest,
            baseStat,
            subStat,
            itemB: emptyFull(),
          }),
          damageCompare({
            ...baseRequest,
            baseStat,
            subStat,
            itemB: { ...emptyFull(), flatAtk: 1 },
          }),
          ...impactOptions.map(option => damageCompare({
            ...baseRequest,
            baseStat: baseStat + (option.redistributedAp ?? 0),
            subStat: subStat - (option.redistributedAp ?? 0),
            itemB: option.item,
          })),
        ])
        const flatAtkExpectedGain = flatAtkBaseline.expectedDmgWithItemB - baseline.expectedDmgWithItemA
        const impactEntries = impactOptions.map((option, index) => {
          const after = impactResults[index]
          const actualAtkGain = isMage
            ? displayMagic(after.magicWithItemB) - displayMagic(baseline.magicWithItemA)
            : after.damageWithItemB - baseline.damageWithItemA
          const expectedGain = after.expectedDmgWithItemB - baseline.expectedDmgWithItemA
          const atkEquivalent = option.key === 'atkPct'
            ? res.atkPct1
            : actualAtkGain !== 0
              ? actualAtkGain
              : flatAtkExpectedGain > 0 ? expectedGain / flatAtkExpectedGain : 0
          return [option.key, {
            atkEquivalent,
            redistributedAp: option.redistributedAp ?? 0,
          }] as const
        })
        setConvImpacts(Object.fromEntries(impactEntries))
      } catch {
        setConvResult(null)
        setConvImpacts(null)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [
    mode, job, baseStat, subStat, weaponType, weaponAtk,
    mapleWarriorLevel, blessingLevel, empressBlessingLevel,
    meditationLevel, rageLevel, sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory, ammoAtk, usesAmmo,
    critRate, critDmgPP, effectiveSkillCoeff,
    slots, getActiveSlots, isMage,
  ])

  async function handleSave() {
    if (presetAction) return
    const name = nickname.trim()
    const presetPassword = password.trim()
    if (!name) { setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    if (!presetPassword) { setPresetMsg({ type: 'err', text: '저장하려면 저장 코드를 입력해주세요.' }); return }
    setSaveConfirmOpen(true)
  }

  async function confirmSavePreset() {
    if (presetAction) return
    const name = nickname.trim()
    const presetPassword = password.trim()
    if (!name) { setSaveConfirmOpen(false); setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    if (!presetPassword) { setSaveConfirmOpen(false); setPresetMsg({ type: 'err', text: '저장하려면 저장 코드를 입력해주세요.' }); return }
    setSaveConfirmOpen(false)
    setPresetAction('save')
    setPresetMsg({ type: 'info', text: '프리셋 저장 중...' })
    try {
      const config: PresetConfig = {
        job, mode, baseStat, subStat, weaponType, compareWeaponType, weaponAtk, atkPercent: 0,
        blessingLevel, empressBlessingLevel,
        mapleWarriorLevel, meditationLevel, rageLevel,
        sharpEyesLevel, decentSharpEyes, babyDragonFood, hontaleVictory,
        strDaggerEnabled, daggerStrStat, daggerStrRequirement, ammoAtk,
        ammoName: selectedAmmo?.name,
        critRate, critDmgPP, skillCoeff: effectiveSkillCoeff, amplificationLevel,
        useOverall, slots, compareSlot, compareItem,
      }
      const res = await savePreset({ nickname: name, password: presetPassword, config })
      trackEvent('PRESET_SAVE')
      setPresetMsg({ type: 'ok', text: `"${res.nickname}" 프리셋을 저장했습니다.` })
    } catch (e: unknown) {
      setPresetMsg({ type: 'err', text: presetErrorMessage(e, '저장에 실패했습니다. 잠시 후 다시 시도해주세요.') })
    } finally {
      setPassword('')
      setPresetAction(null)
    }
  }

  async function handleLoad() {
    if (presetAction) return
    const name = nickname.trim()
    if (!name) { setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    setPresetAction('load')
    setPresetMsg({ type: 'info', text: '프리셋 불러오는 중...' })
    try {
      const res = await loadPreset({ nickname: name, password: password.trim() || undefined })
      trackEvent('PRESET_LOAD')
      const c = res.config as Partial<PresetConfig>
      const loadedJob = c.job && JOB_DEFAULT_WEAPON[c.job] ? c.job : job
      const loadedModeValue = Number(c.mode)
      const loadedMode: Mode = loadedModeValue === 1 || loadedModeValue === 2 ? loadedModeValue : mode
      const loadedUseOverall = c.useOverall ?? false
      const loadedActiveSlots = ALL_SLOTS.filter(s => loadedUseOverall ? s !== '상의' && s !== '하의' : s !== '한벌옷')
      const loadedCompareSlot = c.compareSlot && loadedActiveSlots.includes(c.compareSlot) ? c.compareSlot : loadedActiveSlots[0]
      const loadedWeaponType = normalizeWeaponType(c.weaponType, loadedJob)
      const loadedCompareWeaponType = c.compareWeaponType
        ? normalizeWeaponType(c.compareWeaponType, loadedJob)
        : loadedWeaponType
      const loadedAmmoAtk = numberOrZero(c.ammoAtk)

      setResult(null)
      setApResult(null)
      setConvResult(null)
      setConvImpacts(null)
      setJob(loadedJob); setMode(loadedMode); setBaseStat(numberOrZero(c.baseStat)); setSubStat(numberOrZero(c.subStat))
      setWeaponType(loadedWeaponType); setCompareWeaponType(loadedCompareWeaponType); setWeaponAtk(numberOrZero(c.weaponAtk))
      setBlessingLevel(numberOrZero(c.blessingLevel)); setEmPressBlessingLevel(numberOrZero(c.empressBlessingLevel))
      setMapleWarriorLevel(numberOrZero(c.mapleWarriorLevel))
      const loadedHontaleVictory = c.hontaleVictory ?? false
      setMeditationLevel(loadedHontaleVictory ? 0 : numberOrZero(c.meditationLevel))
      const loadedRageLevel = numberOrZero(c.rageLevel)
      const loadedSharpLevel = numberOrZero(c.sharpEyesLevel)
      setRageLevel(loadedRageLevel)
      setSharpEyesLevel(loadedSharpLevel)
      setDecentSharpEyes(loadedSharpLevel > 0 ? false : c.decentSharpEyes ?? false)
      setBabyDragonFood(loadedRageLevel > 0 ? false : c.babyDragonFood ?? false)
      setHontaleVictory(loadedHontaleVictory)
      setStrDaggerEnabled(c.strDaggerEnabled ?? false)
      setDaggerStrStat(numberOrZero(c.daggerStrStat))
      setDaggerStrRequirement(numberOrZero(c.daggerStrRequirement))
      setSelectedAmmo((AMMO[loadedWeaponType] ?? []).find(item => item.name === c.ammoName)
        ?? (AMMO[loadedWeaponType] ?? []).find(item => item.atk === loadedAmmoAtk)
        ?? null)
      setCritRate(numberOrFallback(c.critRate, JOB_CRIT[loadedJob].critRate))
      setCritDmgPP(numberOrFallback(c.critDmgPP, JOB_CRIT[loadedJob].critDmgPP))
      setSkillCoeff(numberOrFallback(c.skillCoeff, JOB_SKILL_COEFF[loadedJob] ?? 150))
      setAmplificationLevel(loadedJob === '마법사'
        ? levelValue(numberOrZero(c.amplificationLevel) || Math.max(0, numberOrZero(c.skillCoeff) - 110), 30)
        : 0)
      setUseOverall(loadedUseOverall); setSlots(normalizeSlots(c.slots)); setCompareSlot(loadedCompareSlot)
      setCompareItem(normalizeFull(c.compareItem ?? c.itemB ?? c.itemA))
      setPresetMsg({ type: 'ok', text: `"${res.nickname}" 프리셋을 불러왔습니다.` })
    } catch (e: unknown) {
      setPresetMsg({ type: 'err', text: presetErrorMessage(e, '불러오기에 실패했습니다. 닉네임과 저장 코드를 확인해주세요.') })
    } finally {
      setPassword('')
      setPresetAction(null)
    }
  }

  async function handleResetPassword() {
    if (presetAction) return
    const name = nickname.trim()
    if (!name) { setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    setPresetAction('reset')
    setPresetMsg({ type: 'info', text: '저장 코드 초기화 중...' })
    try {
      await resetPresetPassword({ nickname: name, currentPassword: password.trim() || undefined })
      setPresetMsg({ type: 'ok', text: '저장 코드를 초기화했습니다. 다음 저장 때 새 저장 코드를 설정할 수 있습니다.' })
    } catch (e: unknown) {
      setPresetMsg({ type: 'err', text: presetErrorMessage(e, '초기화에 실패했습니다. 닉네임과 현재 저장 코드를 확인해주세요.') })
    } finally {
      setPassword('')
      setPresetAction(null)
    }
  }

  const isMode1Result = (r: typeof result): r is StatCompareResponse =>
    r !== null && 'difference' in r

  const winner = result?.betterItem ?? null
  const statA = result?.statWithItemA ?? null
  const statB = result?.statWithItemB ?? null
  const dmgA = result && !isMode1Result(result) ? result.damageWithItemA : null
  const dmgB = result && !isMode1Result(result) ? result.damageWithItemB : null
  const magicA = result && !isMode1Result(result) ? result.magicWithItemA : null
  const magicB = result && !isMode1Result(result) ? result.magicWithItemB : null
  const expA = result && !isMode1Result(result) ? result.expectedDmgWithItemA : null
  const expB = result && !isMode1Result(result) ? result.expectedDmgWithItemB : null
  const expNormalA = result && !isMode1Result(result) ? result.expectedNormalDmgWithItemA : null
  const expNormalB = result && !isMode1Result(result) ? result.expectedNormalDmgWithItemB : null
  const expDiffPct = result && !isMode1Result(result) ? result.expectedDmgDiffPct : null
  const hasBossDmg = (expA !== null && expNormalA !== null && Math.abs(expA - expNormalA) > 0.001)
    || (expB !== null && expNormalB !== null && Math.abs(expB - expNormalB) > 0.001)

  const maxStat = Math.max(statA ?? 0, statB ?? 0, 1)
  const maxMagic = Math.max(displayMagic(magicA ?? 0), displayMagic(magicB ?? 0), 1)

  const jobSlotRows = getJobSlotRows()
  const activeSlots = getActiveSlots()
  const isWeaponCompare = mode === 2 && compareSlot === '무기'
  const isFlatAtkCompare = mode === 2 && canUseFlatAtk(compareSlot, isMage)
  const currentItemSummary = compareSlot
    ? formatItemSummary({
      item: slots[compareSlot],
      mode,
      statLabel,
      subLabel,
      atkLabel: atkColLabel,
      showFlatAtk: isWeaponCompare || isFlatAtkCompare,
      showWeaponBonuses: isWeaponCompare,
      flatAtkOverride: isWeaponCompare ? weaponAtk : undefined,
    })
    : ''
  const compareItemSummary = formatItemSummary({
    item: compareItem,
    mode,
    statLabel,
    subLabel,
    atkLabel: atkColLabel,
    showFlatAtk: isWeaponCompare || isFlatAtkCompare,
    showWeaponBonuses: isWeaponCompare,
  })
  const hasDamageCompareResult = result !== null && !isMode1Result(result)

  // AP 재분배 계산 (디스플레이용)
  const apFlatSubA = activeSlots.reduce((s, k) => s + slots[k].flatSubStat, 0)
  const apAllStatA = activeSlots.reduce((s, k) => s + slots[k].allStatPercent + slots[k].subStatPercent, 0)
  const apFlatSubWithoutCurrent = apFlatSubA - slots[compareSlot].flatSubStat
  const apAllStatWithoutCurrent = apAllStatA - (slots[compareSlot].allStatPercent + slots[compareSlot].subStatPercent)
  const mwPct = mapleWarriorLevel > 0 ? Math.floor((mapleWarriorLevel + 1) / 2) : 0
  const apCurrentSubStat = effectiveStat(subStat, apFlatSubA, apAllStatA, mwPct)
  const apUsesStrDagger = canUseStrDagger && strDaggerEnabled && daggerStrRequirement > 0
  const apHasRequirement = apTopReq1 > 0 || apUsesStrDagger
  const apHasDexRequirement = apTopReq1 > 0
  const apEffectiveTopReq1 = apHasDexRequirement ? Math.min(apTopReq1, apCurrentSubStat) : 0
  const apEffectiveTopReq2 = apHasDexRequirement ? Math.min(apTopReq2, apCurrentSubStat) : 0
  const apRemainingEquippedReq = apCompareIsTop1 ? apEffectiveTopReq2 : apEffectiveTopReq1
  const apNeedA = apEffectiveTopReq1 > 0
    ? apCompareIsTop1
      ? requiredBaseStat(apEffectiveTopReq1, apFlatSubWithoutCurrent, apAllStatWithoutCurrent, mwPct)
      : requiredBaseStat(apEffectiveTopReq1, apFlatSubA, apAllStatA, mwPct)
    : 0
  const apNeedForCompareItem = apHasDexRequirement
    ? requiredBaseStat(apCompareItemReq, apFlatSubWithoutCurrent, apAllStatWithoutCurrent, mwPct)
    : 0
  const apNeedForEquippedItems = apHasDexRequirement
    ? requiredBaseStat(apRemainingEquippedReq, apFlatSubWithoutCurrent, apAllStatWithoutCurrent, mwPct)
    : 0
  const apNeedB = apHasDexRequirement ? Math.max(apNeedForCompareItem, apNeedForEquippedItems) : subStat
  const apEffReq = Math.max(apRemainingEquippedReq, apCompareItemReq)
  const apSubStatShift = apHasDexRequirement ? subStat - apNeedB : 0
  const apCurrentDaggerStr = effectiveStat(daggerStrStat, 0, 0, mwPct)
  const apNeedDaggerStr = apUsesStrDagger ? requiredBaseStat(daggerStrRequirement, 0, 0, mwPct) : daggerStrStat
  const apDaggerStrShift = apUsesStrDagger ? daggerStrStat - apNeedDaggerStr : 0
  const apRedistributedDaggerStr = apUsesStrDagger ? apNeedDaggerStr : daggerStrStat
  const apStatShift = apSubStatShift + apDaggerStrShift
  const apShiftAbs = Math.abs(apStatShift)
  const apRedistributedBaseStat = baseStat + apStatShift
  const apRedistributedSubStat = apNeedB
  const canShowApRedistribution = apHasRequirement && apStatShift !== 0 && apRedistributedBaseStat >= 0 && apRedistributedSubStat >= 0 && apRedistributedDaggerStr >= 0
  const apSummaryTone = apStatShift > 0 ? 'text-win' : apStatShift < 0 ? 'text-lose' : 'text-muted-foreground'
  const apSummaryText = !apHasRequirement
    ? `${subLabel} 요구치를 입력하면 AP 전후 변화가 계산됩니다.`
    : apStatShift > 0
      ? `순수 AP ${apShiftAbs}을 ${statLabel}으로 전환 가능`
      : apStatShift < 0
        ? `순수 ${statLabel} ${apShiftAbs}을 요구 스탯에 추가 배분 필요`
        : `재분배가 필요한 순수 AP 변화가 없습니다.`
  const apRedistributionText = apStatShift > 0
    ? `순수 ${statLabel} +${apShiftAbs} / 순수 ${subLabel} ${-apSubStatShift >= 0 ? '+' : ''}${-apSubStatShift}${apUsesStrDagger ? ` / 순수 STR ${-apDaggerStrShift >= 0 ? '+' : ''}${-apDaggerStrShift}` : ''}`
    : apStatShift < 0
      ? `순수 ${statLabel} -${apShiftAbs} / 순수 ${subLabel} ${-apSubStatShift >= 0 ? '+' : ''}${-apSubStatShift}${apUsesStrDagger ? ` / 순수 STR ${-apDaggerStrShift >= 0 ? '+' : ''}${-apDaggerStrShift}` : ''}`
      : `순수 ${statLabel}, ${subLabel}${apUsesStrDagger ? ', STR' : ''} 변화 없음`
  const isPresetBusy = presetAction !== null
  const presetMessageClass = presetMsg?.type === 'ok'
    ? 'border-win/20 bg-win-bg text-win'
    : presetMsg?.type === 'info'
      ? 'border-maple/20 bg-maple-bg text-maple'
      : 'border-lose/20 bg-red-50 text-lose'

  useEffect(() => {
    setPageMeta({
      title: '메이플 플래닛 아이템 비교 · 환산 계산기 | PlanetCompare',
      description: '메이플 플래닛 아이템 비교와 환산 계산을 빠르게 확인하세요. 장비 스탯, 공격력, 보공, 총뎀, 크확, 버프를 반영해 교체 효율을 비교합니다.',
      path: '/',
    })
  }, [])

  return (
    <div
      className="text-left min-h-screen"
      style={{ fontFamily: 'var(--font-sans)', background: '#EEF2F7' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-black/8 px-6 py-3 flex items-center gap-6">
        <div>
          <div className="text-[11px] text-muted-foreground tracking-widest uppercase">PlanetCompare</div>
          <h1 className="m-0 text-lg font-semibold text-foreground leading-tight">메이플 플래닛 아이템 비교</h1>
        </div>
        <div className="flex gap-2">
          {([
            { value: 2, label: '스공 & 실제 데미지 비교', Icon: Activity },
            { value: 1, label: '단순 스탯 비교', Icon: Calculator },
          ] as const).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value)
                setResult(null)
              }}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
                mode === value
                  ? 'bg-maple text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 가이드라인 */}
      <GuidePanel
        mode={mode}
        open={isGuideOpen}
        onToggle={() => setIsGuideOpen(open => !open)}
      />

      <div className="grid grid-cols-1 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-4 lg:items-start">

        {/* ── LEFT ── */}
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-3 sm:p-4 flex flex-col gap-6">

          {/* 캐릭터 */}
          <section>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">캐릭터</span>
              <Select value={job} onValueChange={v => v && handleJobChange(v)}>
                <SelectTrigger className="h-7 w-32 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(JOB_STAT).map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{statLabel}</span>
              <NumInput value={baseStat} onChange={setBaseStat} width={88} />
              {mode === 2 && (
                <>
                  <span className="text-xs text-muted-foreground">{subLabel}</span>
                  <NumInput value={subStat} onChange={setSubStat} width={88} />
                </>
              )}
              <span className="text-xs text-muted-foreground">순수 스탯만 입력</span>
            </div>
          </section>

          {/* 장비 스탯 */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">현재 장비 스탯</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none shrink-0">
                <input type="checkbox" checked={useOverall} onChange={e => handleUseOverallChange(e.target.checked)} className="sr-only" />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useOverall ? 'bg-maple border-maple' : 'border-border bg-white'}`}>
                  {useOverall && <span className="text-white text-[10px] leading-none">✓</span>}
                </div>
                한벌옷 착용
              </label>
            </div>

            <div className="flex flex-col gap-3 2xl:flex-row">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground mb-1">직업 부위</div>
                <div className="overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="border border-border px-2 py-1 text-left text-[11px] font-medium text-muted-foreground">슬롯</th>
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}</th>
                        {mode === 2 && (<th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{subLabel}</th>)}
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">올스탯</th>
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}%</th>
                        {mode === 2 && (<th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{subLabel}%</th>)}
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">올스탯%</th>
                        {mode === 2 && (<th className="w-[58px] border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground whitespace-nowrap">{atkColLabel}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {jobSlotRows.map(s => (
                        <tr key={s} className="hover:bg-muted/20">
                          <td className="border border-border px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{s}</td>
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].flatStat} onChange={v => updateSlot(s, 'flatStat', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          {mode === 2 && (<td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].flatSubStat} onChange={v => updateSlot(s, 'flatSubStat', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>)}
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].flatAllStat} onChange={v => updateSlot(s, 'flatAllStat', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].statPercent} onChange={v => updateSlot(s, 'statPercent', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          {mode === 2 && (<td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].subStatPercent} onChange={v => updateSlot(s, 'subStatPercent', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>)}
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].allStatPercent} onChange={v => updateSlot(s, 'allStatPercent', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          {mode === 2 && (<td className="w-[58px] border border-border px-0.5 py-0.5 text-center">{canUseFlatAtk(s, isMage) ? (<NumInput value={slots[s].flatAtk} onChange={v => updateSlot(s, 'flatAtk', v)} max={1000} width={EQUIP_ATK_INPUT_WIDTH} />) : (<span className="text-xs text-muted-foreground">-</span>)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground mb-1">공용 부위</div>
                <div className="overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="border border-border px-2 py-1 text-left text-[11px] font-medium text-muted-foreground">슬롯</th>
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}</th>
                        {mode === 2 && (<th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{subLabel}</th>)}
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">올스탯</th>
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}%</th>
                        {mode === 2 && (<th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">{subLabel}%</th>)}
                        <th className="border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground">올스탯%</th>
                        {mode === 2 && isMage && (<th className="w-[58px] border border-border px-0.5 py-1 text-center text-[11px] font-medium text-muted-foreground whitespace-nowrap">{atkColLabel}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {COMMON_SLOTS.map(s => (
                        <tr key={s} className="hover:bg-muted/20">
                          <td className="border border-border px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{s}</td>
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].flatStat} onChange={v => updateSlot(s, 'flatStat', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          {mode === 2 && (<td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].flatSubStat} onChange={v => updateSlot(s, 'flatSubStat', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>)}
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].flatAllStat} onChange={v => updateSlot(s, 'flatAllStat', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].statPercent} onChange={v => updateSlot(s, 'statPercent', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          {mode === 2 && (<td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].subStatPercent} onChange={v => updateSlot(s, 'subStatPercent', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>)}
                          <td className="border border-border px-0.5 py-0.5 text-center"><NumInput value={slots[s].allStatPercent} onChange={v => updateSlot(s, 'allStatPercent', v)} max={1000} width={EQUIP_INPUT_WIDTH} /></td>
                          {mode === 2 && isMage && (<td className="w-[58px] border border-border px-0.5 py-0.5 text-center">{isFlatMagicSlot(s) ? (<NumInput value={slots[s].flatAtk} onChange={v => updateSlot(s, 'flatAtk', v)} max={1000} width={EQUIP_ATK_INPUT_WIDTH} />) : (<span className="text-xs text-muted-foreground">-</span>)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {mode === 2 && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">무기 종류</Label>
                    <Select value={weaponType} onValueChange={v => { setWeaponType(v as WeaponType); setSelectedAmmo(null) }}>
                      <SelectTrigger className="h-8 w-28 text-sm"><SelectValue>{weaponLabel(weaponType)}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {weaponOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{isMage ? '무기 마력' : '무기 공격력'}</Label>
                    <NumInput value={weaponAtk} onChange={setWeaponAtk} width={84} />
                  </div>
                  {ammoList && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">
                        {weaponType === 'BOW' ? '활 화살' : weaponType === 'CROSSBOW' ? '석궁 화살' : weaponType === 'CLAW' ? '표창' : '불릿'}
                      </Label>
                      <AmmoDropdown items={ammoList} value={selectedAmmo} onChange={setSelectedAmmo} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{statLabel}</Label>
                    <NumInput value={slots['무기'].flatStat} onChange={v => updateSlot('무기', 'flatStat', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{subLabel}</Label>
                    <NumInput value={slots['무기'].flatSubStat} onChange={v => updateSlot('무기', 'flatSubStat', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">올스탯</Label>
                    <NumInput value={slots['무기'].flatAllStat} onChange={v => updateSlot('무기', 'flatAllStat', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{statLabel}%</Label>
                    <NumInput value={slots['무기'].statPercent} onChange={v => updateSlot('무기', 'statPercent', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{subLabel}%</Label>
                    <NumInput value={slots['무기'].subStatPercent} onChange={v => updateSlot('무기', 'subStatPercent', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">올스탯%</Label>
                    <NumInput value={slots['무기'].allStatPercent} onChange={v => updateSlot('무기', 'allStatPercent', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{atkColLabel}%</Label>
                    <NumInput value={slots['무기'].atkPercent} onChange={v => updateSlot('무기', 'atkPercent', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">크확%</Label>
                    <NumInput value={slots['무기'].critRateBonus} onChange={v => updateSlot('무기', 'critRateBonus', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">총뎀%</Label>
                    <NumInput value={slots['무기'].totalDmgPercent} onChange={v => updateSlot('무기', 'totalDmgPercent', v)} width={84} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">보공%</Label>
                    <NumInput value={slots['무기'].bossDmgPercent} onChange={v => updateSlot('무기', 'bossDmgPercent', v)} width={84} />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 비교 아이템 */}
          <section>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">비교 아이템</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">교체 슬롯</span>
                <Select value={compareSlot} onValueChange={v => { if (v) setCompareSlot(v) }}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {compareSlot && (
                <span className="text-[11px] text-muted-foreground">
                  현재: {currentItemSummary}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {/* 장착중인 아이템 (읽기 전용 요약) */}
              {compareSlot && (
                <div className="border rounded-md p-3 bg-muted/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">장착중인 아이템</span>
                    {statA !== null && (
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {statA.toFixed(1)} {statLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentItemSummary}
                  </div>
                </div>
              )}

              {/* 비교 아이템 (입력) */}
              <div
                className={`border rounded-md p-3 flex flex-col gap-2 transition-colors ${winner === 'B' ? 'border-maple bg-maple-bg' : 'border-border'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${winner === 'B' ? 'text-maple' : 'text-foreground'}`}>
                    비교 아이템 {winner === 'B' && '👑'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompareItem(emptyFull())}
                    className="h-7 rounded border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    초기화
                  </button>
                  {statB !== null && (
                    <span className={`text-xs ${winner === 'B' ? 'text-maple' : 'text-muted-foreground'}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {statB.toFixed(1)} {statLabel}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {compareItemSummary}
                </div>

                {isWeaponCompare ? (
                  <>
                    {/* 1. 무기 종류 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">무기 종류</Label>
                        <Select value={compareWeaponType} onValueChange={v => setCompareWeaponType(v as WeaponType)}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue>{weaponLabel(compareWeaponType)}</SelectValue></SelectTrigger>
                          <SelectContent>
                            {weaponOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 2. 스탯, 올스탯, 공격력 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{statLabel}</Label>
                        <NumInput value={compareItem.flatStat} onChange={v => setCompareItem({ ...compareItem, flatStat: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{subLabel}</Label>
                        <NumInput value={compareItem.flatSubStat} onChange={v => setCompareItem({ ...compareItem, flatSubStat: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">올스탯</Label>
                        <NumInput value={compareItem.flatAllStat} onChange={v => setCompareItem({ ...compareItem, flatAllStat: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{atkColLabel}</Label>
                        <NumInput value={compareItem.flatAtk} onChange={v => setCompareItem({ ...compareItem, flatAtk: v })} max={1000} width={84} />
                      </div>
                    </div>

                    {/* 3. 공격력%, 보공%, 총뎀% */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{atkColLabel}%</Label>
                        <NumInput value={compareItem.atkPercent} onChange={v => setCompareItem({ ...compareItem, atkPercent: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">보공%</Label>
                        <NumInput value={compareItem.bossDmgPercent} onChange={v => setCompareItem({ ...compareItem, bossDmgPercent: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">총뎀%</Label>
                        <NumInput value={compareItem.totalDmgPercent} onChange={v => setCompareItem({ ...compareItem, totalDmgPercent: v })} max={1000} width={84} />
                      </div>
                    </div>

                    {/* 4. 스탯%, 나머지 % */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{statLabel}%</Label>
                        <NumInput value={compareItem.statPercent} onChange={v => setCompareItem({ ...compareItem, statPercent: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{subLabel}%</Label>
                        <NumInput value={compareItem.subStatPercent} onChange={v => setCompareItem({ ...compareItem, subStatPercent: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">올스탯 %</Label>
                        <NumInput value={compareItem.allStatPercent} onChange={v => setCompareItem({ ...compareItem, allStatPercent: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">크확%</Label>
                        <NumInput value={compareItem.critRateBonus} onChange={v => setCompareItem({ ...compareItem, critRateBonus: v })} max={1000} width={84} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 스탯 행 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{statLabel}</Label>
                        <NumInput value={compareItem.flatStat} onChange={v => setCompareItem({ ...compareItem, flatStat: v })} max={1000} width={84} />
                      </div>
                      {mode === 2 && (
                        <div className="flex flex-col gap-0.5">
                          <Label className="text-[10px] text-muted-foreground">{subLabel}</Label>
                          <NumInput value={compareItem.flatSubStat} onChange={v => setCompareItem({ ...compareItem, flatSubStat: v })} max={1000} width={84} />
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{statLabel}%</Label>
                        <NumInput value={compareItem.statPercent} onChange={v => setCompareItem({ ...compareItem, statPercent: v })} max={1000} width={84} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">올스탯</Label>
                        <NumInput value={compareItem.flatAllStat} onChange={v => setCompareItem({ ...compareItem, flatAllStat: v })} max={1000} width={84} />
                      </div>
                      {mode === 2 && (
                        <div className="flex flex-col gap-0.5">
                          <Label className="text-[10px] text-muted-foreground">{subLabel}%</Label>
                          <NumInput value={compareItem.subStatPercent} onChange={v => setCompareItem({ ...compareItem, subStatPercent: v })} max={1000} width={84} />
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">올스탯 %</Label>
                        <NumInput value={compareItem.allStatPercent} onChange={v => setCompareItem({ ...compareItem, allStatPercent: v })} max={1000} width={84} />
                      </div>
                    </div>

                    {isFlatAtkCompare && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                        <div className="flex flex-col gap-0.5">
                          <Label className="text-[10px] text-muted-foreground">{atkColLabel}</Label>
                          <NumInput value={compareItem.flatAtk} onChange={v => setCompareItem({ ...compareItem, flatAtk: v })} max={1000} width={84} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── RIGHT: 아이템 비교 결과 ── */}
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-4 sm:p-5 lg:sticky lg:top-[72px] flex flex-col gap-4 h-fit lg:row-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">아이템 비교 결과</span>
            {calculating && <span className="text-[11px] text-muted-foreground">계산 중…</span>}
          </div>

          {result === null ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {statLabel}을 입력하면<br />결과가 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <>
              {/* 주스탯 */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{statLabel} (주스탯)</div>
                {([['A', '장착중인 아이템'], ['B', '비교 아이템']] as const).map(([label, displayName]) => {
                  const val = label === 'A' ? statA : statB
                  const isWin = winner === label
                  return (
                    <div key={label}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>{displayName} {isWin && '👑'}</span>
                        <span className={`text-xl font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val?.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${val !== null ? (val / maxStat) * 100 : 0}%`, background: isWin ? '#2563EB' : '#d1d5db' }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-baseline justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">{statLabel} 차이</span>
                  {winner === 'SAME' ? (
                    <span className="text-sm text-muted-foreground">동일</span>
                  ) : (
                    <div className="text-right">
                      <span className="text-base font-semibold text-win" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        +{Math.abs(isMode1Result(result) ? result.difference : result.statDifference).toFixed(1)}
                      </span>
                      {statA !== null && statB !== null && (
                        <div className="text-[11px] text-muted-foreground">
                          ({((Math.abs(statA - statB) / Math.min(statA, statB)) * 100).toFixed(1)}% 차이)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {mode === 2 && !isMode1Result(result) && (
                <>
                  {/* 총마력 (마법사 전용) */}
                  {isMage && magicA !== null && magicB !== null && magicA > 0 && magicB > 0 && (
                    <div className="border-t border-border pt-3 flex flex-col gap-2">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">총마력</div>
                      {(['A', 'B'] as const).map(label => {
                        const val = displayMagic(label === 'A' ? magicA : magicB)
                        const isWin = winner === label
                        return (
                          <div key={label}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>{label === 'A' ? '장착중인 아이템' : '비교 아이템'}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(val / maxMagic) * 100}%`, background: isWin ? '#2563EB' : '#d1d5db' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 스공 (비마법사 전용) */}
                  {!isMage && dmgA !== null && dmgB !== null && (
                    <div className="border-t border-border pt-3 flex flex-col gap-2">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">스공</div>
                      {([['A', '장착중인 아이템'], ['B', '비교 아이템']] as const).map(([label, displayName]) => {
                        const val = label === 'A' ? dmgA : dmgB
                        const isWin = winner === label
                        return (
                          <div key={label}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>{displayName}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(val / Math.max(dmgA, dmgB, 1)) * 100}%`, background: isWin ? '#2563EB' : '#d1d5db' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 실질 데미지 (보공 + 총뎀 + 크리 기대값) */}
                  {expDiffPct !== null && expA !== null && expB !== null && expNormalA !== null && expNormalB !== null && (
                    <div className="border-t border-border pt-3 flex flex-col gap-3">
                      {/* 일반 몬스터 */}
                      <ExpectedDmgBlock
                        title="실질 데미지 — 일반 몬스터"
                        valA={expNormalA} valB={expNormalB}
                      />
                      {/* 보스 몬스터 (보공이 있을 때만) */}
                      {hasBossDmg && (
                        <ExpectedDmgBlock
                          title="실질 데미지 — 보스 몬스터"
                          valA={expA} valB={expB}
                        />
                      )}
                      {/* 아이템 + 앰플 합산 실질 데미지 (마법사, 두 레벨이 다를 때) */}
                      {isMage && amplificationLevel !== amplificationCompareLevel && (() => {
                        const ratio = amplificationCoeff(amplificationCompareLevel) / amplificationCoeff(amplificationLevel)
                        // valA = 현재 아이템 + 현재 앰플, valB = 비교 아이템 + 비교 앰플
                        return (
                          <>
                            <ExpectedDmgBlock
                              title={`실질 데미지 + 앰플 Lv.${amplificationLevel}→${amplificationCompareLevel} — 일반 몬스터`}
                              valA={expNormalA} valB={expNormalB * ratio}
                            />
                            {hasBossDmg && (
                              <ExpectedDmgBlock
                                title={`실질 데미지 + 앰플 Lv.${amplificationLevel}→${amplificationCompareLevel} — 보스 몬스터`}
                                valA={expA} valB={expB * ratio}
                              />
                            )}
                          </>
                        )
                      })()}
                      {/* INT / 총마력 수치 비교 (마법사) */}
                      {isMage && statA !== null && statB !== null && magicA !== null && magicB !== null && (
                        <div className="rounded-md bg-muted/30 px-3 py-2 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">INT 차이</span>
                            <span className={`font-semibold ${statB - statA > 0 ? 'text-win' : statB - statA < 0 ? 'text-lose' : 'text-muted-foreground'}`}
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {statB - statA >= 0 ? '+' : ''}{(statB - statA).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">총마력 차이</span>
                            <span className={`font-semibold ${displayMagic(magicB) - displayMagic(magicA) > 0 ? 'text-win' : displayMagic(magicB) - displayMagic(magicA) < 0 ? 'text-lose' : 'text-muted-foreground'}`}
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {displayMagic(magicB) - displayMagic(magicA) >= 0 ? '+' : ''}{displayMagic(magicB) - displayMagic(magicA)}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* 승자 배너 */}
                      <div className={`rounded-md px-3 py-2 text-sm font-medium ${winner === 'SAME' ? 'bg-muted/40 text-muted-foreground' : 'bg-win-bg text-foreground'}`}>
                        {winner === 'SAME' ? '두 아이템이 동일합니다' : (
                          <><span className="text-maple font-semibold">{winner === 'B' ? '비교 아이템' : '장착중인 아이템'}</span>이{' '}
                          <span className="text-win font-semibold">{Math.abs(expDiffPct).toFixed(2)}%</span> 더 강함
                          {hasBossDmg && <span className="text-muted-foreground text-xs ml-1">(보스 기준)</span>}</>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {mode === 2 && convResult !== null && (() => {
            const atkLabel = isMage ? '마력' : '공격력'
            const rawMainStat1ToFinal = convResult.mainStatMultiplier
            const atkEqLabel = isMage ? '마력' : '공격력'
            const convOptions = [
              { key: 'statPct', label: `${statLabel} 1%`, value: convResult.statPct1ToMainStat },
              { key: 'allStatPct', label: '올스탯 1%', value: convResult.allStatPct1ToMainStat },
              { key: 'atkPct', label: `${atkLabel} 1%`, value: convResult.atkPct1ToMainStat },
              { key: 'flatAtk', label: `${atkLabel} 1`, value: convResult.flatAtk1ToMainStat },
              { key: 'critRate', label: '크확 1%', value: convResult.critRate1ToMainStat },
              { key: 'bossDmgPct', label: '보공 1%', value: convResult.bossDmgPct1ToMainStat },
              { key: 'totalDmgPct', label: '총뎀 1%', value: convResult.totalDmgPct1ToMainStat },
            ]
            return (
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">스탯 환산</div>
                  <span className="text-[11px] text-muted-foreground">
                    현재 {statLabel}: <span className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{convResult.currentMainStat.toFixed(2)}</span>
                    {' '} / 총 {atkLabel}: <span className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{convResult.totalAttack}</span>
                  </span>
                </div>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>장비 {statLabel} 기준</span>
                    <span className="text-right">
                      {statLabel}1 증가시 최종 {statLabel} {rawMainStat1ToFinal.toFixed(2)} 상승
                    </span>
                  </div>
                  <div className="divide-y divide-border rounded-md border border-border bg-background">
                    {convOptions.map(opt => {
                      const impact = convImpacts?.[opt.key]
                      const redistributedValue = opt.key === 'allStatPct' ? impact?.redistributedAp ?? 0 : 0
                      const mainValue = impact?.mainValue ?? opt.value + redistributedValue
                      const atkEquivalent = impact?.atkEquivalent ?? 0
                      return (
                        <div key={opt.key} className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 px-3 py-2 text-xs">
                          <span className="text-muted-foreground">{opt.label}</span>
                          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right">
                            <span className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {statLabel} +{mainValue.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {atkEqLabel} 환산 <span className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{atkEquivalent.toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}
          {mode === 2 && (
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">스킬</div>
                <button
                  type="button"
                  onClick={() => {
                    setBlessingLevel(0); setEmPressBlessingLevel(0); setMapleWarriorLevel(0)
                    setMeditationLevel(0); setRageLevel(0); setSharpEyesLevel(0)
                    setAmplificationLevel(0); setAmplificationCompareLevel(0); setDecentSharpEyes(false); setBabyDragonFood(false); setHontaleVictory(false)
                  }}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  초기화
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="정령의축복.png">정령의 축복</BuffLabel></Label>
                    <button type="button" onClick={() => setBlessingLevel(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={blessingLevel} onChange={v => setBlessingLevel(levelValue(v, 20))} width={72} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="여신의축복.png">여신의 축복</BuffLabel></Label>
                    <button type="button" onClick={() => setEmPressBlessingLevel(12)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={empressBlessingLevel} onChange={v => setEmPressBlessingLevel(levelValue(v, 12))} width={72} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="메이플용사.png">메용</BuffLabel></Label>
                    <button type="button" onClick={() => setMapleWarriorLevel(30)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={mapleWarriorLevel} onChange={v => setMapleWarriorLevel(levelValue(v, 30))} width={72} />
                </div>
                {isMage && (
                  <div className="flex flex-col gap-1 col-span-full sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs"><BuffLabel icon="앰플리케이션.png">앰플</BuffLabel></Label>
                      <button type="button" onClick={() => { setAmplificationLevel(30); setAmplificationCompareLevel(30) }} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <NumInput value={amplificationLevel} onChange={v => setAmplificationLevel(levelValue(v, 30))} width={56} />
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <NumInput value={amplificationCompareLevel} onChange={v => setAmplificationCompareLevel(levelValue(v, 30))} width={56} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="메디테이션.png">메디테이션</BuffLabel></Label>
                    <button type="button" onClick={() => setMeditationLevelSafe(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={meditationLevel} onChange={setMeditationLevelSafe} width={72} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="분노.png">분노</BuffLabel></Label>
                    <button type="button" onClick={() => setRageLevelSafe(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={rageLevel} onChange={setRageLevelSafe} width={72} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="샤프아이즈.png">샤프아이즈</BuffLabel></Label>
                    <button type="button" onClick={() => setSharpEyesLevelSafe(30)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={sharpEyesLevel} onChange={setSharpEyesLevelSafe} width={72} />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={decentSharpEyes} onChange={e => setDecentSharpEyesSafe(e.target.checked)} />
                  <BuffLabel icon="샤프아이즈.png">쓸샾</BuffLabel>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={babyDragonFood} onChange={e => setBabyDragonFoodSafe(e.target.checked)} />
                  <BuffLabel icon="아기용의 이유식.png">아기용의 이유식</BuffLabel>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={hontaleVictory} onChange={e => setHontaleVictorySafe(e.target.checked)} />
                  <BuffLabel icon="혼테일 원정대의 승리.png">혼테일</BuffLabel>
                </label>
              </div>
            </div>
          )}

          {/* 프리셋 */}
          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">프리셋</div>
            <div className="flex gap-1.5">
              <input
                type="text" placeholder="닉네임" value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleLoad() }}
                disabled={isPresetBusy}
                className="h-7 flex-1 min-w-0 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text" placeholder="저장 코드" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleLoad() }}
                autoComplete="off"
                name="preset-code"
                spellCheck={false}
                disabled={isPresetBusy}
                className="h-7 flex-1 min-w-0 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleSave} disabled={isPresetBusy}
                className="h-7 flex-1 rounded bg-maple text-white text-xs font-medium hover:bg-maple/90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors">
                {presetAction === 'save' ? '저장 중' : '저장'}
              </button>
              <button onClick={handleLoad} disabled={isPresetBusy}
                className="h-7 flex-1 rounded border border-border bg-background text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 transition-colors">
                {presetAction === 'load' ? '불러오는 중' : '불러오기'}
              </button>
              <button onClick={handleResetPassword} disabled={isPresetBusy}
                className="h-7 flex-1 rounded border border-border bg-background text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 transition-colors">
                {presetAction === 'reset' ? '초기화 중' : '코드 초기화'}
              </button>
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground">
              저장은 저장 코드가 필요합니다. 불러오기와 초기화는 저장 당시 저장 코드를 입력해야 합니다.
            </p>
            {presetMsg && (
              <p role={presetMsg.type === 'err' ? 'alert' : 'status'} className={`rounded-md border px-2 py-1.5 text-xs ${presetMessageClass}`}>
                {presetMsg.text}
              </p>
            )}
          </div>
        </div>


      {/* ── AP 재분배 시뮬레이터 ── */}
      <div className="bg-white rounded-xl border border-black/8 shadow-sm p-4 sm:p-5 flex flex-col gap-4 lg:col-start-1">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">AP 재분배 시뮬레이터</span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`text-lg font-semibold ${apSummaryTone}`}>{apSummaryText}</span>
              {apHasRequirement && <span className="text-sm text-muted-foreground">{apRedistributionText}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs lg:min-w-[360px]">
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">현재 최종 {subLabel}</div>
              <div className="text-base font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{apCurrentSubStat}</div>
            </div>
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">순수 {statLabel}</div>
              <div className="text-base font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {baseStat} → {canShowApRedistribution ? apRedistributedBaseStat : baseStat}
              </div>
            </div>
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">순수 {subLabel}</div>
              <div className="text-base font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {subStat} → {canShowApRedistribution ? apRedistributedSubStat : subStat}
              </div>
            </div>
          </div>
        </div>

        {/* AP 역산 */}
        {(() => {
          const mwPct = mapleWarriorLevel > 0 ? Math.floor((mapleWarriorLevel + 1) / 2) : 0
          const flatMainEquip = activeSlots.reduce((s, k) => s + (slots[k].flatStat ?? 0) + (slots[k].flatAllStat ?? 0), 0)
          const mainPct = activeSlots.reduce((s, k) => s + (slots[k].statPercent ?? 0) + (slots[k].allStatPercent ?? 0), 0)
          const minPureSub = apReverseReq > 0 ? requiredBaseStat(apReverseReq, apFlatSubA, apAllStatA, mwPct) : 0
          const moveable = apReverseReq > 0 ? Math.max(0, subStat - minPureSub) : 0
          const newPureMain = baseStat + moveable
          const newMwBonus = Math.floor(newPureMain * mwPct / 100)
          const newFinalMain = Math.floor((newPureMain + flatMainEquip) * (1 + mainPct / 100)) + newMwBonus
          const curMwBonus = Math.floor(baseStat * mwPct / 100)
          const curFinalMain = Math.floor((baseStat + flatMainEquip) * (1 + mainPct / 100)) + curMwBonus
          return (
            <div className="flex flex-col gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">AP 역산</span>
                <span className="text-[11px] text-muted-foreground">— 최소 필요 최종 {subLabel}을 입력하면 이전 가능한 AP를 계산합니다</span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">최소 필요 최종 {subLabel}</Label>
                  <NumInput value={apReverseReq} onChange={setApReverseReq} width={88} />
                </div>
                {apReverseReq > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                      <div className="text-[10px] text-muted-foreground">필요 순수 {subLabel}</div>
                      <div className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{minPureSub}</div>
                    </div>
                    <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                      <div className="text-[10px] text-muted-foreground">이전 가능 AP</div>
                      <div className={`font-semibold ${moveable > 0 ? 'text-win' : 'text-muted-foreground'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {moveable > 0 ? `+${moveable}` : '0'}
                      </div>
                    </div>
                    {moveable > 0 && (
                      <>
                        <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                          <div className="text-[10px] text-muted-foreground">순수 {statLabel}</div>
                          <div className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{baseStat} → <span className="text-win">{newPureMain}</span></div>
                        </div>
                        <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                          <div className="text-[10px] text-muted-foreground">최종 {statLabel}</div>
                          <div className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{curFinalMain} → <span className="text-win">{newFinalMain}</span></div>
                        </div>
                      </>
                    )}
                    {moveable === 0 && subStat > 0 && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        {subStat <= minPureSub ? `순수 ${subLabel}가 이미 최소치입니다` : '이전 가능한 AP가 없습니다'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* 요구치 입력 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground lg:max-w-3xl">
            <p>
              현재 장착 중인 장비의 <strong>착용 요구 {subLabel}</strong>를 높은 순서대로 입력하세요.
              장비 옵션이나 현재 최종 {subLabel}가 아니라, 아이템 설명에 적힌 착용 조건 값입니다.
            </p>
            <p>
              예: 요구 {subLabel}가 160, 140, 120인 장비를 쓰고 있으면 1위는 160, 2위는 140만 입력합니다.
              3위는 2위보다 낮아서 기준이 되지 않습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">현재 장비 1위 착용 요구 {subLabel}</Label>
              <NumInput value={apTopReq1} onChange={setApTopReq1} width={88} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">현재 장비 2위 착용 요구 {subLabel}</Label>
              <NumInput value={apTopReq2} onChange={setApTopReq2} width={88} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">새 비교 장비 착용 요구 {subLabel}</Label>
              <NumInput value={apCompareItemReq} onChange={setApCompareItemReq} width={88} />
            </div>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none pb-1">
              <input type="checkbox" checked={apCompareIsTop1} onChange={e => setApCompareIsTop1(e.target.checked)} />
              <span className="text-muted-foreground">현재 선택한 비교 슬롯 장비가 1위 요구치 장비입니다</span>
            </label>
          </div>
        </div>
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">입력 기준:</strong>
          {' '}현재 장비 1위/2위는 교체 전 착용 중인 장비 기준이고, 새 비교 장비 착용 요구치는 교체하려는 장비 기준입니다.
          현재 비교 슬롯 장비가 1위 요구치 장비라면 체크해야 교체 후 1위 요구치가 빠집니다.
        </div>

        {canUseStrDagger && (
          <div className="rounded-md border border-border bg-muted/10 px-3 py-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={strDaggerEnabled}
                onChange={e => setStrDaggerEnabled(e.target.checked)}
              />
              힘단도 STR 요구치 포함
            </label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              STR은 단검 착용 조건에만 사용하고 스공 계산에는 넣지 않습니다. 현재 순수 STR과 힘단도 착용 요구 STR을 입력하면 메용을 반영해 필요한 순수 STR을 역산합니다.
            </p>
            {strDaggerEnabled && (
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">현재 순수 STR</Label>
                  <NumInput value={daggerStrStat} onChange={setDaggerStrStat} width={88} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">힘단도 착용 요구 STR</Label>
                  <NumInput value={daggerStrRequirement} onChange={setDaggerStrRequirement} width={88} />
                </div>
                {daggerStrRequirement > 0 && (
                  <div className="flex items-end pb-1 text-xs text-muted-foreground">
                    최종 STR {apCurrentDaggerStr} / 필요 순수 STR {apNeedDaggerStr} · 순수 STR {daggerStrStat} → {apRedistributedDaggerStr}
                    {apDaggerStrShift > 0 && <span className="ml-2 text-win">남는 STR {apDaggerStrShift} AP를 {statLabel}으로 전환</span>}
                    {apDaggerStrShift < 0 && <span className="ml-2 text-lose">STR {-apDaggerStrShift} AP 추가 필요</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 계산 결과 */}
        {apHasRequirement && (
          <div className="rounded-lg bg-muted/30 px-4 py-3 flex flex-col gap-2 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span className="text-muted-foreground">
                현재 최종 {subLabel}: <strong className="text-foreground">{apCurrentSubStat}</strong>
              </span>
              {apHasDexRequirement && (
                <>
                  <span className="text-muted-foreground">
                    교체 전 기준 요구치: <strong className="text-foreground">{apEffectiveTopReq1} {subLabel}</strong>
                    {' '}→ 필요 순수 {subLabel}: <strong className="text-foreground">{apNeedA}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    교체 후 기준 요구치: <strong className="text-foreground">{apEffReq} {subLabel}</strong>
                    {' '}→ 필요 순수 {subLabel}: <strong className="text-foreground">{apNeedB}</strong>
                  </span>
                </>
              )}
              {apUsesStrDagger && (
                <span className="text-muted-foreground">
                  힘단도 요구 STR: <strong className="text-foreground">{daggerStrRequirement}</strong>
                  {' '}→ 필요 순수 STR: <strong className="text-foreground">{apNeedDaggerStr}</strong>
                </span>
              )}
            </div>
            {apHasDexRequirement && (apTopReq1 > apCurrentSubStat || apTopReq2 > apCurrentSubStat) && (
              <div className="text-xs text-lose">
                현재 최종 {subLabel}를 넘는 기존 장비 요구치는 계산에서 {apCurrentSubStat}로 보정됩니다.
              </div>
            )}
            {apHasDexRequirement && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>
                  비교 아이템 장착 조건: <strong className="text-foreground">{apNeedForCompareItem}</strong>
                  <span className="ml-1">(비교 아이템 스탯 제외)</span>
                </span>
                <span>
                  장착 후 기존 장비 조건: <strong className="text-foreground">{apNeedForEquippedItems}</strong>
                  <span className="ml-1">(비교 아이템 스탯 포함)</span>
                </span>
              </div>
            )}
            {apStatShift > 0 ? (
              <div className="text-sm font-semibold text-win">
                순수 AP {apShiftAbs} 절감 가능 → 순수 {statLabel} +{apShiftAbs} 전환
              </div>
            ) : apStatShift < 0 ? (
              <div className="text-sm font-semibold text-lose">
                요구 스탯에 순수 AP {apShiftAbs} 추가 필요 → 순수 {statLabel} -{apShiftAbs} 전환
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                재분배가 필요한 순수 AP 변화가 없습니다.
              </div>
            )}
            {(apSubStatShift !== 0 || apDaggerStrShift !== 0) && (
              <div className="text-xs text-muted-foreground">
                세부 변화: 순수 {subLabel} {subStat} → {apRedistributedSubStat}
                {apUsesStrDagger && <> / 순수 STR {daggerStrStat} → {apRedistributedDaggerStr}</>}
              </div>
            )}
            {apStatShift < 0 && apRedistributedBaseStat < 0 && (
              <div className="text-xs text-lose">
                전환 가능한 순수 {statLabel}이 부족합니다.
              </div>
            )}
          </div>
        )}

        {/* AP 재분배 후 데미지 재비교 */}
        {canShowApRedistribution && hasDamageCompareResult && (
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">재분배 후 데미지 재비교</span>
              <span className="text-xs text-muted-foreground">
                순수 {statLabel} {baseStat} → {apRedistributedBaseStat} / 순수 {subLabel} {subStat} → {apRedistributedSubStat}
                {apUsesStrDagger && <> / 순수 STR {daggerStrStat} → {apRedistributedDaggerStr}</>}
              </span>
            </div>
            {apResult === null ? (
              <p className="text-xs text-muted-foreground">계산 중…</p>
              ) : (
              <div className="flex flex-col gap-3">
                {(() => {
                  const apPowerLabel = isMage ? '총마력' : '스공'
                  const rows = ([
                    { label: '장착중인 아이템', pick: 'A' },
                    { label: '비교 아이템', pick: 'B' },
                  ] as const).map(({ label, pick }) => {
                    const beforeStat = pick === 'A' ? result.statWithItemA : result.statWithItemB
                    const afterStat = pick === 'A' ? apResult.statWithItemA : apResult.statWithItemB
                    const beforePower = isMage
                      ? displayMagic(pick === 'A' ? result.magicWithItemA : result.magicWithItemB)
                      : pick === 'A' ? result.damageWithItemA : result.damageWithItemB
                    const afterPower = isMage
                      ? displayMagic(pick === 'A' ? apResult.magicWithItemA : apResult.magicWithItemB)
                      : pick === 'A' ? apResult.damageWithItemA : apResult.damageWithItemB
                    const beforeNormal = pick === 'A' ? result.expectedNormalDmgWithItemA : result.expectedNormalDmgWithItemB
                    const afterNormal = pick === 'A' ? apResult.expectedNormalDmgWithItemA : apResult.expectedNormalDmgWithItemB
                    const beforeBoss = pick === 'A' ? result.expectedDmgWithItemA : result.expectedDmgWithItemB
                    const afterBoss = pick === 'A' ? apResult.expectedDmgWithItemA : apResult.expectedDmgWithItemB
                    const useBoss = Math.abs(beforeBoss - beforeNormal) > 0.001 || Math.abs(afterBoss - afterNormal) > 0.001
                    const beforeExpected = useBoss ? beforeBoss : beforeNormal
                    const afterExpected = useBoss ? afterBoss : afterNormal
                    return {
                      label,
                      useBoss,
                      beforeStat,
                      afterStat,
                      beforePower,
                      afterPower,
                      beforeExpected,
                      afterExpected,
                      statDelta: afterStat - beforeStat,
                      powerDelta: afterPower - beforePower,
                      expectedDelta: afterExpected - beforeExpected,
                    }
                  })
                  const valueClass = (value: number) => value > 0 ? 'text-win' : value < 0 ? 'text-lose' : 'text-muted-foreground'
                  return (
                    <>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {([
                          {
                            step: '1',
                            title: 'AP 적용 전',
                            note: `순수 ${statLabel} ${baseStat} / 순수 ${subLabel} ${subStat}${apUsesStrDagger ? ` / 순수 STR ${daggerStrStat}` : ''}`,
                            stat: (row: typeof rows[number]) => row.beforeStat,
                            power: (row: typeof rows[number]) => row.beforePower,
                            expected: (row: typeof rows[number]) => row.beforeExpected,
                          },
                          {
                            step: '2',
                            title: 'AP 적용 후',
                            note: `순수 ${statLabel} ${apRedistributedBaseStat} / 순수 ${subLabel} ${apRedistributedSubStat}${apUsesStrDagger ? ` / 순수 STR ${apRedistributedDaggerStr}` : ''}`,
                            stat: (row: typeof rows[number]) => row.afterStat,
                            power: (row: typeof rows[number]) => row.afterPower,
                            expected: (row: typeof rows[number]) => row.afterExpected,
                          },
                        ] as const).map(stage => (
                          <div key={stage.step} className="rounded-lg bg-muted/30 px-3 py-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                                  {stage.step}
                                </span>
                                <span className="text-sm font-semibold text-foreground">{stage.title}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground">{stage.note}</span>
                            </div>
                            <div className="overflow-hidden rounded-md border border-border bg-white/70">
                              <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr] border-b border-border bg-muted/40 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">
                                <span>아이템</span>
                                <span className="text-right">{statLabel}</span>
                                <span className="text-right">{apPowerLabel}</span>
                                <span className="text-right">실질 데미지</span>
                              </div>
                              {rows.map(row => (
                                <div key={row.label} className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr] items-center border-b border-border/70 px-2 py-2 text-xs last:border-b-0">
                                  <span className="font-medium text-foreground">{row.label}{row.useBoss && <span className="ml-1 text-[10px] text-muted-foreground">(보스)</span>}</span>
                                  <span className="text-right font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stage.stat(row).toFixed(1)}</span>
                                  <span className="text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stage.power(row).toFixed(1)}</span>
                                  <span className="text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stage.expected(row).toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg bg-win-bg/70 px-3 py-3 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">3</span>
                            <span className="text-sm font-semibold text-foreground">AP 변화 결과</span>
                          </div>
                          <span className={`text-sm font-semibold ${apStatShift > 0 ? 'text-win' : 'text-lose'}`}>
                            순수 {statLabel} {apStatShift >= 0 ? '+' : ''}{apStatShift} / 순수 {subLabel} {(-apSubStatShift) >= 0 ? '+' : ''}{-apSubStatShift}
                            {apUsesStrDagger && <> / 순수 STR {(-apDaggerStrShift) >= 0 ? '+' : ''}{-apDaggerStrShift}</>}
                          </span>
                        </div>
                          <div className="overflow-hidden rounded-md border border-border bg-white/70">
                            <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr] border-b border-border bg-muted/40 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">
                              <span>아이템</span>
                              <span className="text-right">{apPowerLabel} 변화</span>
                              <span className="text-right">실질 데미지 변화</span>
                            </div>
                          {rows.map(row => (
                            <div key={row.label} className="grid grid-cols-[1.1fr_0.9fr_0.9fr] items-center border-b border-border/70 px-2 py-2 text-xs last:border-b-0">
                              <span className="font-medium text-foreground">{row.label}</span>
                              <span className={`text-right font-semibold ${valueClass(row.powerDelta)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {row.powerDelta >= 0 ? '+' : ''}{row.powerDelta.toFixed(1)}
                              </span>
                              <span className={`text-right font-semibold ${valueClass(row.expectedDelta)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {row.expectedDelta >= 0 ? '+' : ''}{row.expectedDelta.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">상세 A/B 비교</span>
                  <button
                    type="button"
                    onClick={() => setShowApDetails(open => !open)}
                    className="h-7 rounded border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showApDetails ? '상세 접기' : '상세 보기'}
                  </button>
                </div>
                {showApDetails && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                  { label: '기존 비교', r: result },
                  { label: 'AP 재분배 후', r: apResult },
                ] as const).map(({ label, r }) => {
                  const eA = r.expectedDmgWithItemA
                  const eB = r.expectedDmgWithItemB
                  const eNA = r.expectedNormalDmgWithItemA
                  const eNB = r.expectedNormalDmgWithItemB
                  const useBoss = Math.abs(eA - eNA) > 0.001 || Math.abs(eB - eNB) > 0.001
                  const vA = useBoss ? eA : eNA
                  const vB = useBoss ? eB : eNB
                  const diff = vA > 0 ? ((vB - vA) / vA) * 100 : 0
                  const displayStatA = Number(r.statWithItemA.toFixed(1))
                  const displayStatB = Number(r.statWithItemB.toFixed(1))
                  const statDiff = displayStatB - displayStatA
                  return (
                    <div key={label} className="rounded-lg bg-muted/30 px-3 py-2 flex flex-col gap-1">
                      <div className="text-[11px] font-semibold text-muted-foreground">{label}{useBoss && ' (보스 기준)'}</div>
                      <div className="grid grid-cols-2 gap-2 rounded-md bg-white/60 px-2 py-1.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground">장착중 {statLabel}</span>
                          <span className="text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {displayStatA.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground">비교 {statLabel}</span>
                          <span className="text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {displayStatB.toFixed(1)}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-between border-t border-border pt-1 text-xs">
                          <span className="text-muted-foreground">{statLabel} 차이</span>
                          <span
                            className={`font-semibold ${statDiff > 0 ? 'text-win' : statDiff < 0 ? 'text-lose' : 'text-muted-foreground'}`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {statDiff >= 0 ? '+' : ''}{statDiff.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">장착중인 아이템</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{vA.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">비교 아이템</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{vB.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-border pt-1 mt-0.5">
                        <span className="text-muted-foreground">차이</span>
                        <span
                          className={`font-semibold ${diff > 0 ? 'text-win' : diff < 0 ? 'text-lose' : 'text-muted-foreground'}`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {diff >= 0 ? '+' : ''}{diff.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      {saveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="presentation"
          onMouseDown={() => setSaveConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-preset-title"
            className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-4 shadow-2xl"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="save-preset-title" className="text-base font-semibold text-foreground">프리셋 저장</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  <span className="font-semibold text-foreground">{nickname.trim()}</span> 프리셋을 저장하시겠습니까?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSaveConfirmOpen(false)}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="닫기"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 rounded-lg border border-maple/20 bg-maple-bg px-3 py-2 text-xs leading-5 text-muted-foreground">
              현재 입력한 캐릭터, 장비, 비교 아이템, 버프 설정이 이 닉네임에 저장됩니다.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveConfirmOpen(false)}
                className="h-8 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmSavePreset()}
                className="h-8 rounded-md bg-maple px-3 text-xs font-semibold text-white transition-colors hover:bg-maple/90"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
      <SeoContent />
    </div>
  )
}
