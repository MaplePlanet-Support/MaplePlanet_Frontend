import { api } from './client'
import type { WeaponType, ItemStatFull } from './calculator'

export type PresetConfig = {
  job: string
  mode: 1 | 2
  baseStat: number
  subStat: number
  weaponType: WeaponType
  compareWeaponType?: WeaponType
  weaponAtk: number
  atkPercent: number
  critRate: number
  critDmgPP: number
  skillCoeff: number
  blessingLevel: number
  empressBlessingLevel: number
  mapleWarriorLevel: number
  meditationLevel: number
  rageLevel: number
  sharpEyesLevel: number
  decentSharpEyes: boolean
  babyDragonFood: boolean
  hontaleVictory?: boolean
  ammoAtk?: number
  useOverall: boolean
  slots: Record<string, Partial<ItemStatFull>>
  compareSlot: string
  compareItem: Partial<ItemStatFull>
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

export type PresetResetPasswordRequest = {
  nickname: string
  currentPassword?: string
}

export const savePreset = (body: PresetSaveRequest) =>
  api.post<PresetSaveResponse>('/v1/preset/save', body)

export const loadPreset = (body: PresetLoadRequest) =>
  api.post<PresetLoadResponse>('/v1/preset/load', body)

export const resetPresetPassword = (body: PresetResetPasswordRequest) =>
  api.post<void>('/v1/preset/reset-password', body)
