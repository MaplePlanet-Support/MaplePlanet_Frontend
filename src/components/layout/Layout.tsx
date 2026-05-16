import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div>
      <header>
        <nav>
          <NavLink to="/">메이플 플래닛</NavLink>
          <NavLink to="/calculator">스탯 비교기</NavLink>
          <NavLink to="/calculator/damage">스공 계산기</NavLink>
          <NavLink to="/simulator/scroll">혼돈의 주문서</NavLink>
          <NavLink to="/simulator/cube">큐브</NavLink>
          <NavLink to="/simulator/maker">메이커</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
