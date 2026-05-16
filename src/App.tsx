import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import StatCalculator from '@/pages/calculator/StatCalculator'
import ScrollSimulator from '@/pages/simulator/ScrollSimulator'
import CubeSimulator from '@/pages/simulator/CubeSimulator'
import MakerSimulator from '@/pages/simulator/MakerSimulator'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="calculator" element={<StatCalculator />} />
          <Route path="simulator/scroll" element={<ScrollSimulator />} />
          <Route path="simulator/cube" element={<CubeSimulator />} />
          <Route path="simulator/maker" element={<MakerSimulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
