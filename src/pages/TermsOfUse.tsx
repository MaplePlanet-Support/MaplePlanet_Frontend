import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '@/lib/seo'

export default function TermsOfUse() {
  useEffect(() => {
    setPageMeta({
      title: '이용 안내 | PlanetCompare',
      description: 'PlanetCompare 이용 안내입니다. 메이플 플래닛 아이템 비교 계산기 사용 전 가이드, 프리셋 저장, 문의 게시판 이용 방법을 안내합니다.',
      path: '/terms',
    })
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="mb-6 text-2xl font-bold">이용 안내</h1>

      <section className="mb-6 rounded-xl border border-maple/15 bg-maple-bg p-5">
        <h2 className="mb-2 text-base font-semibold">처음이라면 가이드부터 확인해 주세요</h2>
        <p className="mb-4 text-muted-foreground">
          PlanetCompare는 입력값이 많은 계산기라서, 처음 사용할 때는 단계별 사용 가이드를 보는 편이 빠릅니다.
          직업 선택, 현재 장비 입력, 비교 아이템 입력, 결과 확인, AP 재분배까지 예시 화면으로 정리해 두었습니다.
        </p>
        <Link
          to="/about"
          className="inline-flex h-9 items-center rounded-md bg-maple px-4 text-xs font-semibold text-white hover:bg-maple/90"
        >
          소개/가이드 보기
        </Link>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">1. 프리셋 저장</h2>
        <p className="text-muted-foreground">
          닉네임과 저장 코드로 현재 입력값을 저장하고 다시 불러올 수 있습니다.
          저장 코드는 다른 사이트에서 쓰는 비밀번호와 다르게 설정하는 것을 권장합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">2. 문의 게시판</h2>
        <p className="text-muted-foreground">
          계산 결과가 이상하거나 화면 오류가 있으면 문의 게시판에 제목, 내용, 이미지를 남길 수 있습니다.
          저장 코드를 함께 입력하면 운영자가 같은 프리셋 세팅을 확인하면서 문제를 재현할 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">3. 비공식 팬 도구</h2>
        <p className="text-muted-foreground">
          PlanetCompare는 메이플 플래닛 유저 편의를 위해 만든 비공식 도구입니다.
          게임명, 아이템명, 이미지 등 관련 권리는 각 권리자에게 있습니다.
        </p>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">최종 수정일: 2026년 5월 29일</p>
    </div>
  )
}
