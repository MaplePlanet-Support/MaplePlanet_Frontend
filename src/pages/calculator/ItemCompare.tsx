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
const JOB_CRIT: Record<string, { critRate: number; critDmgPP: number; skillPct: number }> = {
  전사:       { critRate: 5,  critDmgPP: 0,   skillPct: 100 },
  마법사:     { critRate: 5,  critDmgPP: 0,   skillPct: 100 },
  궁수:       { critRate: 5,  critDmgPP: 0,   skillPct: 100 },
  도적:       { critRate: 50, critDmgPP: 100, skillPct: 150 },
  '해적(바이퍼)': { critRate: 5, critDmgPP: 0, skillPct: 100 },
  '해적(캡틴)':   { critRate: 5, critDmgPP: 0, skillPct: 100 },
}

const JOB_SLOTS = ['모자', '한벌옷', '상의', '하의', '장갑', '신발', '무기', '방패']
const COMMON_SLOTS = ['귀고리', '망토', '목걸이', '안경', '반지', '벨트', '훈장']
const ALL_SLOTS = [...JOB_SLOTS, ...COMMON_SLOTS]

const emptyFull = (): ItemStatFull => ({
  flatStat: 0, statPercent: 0,
  flatAtk: 0, atkPercent: 0,
  critRateBonus: 0, totalDmgPercent: 0, bossDmgPercent: 0,
})

type Mode = 1 | 2

function NumInput({
  value, onChange, width = 56,
}: {
  value: number; onChange: (v: number) => void; width?: number
}) {
  return (
    <input
      type="number"
      min={0}
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      style={{ width, fontFamily: "'JetBrains Mono', monospace" }}
      className="h-7 rounded border border-border bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

export default function ItemCompare() {
  const [mode, setMode] = useState<Mode>(1)
  const [job, setJob] = useState('궁수')
  const [baseStat, setBaseStat] = useState(0)
  const [subStat, setSubStat] = useState(0)
  const [weaponType, setWeaponType] = useState<WeaponType>('BOW')
  const [weaponAtk, setWeaponAtk] = useState(0)
  const [atkPercent, setAtkPercent] = useState(0)
  const [blessingLevel, setBlessingLevel] = useState(0)
  const [empressBlessingLevel, setEmPressBlessingLevel] = useState(0)
  const [critRate, setCritRate] = useState(5)
  const [critDmgPP, setCritDmgPP] = useState(0)
  const [skillPct, setSkillPct] = useState(100)
  const [useOverall, setUseOverall] = useState(false)
  const [slots, setSlots] = useState<Record<string, ItemStatFull>>(
    Object.fromEntries(ALL_SLOTS.map(s => [s, emptyFull()]))
  )
  const [compareSlot, setCompareSlot] = useState('모자')
  const [itemA, setItemA] = useState<ItemStatFull>(emptyFull())
  const [itemB, setItemB] = useState<ItemStatFull>(emptyFull())
  const [result, setResult] = useState<StatCompareResponse | DamageCompareResponse | null>(null)
  const [calculating, setCalculating] = useState(false)

  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
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
    setSkillPct(d.skillPct)
    setWeaponType(isMage ? 'WAND' : 'BOW')
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

  const calculate = useCallback(async () => {
    if (baseStat <= 0) { setResult(null); return }
    const activeSlots = getActiveSlots()
    setCalculating(true)
    try {
      const equippedFull = activeSlots.map(s => slots[s])
      const currentSlotFull = compareSlot ? slots[compareSlot] : null

      if (mode === 1) {
        const toBasic = (item: ItemStatFull): ItemStat => ({
          flatStat: item.flatStat, statPercent: item.statPercent,
        })
        const res = await statCompare({
          baseStat,
          equippedItems: equippedFull.map(toBasic),
          currentSlotItem: currentSlotFull ? toBasic(currentSlotFull) : null,
          itemA: toBasic(itemA),
          itemB: toBasic(itemB),
        })
        setResult(res)
      } else {
        const res = await damageCompare({
          job, baseStat, subStat, weaponType, weaponAtk, atkPercent,
          blessingLevel, empressBlessingLevel, critRate, critDmgPP, skillPct,
          equippedItems: equippedFull,
          currentSlotItem: currentSlotFull,
          itemA, itemB,
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
    blessingLevel, empressBlessingLevel, critRate, critDmgPP, skillPct,
    useOverall, slots, compareSlot, itemA, itemB, getActiveSlots,
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
        blessingLevel, empressBlessingLevel, critRate, critDmgPP, skillPct,
        useOverall, slots, compareSlot, itemA, itemB,
      }
      const res = await savePreset({ nickname: nickname.trim(), password: password || undefined, config })
      setPresetMsg({ type: 'ok', text: `"${res.nickname}" 저장 완료!` })
    } catch {
      setPresetMsg({ type: 'err', text: '저장 실패. 비밀번호를 확인해주세요.' })
    }
  }

  async function handleLoad() {
    if (!nickname.trim()) { setPresetMsg({ type: 'err', text: '닉네임을 입력해주세요.' }); return }
    try {
      const res = await loadPreset({ nickname: nickname.trim(), password: password || undefined })
      const c = res.config
      setJob(c.job); setMode(c.mode); setBaseStat(c.baseStat); setSubStat(c.subStat)
      setWeaponType(c.weaponType); setWeaponAtk(c.weaponAtk); setAtkPercent(c.atkPercent)
      setBlessingLevel(c.blessingLevel); setEmPressBlessingLevel(c.empressBlessingLevel)
      if (c.critRate !== undefined) setCritRate(c.critRate)
      if (c.critDmgPP !== undefined) setCritDmgPP(c.critDmgPP)
      if (c.skillPct !== undefined) setSkillPct(c.skillPct)
      setUseOverall(c.useOverall); setSlots(c.slots); setCompareSlot(c.compareSlot)
      setItemA(c.itemA); setItemB(c.itemB)
      setPresetMsg({ type: 'ok', text: `"${res.nickname}" 불러오기 완료!` })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setPresetMsg({ type: 'err', text: msg.includes('비밀번호') ? '비밀번호가 일치하지 않습니다.' : '해당 닉네임을 찾을 수 없습니다.' })
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
  const expDiffPct = result && !isMode1Result(result) ? result.expectedDmgDiffPct : null

  const maxStat = Math.max(statA ?? 0, statB ?? 0, 1)
  const maxDmg = Math.max(dmgA ?? 0, dmgB ?? 0, 1)
  const maxMagic = Math.max(magicA ?? 0, magicB ?? 0, 1)
  const maxExp = Math.max(expA ?? 0, expB ?? 0, 1)

  const jobSlotRows = getJobSlotRows()
  const activeSlots = getActiveSlots()

  return (
    <div
      className="text-left min-h-screen"
      style={{ fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif", background: '#EDEBE6' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-black/8 px-6 py-3 flex items-center gap-6">
        <div>
          <div className="text-[11px] text-muted-foreground tracking-widest uppercase">PlanetCompare</div>
          <div className="text-lg font-semibold text-foreground leading-tight">아이템 비교기</div>
        </div>
        <Tabs value={String(mode)} onValueChange={v => setMode(Number(v) as Mode)}>
          <TabsList>
            <TabsTrigger value="1">단순 스탯 비교</TabsTrigger>
            <TabsTrigger value="2">정밀 스공 비교</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 grid grid-cols-[1fr_340px] gap-4 items-start">

        {/* ── LEFT ── */}
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-6 flex flex-col gap-6">

          {/* 캐릭터 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">캐릭터</div>
              <span className="text-xs text-muted-foreground">주스탯: {statLabel}</span>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">직업</Label>
                <Select value={job} onValueChange={setJob}>
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
                    <Label className="text-xs">크리 추가퍼뎀 (%p)</Label>
                    <NumInput value={critDmgPP} onChange={setCritDmgPP} width={72} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">스킬 퍼뎀 (%p)</Label>
                    <NumInput value={skillPct} onChange={setSkillPct} width={64} />
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

            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground mb-1">직업 부위</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1 text-left text-[11px] font-medium text-muted-foreground">슬롯</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">{statLabel}%</th>
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">깡 {statLabel}</th>
                      {mode === 2 && (
                        <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">{atkColLabel}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {jobSlotRows.map(s => (
                      <tr key={s} className="hover:bg-muted/20">
                        <td className="border border-border px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{s}</td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].statPercent} onChange={v => updateSlot(s, 'statPercent', v)} />
                        </td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].flatStat} onChange={v => updateSlot(s, 'flatStat', v)} />
                        </td>
                        {mode === 2 && (
                          <td className="border border-border px-1 py-0.5 text-center">
                            {!isMage && s === '장갑' ? (
                              <NumInput value={slots[s].flatAtk} onChange={v => updateSlot(s, 'flatAtk', v)} />
                            ) : (
                              <span className="text-xs text-muted-foreground/30">—</span>
                            )}
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
                      <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">깡 {statLabel}</th>
                      {mode === 2 && (
                        <th className="border border-border px-1 py-1 text-center text-[11px] font-medium text-muted-foreground">{atkColLabel}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {COMMON_SLOTS.map(s => (
                      <tr key={s} className="hover:bg-muted/20">
                        <td className="border border-border px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{s}</td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].statPercent} onChange={v => updateSlot(s, 'statPercent', v)} />
                        </td>
                        <td className="border border-border px-1 py-0.5 text-center">
                          <NumInput value={slots[s].flatStat} onChange={v => updateSlot(s, 'flatStat', v)} />
                        </td>
                        {mode === 2 && (
                          <td className="border border-border px-1 py-0.5 text-center">
                            {isMage && s === '귀고리' ? (
                              <NumInput value={slots[s].flatAtk} onChange={v => updateSlot(s, 'flatAtk', v)} />
                            ) : (
                              <span className="text-xs text-muted-foreground/30">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {mode === 2 && (
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">무기 종류</Label>
                  <Select value={weaponType} onValueChange={v => setWeaponType(v as WeaponType)}>
                    <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
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
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">정령의 축복</Label>
                  <NumInput value={blessingLevel} onChange={setBlessingLevel} width={60} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">여제의 축복</Label>
                  <NumInput value={empressBlessingLevel} onChange={setEmPressBlessingLevel} width={60} />
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
                <Select value={compareSlot} onValueChange={setCompareSlot}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">빈 슬롯</SelectItem>
                    {activeSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {compareSlot && (
                <span className="text-[11px] text-muted-foreground">
                  현재: {statLabel}% {slots[compareSlot].statPercent} / 깡 {slots[compareSlot].flatStat}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B'] as const).map(label => {
                const item = label === 'A' ? itemA : itemB
                const setItem = label === 'A' ? setItemA : setItemB
                const isWinner = winner === label
                const statVal = label === 'A' ? statA : statB
                return (
                  <div
                    key={label}
                    className={`border rounded-md p-3 flex flex-col gap-2 transition-colors ${isWinner ? 'border-maple bg-maple-bg' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isWinner ? 'text-maple' : 'text-foreground'}`}>
                        후보 {label} {isWinner && '👑'}
                      </span>
                      {statVal !== null && (
                        <span className={`text-xs ${isWinner ? 'text-maple' : 'text-muted-foreground'}`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {statVal.toFixed(1)} {statLabel}
                        </span>
                      )}
                    </div>

                    {/* 스탯 행 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">{statLabel}%</Label>
                        <NumInput value={item.statPercent} onChange={v => setItem({ ...item, statPercent: v })} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-[10px] text-muted-foreground">깡 {statLabel}</Label>
                        <NumInput value={item.flatStat} onChange={v => setItem({ ...item, flatStat: v })} />
                      </div>
                    </div>

                    {mode === 2 && (
                      <>
                        {/* 공격력/마력 행 */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] text-muted-foreground">{atkColLabel}</Label>
                            <NumInput value={item.flatAtk} onChange={v => setItem({ ...item, flatAtk: v })} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] text-muted-foreground">{atkColLabel}%</Label>
                            <NumInput value={item.atkPercent} onChange={v => setItem({ ...item, atkPercent: v })} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] text-muted-foreground">크확%</Label>
                            <NumInput value={item.critRateBonus} onChange={v => setItem({ ...item, critRateBonus: v })} width={48} />
                          </div>
                        </div>
                        {/* 데미지 배율 행 */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] text-muted-foreground">총뎀%</Label>
                            <NumInput value={item.totalDmgPercent} onChange={v => setItem({ ...item, totalDmgPercent: v })} width={48} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[10px] text-muted-foreground">보공%</Label>
                            <NumInput value={item.bossDmgPercent} onChange={v => setItem({ ...item, bossDmgPercent: v })} width={48} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── RIGHT: 실시간 결과 ── */}
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-5 sticky top-[60px] flex flex-col gap-4 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">실시간 결과</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${calculating ? 'border-border text-muted-foreground' : 'border-maple/40 text-maple'}`}>
              {calculating ? '계산 중…' : '● 라이브'}
            </span>
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
                {(['A', 'B'] as const).map(label => {
                  const val = label === 'A' ? statA : statB
                  const isWin = winner === label
                  return (
                    <div key={label}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>후보 {label} {isWin && '👑'}</span>
                        <span className={`text-xl font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val?.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${val !== null ? (val / maxStat) * 100 : 0}%`, background: isWin ? '#E26B2C' : '#d1d5db' }} />
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
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>후보 {label}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val.toFixed(0)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(val / maxMagic) * 100}%`, background: isWin ? '#E26B2C' : '#d1d5db' }} />
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
                      {(['A', 'B'] as const).map(label => {
                        const dmg = label === 'A' ? dmgA : dmgB
                        const isWin = winner === label
                        return (
                          <div key={label}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>후보 {label}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{dmg.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(dmg / maxDmg) * 100}%`, background: isWin ? '#E26B2C' : '#d1d5db' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 실질 데미지 (보공 + 총뎀 + 크리 기대값) */}
                  {expDiffPct !== null && expA !== null && expB !== null && (
                    <div className="border-t border-border pt-3">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        실질 데미지 (보공·총뎀·크리 반영)
                      </div>
                      {(['A', 'B'] as const).map(label => {
                        const val = label === 'A' ? expA : expB
                        const isWin = winner === label
                        return (
                          <div key={label} className="mb-1.5">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-xs font-medium ${isWin ? 'text-maple' : 'text-muted-foreground'}`}>후보 {label} {isWin && '👑'}</span>
                              <span className={`text-lg font-semibold ${isWin ? 'text-maple' : 'text-foreground'}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(val / maxExp) * 100}%`, background: isWin ? '#E26B2C' : '#d1d5db' }} />
                            </div>
                          </div>
                        )
                      })}
                      <div className={`mt-2 rounded-md px-3 py-2 text-sm font-medium ${winner === 'SAME' ? 'bg-muted/40 text-muted-foreground' : 'bg-win-bg text-foreground'}`}>
                        {winner === 'SAME' ? '두 아이템이 동일합니다' : (
                          <>후보 <span className="text-maple font-semibold">{winner}</span>가{' '}
                          <span className="text-win font-semibold">{Math.abs(expDiffPct).toFixed(2)}%</span> 더 강함</>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
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
              <input
                type="password" placeholder="비밀번호 (선택)" value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-7 w-24 min-w-0 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
