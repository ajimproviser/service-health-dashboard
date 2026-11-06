import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ApiContext } from './api/apiClient'
import { createMockApi } from './api/mockApi'
import './styles.css'

// Swap createMockApi() for a real REST implementation of ApiClient to talk to a backend.
const api = createMockApi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiContext.Provider value={api}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApiContext.Provider>
  </StrictMode>,
)
