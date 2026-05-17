import { api } from './client'

export type ItemStat = {
  flatStat: number
  statPercent: number
}

export type ItemStatFull = {
  flatStat: number
  flatSubStat: number
  statPercent: number
  flatAtk: number
  atkPercent: number      // 공격력/마력% (잠재)
  critRateBonus: number   // 크리티컬 확률% (잠재)
  totalDmgPercent: number // 총 데미지%
  bossDmgPercent: number  // 보스 공격 시 데미지%
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
  | 'WAND' | 'STAFF'

export const WEAPON_OPTIONS: { value: WeaponType; label: string }[] = [
  { value: 'ONE_HAND_SWORD', label: '한손검' },
  { value: 'ONE_HAND_AXE', label: '한손도끼' },
  { value: 'ONE_HAND_BLUNT', label: '한손둔기' },
  { value: 'TWO_HAND_SWORD', label: '두손검' },
  { value: 'TWO_HAND_AXE', label: '두손도끼' },
  { value: 'TWO_HAND_BLUNT', label: '두손둔기' },
  { value: 'SPEAR', label: '창' },
  { value: 'POLEARM', label: '폴암' },
  { value: 'BOW', label: '활' },
  { value: 'CROSSBOW', label: '석궁' },
  { value: 'DAGGER', label: '단검' },
  { value: 'CLAW', label: '아대' },
  { value: 'KNUCKLE', label: '너클' },
  { value: 'GUN', label: '건' },
]

export const MAGE_WEAPON_OPTIONS: { value: WeaponType; label: string }[] = [
  { value: 'WAND', label: '완드' },
  { value: 'STAFF', label: '스태프' },
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
  mapleWarriorLevel: number
  meditationLevel: number
  rageLevel: number
  sharpEyesLevel: number
  decentSharpEyes: boolean
  babyDragonFood: boolean
}

export type DamageCalcResponse = {
  blessingAtk: number
  empressBlessingAtk: number
  buffAtk: number
  buffMagic: number
  mapleWarriorStat: number
  critRate: number
  critDmgPP: number
  totalAtk: number
  totalMagic: number
  damage: number
}

export type DamageCompareRequest = {
  job: string
  baseStat: number
  subStat: number
  weaponType: WeaponType
  weaponAtk: number
  atkPercent: number
  blessingLevel: number
  empressBlessingLevel: number
  mapleWarriorLevel: number
  meditationLevel: number
  rageLevel: number
  sharpEyesLevel: number
  decentSharpEyes: boolean
  babyDragonFood: boolean
  critRate: number
  critDmgPP: number  // 크리 시 추가 퍼뎀 절대값(%p). 예) SE30=140, CT30=100
  skillCoeff: number // 기준 스킬 계수(%p). 예) 럭키세븐=150, 파워스트라이크=260
  equippedItems: ItemStatFull[]
  currentSlotItem: ItemStatFull | null
  itemA: ItemStatFull
  itemB: ItemStatFull
}

export type DamageCompareResponse = {
  statWithItemA: number
  statWithItemB: number
  damageWithItemA: number
  damageWithItemB: number
  magicWithItemA: number
  magicWithItemB: number
  expectedDmgWithItemA: number       // 보스 기준 (총뎀 + 보공)
  expectedDmgWithItemB: number
  expectedNormalDmgWithItemA: number // 일반 기준 (총뎀만)
  expectedNormalDmgWithItemB: number
  statDifference: number
  damageDifference: number
  expectedDmgDiffPct: number
  betterItem: 'A' | 'B' | 'SAME'
}

export const statCompare = (body: StatCompareRequest) =>
  api.post<StatCompareResponse>('/v1/calculator/stat-compare', body)

export const calcDamage = (body: DamageCalcRequest) =>
  api.post<DamageCalcResponse>('/v1/calculator/damage', body)

export const damageCompare = (body: DamageCompareRequest) =>
  api.post<DamageCompareResponse>('/v1/calculator/damage-compare', body)
