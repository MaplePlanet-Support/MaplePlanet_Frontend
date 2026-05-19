import { useState } from 'react'
import {
  calcDamage, MAGE_WEAPON_OPTIONS, WEAPON_OPTIONS,
  type WeaponType, type DamageCalcResponse,
} from '@/api/calculator'

const ALL_WEAPON_OPTIONS = [...WEAPON_OPTIONS, ...MAGE_WEAPON_OPTIONS]

const JOB_DEFAULT_WEAPON: Record<string, WeaponType> = {
  전사: 'TWO_HAND_SWORD',
  마법사: 'STAFF',
  궁수: 'BOW',
  도적: 'CLAW',
  '해적(바이퍼)': 'KNUCKLE',
  '해적(캡틴)': 'GUN',
}

const JOB_WEAPONS: Record<string, WeaponType[]> = {
  전사: ['ONE_HAND_SWORD', 'ONE_HAND_AXE', 'ONE_HAND_BLUNT', 'TWO_HAND_SWORD', 'TWO_HAND_AXE', 'TWO_HAND_BLUNT', 'SPEAR', 'POLEARM'],
  마법사: ['WAND', 'STAFF'],
  궁수: ['BOW', 'CROSSBOW'],
  도적: ['DAGGER', 'CLAW'],
  '해적(바이퍼)': ['KNUCKLE'],
  '해적(캡틴)': ['GUN'],
}

const JOB_OPTIONS = Object.keys(JOB_DEFAULT_WEAPON)

function levelValue(value: number, max: number) {
  return Math.max(0, Math.min(max, value))
}

function NumInput({
  value, onChange, width = 76,
}: {
  value: number
  onChange: (v: number) => void
  width?: number
}) {
  return (
    <input
      type="number"
      min={0}
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      style={{ width, fontFamily: "'JetBrains Mono', monospace" }}
      className="h-8 rounded border border-border bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

function BuffLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={`/buffs/${icon}`} alt="" className="h-5 w-5" />
      {children}
    </span>
  )
}

export default function DamageCalculator() {
  const [job, setJob] = useState('전사')
  const [mainStat, setMainStat] = useState(0)
  const [subStat, setSubStat] = useState(0)
  const [weaponType, setWeaponType] = useState<WeaponType>('ONE_HAND_SWORD')
  const [weaponAtk, setWeaponAtk] = useState(0)
  const [equipAtk, setEquipAtk] = useState(0)
  const [atkPercent, setAtkPercent] = useState(0)
  const [blessingLevel, setBlessingLevel] = useState(0)
  const [empressBlessingLevel, setEmPressBlessingLevel] = useState(0)
  const [mapleWarriorLevel, setMapleWarriorLevel] = useState(0)
  const [meditationLevel, setMeditationLevel] = useState(0)
  const [rageLevel, setRageLevel] = useState(0)
  const [sharpEyesLevel, setSharpEyesLevel] = useState(0)
  const [decentSharpEyes, setDecentSharpEyes] = useState(false)
  const [babyDragonFood, setBabyDragonFood] = useState(false)
  const [result, setResult] = useState<DamageCalcResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)
  const isMagicWeapon = weaponType === 'WAND' || weaponType === 'STAFF'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCalculating(true)
    try {
      const res = await calcDamage({
        mainStat, subStat, weaponType,
        weaponAtk, equipAtk, atkPercent,
        blessingLevel, empressBlessingLevel,
        mapleWarriorLevel, meditationLevel, rageLevel,
        sharpEyesLevel, decentSharpEyes, babyDragonFood,
      })
      setResult(res)
    } catch {
      setError('계산 중 오류가 발생했습니다.')
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div
      className="min-h-screen text-left"
      style={{ fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif", background: '#EEF2F7' }}
    >
      <div className="bg-white border-b border-black/8 px-6 py-3">
        <div className="text-[11px] text-muted-foreground tracking-widest uppercase">PlanetCompare</div>
        <div className="text-lg font-semibold text-foreground leading-tight">스공 계산기</div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-4 lg:items-start">
        <div className="bg-white rounded-xl border border-black/8 shadow-sm p-3 sm:p-6 flex flex-col gap-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">캐릭터 스탯</div>
              <span className="text-xs text-muted-foreground">주/부스탯 직접 입력</span>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">직업</label>
                <select
                  value={job}
                  onChange={e => {
                    const nextJob = e.target.value
                    setJob(nextJob)
                    setWeaponType(JOB_DEFAULT_WEAPON[nextJob])
                  }}
                  className="h-8 w-32 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {JOB_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">주스탯</label>
                <NumInput value={mainStat} onChange={setMainStat} width={92} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">부스탯</label>
                <NumInput value={subStat} onChange={setSubStat} width={92} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">무기 종류</label>
                <select
                  value={weaponType}
                  onChange={e => setWeaponType(e.target.value as WeaponType)}
                  className="h-8 w-32 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_WEAPON_OPTIONS.filter(o => JOB_WEAPONS[job]?.includes(o.value)).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isMagicWeapon ? '마력' : '공격력'}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <label className="mb-1 block text-xs text-muted-foreground">{isMagicWeapon ? '무기 마력' : '무기 공격력'}</label>
                <NumInput value={weaponAtk} onChange={setWeaponAtk} width={88} />
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <label className="mb-1 block text-xs text-muted-foreground">{isMagicWeapon ? '장비 마력 합' : '장비 공격력 합'}</label>
                <NumInput value={equipAtk} onChange={setEquipAtk} width={88} />
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <label className="mb-1 block text-xs text-muted-foreground">{isMagicWeapon ? '마력%' : '공격력%'}</label>
                <NumInput value={atkPercent} onChange={setAtkPercent} width={88} />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">버프</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { icon: '정령의축복.png', label: '정령의 축복', value: blessingLevel, max: 20, set: setBlessingLevel, hint: `공 +${blessingLevel} / 마 +${blessingLevel * 2}` },
                { icon: '여신의축복.png', label: '여신의 축복', value: empressBlessingLevel, max: 12, set: setEmPressBlessingLevel, hint: `공 +${empressBlessingLevel} / 마 +${empressBlessingLevel * 2}` },
                { icon: '메이플용사.png', label: '메용', value: mapleWarriorLevel, max: 30, set: setMapleWarriorLevel, hint: `주스탯 +${Math.floor((mapleWarriorLevel + 1) / 2)}%` },
                { icon: '메디테이션.png', label: '메디테이션', value: meditationLevel, max: 20, set: setMeditationLevel, hint: `마 +${meditationLevel}` },
              ].map(buff => (
                <div key={buff.label} className="rounded-md border border-border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="text-xs text-muted-foreground"><BuffLabel icon={buff.icon}>{buff.label}</BuffLabel></label>
                    <button type="button" onClick={() => buff.set(buff.max)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <NumInput value={buff.value} onChange={v => buff.set(levelValue(v, buff.max))} width={60} />
                    <span className="text-[11px] text-muted-foreground">{buff.hint}</span>
                  </div>
                </div>
              ))}

              <div className="rounded-md border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="text-xs text-muted-foreground"><BuffLabel icon="분노.png">분노</BuffLabel></label>
                  <button type="button" onClick={() => setRageLevelSafe(20)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <NumInput value={rageLevel} onChange={setRageLevelSafe} width={60} />
                  <span className="text-[11px] text-muted-foreground">공 +{rageLevel <= 16 ? Math.floor((rageLevel + 1) / 2) : 8 + (rageLevel - 16)}</span>
                </div>
              </div>

              <div className="rounded-md border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="text-xs text-muted-foreground"><BuffLabel icon="샤프아이즈.png">샤프아이즈</BuffLabel></label>
                  <button type="button" onClick={() => setSharpEyesLevelSafe(30)} className="text-[10px] font-medium text-maple hover:underline">만렙</button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <NumInput value={sharpEyesLevel} onChange={setSharpEyesLevelSafe} width={60} />
                  <span className="text-[11px] text-muted-foreground">크확 +{sharpEyesLevel === 0 ? 0 : Math.floor((sharpEyesLevel + 1) / 2)}%</span>
                </div>
              </div>

              <label className="rounded-md border border-border p-3 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={decentSharpEyes} onChange={e => setDecentSharpEyesSafe(e.target.checked)} />
                <BuffLabel icon="샤프아이즈.png">쓸만한 샤프아이즈</BuffLabel>
              </label>
              <label className="rounded-md border border-border p-3 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={babyDragonFood} onChange={e => setBabyDragonFoodSafe(e.target.checked)} />
                <BuffLabel icon="아기용의 이유식.png">아기용의 이유식</BuffLabel>
              </label>
            </div>
          </section>
        </div>

        <aside className="bg-white rounded-xl border border-black/8 shadow-sm p-4 sm:p-5 lg:sticky lg:top-[72px] flex flex-col gap-4 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">계산 결과</span>
            {calculating && <span className="text-[11px] text-muted-foreground">계산 중…</span>}
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-lose">{error}</p>}

          {!result ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              값을 입력하고 계산하면<br />결과가 여기에 표시됩니다.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{isMagicWeapon ? '총 마력' : '총 공격력'}</div>
                <div className="mt-1 text-3xl font-semibold text-maple" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {isMagicWeapon ? result.totalMagic : result.totalAtk}
                </div>
              </div>
              {!isMagicWeapon && (
                <div className="border-t border-border pt-3">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">스공</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {result.damage.toFixed(1)}
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">버프 공</span><strong className="ml-2">+{result.buffAtk}</strong></div>
                <div><span className="text-muted-foreground">버프 마</span><strong className="ml-2">+{result.buffMagic}</strong></div>
                <div><span className="text-muted-foreground">메용 스탯</span><strong className="ml-2">{result.mapleWarriorStat.toFixed(0)}</strong></div>
                <div><span className="text-muted-foreground">크확</span><strong className="ml-2">+{result.critRate}%</strong></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="h-9 rounded bg-maple text-white text-sm font-medium hover:bg-maple/90 transition-colors"
          >
            계산하기
          </button>
        </aside>
      </form>
    </div>
  )
}
