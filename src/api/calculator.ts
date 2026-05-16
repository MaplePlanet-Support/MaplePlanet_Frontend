import { api } from './client'

export type ItemStat = {
  flatStat: number
  statPercent: number
}

export type StatCompareRequest = {
  baseStat: number
  equippedItems: ItemStat[]
  currentSlotItem: ItemStat | null
  itemA: ItemStat
  itemB: ItemStat
}

export type StatCompareResponse = {
  statWithItemA: number
  statWithItemB: number
  difference: number
  betterItem: 'A' | 'B' | 'SAME'
}

export type WeaponType =
  | 'ONE_HAND_SWORD' | 'ONE_HAND_AXE' | 'ONE_HAND_BLUNT'
  | 'TWO_HAND_SWORD' | 'TWO_HAND_AXE' | 'TWO_HAND_BLUNT'
  | 'SPEAR' | 'POLEARM'
  | 'BOW' | 'CROSSBOW'
  | 'DAGGER' | 'CLAW' | 'KNUCKLE' | 'GUN'

export const WEAPON_OPTIONS: { value: WeaponType; label: string }[] = [
  { value: 'ONE_HAND_SWORD', label: '한손검 (4.0)' },
  { value: 'ONE_HAND_AXE', label: '한손도끼 (4.4)' },
  { value: 'ONE_HAND_BLUNT', label: '한손둔기 (4.4)' },
  { value: 'TWO_HAND_SWORD', label: '두손검 (4.6)' },
  { value: 'TWO_HAND_AXE', label: '두손도끼 (4.8)' },
  { value: 'TWO_HAND_BLUNT', label: '두손둔기 (4.8)' },
  { value: 'SPEAR', label: '창 (5.0)' },
  { value: 'POLEARM', label: '폴암 (5.0)' },
  { value: 'BOW', label: '활 (3.4)' },
  { value: 'CROSSBOW', label: '석궁 (3.6)' },
  { value: 'DAGGER', label: '단검 (3.6)' },
  { value: 'CLAW', label: '아대 (3.8)' },
  { value: 'KNUCKLE', label: '너클 (4.8)' },
  { value: 'GUN', label: '건 (3.6)' },
]

export type DamageCalcRequest = {
  mainStat: number
  subStat: number
  weaponType: WeaponType
  weaponAtk: number
  equipAtk: number
  atkPercent: number
  blessingLevel: number
  empressBlessingLevel: number
}

export type DamageCalcResponse = {
  blessingAtk: number
  empressBlessingAtk: number
  totalAtk: number
  damage: number
}

export const statCompare = (body: StatCompareRequest) =>
  api.post<StatCompareResponse>('/v1/calculator/stat-compare', body)

export const calcDamage = (body: DamageCalcRequest) =>
  api.post<DamageCalcResponse>('/v1/calculator/damage', body)
