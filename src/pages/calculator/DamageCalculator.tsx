import { useState } from 'react'
import { calcDamage, WEAPON_OPTIONS, type WeaponType, type DamageCalcResponse } from '@/api/calculator'

export default function DamageCalculator() {
  const [mainStat, setMainStat] = useState(0)
  const [subStat, setSubStat] = useState(0)
  const [weaponType, setWeaponType] = useState<WeaponType>('ONE_HAND_SWORD')
  const [weaponAtk, setWeaponAtk] = useState(0)
  const [equipAtk, setEquipAtk] = useState(0)
  const [atkPercent, setAtkPercent] = useState(0)
  const [blessingLevel, setBlessingLevel] = useState(0)
  const [empressBlessingLevel, setEmPressBlessingLevel] = useState(0)
  const [result, setResult] = useState<DamageCalcResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await calcDamage({
        mainStat, subStat, weaponType,
        weaponAtk, equipAtk, atkPercent,
        blessingLevel, empressBlessingLevel,
      })
      setResult(res)
    } catch {
      setError('계산 중 오류가 발생했습니다.')
    }
  }

  return (
    <div>
      <h1>스공 계산기</h1>
      <form onSubmit={handleSubmit}>

        <section>
          <h2>캐릭터 스탯</h2>
          <table>
            <tbody>
              <tr>
                <td>주스탯</td>
                <td><input type="number" min={0} value={mainStat} onChange={e => setMainStat(Number(e.target.value))} /></td>
              </tr>
              <tr>
                <td>부스탯</td>
                <td><input type="number" min={0} value={subStat} onChange={e => setSubStat(Number(e.target.value))} /></td>
              </tr>
              <tr>
                <td>무기 종류</td>
                <td>
                  <select value={weaponType} onChange={e => setWeaponType(e.target.value as WeaponType)}>
                    {WEAPON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>공격력</h2>
          <table>
            <tbody>
              <tr>
                <td>무기 공격력</td>
                <td><input type="number" min={0} value={weaponAtk} onChange={e => setWeaponAtk(Number(e.target.value))} /></td>
              </tr>
              <tr>
                <td>장비 공격력 합 (무기 제외)</td>
                <td><input type="number" min={0} value={equipAtk} onChange={e => setEquipAtk(Number(e.target.value))} /></td>
              </tr>
              <tr>
                <td>공격력%</td>
                <td><input type="number" min={0} value={atkPercent} onChange={e => setAtkPercent(Number(e.target.value))} /></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>버프</h2>
          <table>
            <tbody>
              <tr>
                <td>정령의 축복 레벨</td>
                <td><input type="number" min={0} value={blessingLevel} onChange={e => setBlessingLevel(Number(e.target.value))} /></td>
                <td style={{ color: '#888', fontSize: 13 }}>공격력 +{blessingLevel}</td>
              </tr>
              <tr>
                <td>여제의 축복 레벨</td>
                <td><input type="number" min={0} value={empressBlessingLevel} onChange={e => setEmPressBlessingLevel(Number(e.target.value))} /></td>
                <td style={{ color: '#888', fontSize: 13 }}>공격력 +{empressBlessingLevel}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <button type="submit">계산하기</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <section>
          <h2>결과</h2>
          <table>
            <tbody>
              <tr><td>정령의 축복 공격력 기여</td><td><strong>+{result.blessingAtk}</strong></td></tr>
              <tr><td>여제의 축복 공격력 기여</td><td><strong>+{result.empressBlessingAtk}</strong></td></tr>
              <tr><td>총 공격력</td><td><strong>{result.totalAtk}</strong></td></tr>
              <tr><td>스공 (최대)</td><td><strong>{result.damage.toFixed(1)}</strong></td></tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
