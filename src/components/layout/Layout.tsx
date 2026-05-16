import { Outlet, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Layout() {
  const [toast, setToast] = useState<string | null>(null)

  function showUnimplemented() {
    setToast('아직 미구현 기능입니다.')
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

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
          {[
            { to: '/', label: '아이템 비교' },
            { to: '/calculator/damage', label: '스공 계산기' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-maple text-white font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {['혼돈의 주문서', '큐브', '메이커'].map(label => (
            <button
              key={label}
              type="button"
              onClick={showUnimplemented}
              className="px-3 py-1 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      {toast && (
        <div className="fixed right-5 bottom-5 z-[100] rounded-md border border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
