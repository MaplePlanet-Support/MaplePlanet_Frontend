import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif" }}>
      <header className="border-b border-black/8 bg-white sticky top-0 z-50">
        <nav className="flex items-center gap-1 px-6 h-11">
          <NavLink
            to="/"
            className="mr-4 text-sm font-bold text-foreground hover:text-maple transition-colors"
          >
            🍁 PlanetCompare
          </NavLink>
          {[
            { to: '/compare', label: '아이템 비교기' },
            { to: '/calculator/damage', label: '스공 계산기' },
            { to: '/simulator/scroll', label: '혼돈의 주문서' },
            { to: '/simulator/cube', label: '큐브' },
            { to: '/simulator/maker', label: '메이커' },
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
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
