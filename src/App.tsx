import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InternalAnalytics from '@/components/InternalAnalytics'
import Layout from '@/components/layout/Layout'
import About from '@/pages/About'
import Formulas from '@/pages/Formulas'
import Contact from '@/pages/Contact'
import Donate from '@/pages/Donate'
import ItemCompare from '@/pages/calculator/ItemCompare'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsOfUse from '@/pages/TermsOfUse'

function App() {
  return (
    <BrowserRouter>
      <InternalAnalytics />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ItemCompare />} />
          <Route path="about" element={<About />} />
          <Route path="formulas" element={<Formulas />} />
          <Route path="contact" element={<Contact />} />
          <Route path="donate" element={<Donate />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfUse />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
