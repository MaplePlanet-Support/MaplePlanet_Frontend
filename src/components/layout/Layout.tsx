import { Outlet, NavLink } from 'react-router-dom'

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
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
