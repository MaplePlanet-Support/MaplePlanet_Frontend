import { useEffect } from 'react'

export default function About() {
  useEffect(() => {
    document.title = '서비스 소개 | 메이플 플래닛 아이템 비교 PlanetCompare'
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        'PlanetCompare는 메이플 플래닛 아이템 비교, 환산 계산, 장비 교체 효율 확인을 돕는 비공식 웹 도구입니다.',
      )
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-sm text-foreground leading-relaxed">
      <h1 className="text-2xl font-bold mb-6">서비스 소개</h1>

      <section className="mb-7">
        <h2 className="text-base font-semibold mb-2">PlanetCompare는 어떤 서비스인가요?</h2>
        <p className="text-muted-foreground">
          PlanetCompare는 메이플 플래닛 아이템 비교와 환산 계산을 빠르게 확인하기 위한 비공식 팬 도구입니다.
          장착 중인 아이템과 비교 아이템의 주스탯, 부스탯, 공격력, 마력, 보스 공격력, 총 데미지, 크리티컬 확률을 입력하면
          스공과 실제 데미지 기준 차이를 계산합니다.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-base font-semibold mb-2">제공하는 기능</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>메이플 플래닛 아이템 비교: 현재 장비와 교체 후보 장비의 효율 비교</li>
          <li>메이플 플래닛 환산: 공격력, 보공, 총뎀, 올스탯 옵션의 스탯 환산값 확인</li>
          <li>직업별 주스탯과 부스탯, 무기 타입, 표창·불릿·화살 공격력 반영</li>
          <li>메이플 용사, 분노, 메디테이션, 샤프 아이즈 등 주요 버프 반영</li>
          <li>프리셋 저장과 불러오기를 통한 반복 계산 지원</li>
        </ul>
      </section>

      <section className="mb-7">
        <h2 className="text-base font-semibold mb-2">운영 및 문의</h2>
        <p className="text-muted-foreground">
          계산식은 검증 가능한 수치와 사용자 피드백을 바탕으로 계속 개선됩니다.
          오류 제보, 기능 제안, 개인정보 관련 문의는 이메일로 연락해 주세요.
        </p>
        <p className="mt-2">
          <a href="mailto:tjdwkddl@gmail.com" className="text-foreground underline">tjdwkddl@gmail.com</a>
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        PlanetCompare는 게임사와 공식 제휴된 서비스가 아니며, 메이플 플래닛 유저 편의를 위해 제작된 비공식 계산 도구입니다.
      </p>
    </div>
  )
}
