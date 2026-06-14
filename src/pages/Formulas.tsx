import { useEffect } from 'react'
import { setPageMeta } from '@/lib/seo'

export default function Formulas() {
  useEffect(() => {
    setPageMeta({
      title: '계산 방식 안내 | PlanetCompare',
      description: 'PlanetCompare의 스탯 계산, 물리 직업군 스공 산출, 마법사 데미지 스케일링, 크리티컬 기대 데미지 및 실시간 스탯 환산 메커니즘을 안내합니다.',
      path: '/formulas',
    })
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-left text-sm leading-relaxed text-foreground">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--heading)' }}>
        계산 방식 안내
      </h1>
      <p className="mb-8 text-muted-foreground">
        PlanetCompare가 장비와 버프 옵션을 분석하여 아이템 교체 효율과 스탯 환산값을 산출하는 개념적 계산 흐름을 안내합니다. 
        본 안내는 사용자의 지적재산 보호를 위해 구체적인 고유 상수나 특정 소수점 계수를 제외한 **논리적 계산 원리와 수식의 흐름**만을 다룹니다.
      </p>

      {/* 1. 스탯 계산 원리 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground border-b border-border pb-1.5">
          1. 캐릭터 최종 스탯 계산 원리
        </h2>
        <p className="mb-3 text-muted-foreground">
          캐릭터의 최종 주스탯과 부스탯은 순수 스탯(AP)과 장비에 부여된 스탯 옵션을 종합하여 연산됩니다. 
          일반적으로 아이템 비교 시 올스탯%와 올스탯 깡스탯은 각 직업군에 맞는 주스탯 및 부스탯으로 자동 변환되어 반영됩니다.
        </p>
        <div className="rounded-xl border border-border bg-slate-50 p-4 font-medium text-slate-800">
          <div className="text-xs text-muted-foreground mb-1">개념식</div>
          <div className="font-mono text-xs overflow-x-auto leading-relaxed">
            최종 스탯 = ⌊ (순수 AP 스탯 + 장비 주스탯 합계 + 장비 올스탯 합계) × (1 + (장비 주스탯% 합계 + 장비 올스탯% 합계) / 100) ⌋ + 메이플 용사 버프 증가치
          </div>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-muted-foreground">
          <li><strong>메이플 용사 보너스:</strong> 장비 스탯%의 영향을 받지 않고, 오직 캐릭터의 순수 AP 스탯과 메이플 용사 스킬 레벨에 비례하여 합산 적용됩니다.</li>
          <li><strong>부스탯 계산:</strong> 주스탯과 동일한 논리로 연산되되, 직업별 부스탯(예: 전사의 DEX, 도적의 DEX 등)에 해당하는 아이템 옵션 수치를 기준으로 별도 계산됩니다.</li>
        </ul>
      </section>

      {/* 2. 물리 직업군 스공 산출 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground border-b border-border pb-1.5">
          2. 물리 공격력 직업군 스탯 공격력 산출
        </h2>
        <p className="mb-3 text-muted-foreground">
          전사, 궁수, 도적, 해적 등 물리 공격력을 사용하는 직업군의 스탯 공격력은 최종 스탯과 캐릭터가 사용하는 무기의 배율(상수), 그리고 최종 공격력을 곱해 결정됩니다.
        </p>
        <div className="rounded-xl border border-border bg-slate-50 p-4 font-medium text-slate-800">
          <div className="text-xs text-muted-foreground mb-1">개념식</div>
          <div className="font-mono text-xs overflow-x-auto leading-relaxed">
            물리 데미지 베이스 = ⌊ (최종 주스탯 × 무기별 고유 상수 + 최종 부스탯) × 최종 공격력 / 100 ⌋
          </div>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-muted-foreground">
          <li><strong>무기별 고유 상수:</strong> 무기의 속도와 종류(한손검, 두손검, 창, 폴암, 활, 석궁, 단검, 아대, 너클, 건 등)에 따라 밸런스를 고려한 서로 다른 고유의 가중 배율이 대입됩니다.</li>
          <li><strong>공격력% 증폭:</strong> 공격력 증가 백분율(공격력%) 옵션은 캐릭터 무기의 공격력을 기준으로만 곱연산되어 반영되며, 무기 외 슬롯(장갑 등)에서 획득한 깡공격력 및 소비 아이템(표창, 화살, 불릿 등)의 공격력에는 적용되지 않습니다.</li>
          <li><strong>공격력 합산 흐름:</strong> 최종 공격력은 증폭된 무기 공격력에 무기 외 장비 공격력, 버프 공격력, 투척무기 공격력을 단순 합산하여 완성됩니다.</li>
        </ul>
      </section>

      {/* 3. 마법사 직업군 데미지 원리 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground border-b border-border pb-1.5">
          3. 마법사 직업군 총마력 및 데미지 연산
        </h2>
        <p className="mb-3 text-muted-foreground">
          마법사 직업군은 일반적인 물리 직업군과 달리 비선형 스케일링 데미지 모형을 가집니다. 
          마력의 효율이 선형적으로 증가하지 않고 마력이 증가할수록 데미지 상승폭이 가파르게 설계되어 있어, 마력 옵션의 가치가 매우 높게 평가됩니다.
        </p>
        <div className="rounded-xl border border-border bg-slate-50 p-4 font-medium text-slate-800">
          <div className="text-xs text-muted-foreground mb-1">개념식</div>
          <div className="font-mono text-xs overflow-x-auto leading-relaxed">
            최종 총마력 = (최종 INT 스탯 + 무기 마력 + 장비 마력) × (1 + 마력% / 100) + 버프 마력<br />
            마법 데미지 베이스 = f(최종 총마력) + g(최종 INT 스탯) × 스킬 계수
          </div>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-muted-foreground">
          <li><strong>비선형 스케일링 f(총마력):</strong> 총마력은 단순 일차 곱연산이 아니라 제곱 비율이 반영된 곡선형 가중치를 통과하므로 고스탯·고마력 상태일수록 공격력 상승 효율이 더욱 증가합니다.</li>
          <li><strong>마력% 증폭 범위:</strong> 물리 직업군과 다르게 마법사의 마력% 옵션은 무기 마력뿐 아니라 캐릭터의 INT 스탯 및 기타 방어구에서 얻은 마력의 합산 베이스 전체를 대상으로 증폭됩니다.</li>
        </ul>
      </section>

      {/* 4. 기대 데미지 계산 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground border-b border-border pb-1.5">
          4. 크리티컬 및 기대 데미지(총뎀/보공) 계산
        </h2>
        <p className="mb-3 text-muted-foreground">
          단순 스탯 공격력에 머무르지 않고, 실전 보스 공격 시의 최종 데미지 기대값과 장비 교체에 따른 최종 승자를 판정하기 위해 크리티컬 확률, 크리티컬 데미지, 총 데미지%, 보스 데미지%를 종합 연산합니다.
        </p>
        <div className="rounded-xl border border-border bg-slate-50 p-4 font-medium text-slate-800">
          <div className="text-xs text-muted-foreground mb-1">개념식</div>
          <div className="font-mono text-xs overflow-x-auto leading-relaxed">
            크리티컬 배율 = 1 + (크리티컬 확률 / 100) × (크리티컬 데미지 증가율 / 스킬 보정치)<br />
            일반 몬스터 기대 데미지 = 데미지 베이스 × (1 + 총 데미지% / 100) × 크리티컬 배율<br />
            보스 몬스터 기대 데미지 = 데미지 베이스 × (1 + (총 데미지% + 보스 데미지%) / 100) × 크리티컬 배율
          </div>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-muted-foreground">
          <li><strong>크리티컬 확률 상한:</strong> 크리티컬 확률은 버프 효과를 합산하여 최소 0%에서 최대 100% 범위 내에서 유효값으로 보정(Clamp)됩니다.</li>
          <li><strong>보스 공격력 승자 판정:</strong> 아이템 비교 화면에서 아이템 A와 B 중 어떤 것이 더 강한지를 결정하는 승자 판정은 항상 일반 몬스터 기준이 아닌 <strong>'보스 몬스터 기대 데미지'</strong>를 기준으로 이루어집니다.</li>
        </ul>
      </section>

      {/* 5. 스탯 환산 메커니즘 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground border-b border-border pb-1.5">
          5. 실시간 동적 스탯 환산(Stat Conversion) 메커니즘
        </h2>
        <p className="mb-3 text-muted-foreground">
          PlanetCompare가 제공하는 가장 정교한 기능인 스탯 환산은 단순히 고정된 비율로 곱해주는 일차원적 계산이 아닙니다. 
          캐릭터의 현재 장비 세팅, 레벨, 적용 중인 버프의 수준에 따라 스탯 1%나 공격력 1이 갖는 상대적 가치가 실시간으로 달라집니다.
        </p>
        <div className="rounded-xl border border-border bg-slate-50 p-4 font-medium text-slate-800">
          <div className="text-xs text-muted-foreground mb-1">수치 산출 흐름</div>
          <div className="space-y-1 font-mono text-xs leading-relaxed">
            1. 현재 내 스펙 기준의 기본 기대 데미지 산출<br />
            2. 비교 대상 옵션(예: 공격력)을 가상으로 +1 증가시킨 가상 데미지 산출<br />
            3. 증가한 가상 데미지에 도달하기 위해 필요한 순수 주스탯 증가량을 이분 탐색(Binary Search) 또는 정밀 수식 역산으로 추적<br />
            4. 해당 주스탯 요구 수치를 동적으로 매칭하여 화면에 최종 표시
          </div>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-muted-foreground">
          <li><strong>동적 밸런스 반영:</strong> 예를 들어, 현재 세팅에 공격력이 지나치게 낮고 주스탯%가 과도하게 높다면 공격력 1의 가치는 더 높은 주스탯 환산값으로 자동 책정됩니다. 반대로 공격력이 매우 높고 스탯%가 낮다면 공격력의 상대적 가치가 낮게 계산됩니다.</li>
          <li><strong>마법사 환산의 정확도:</strong> 마법사 직업군의 스탯 환산은 비선형 제곱항 공식이 포함되어 있어 수치적인 단순 나눗셈이 불가능합니다. 따라서 내부 시뮬레이션을 통해 기대 데미지의 델타값을 역산하여 오차가 없는 최적의 환산 주스탯 값을 계산해냅니다.</li>
        </ul>
      </section>
    </div>
  )
}
