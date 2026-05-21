import { Outlet, NavLink, Link } from 'react-router-dom'

export default function Layout() {

  return (
    <div style={{ fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif" }}>
      <header className="border-b border-black/8 bg-white sticky top-0 z-50">
        <nav className="flex h-16 items-center gap-1 overflow-x-auto px-3 sm:px-6">
          <NavLink
            to="/"
            className="mr-3 flex h-16 shrink-0 items-center sm:mr-6"
            aria-label="플래닛 컴페어 홈"
          >
            <img src="/logo.png" alt="플래닛 컴페어" className="h-11 w-auto sm:h-14" />
          </NavLink>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-1 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-maple text-white font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`
            }
          >
            아이템 비교
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3 py-1 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-maple text-white font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`
            }
          >
            소개
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-8 border-t border-black/8 bg-white px-6 py-4 text-center text-xs text-muted-foreground">
        건의사항은 이메일로 문의해 주세요 —{' '}
        <a href="mailto:tjdwkddl@gmail.com" className="text-foreground hover:underline">tjdwkddl@gmail.com</a>
        <span className="mx-2">·</span>
        <Link to="/about" className="hover:underline">서비스 소개</Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:underline">개인정보처리방침</Link>
      </footer>
    </div>
  )
}
