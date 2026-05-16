import { useState } from 'react'
import { statCompare, type ItemStat, type StatCompareResponse } from '@/api/calculator'

const JOB_STAT: Record<string, string> = {
  전사: 'STR', 마법사: 'INT', 궁수: 'DEX', 도적: 'LUK', '해적(바이퍼)': 'STR', '해적(캡틴)': 'DEX',
}

const JOB_SLOTS = ['모자', '한벌옷', '상의', '하의', '장갑', '신발', '무기', '방패']
const COMMON_SLOTS = ['귀고리', '망토', '목걸이', '안경', '반지', '벨트', '훈장']
const ALL_SLOTS = [...JOB_SLOTS, ...COMMON_SLOTS]

const emptyItem = (): ItemStat => ({ flatStat: 0, statPercent: 0 })

const initialSlots = () =>
  Object.fromEntries(ALL_SLOTS.map(s => [s, emptyItem()])) as Record<string, ItemStat>

function SlotRow({ slotName, value, onChange }: {
  slotName: string
  value: ItemStat
  onChange: (v: ItemStat) => void
}) {
  return (
    <tr>
      <td>{slotName}</td>
      <td>
        <input type="number" min={0} value={value.statPercent} style={{ width: 60 }}
          onChange={e => onChange({ ...value, statPercent: Number(e.target.value) })} />
      </td>
      <td>
        <input type="number" min={0} value={value.flatStat} style={{ width: 60 }}
          onChange={e => onChange({ ...value, flatStat: Number(e.target.value) })} />
      </td>
    </tr>
  )
}

export default function StatCalculator() {
  const [job, setJob] = useState('궁수')
  const [baseStat, setBaseStat] = useState(0)
  const [slots, setSlots] = useState<Record<string, ItemStat>>(initialSlots)
  const [useOverall, setUseOverall] = useState(false)
  const [compareSlot, setCompareSlot] = useState('')
  const [itemA, setItemA] = useState<ItemStat>(emptyItem())
  const [itemB, setItemB] = useState<ItemStat>(emptyItem())
  const [result, setResult] = useState<StatCompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statLabel = JOB_STAT[job]

  const activeSlots = ALL_SLOTS.filter(s =>
    useOverall ? s !== '상의' && s !== '하의' : s !== '한벌옷'
  )

  function updateSlot(slotName: string, value: ItemStat) {
    setSlots(prev => ({ ...prev, [slotName]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const equippedItems = activeSlots.map(s => slots[s])
      const currentSlotItem = compareSlot ? slots[compareSlot] : null
      const res = await statCompare({ baseStat, equippedItems, currentSlotItem, itemA, itemB })
      setResult(res)
    } catch {
      setError('계산 중 오류가 발생했습니다.')
    }
  }

  const jobSlotRows = JOB_SLOTS.filter(s =>
    useOverall ? s !== '상의' && s !== '하의' : s !== '한벌옷'
  )

  return (
    <div>
      <h1>아이템 스탯 비교기</h1>
      <form onSubmit={handleSubmit}>

        {/* Step 1 */}
        <section>
          <h2>Step 1. 캐릭터 정보</h2>
          <label>직업&nbsp;
            <select value={job} onChange={e => setJob(e.target.value)}>
              {Object.keys(JOB_STAT).map(j => <option key={j}>{j}</option>)}
            </select>
          </label>
          &nbsp;&nbsp;
          <label>순수 {statLabel}&nbsp;
            <input type="number" min={0} value={baseStat}
              onChange={e => setBaseStat(Number(e.target.value))} />
          </label>
        </section>

        {/* Step 2 */}
        <section>
          <h2>Step 2. 현재 장비 {statLabel} 스탯</h2>
          <label>
            <input type="checkbox" checked={useOverall}
              onChange={e => setUseOverall(e.target.checked)} />
            &nbsp;한벌옷 착용 (상의/하의 대신)
          </label>
          <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
            <table>
              <thead>
                <tr><th>직업 부위</th><th>{statLabel}%</th><th>깡 {statLabel}</th></tr>
              </thead>
              <tbody>
                {jobSlotRows.map(s => (
                  <SlotRow key={s} slotName={s} value={slots[s]}
                    onChange={v => updateSlot(s, v)} />
                ))}
              </tbody>
            </table>
            <table>
              <thead>
                <tr><th>공용 부위</th><th>{statLabel}%</th><th>깡 {statLabel}</th></tr>
              </thead>
              <tbody>
                {COMMON_SLOTS.map(s => (
                  <SlotRow key={s} slotName={s} value={slots[s]}
                    onChange={v => updateSlot(s, v)} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 3 */}
        <section>
          <h2>Step 3. 교체할 슬롯 선택</h2>
          <label>교체 슬롯&nbsp;
            <select value={compareSlot} onChange={e => setCompareSlot(e.target.value)}>
              <option value="">빈 슬롯 (새로 착용)</option>
              {activeSlots.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          {compareSlot && (
            <p style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
              현재 {compareSlot}: 깡{statLabel} {slots[compareSlot].flatStat} / {statLabel}% {slots[compareSlot].statPercent}
            </p>
          )}
        </section>

        {/* Step 4 */}
        <section>
          <h2>Step 4. 비교 아이템</h2>
          <table>
            <thead>
              <tr><th></th><th>깡 {statLabel}</th><th>{statLabel}%</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>후보 A</td>
                <td><input type="number" min={0} value={itemA.flatStat}
                  onChange={e => setItemA({ ...itemA, flatStat: Number(e.target.value) })} /></td>
                <td><input type="number" min={0} value={itemA.statPercent}
                  onChange={e => setItemA({ ...itemA, statPercent: Number(e.target.value) })} /></td>
              </tr>
              <tr>
                <td>후보 B</td>
                <td><input type="number" min={0} value={itemB.flatStat}
                  onChange={e => setItemB({ ...itemB, flatStat: Number(e.target.value) })} /></td>
                <td><input type="number" min={0} value={itemB.statPercent}
                  onChange={e => setItemB({ ...itemB, statPercent: Number(e.target.value) })} /></td>
              </tr>
            </tbody>
          </table>
        </section>

        <button type="submit">비교하기</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <section>
          <h2>결과</h2>
          <p>후보 A 최종 {statLabel}: <strong>{result.statWithItemA.toFixed(1)}</strong></p>
          <p>후보 B 최종 {statLabel}: <strong>{result.statWithItemB.toFixed(1)}</strong></p>
          <p>
            {result.betterItem === 'SAME'
              ? '두 아이템이 동일합니다'
              : `👑 후보 ${result.betterItem}가 ${statLabel} ${Math.abs(result.difference).toFixed(1)} 더 높습니다`}
          </p>
        </section>
      )}
    </div>
  )
}
