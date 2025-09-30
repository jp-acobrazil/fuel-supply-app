<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import HomeWidgets from '../components/HomeWidgets.vue'
import RecentList from '../components/RecentList.vue'
import FabActions from '../components/FabActions.vue'
import api from '../services/api'
import { statusClass } from '../utils/status'
import { useSideMenu } from '../composables/useSideMenu'
import { fetchCurrentUser, getCurrentDriverId } from '../services/user'

const driverId = ref(null)

const abastecimentosHeaders = ['ID', 'Placa', 'Data', 'Valor', 'Status']
const abastecimentosRows = ref([])

const checklistHeaders = ['ID', 'Placa', 'Data', 'Rota', 'Status']
const checklistRows = ref([])

const widgetAbastecimentos = ref(0)
const widgetViagens = ref(0)
const widgetAbertos = ref(0)

function padId(n) { return `#${String(n).padStart(4, '0')}` }
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}
function formatCurrency(v) {
  const n = Number(v)
  const val = isNaN(n) ? 0 : n
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function loadAbastecimentos() {
  try {
    await fetchCurrentUser()
    driverId.value = getCurrentDriverId()
    console.log('Driver ID:', driverId.value)
    const { data } = await api.get(`/supplies/driver/${driverId.value}`)
    const items = Array.isArray(data) ? data : []
    widgetAbastecimentos.value = items.length

    items.sort((a, b) => new Date(b.date) - new Date(a.date))
    const last5 = items.slice(0, 5)
    abastecimentosRows.value = last5.map((s) => {
      const valor = (Number(s.liters) || 0) * (Number(s.pricePerLiter) || 0)
      return {
        id: padId(s.id),
        rawId: s.id,
        placa: s?.vehicle?.plate || '-',
        data: formatDate(s.date),
        valor: formatCurrency(valor),
        statusColor: statusClass(s.status),
        status: s.status,
      }
    })
  } catch (e) {
    console.error('Erro ao carregar abastecimentos', e)
    abastecimentosRows.value = []
  }
}

onMounted(loadAbastecimentos)

function routeLabel(code) {
  const c = String(code || '').toUpperCase()
  if (c === 'I' || c === 'START') return 'Início'
  if (c === 'F' || c === 'END') return 'Fim'
  return '-'
}

function statusColorChecklist(code) {
  const c = String(code || '').toUpperCase()
  if (c === 'F' || c === 'FINISHED' || c === 'E' || c === 'ENDED') return 'green'
  if (c === 'P' || c === 'PENDING') return 'orange'
  if (c === 'U' || c === 'UNCONCLUDED') return 'red'
  return 'gray'
}

async function loadChecklists() {
  try {
    if (!driverId.value) {
      await fetchCurrentUser()
      driverId.value = getCurrentDriverId()
    }
    const did = driverId.value
    if (!did) {
      checklistRows.value = []
      return
    }
    const base = 'https://portal.acobrazil.com.br/checklist/checklists/driver/3156'
    const url = `${base}/${encodeURIComponent(did)}`
    const { data } = await axios.get(url, { timeout: 15000, withCredentials: false })
    const items = Array.isArray(data) ? data : []

    widgetViagens.value = items.filter(it => String(it.route || '').toUpperCase() === 'I').length
    widgetAbertos.value = items.filter(it => ['P', 'U'].includes(String(it.status || '').toUpperCase())).length

    items.sort((a, b) => new Date(b.checklistDate) - new Date(a.checklistDate))
    const last5 = items.slice(0, 5)
    checklistRows.value = last5.map(it => ({
      id: padId(it.checklistId),
      rawId: it.checklistId,
      placa: it.carPlate || '-',
      data: formatDate(it.checklistDate),
      valor: routeLabel(it.route),
      statusColor: statusColorChecklist(it.status),
      status: it.status,
    }))
  } catch (e) {
    console.error('Erro ao carregar checklists', e)
    checklistRows.value = []
  }
}

onMounted(loadChecklists)

const { toggle } = useSideMenu()
</script>

<template>
  <div class="page">
    <header class="app-bar">
      <button class="menu-btn" aria-label="menu" @click="toggle">☰</button>
      <a href="https://portal.acobrazil.com.br/" target="_blank" rel="noopener noreferrer">
        <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
      </a>
      <div class="actions">
        <span class="badge">3</span>
      </div>
    </header>

    <main class="content">
      <h1 class="title">Transporte</h1>

      <HomeWidgets :checklists="widgetAbastecimentos" :viagens="widgetViagens" :abertos="widgetAbertos" />

      <section class="card">
        <h2 class="card-title">Ult. Abastecimentos</h2>
        <RecentList :headers="abastecimentosHeaders" :rows="abastecimentosRows" title="Ult. Abastecimentos" />
      </section>

      <section class="card">
        <h2 class="card-title">Ult. Checklist</h2>
        <RecentList :headers="checklistHeaders" :rows="checklistRows" title="Ult. Checklist" />
      </section>

      <div class="fab-spacer" />
    </main>

    <FabActions />
  </div>

</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;

  align-items: center;
  gap: 12px;
  padding: calc(8px + env(safe-area-inset-top)) 12px 10px;
  background: #0b5d3b;
  color: #fff;
}

.menu-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.menu-btn {
  justify-self: start;
}

.brand {
  height: 24px;
  justify-self: center;
}

.actions {
  justify-self: end;
  margin-left: 0;
}

.badge {
  background: #ffc107;
  color: #0b5d3b;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
}

.content {
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
}

.title {
  margin: 8px 0 16px;
  font-size: 22px;
}

.card {
  background: var(--card-bg, #fff);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .1);
  border: 1px solid rgba(0, 0, 0, .05);
  margin-bottom: 12px;
}

.card-title {
  text-align: center;
  margin: 4px 0 12px;
  font-size: 18px;
}

.fab-spacer {
  height: 96px;
}

</style>
