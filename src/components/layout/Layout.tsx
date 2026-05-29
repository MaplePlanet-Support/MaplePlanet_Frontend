import { Outlet, NavLink, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <header className="sticky top-0 z-50 border-b border-black/8 bg-white/90 backdrop-blur-md">
        <nav className="flex h-16 items-center gap-1 overflow-x-auto px-3 sm:px-6">
          <NavLink
            to="/"
            className="mr-4 flex h-16 shrink-0 items-center sm:mr-6"
            aria-label="플래닛 컴페어 홈"
          >
            <img src="/logo.png" alt="플래닛 컴페어" className="h-10 w-auto sm:h-12" />
          </NavLink>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-maple text-white shadow-sm shadow-maple/30'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
              }`
            }
          >
            아이템 비교
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-maple text-white shadow-sm shadow-maple/30'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
              }`
            }
          >
            소개/가이드
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-maple text-white shadow-sm shadow-maple/30'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
              }`
            }
          >
            문의
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-10 border-t border-black/8 bg-white px-6 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          건의사항은 이메일로 문의해 주세요 —{' '}
          <a href="mailto:tjdwkddl@gmail.com" className="text-foreground hover:underline">
            tjdwkddl@gmail.com
          </a>
          <span className="mx-2 opacity-40">·</span>
          <Link to="/about" className="hover:underline">소개/가이드</Link>
          <span className="mx-2 opacity-40">·</span>
          <Link to="/contact" className="hover:underline">문의</Link>
          <span className="mx-2 opacity-40">·</span>
          <Link to="/terms" className="hover:underline">이용 안내</Link>
          <span className="mx-2 opacity-40">·</span>
          <Link to="/privacy" className="hover:underline">개인정보처리방침</Link>
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          PlanetCompare는 메이플 플래닛 비공식 팬 도구입니다.
        </p>
      </footer>
    </div>
  )
}
