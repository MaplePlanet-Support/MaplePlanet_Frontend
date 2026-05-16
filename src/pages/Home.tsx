import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h1>메이플 플래닛 유틸리티</h1>
      <ul>
        <li><Link to="/calculator">주스탯 환산기</Link></li>
        <li><Link to="/simulator/scroll">혼돈의 주문서 시뮬레이터</Link></li>
        <li><Link to="/simulator/cube">큐브 시뮬레이터</Link></li>
        <li><Link to="/simulator/maker">메이커 시뮬레이터</Link></li>
      </ul>
    </div>
  )
}
