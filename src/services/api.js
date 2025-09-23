import axios from 'axios'

const base = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api')

const api = axios.create({ baseURL: base, timeout: 15000 })

export default api
