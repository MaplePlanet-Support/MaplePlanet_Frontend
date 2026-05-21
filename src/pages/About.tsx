import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const guideSteps = [
  {
    no: '1',
    title: '직업과 순수 스탯을 입력합니다',
    src: '/guide/user/01-character.png',
    imageClass: 'max-w-[560px]',
    desc: '레벨업으로 찍은 순수 주스탯과 부스탯을 먼저 입력합니다. 장비나 버프가 적용된 최종 스탯이 아니라 AP로 찍은 기본 스탯 기준입니다.',
  },
  {
    no: '2',
    title: '현재 장비 스탯을 입력합니다',
    src: '/guide/user/02-equipment.png',
    imageClass: 'max-w-[650px]',
    desc: '현재 착용 중인 장비의 깡스탯, 스탯%, 올스탯%, 마력/공격력을 슬롯별로 입력합니다. 한벌옷을 쓰고 있다면 한벌옷 착용을 체크합니다.',
  },
  {
    no: '3',
    title: '무기 정보를 입력합니다',
    src: '/guide/user/03-weapon.png',
    imageClass: 'max-w-[760px]',
    desc: '무기 종류를 선택하고 현재 무기의 공격력 또는 마력, 스탯, 잠재 옵션을 입력합니다. 마법사는 완드/스태프와 마력 기준으로 계산됩니다.',
  },
  {
    no: '4',
    title: '사용 중인 버프를 맞춥니다',
    src: '/guide/user/04-buffs.png',
    imageClass: 'max-w-[340px]',
    desc: '비교하려는 상황에서 실제로 켜는 버프를 입력합니다. 만렙 버튼을 쓰면 주요 버프를 빠르게 입력할 수 있습니다.',
  },
  {
    no: '5',
    title: '비교 아이템을 입력합니다',
    src: '/guide/user/05-compare-item.png',
    imageClass: 'max-w-[860px]',
    desc: '교체할 슬롯을 고르고 후보 아이템의 옵션을 입력합니다. 무기 비교라면 비교 무기의 종류와 공격력/마력, 보공, 총뎀도 함께 입력합니다.',
  },
  {
    no: '6',
    title: '결과를 확인합니다',
    src: '/guide/user/06-result.png',
    imageClass: 'max-w-[340px]',
    desc: '오른쪽 결과에서 현재 아이템과 비교 아이템의 주스탯, 총마력/스공, 실질 데미지를 확인합니다. 초록색 플러스 값은 비교 아이템이 더 좋은 경우입니다.',
  },
  {
    no: '7',
    title: '스탯 환산을 참고합니다',
    src: '/guide/user/07-conversion.png',
    imageClass: 'max-w-[340px]',
    desc: '공격력, 마력, 보공, 총뎀, 올스탯 같은 옵션이 현재 캐릭터 기준으로 주스탯 몇 정도인지 확인할 수 있습니다.',
  },
  {
    no: '8',
    title: 'AP 재분배를 확인합니다',
    src: '/guide/user/08-ap-redistribution.png',
    imageClass: 'max-w-[880px]',
    desc: '아이템 교체로 부스탯 요구치가 줄어드는 경우, 남는 AP를 주스탯으로 얼마나 옮길 수 있는지 확인합니다.',
  },
]

const features = [
  { label: '아이템 비교', desc: '장비 교체 효율을 수치로 확인' },
  { label: '스탯 환산', desc: '옵션별 주스탯 환산값 계산' },
  { label: 'AP 재분배', desc: '아이템 교체 후 AP 최적화' },
  { label: '버프 반영', desc: '실전 버프 조건 그대로 적용' },
]

export default function About() {
  useEffect(() => {
    document.title = '소개/가이드 | 메이플 플래닛 아이템 비교 PlanetCompare'
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        'PlanetCompare 사용 가이드입니다. 메이플 플래닛 아이템 비교, 환산 계산, 버프 설정, AP 재분배 시뮬레이터 사용 방법을 안내합니다.',
      )
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-left">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] px-4 py-14 text-white sm:px-6 sm:py-20">
        {/* 배경 장식 원 */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl">
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest text-white/90 backdrop-blur-sm">
            PlanetCompare · 소개 &amp; 가이드
          </span>
          <h1
            className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--heading)', fontWeight: 800, margin: '16px 0 0', letterSpacing: '-0.03em' }}
          >
            메이플 플래닛<br />아이템 비교 계산기
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
            PlanetCompare는 메이플 플래닛 아이템 비교와 환산 계산을 도와주는 비공식 계산기입니다.
            현재 장비와 비교 아이템을 같은 조건에서 계산해 <strong className="font-semibold text-white">주스탯 · 총마력/스공 · 실질 데미지 차이</strong>를 한눈에 확인할 수 있습니다.
          </p>

          {/* Feature chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {features.map(f => (
              <div
                key={f.label}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm"
              >
                <div className="text-sm font-semibold text-white">{f.label}</div>
                <div className="text-xs text-blue-200">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
            >
              계산기 바로 사용하기
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* 사용 순서 목차 */}
        <section className="rounded-2xl border border-black/8 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-maple/10">
              <svg className="h-5 w-5 text-maple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--heading)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}
            >
              사용 순서
            </h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            처음 한 번만 현재 장비를 채워두면 이후에는 비교 아이템만 바꿔가며 확인하기 편합니다.
          </p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-2">
            {guideSteps.map(step => (
              <li key={step.no}>
                <a
                  href={`#guide-${step.no}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-maple/5 hover:text-maple"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-maple/10 text-xs font-bold text-maple">
                    {step.no}
                  </span>
                  <span className="text-muted-foreground hover:text-maple">{step.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        {/* 단계별 가이드 */}
        <section className="mt-6 grid gap-5">
          {guideSteps.map((step, idx) => (
            <article
              id={`guide-${step.no}`}
              key={step.no}
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm"
            >
              {/* 카드 헤더 */}
              <div className="flex items-start gap-4 border-b border-black/6 bg-gradient-to-r from-maple/4 to-transparent px-6 py-5 sm:px-8">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-maple text-white shadow-md shadow-maple/30">
                  <span className="text-[10px] font-semibold leading-none opacity-80">STEP</span>
                  <span className="text-lg font-bold leading-tight">{step.no}</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-lg font-bold text-foreground sm:text-xl"
                      style={{ fontFamily: 'var(--heading)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}
                    >
                      {step.title}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </div>

              {/* 이미지 영역 */}
              <div className="flex items-center justify-center bg-[#F8FAFC] p-5 sm:p-6">
                <div className="overflow-hidden rounded-xl border border-black/8 bg-white shadow-sm">
                  <img
                    src={step.src}
                    alt={`${step.title} 예시 화면`}
                    className={`${step.imageClass} h-auto w-auto max-w-full`}
                    loading={idx < 2 ? 'eager' : 'lazy'}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* 문의 섹션 */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
          <div className="border-b border-black/6 bg-gradient-to-r from-slate-50 to-transparent px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2
                className="text-lg font-bold text-foreground"
                style={{ fontFamily: 'var(--heading)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}
              >
                문의
              </h2>
            </div>
          </div>
          <div className="px-6 py-5 sm:px-8">
            <p className="text-sm leading-7 text-muted-foreground">
              계산식 오류나 개선 제안이 있으면 이메일로 알려주세요.{' '}
              <a
                href="mailto:tjdwkddl@gmail.com"
                className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 font-semibold text-foreground underline-offset-2 hover:underline"
              >
                tjdwkddl@gmail.com
              </a>
            </p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700 border border-amber-100">
              이 사이트는 게임사와 공식 제휴된 서비스가 아니며, 메이플 플래닛 유저 편의를 위해 만든 비공식 도구입니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
