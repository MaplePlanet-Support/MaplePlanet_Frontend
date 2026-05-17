import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ItemCompare from '@/pages/calculator/ItemCompare'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ItemCompare />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
