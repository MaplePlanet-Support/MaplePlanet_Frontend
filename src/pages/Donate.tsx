import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Copy, Check, Coins } from 'lucide-react'
import { setPageMeta } from '@/lib/seo'

export default function Donate() {
  const [copied, setCopied] = useState(false)
  const accountNumber = '3511079751333'

  useEffect(() => {
    setPageMeta({
      title: '후원하기 | 메이플 플래닛 아이템 비교 PlanetCompare',
      description: 'PlanetCompare 서버비 충당을 위한 후원 페이지입니다. 유저 여러분의 소중한 후원으로 서비스를 안정적으로 유지합니다.',
      path: '/donate',
    })
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (err) {
      console.error('계좌번호 복사에 실패했습니다.', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-left">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maple via-[#e05300] to-[#ff9244] px-4 py-14 text-white sm:px-6 sm:py-20">
        {/* 배경 장식 원 */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest text-white/90 backdrop-blur-sm">
            <Heart className="h-3 w-3 fill-current text-white" /> PlanetCompare · 후원
          </span>
          <h1
            className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--heading)', fontWeight: 800, margin: '16px 0 0', letterSpacing: '-0.03em' }}
          >
            안정적인 서비스 유지를 위해<br />후원을 기다립니다
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-orange-100 sm:text-lg">
            PlanetCompare는 메이플 플래닛 유저 여러분의 편의를 위해 제작된 비공식 도구입니다.<br />
            보내주시는 소중한 후원금은 서비스의 원활한 서버비 충당을 위해 전액 사용됩니다.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {/* 후원 취지 설명 카드 */}
          <section className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                <Coins className="h-5 w-5 text-maple" />
              </div>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: 'var(--heading)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}
              >
                후원 목적
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              PlanetCompare는 백엔드 서버 구동, DB 운영 및 호스팅 등 매달 고정적인 서버 비용이 발생하고 있습니다.
              광고 수익이 없거나 부족한 상태에서 개인 비용으로 서비스를 감당하기에 다소 어려움이 있어,
              부득이하게 <strong>서버비 충당 목적의 후원</strong>을 요청드리게 되었습니다.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              여러분의 작지만 소중한 보탬은 사이트가 중단되지 않고 안정적으로 유지되는 데 아주 큰 힘이 됩니다. 
              더욱 쾌적하고 정확한 서비스를 위해 최선을 다해 운영하겠습니다.
            </p>
          </section>

          {/* 계좌 정보 카드 */}
          <section className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
            <div className="border-b border-black/6 bg-gradient-to-r from-orange-50 to-transparent px-6 py-5 sm:px-8">
              <h3 className="text-sm font-semibold tracking-wider text-orange-700 uppercase">
                후원 계좌 정보
              </h3>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded bg-[#03643b] px-2.5 py-0.5 text-xs font-semibold text-white">
                      NH농협은행
                    </span>
                    <span className="text-lg font-bold text-foreground sm:text-xl">
                      {accountNumber}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    예금주: <span className="font-semibold text-foreground">임재모</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
                    copied
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                      : 'bg-maple text-white shadow-md shadow-maple/30 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-600/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      계좌번호 복사하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 감사의 메시지 및 홈 이동 */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              항상 저희 서비스를 이용해 주시고 응원해 주셔서 진심으로 감사드립니다.
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-black/8 bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-slate-50"
              >
                메인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
