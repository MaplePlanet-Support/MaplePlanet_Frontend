import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ItemCompare from '@/pages/calculator/ItemCompare'
import PrivacyPolicy from '@/pages/PrivacyPolicy'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ItemCompare />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
