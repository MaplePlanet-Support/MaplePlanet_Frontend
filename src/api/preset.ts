import { api } from './client'
import type { WeaponType, ItemStatFull } from './calculator'

export type PresetConfig = {
  job: string
  mode: 1 | 2
  baseStat: number
  subStat: number
  weaponType: WeaponType
  weaponAtk: number
  atkPercent: number
  critRate: number
  critDmgPP: number
  skillPct: number
  blessingLevel: number
  empressBlessingLevel: number
  useOverall: boolean
  slots: Record<string, ItemStatFull>
  compareSlot: string
  itemA: ItemStatFull
  itemB: ItemStatFull
}

export type PresetSaveRequest = {
  nickname: string
  password?: string
  config: PresetConfig
}

export type PresetSaveResponse = {
  nickname: string
  savedAt: string
}

export type PresetLoadRequest = {
  nickname: string
  password?: string
}

export type PresetLoadResponse = {
  nickname: string
  config: PresetConfig
}

export const savePreset = (body: PresetSaveRequest) =>
  api.post<PresetSaveResponse>('/v1/preset/save', body)

export const loadPreset = (body: PresetLoadRequest) =>
  api.post<PresetLoadResponse>('/v1/preset/load', body)
