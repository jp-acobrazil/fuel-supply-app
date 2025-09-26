<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSideMenu } from '../composables/useSideMenu'
import api from '../services/api'
import { useRouter } from 'vue-router'

const { toggle } = useSideMenu()
const router = useRouter()

const supplies = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}
function formatCurrency(v) {
  const n = Number(v)
  return (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/supplies')
    const arr = Array.isArray(data) ? data : []
    // ordenar desc
    arr.sort((a,b)=> new Date(b.date) - new Date(a.date))
    supplies.value = arr
  } catch (e) {
    error.value = 'Falha ao carregar abastecimentos.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(()=> {
  const q = search.value.trim().toLowerCase()
  if (!q) return supplies.value
  return supplies.value.filter(s => {
    const idStr = String(s.id).padStart(4,'0')
    const plate = (s?.vehicle?.plate||'').toLowerCase()
    const date = formatDate(s.date).toLowerCase()
    return idStr.includes(q) || plate.includes(q) || date.includes(q)
  })
})

function statusColor(s) {
  const code = (s?.status || '').toUpperCase()
  if (code === 'A' || code === 'APPROVED') return 'green'
  if (code === 'R' || code === 'REJECTED') return 'red'
  if (code === 'C' || code === 'CREATED' || code === 'PENDING') return 'orange'
  return 'gray'
}

function openDetail(s) {
  router.push({ name: 'supply-detail', params: { id: s.id } })
}

// Popover de ações
const actionSupplyId = ref(null)
const popCoords = ref({ top: 0, left: 0 })
function toggleRowMenu(s, el) {
  if (actionSupplyId.value === s.id) {
    actionSupplyId.value = null
    return
  }
  const rect = el.getBoundingClientRect()
  // largura aproximada do pop ~140px
  popCoords.value = {
    top: rect.bottom + window.scrollY + 4,
    left: rect.right + window.scrollX - 160
  }
  actionSupplyId.value = s.id
}
function closeActions() { actionSupplyId.value = null }
function handleDocClick(e) {
  try {
    const t = e.target
    if (!(t instanceof Element)) { closeActions(); return }
    if (!t.closest('.pop-actions') && !t.closest('.icon-btn')) closeActions()
  } catch { closeActions() }
}
function handleKey(e) { if (e.key === 'Escape') closeActions() }
onMounted(() => {
  document.addEventListener('click', handleDocClick)
  document.addEventListener('keydown', handleKey)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDocClick)
  document.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <div class="page">
    <header class="app-bar">
  <button class="menu-btn" aria-label="menu" @click="toggle">☰</button>
      <a href="https://portal.acobrazil.com.br/" target="_blank" rel="noopener noreferrer">
        <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
      </a>
      <div class="actions" />
    </header>
    <main class="content">
      <div class="top-actions">
        <button class="btn back" @click="() => router.push({ name: 'home' })">← Voltar</button>
      </div>
      <h1 class="title">Abastecimento</h1>
      <div class="card">
        <header class="list-header">
          <h2>Abastecimento</h2>
          <div class="actions-inline">
            <div class="search-box">
              <input v-model="search" placeholder="Pesquisar por ID, placa ou data" />
            </div>
            <button class="btn ghost" @click="load" :disabled="loading">{{ loading ? '...' : '↻' }}</button>
            <button class="btn primary" @click="() => router.push({ name: 'supply' })">+ Adicionar</button>
          </div>
        </header>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <div class="table-wrapper" v-if="filtered.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Motorista</th>
                <th>Placa</th>
                <th>Tipo combustível</th>
                <th>Data abastec.</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filtered" :key="s.id">
                <td>{{ '#' + String(s.id).padStart(4,'0') }}</td>
                <td>{{ s.driver?.name || '-' }}</td>
                <td>{{ s?.vehicle?.plate || '-' }}</td>
                <td>{{ s?.vehicle?.fuelType || s.fuelType || '-' }}</td>
                <td>{{ formatDate(s.date) }}</td>
                <td>{{ formatCurrency((Number(s.liters)||0) * (Number(s.pricePerLiter)||0)) }}</td>
                <td><span class="dot" :class="statusColor(s)"></span></td>
                <td class="row-actions">
                  <button class="icon-btn" @click="toggleRowMenu(s, $event.currentTarget)">⋯</button>
                  <teleport to="body">
                    <div
                      v-if="actionSupplyId===s.id"
                      class="pop pop-actions"
                      :style="{ top: popCoords.top + 'px', left: popCoords.left + 'px' }"
                      @click.stop
                    >
                      <button class="pop-item" @click="openDetail(s); closeActions()">Visualizar</button>
                    </div>
                  </teleport>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="!loading" class="empty">Nenhum resultado</div>
        <div v-if="loading" class="loading">Carregando...</div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page { display:flex; flex-direction:column; min-height:100vh; }
.app-bar { position:sticky; top:0; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; padding:10px 12px; background:#0b5d3b; color:#fff; }
.menu-btn { background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer; justify-self:start; }
.brand { height:24px; justify-self:center; }
.content { padding:18px; max-width: 1000px; margin:0 auto; width:100%; }
.title { margin:4px 0 20px; font-size:22px; text-align:left; }
.top-actions { display:flex; align-items:center; justify-content:flex-start; margin: 6px 0 6px; }
.btn.back { height:32px; border-radius:8px; border:1px solid #d1d5db; padding:0 10px; background:#fff; cursor:pointer; font-weight:600; font-size:13px; }
.btn.back:hover { background:#f3f4f6; }
.card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px 18px 24px; }
.list-header { display:flex; flex-direction:column; gap:14px; margin-bottom:12px; }
@media (min-width: 640px){ .list-header { flex-direction:row; align-items:center; justify-content:space-between; } }
.list-header h2 { margin:0; font-size:16px; font-weight:600; }
.actions-inline { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.search-box input { height:40px; border:1px solid #d1d5db; border-radius:8px; padding:0 12px; min-width:260px; }
.btn { height:40px; border-radius:8px; border:1px solid transparent; padding:0 14px; background:#f3f4f6; cursor:pointer; font-weight:600; font-size:14px; }
.btn.primary { background:#0b5d3b; color:#fff; }
.btn.ghost { background:#fff; border-color:#d1d5db; }
.btn:disabled { opacity:.5; cursor:default; }
.table-wrapper { overflow:auto; }
table { border-collapse:collapse; width:100%; font-size:12px; }
th, td { text-align:left; padding:8px 10px; white-space:nowrap; }
thead th { font-size:11px; font-weight:600; color:#374151; border-bottom:1px solid #e5e7eb; }
tbody tr { border-bottom:1px solid #f1f5f9; }
tbody tr:last-child { border-bottom:none; }
.dot { width:10px; height:10px; border-radius:50%; display:inline-block; background:#9ca3af; }
.dot.green { background:#059669; }
.dot.orange { background:#ea8800; }
.dot.red { background:#dc2626; }
.dot.gray { background:#9ca3af; }
.row-actions { position:relative; }
.icon-btn { background:transparent; border:none; cursor:pointer; font-size:18px; line-height:1; padding:4px 6px; }
.pop-actions { position:absolute; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:4px; display:flex; flex-direction:column; min-width:140px; box-shadow:0 6px 22px -4px rgba(0,0,0,.18),0 4px 10px -2px rgba(0,0,0,.08); z-index:9999; }
.pop-item { background:#fff; border:none; text-align:left; padding:8px 10px; font-size:13px; cursor:pointer; border-radius:6px; }
.pop-item:hover { background:#f3f4f6; }
.empty, .loading, .error-msg { padding:20px 8px; text-align:center; font-size:14px; color:#374151; }
.error-msg { color:#b91c1c; }
</style>