import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  statCompare, damageCompare, WEAPON_OPTIONS, MAGE_WEAPON_OPTIONS,
  type WeaponType, type ItemStatFull, type ItemStat,
  type StatCompareResponse, type DamageCompareResponse,
} from '@/api/calculator'
import { savePreset, loadPreset, type PresetConfig } from '@/api/preset'

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

const weaponLabel = (value: WeaponType) =>
  [...WEAPON_OPTIONS, ...MAGE_WEAPON_OPTIONS].find(o => o.value === value)?.label ?? value

const JOB_SLOTS = ['모자', '한벌옷', '상의', '하의', '장갑', '신발', '무기', '방패']
const COMMON_SLOTS = ['귀고리', '망토', '목걸이', '안경', '반지', '벨트', '훈장']
const ALL_SLOTS = [...JOB_SLOTS, ...COMMON_SLOTS]

const emptyFull = (): ItemStatFull => ({
  flatStat: 0, flatSubStat: 0, statPercent: 0, allStatPercent: 0,
  flatAtk: 0, atkPercent: 0,
  critRateBonus: 0, totalDmgPercent: 0, bossDmgPercent: 0,
})

type Mode = 1 | 2

function NumInput({
  value, onChange, width = 56, max,
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
      className="h-7 rounded border border-border bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

function levelValue(value: number, max: number) {
  return Math.max(0, Math.min(max, value))
}

function BuffLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={`/buffs/${icon}`} alt="" className="h-5 w-5" />
      {children}
    </span>
  )
}

function ExpectedDmgBlock({
  title, valA, valB, maxVal, winner,
}: {
  title: string; valA: number; valB: number; maxVal: number; winner: string | null
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</div>
      {([['A', '현재 장착'], ['B', '비교 아이템']] as const).map(([label, displayName]) => {
        const val = label === 'A' ? valA : valB
        const isWin = winner === label
        return (
          <div key={label} className="mb-1.5">
            <div className="flex items-baseline justify-between mb-1">
              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>{displayName} {isWin && '👑'}</span>
              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val.toFixed(1)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(val / maxVal) * 100}%`, background: isWin ? '#2563EB' : '#d1d5db' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ItemCompare() {
  const [mode, setMode] = useState<Mode>(1)
  const [job, setJob] = useState('전사')
  const [baseStat, setBaseStat] = useState(0)
  const [subStat, setSubStat] = useState(0)
  const [weaponType, setWeaponType] = useState<WeaponType>('TWO_HAND_SWORD')
  const [weaponAtk, setWeaponAtk] = useState(0)
  const [atkPercent, setAtkPercent] = useState(0)
  const [blessingLevel, setBlessingLevel] = useState(0)
  const [empressBlessingLevel, setEmPressBlessingLevel] = useState(0)
  const [mapleWarriorLevel, setMapleWarriorLevel] = useState(0)
  const [meditationLevel, setMeditationLevel] = useState(0)
  const [rageLevel, setRageLevel] = useState(0)
  const [sharpEyesLevel, setSharpEyesLevel] = useState(0)
  const [decentSharpEyes, setDecentSharpEyes] = useState(false)
  const [babyDragonFood, setBabyDragonFood] = useState(false)
  const [critRate, setCritRate] = useState(0)
  const [critDmgPP, setCritDmgPP] = useState(0)
  const [skillCoeff, setSkillCoeff] = useState(150)
  const [useOverall, setUseOverall] = useState(false)
  const [slots, setSlots] = useState<Record<string, ItemStatFull>>(
    Object.fromEntries(ALL_SLOTS.map(s => [s, emptyFull()]))
  )
  const [compareSlot, setCompareSlot] = useState('모자')
  const [compareItem, setCompareItem] = useState<ItemStatFull>(emptyFull())
  const [result, setResult] = useState<StatCompareResponse | DamageCompareResponse | null>(null)
  const [calculating, setCalculating] = useState(false)

  const [nickname, setNickname] = useState('')
  const [presetMsg, setPresetMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const isMage = job === '마법사'
  const atkColLabel = isMage ? '마력' : '공격력'
  const statLabel = JOB_STAT[job]
  const subLabel = JOB_SUB[job]
  const weaponOptions = isMage ? MAGE_WEAPON_OPTIONS : WEAPON_OPTIONS

  useEffect(() => {
    const d = JOB_CRIT[job]
    setCritRate(d.critRate)
    setCritDmgPP(d.critDmgPP)
    setSkillCoeff(JOB_SKILL_COEFF[job] ?? 150)
    setWeaponType(JOB_DEFAULT_WEAPON[job])
  }, [job])

  const getActiveSlots = useCallback(
    () => ALL_SLOTS.filter(s => useOverall ? s !== '상의' && s !== '하의' : s !== '한벌옷'),
    [useOverall]
  )

  const getJobSlotRows = useCallback(
    () => {
      let rows = JOB_SLOTS.filter(s => useOverall ? s !== '상의' && s !== '하의' : s !== '한벌옷')
      if (mode === 2) rows = rows.filter(s => s !== '무기')
      return rows
    },
    [useOverall, mode]
  )

  useEffect(() => {
    const active = getActiveSlots()
    if (!active.includes(compareSlot)) setCompareSlot(active[0])
  }, [useOverall])

  useEffect(() => { setResult(null) }, [mode])

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

  const calculate = useCallback(async () => {
    if (baseStat <= 0) { setResult(null); return }
    const activeSlots = getActiveSlots()
    setCalculating(true)
    try {
      const equippedFull = activeSlots.map(s => slots[s])
      const currentSlotFull = compareSlot ? slots[compareSlot] : null
      const sanitizeFull = (item: ItemStatFull, isWeapon: boolean): ItemStatFull => isWeapon
        ? item
        : { ...item, flatAtk: 0, atkPercent: 0, critRateBonus: 0, totalDmgPercent: 0, bossDmgPercent: 0 }

      // itemA = 현재 장착 (slots[compareSlot]), itemB = 비교 아이템
      const currentEquipped = currentSlotFull ?? emptyFull()

      if (mode === 1) {
        const toBasic = (item: ItemStatFull): ItemStat => ({
          flatStat: item.flatStat,
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
        const equippedDamage = activeSlots.map(s => sanitizeFull(slots[s], s === '무기'))
        const currentDamage = compareSlot ? sanitizeFull(slots[compareSlot], compareSlot === '무기') : null
        const isWeapon = compareSlot === '무기'
        // 무기 슬롯 비교: mode 2에서 무기 행이 테이블에 없으므로 slots['무기']는 항상 비어있음.
        // weaponAtk(현재 무기 공격력)를 itemA.flatAtk으로 넘기고, API의 weaponAtk=0으로 설정.
        const apiWeaponAtk = isWeapon ? 0 : weaponAtk
        const currentEquippedDamage = isWeapon
          ? { ...emptyFull(), flatAtk: weaponAtk, atkPercent: slots['무기'].atkPercent, critRateBonus: slots['무기'].critRateBonus, totalDmgPercent: slots['무기'].totalDmgPercent, bossDmgPercent: slots['무기'].bossDmgPercent }
          : sanitizeFull(currentEquipped, false)
        const compareItemDamage = sanitizeFull(compareItem, isWeapon)
        const res = await damageCompare({
          job, baseStat, subStat, weaponType, weaponAtk: apiWeaponAtk, atkPercent,
          blessingLevel, empressBlessingLevel,
          mapleWarriorLevel, meditationLevel, rageLevel,
          sharpEyesLevel, decentSharpEyes, babyDragonFood,
          critRate, critDmgPP, skillCoeff,
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
    mode, job, baseStat, subStat, weaponType, weaponAtk, atkPercent,
    blessingLevel, empressBlessingLevel,
    mapleWarriorLevel, meditationLevel, rageLevel,
    sharpEyesLevel, decentSharpEyes, babyDragonFood,
    critRate, critDmgPP, skillCoeff,
    useOverall, slots, compareSlot, compareItem, getActiveSlots,
  ])

  useEffect(() => {
    const timer = setTimeout(calculate, 400)
    return () => clearTimeout(timer)
  }, [calculate])

  async function handleSave() {
    if (!nickname.trim()) { setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    try {
      const config: PresetConfig = {
        job, mode, baseStat, subStat, weaponType, weaponAtk, atkPercent,
        blessingLevel, empressBlessingLevel,
        mapleWarriorLevel, meditationLevel, rageLevel,
        sharpEyesLevel, decentSharpEyes, babyDragonFood,
        critRate, critDmgPP, skillCoeff,
        useOverall, slots, compareSlot, compareItem,
      }
      const res = await savePreset({ nickname: nickname.trim(), config })
      setPresetMsg({ type: 'ok', text: `"${res.nickname}" 저장 완료!` })
    } catch {
      setPresetMsg({ type: 'err', text: '저장 실패. 잠시 후 다시 시도해주세요.' })
    }
  }

  async function handleLoad() {
    if (!nickname.trim()) { setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    try {
      const res = await loadPreset({ nickname: nickname.trim() })
      const c = res.config
      setJob(c.job); setMode(c.mode); setBaseStat(c.baseStat); setSubStat(c.subStat)
      setWeaponType(c.weaponType); setWeaponAtk(c.weaponAtk); setAtkPercent(c.atkPercent)
      setBlessingLevel(c.blessingLevel); setEmPressBlessingLevel(c.empressBlessingLevel)
      setMapleWarriorLevel(c.mapleWarriorLevel ?? 0)
      setMeditationLevel(c.meditationLevel ?? 0)
      const loadedRageLevel = c.rageLevel ?? 0
      const loadedSharpLevel = c.sharpEyesLevel ?? 0
      setRageLevel(loadedRageLevel)
      setSharpEyesLevel(loadedSharpLevel)
      setDecentSharpEyes(loadedSharpLevel > 0 ? false : c.decentSharpEyes ?? false)
      setBabyDragonFood(loadedRageLevel > 0 ? false : c.babyDragonFood ?? false)
      if (c.critRate !== undefined) setCritRate(c.critRate)
      if (c.critDmgPP !== undefined) setCritDmgPP(c.critDmgPP)
      if (c.skillCoeff !== undefined) setSkillCoeff(c.skillCoeff)
      setUseOverall(c.useOverall); setSlots(c.slots); setCompareSlot(c.compareSlot)
      if (c.compareItem !== undefined) setCompareItem(c.compareItem)
      setPresetMsg({ type: 'ok', text: `"${res.nickname}" 불러오기 완료!` })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setPresetMsg({ type: 'err', text: msg.includes('Too many requests') ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' : '해당 닉네임을 찾을 수 없습니다.' })
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
  const hasBossDmg = expA !== null && expNormalA !== null && Math.abs(expA - expNormalA) > 0.001

  const maxStat = Math.max(statA ?? 0, statB ?? 0, 1)
  const maxDmg = Math.max(dmgA ?? 0, dmgB ?? 0, 1)
  const maxMagic = Math.max(magicA ?? 0, magicB ?? 0, 1)
  const maxExp = Math.max(expA ?? 0, expB ?? 0, 1)
  const maxNormalExp = Math.max(expNormalA ?? 0, expNormalB ?? 0, 1)

  const jobSlotRows = getJobSlotRows()
  const activeSlots = getActiveSlots()
  const isWeaponCompare = mode === 2 && compareSlot === '무기'

  return (
    <div
      className="text-left min-h-screen"
      style={{ fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif", background: '#EEF2F7' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-black/8 px-6 py-3 flex items-center gap-6">
        <div>
          <div className="text-[11px] text-muted-foreground tracking-widest uppercase">PlanetCompare</div>
          <div className="text-lg font-semibold text-foreground leading-tight">아이템 비교</div>
        </div>
        <Tabs value={String(mode)} onValueChange={v => setMode(Number(v) as Mode)}>
          <TabsList>
            <TabsTrigger value="1">단순 스탯 비교</TabsTrigger>
            <TabsTrigger value="2">스공&실제 데미지 비교</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-4 lg:items-start">

        {/* ── LEFT ── */}
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-3 sm:p-6 flex flex-col gap-6">

          {/* 캐릭터 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">캐릭터</div>
              <span className="text-xs text-muted-foreground">주스탯: {statLabel}</span>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">직업</Label>
                <Select value={job} onValueChange={v => v && setJob(v)}>
                  <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(JOB_STAT).map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">순수 {statLabel}</Label>
                <NumInput value={baseStat} onChange={setBaseStat} width={88} />
              </div>
              {mode === 2 && (
                <>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">순수 {subLabel}</Label>
                    <NumInput value={subStat} onChange={setSubStat} width={88} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">크리 확률 %</Label>
                    <NumInput value={critRate} onChange={setCritRate} width={60} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">크리 추가퍼뎀 (%p 절대값)</Label>
                    <NumInput value={critDmgPP} onChange={setCritDmgPP} width={72} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">기준 스킬 계수 (%p)</Label>
                    <NumInput value={skillCoeff} onChange={v => setSkillCoeff(Math.max(1, v))} width={72} />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 장비 스탯 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">현재 장비 스탯</div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={useOverall} onChange={e => setUseOverall(e.target.checked)} className="sr-only" />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useOverall ? 'bg-maple border-maple' : 'border-border bg-white'}`}>
                  {useOverall && <span className="text-white text-[10px] leading-none">✓</span>}
                </div>
                한벌옷 착용
              </label>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground mb-1">직업 부위</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1 text-left text-[11px] font-medium text-muted-foreground">슬롯</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}%</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">올%</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">깡 {statLabel}</th>
                      {mode === 2 && (
                        <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">깡 {subLabel}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {jobSlotRows.map(s => (
                      <tr key={s} className="hover:bg-muted/20">
                        <td className="border border-border px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{s}</td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].statPercent} onChange={v => updateSlot(s, 'statPercent', v)} max={1000} width={68} />
                        </td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].allStatPercent} onChange={v => updateSlot(s, 'allStatPercent', v)} max={1000} width={68} />
                        </td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].flatStat} onChange={v => updateSlot(s, 'flatStat', v)} max={1000} width={68} />
                        </td>
                        {mode === 2 && (
                          <td className="border border-border px-1 py-0.5 text-center">
                            <NumInput value={slots[s].flatSubStat} onChange={v => updateSlot(s, 'flatSubStat', v)} max={1000} width={68} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground mb-1">공용 부위</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1 text-left text-[11px] font-medium text-muted-foreground">슬롯</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}%</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">올%</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">깡 {statLabel}</th>
                      {mode === 2 && (
                        <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">깡 {subLabel}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {COMMON_SLOTS.map(s => (
                      <tr key={s} className="hover:bg-muted/20">
                        <td className="border border-border px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{s}</td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].statPercent} onChange={v => updateSlot(s, 'statPercent', v)} max={1000} width={68} />
                        </td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].allStatPercent} onChange={v => updateSlot(s, 'allStatPercent', v)} max={1000} width={68} />
                        </td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].flatStat} onChange={v => updateSlot(s, 'flatStat', v)} max={1000} width={68} />
                        </td>
                        {mode === 2 && (
                          <td className="border border-border px-1 py-0.5 text-center">
                            <NumInput value={slots[s].flatSubStat} onChange={v => updateSlot(s, 'flatSubStat', v)} max={1000} width={68} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {mode === 2 && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">무기 종류</Label>
                    <Select value={weaponType} onValueChange={v => setWeaponType(v as WeaponType)}>
                      <SelectTrigger className="h-8 w-28 text-sm"><SelectValue>{weaponLabel(weaponType)}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {weaponOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{isMage ? '무기 마력' : '무기 공격력'}</Label>
                    <NumInput value={weaponAtk} onChange={setWeaponAtk} width={76} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{atkColLabel}% (비교슬롯 제외)</Label>
                    <NumInput value={atkPercent} onChange={setAtkPercent} width={84} />
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
                <Select value={compareSlot} onValueChange={v => setCompareSlot(v ?? '')}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">빈 슬롯</SelectItem>
                    {activeSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {compareSlot && (
                <span className="text-[11px] text-muted-foreground">
                  현재: {statLabel}% {slots[compareSlot].statPercent} / 깡 {statLabel} {slots[compareSlot].flatStat}
                  {mode === 2 && ` / 깡 ${subLabel} ${slots[compareSlot].flatSubStat}`}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {/* 현재 장착 (읽기 전용 요약) */}
              {compareSlot && (
                <div className="border rounded-md p-3 bg-muted/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">현재 장착</span>
                    {statA !== null && (
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {statA.toFixed(1)} {statLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {statLabel}% {slots[compareSlot].statPercent} / 깡 {statLabel} {slots[compareSlot].flatStat}
                    {mode === 2 && ` / 깡 ${subLabel} ${slots[compareSlot].flatSubStat}`}
                    {isWeaponCompare && ` / ${atkColLabel} ${slots[compareSlot].flatAtk} / ${atkColLabel}% ${slots[compareSlot].atkPercent} / 크확% ${slots[compareSlot].critRateBonus}`}
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
                  {statB !== null && (
                    <span className={`text-xs ${winner === 'B' ? 'text-maple' : 'text-muted-foreground'}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {statB.toFixed(1)} {statLabel}
                    </span>
                  )}
                </div>

                {/* 스탯 행 */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[10px] text-muted-foreground">{statLabel}%</Label>
                    <NumInput value={compareItem.statPercent} onChange={v => setCompareItem({ ...compareItem, statPercent: v })} max={1000} width={68} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[10px] text-muted-foreground">올%</Label>
                    <NumInput value={compareItem.allStatPercent} onChange={v => setCompareItem({ ...compareItem, allStatPercent: v })} max={1000} width={68} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[10px] text-muted-foreground">깡 {statLabel}</Label>
                    <NumInput value={compareItem.flatStat} onChange={v => setCompareItem({ ...compareItem, flatStat: v })} max={1000} width={68} />
                  </div>
                  {mode === 2 && (
                    <div className="flex flex-col gap-0.5">
                      <Label className="text-[10px] text-muted-foreground">깡 {subLabel}</Label>
                      <NumInput value={compareItem.flatSubStat} onChange={v => setCompareItem({ ...compareItem, flatSubStat: v })} max={1000} width={68} />
                    </div>
                  )}
                </div>

                {isWeaponCompare && (
                  <>
                    {/* 공격력/마력 행 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{atkColLabel}</Label>
                        <NumInput value={compareItem.flatAtk} onChange={v => setCompareItem({ ...compareItem, flatAtk: v })} max={1000} width={68} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{atkColLabel}%</Label>
                        <NumInput value={compareItem.atkPercent} onChange={v => setCompareItem({ ...compareItem, atkPercent: v })} max={1000} width={68} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">크확%</Label>
                        <NumInput value={compareItem.critRateBonus} onChange={v => setCompareItem({ ...compareItem, critRateBonus: v })} max={1000} width={68} />
                      </div>
                    </div>
                    {/* 데미지 배율 행 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">총뎀%</Label>
                        <NumInput value={compareItem.totalDmgPercent} onChange={v => setCompareItem({ ...compareItem, totalDmgPercent: v })} max={1000} width={68} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">보공%</Label>
                        <NumInput value={compareItem.bossDmgPercent} onChange={v => setCompareItem({ ...compareItem, bossDmgPercent: v })} max={1000} width={68} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── RIGHT: 아이템 비교 결과 ── */}
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-4 sm:p-5 lg:sticky lg:top-[72px] flex flex-col gap-4 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">아이템 비교 결과</span>
            {calculating && <span className="text-[11px] text-muted-foreground">계산 중…</span>}
          </div>

          {result === null ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                순수 {statLabel}을 입력하면<br />결과가 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <>
              {/* 주스탯 */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{statLabel} (주스탯)</div>
                {([['A', '현재 장착'], ['B', '비교 아이템']] as const).map(([label, displayName]) => {
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
                        const val = label === 'A' ? magicA : magicB
                        const isWin = winner === label
                        return (
                          <div key={label}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>{label === 'A' ? '현재 장착' : '비교 아이템'}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val.toFixed(0)}</span>
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

                  {/* 스공 / 기본데미지 */}
                  {dmgA !== null && dmgB !== null && (
                    <div className="border-t border-border pt-3 flex flex-col gap-2">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {isMage ? '기본 데미지' : '스공'}
                      </div>
                      {([['A', '현재 장착'], ['B', '비교 아이템']] as const).map(([label, displayName]) => {
                        const dmg = label === 'A' ? dmgA : dmgB
                        const isWin = winner === label
                        return (
                          <div key={label}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>{displayName}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{dmg.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(dmg / maxDmg) * 100}%`, background: isWin ? '#2563EB' : '#d1d5db' }} />
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
                        maxVal={maxNormalExp} winner={winner}
                      />
                      {/* 보스 몬스터 (보공이 있을 때만) */}
                      {hasBossDmg && (
                        <ExpectedDmgBlock
                          title="실질 데미지 — 보스 몬스터"
                          valA={expA} valB={expB}
                          maxVal={maxExp} winner={winner}
                        />
                      )}
                      {/* 승자 배너 */}
                      <div className={`rounded-md px-3 py-2 text-sm font-medium ${winner === 'SAME' ? 'bg-muted/40 text-muted-foreground' : 'bg-win-bg text-foreground'}`}>
                        {winner === 'SAME' ? '두 아이템이 동일합니다' : (
                          <><span className="text-maple font-semibold">{winner === 'B' ? '비교 아이템' : '현재 장착'}</span>이{' '}
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

          {mode === 2 && (
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">스킬</div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="정령의축복.png">정령의 축복</BuffLabel></Label>
                    <button type="button" onClick={() => setBlessingLevel(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={blessingLevel} onChange={v => setBlessingLevel(levelValue(v, 20))} width={60} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="여신의축복.png">여신의 축복</BuffLabel></Label>
                    <button type="button" onClick={() => setEmPressBlessingLevel(12)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={empressBlessingLevel} onChange={v => setEmPressBlessingLevel(levelValue(v, 12))} width={60} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="메이플용사.png">메용</BuffLabel></Label>
                    <button type="button" onClick={() => setMapleWarriorLevel(30)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={mapleWarriorLevel} onChange={v => setMapleWarriorLevel(levelValue(v, 30))} width={60} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="메디테이션.png">메디테이션</BuffLabel></Label>
                    <button type="button" onClick={() => setMeditationLevel(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={meditationLevel} onChange={v => setMeditationLevel(levelValue(v, 20))} width={60} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="분노.png">분노</BuffLabel></Label>
                    <button type="button" onClick={() => setRageLevelSafe(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={rageLevel} onChange={setRageLevelSafe} width={60} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs"><BuffLabel icon="샤프아이즈.png">샤프아이즈</BuffLabel></Label>
                    <button type="button" onClick={() => setSharpEyesLevelSafe(30)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <NumInput value={sharpEyesLevel} onChange={setSharpEyesLevelSafe} width={60} />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={decentSharpEyes} onChange={e => setDecentSharpEyesSafe(e.target.checked)} />
                  <BuffLabel icon="샤프아이즈.png">쓸샾</BuffLabel>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={babyDragonFood} onChange={e => setBabyDragonFoodSafe(e.target.checked)} />
                  <BuffLabel icon="아기용의 이유식.png">아기용의 이유식</BuffLabel>
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
                className="h-7 flex-1 min-w-0 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleSave}
                className="h-7 flex-1 rounded bg-maple text-white text-xs font-medium hover:bg-maple/90 transition-colors">
                저장
              </button>
              <button onClick={handleLoad}
                className="h-7 flex-1 rounded border border-border bg-background text-xs font-medium hover:bg-muted transition-colors">
                불러오기
              </button>
            </div>
            {presetMsg && (
              <p className={`text-xs ${presetMsg.type === 'ok' ? 'text-win' : 'text-lose'}`}>{presetMsg.text}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
