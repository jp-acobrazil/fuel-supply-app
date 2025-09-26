<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { statusClass } from '../utils/status'
import { useSideMenu } from '../composables/useSideMenu'

const route = useRoute()
const router = useRouter()
const { toggle } = useSideMenu()

const id = computed(() => route.params.id)
const loading = ref(false)
const error = ref('')
const supply = ref(null)
const files = ref([])


const total = computed(() => {
  if (!supply.value) return 0
  return (Number(supply.value.liters) || 0) * (Number(supply.value.pricePerLiter) || 0)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/supplies/${id.value}`)
    supply.value = data
    try {
      const { data: arr } = await api.get(`/supplies/${id.value}/files`)
      if (Array.isArray(arr)) files.value = arr
    } catch {}
  } catch (e) {
    error.value = 'Falha ao carregar abastecimento.'
    console.error(e)
  } finally { loading.value = false }
}

onMounted(load)
function back() { router.push({ name: 'home' }) }
</script>

<template>
  <div class="page">
    <header class="app-bar">
      <button class="menu-btn" aria-label="menu" @click="toggle">☰</button>
      <a href="https://portal.acobrazil.com.br/" target="_blank" rel="noopener noreferrer">
        <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
      </a>
      <div />
    </header>
    <main class="content">
      <div class="card">
        <div class="head">
          <h2 class="title-inline">Abastecimento <span v-if="supply?.status" class="status-dot" :class="statusClass(supply.status)"></span></h2>
          <span class="code">#{{ String(id).padStart(4,'0') }}</span>
        </div>
        <div v-if="error" class="msg error">{{ error }}</div>
        <div v-else-if="loading" class="msg">Carregando...</div>
        <template v-else>
          <section class="block">
            <h3>Combustível</h3>
            <div class="grid">
              <div class="field"><label>Qtd (L)</label><input disabled :value="supply?.liters" /></div>
              <div class="field"><label>Preço/L</label><input disabled :value="supply?.pricePerLiter" /></div>
              <div class="field"><label>Total</label><input disabled :value="total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})" /></div>
            </div>
          </section>
          <section class="block">
            <h3>Veículo</h3>
            <div class="grid">
              <div class="field"><label>Placa</label><input disabled :value="supply?.vehicle?.plate || supply?.plate" /></div>
              <div class="field"><label>Tipo Comb.</label><input disabled :value="supply?.fuelType || supply?.vehicle?.fuelType" /></div>
              <div class="field"><label>Hodômetro</label><input disabled :value="supply?.odometer" /></div>
            </div>
          </section>
          <section class="block">
            <h3>Em Rota</h3>
            <div class="grid">
              <div class="field"><label>CNPJ</label><input disabled :value="supply?.stationCnpj" /></div>
              <div class="field"><label>Posto</label><input disabled :value="supply?.stationName" /></div>
              <div class="field full"><label>Observações</label><textarea disabled rows="3" :value="supply?.obs" />
              </div>
            </div>
          </section>
          <section class="block" v-if="supply?.status === 'R' && supply?.approvalComment">
            <h3>Motivo Reprovação</h3>
            <div class="comment-box">{{ supply.approvalComment }}</div>
          </section>
          <div class="actions">
            <button class="btn" @click="back">Voltar</button>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page { display:flex; flex-direction:column; min-height:100vh; }
.app-bar { position:sticky; top:0; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:10px 12px; background:#0b5d3b; color:#fff; }
.menu-btn { background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer; justify-self:start; }
.brand { height:24px; justify-self:center; }
.content { padding:16px; max-width:640px; margin:0 auto; width:100%; }
.card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px 20px 30px; }
.head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.title-inline { display:flex; align-items:center; gap:8px; margin:0; font-size:18px; }
.status-dot { width:14px; height:14px; border-radius:50%; background:#9ca3af; box-shadow:0 0 0 2px #fff,0 0 0 3px #d1d5db; }
.status-dot.green { background:#059669; }
.status-dot.red { background:#dc2626; }
.status-dot.orange { background:#ea8800; }
.code { font-weight:600; font-size:14px; }
.block { border:1px solid #e5e7eb; border-radius:8px; padding:14px 14px 12px; margin-bottom:16px; }
.block h3 { margin:0 0 10px; font-size:15px; font-weight:600; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px 16px; }
.field { display:flex; flex-direction:column; gap:4px; }
.field.full { grid-column:1 / -1; }
.field label { font-size:11px; text-transform:uppercase; letter-spacing:.5px; font-weight:600; color:#374151; }
.field input, .field textarea { height:30px; border:1px solid #d1d5db; border-radius:6px; padding:4px 8px; font-size:13px; background:#f8f9fa; }
.field textarea { height:auto; min-height:70px; resize:vertical; }
.comment-box { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:10px 12px; border-radius:6px; font-size:13px; line-height:1.4; white-space:pre-wrap; }
.actions { display:flex; justify-content:flex-end; }
.btn { height:34px; border-radius:20px; border:1px solid #0b5d3b; background:#fff; padding:0 18px; cursor:pointer; font-size:13px; font-weight:600; }
.btn:hover { background:#f3f4f6; }
</style>
