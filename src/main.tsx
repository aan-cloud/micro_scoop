import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WholeSlideViewer from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WholeSlideViewer />
  </StrictMode>,
)
