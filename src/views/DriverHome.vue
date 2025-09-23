<script setup>
import { ref, onMounted } from 'vue'
import HomeWidgets from '../components/HomeWidgets.vue'
import RecentList from '../components/RecentList.vue'
import FabActions from '../components/FabActions.vue'
import api from '../services/api'

const abastecimentosHeaders = ['ID', 'Placa', 'Data', 'Valor', 'Status']
const abastecimentosRows = ref([])

const checklistHeaders = ['ID', 'Placa', 'Data', 'Rota', 'Status']
const checklistRows = [
  { id: '#0125', placa: 'OJF4J54', data: '25/09/25', valor: 'Início', statusColor: 'green' },
  { id: '#0132', placa: 'OJF4J54', data: '28/09/25', valor: 'Fim', statusColor: 'orange' }
]

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
    const { data } = await api.get('/supplies')
    const items = Array.isArray(data) ? data : []
    // ordenar desc por data
    items.sort((a, b) => new Date(b.date) - new Date(a.date))
    const last5 = items.slice(0, 5)
    abastecimentosRows.value = last5.map((s, idx) => {
      const valor = (Number(s.liters) || 0) * (Number(s.pricePerLiter) || 0)
      return {
        id: padId(s.id),
        placa: s?.vehicle?.plate || '-',
        data: formatDate(s.date),
        valor: formatCurrency(valor),
        statusColor: idx % 2 === 0 ? 'green' : 'orange', // mock
      }
    })
  } catch (e) {
    console.error('Erro ao carregar abastecimentos', e)
    abastecimentosRows.value = []
  }
}

onMounted(loadAbastecimentos)
</script>

<template>
  <div class="page">
    <header class="app-bar">
      <button class="menu-btn" aria-label="menu">☰</button>
      <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
      <div class="actions">
        <span class="badge">3</span>
      </div>
    </header>

    <main class="content">
      <h1 class="title">Transporte</h1>

      <HomeWidgets />

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
  /* menu | logo (center) | actions */
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

.fab-spacer { height: 96px; }

/* Footer de ações substituído por FABs */
</style>
