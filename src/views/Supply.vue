<script setup>
import { ref } from 'vue'
import FuelSection from '../components/FuelSection.vue'
import VehicleSection from '../components/VehicleSection.vue'
import OnRouteSection from '../components/OnRouteSection.vue'
import api from '../services/api'

const fuelRef = ref(null)
const vehicleRef = ref(null)
const routeRef = ref(null)

const loading = ref(false)
const message = ref('')

function toNumber(val) {
  if (val === undefined || val === null) return 0
  const s = String(val).replace(',', '.')
  const n = Number(s)
  return isNaN(n) ? 0 : n
}
function onlyDigits(val) {
  return String(val || '').replace(/\D+/g, '')
}

async function submitSupply() {
  try {
    loading.value = true
    message.value = ''

    const f = fuelRef.value?.getData?.() || {}
    const v = vehicleRef.value?.getData?.() || {}
    const r = routeRef.value?.getData?.() || {}

    // Mapear para o payload esperado pela API
    const payload = {
      driverId: 98, // TODO: pegar do auth/estado do app
      liters: toNumber(f.liters),
      pricePerLiter: toNumber(f.pricePerLiter),
      plate: v.plate,
      fuelType: v.fuelType,
      odometer: toNumber(v.odometer),
      stationCnpj: onlyDigits(r.stationCnpj),
      obs: r.obs,
    }

    console.log('Payload', payload)

    // validação simples
    if (!payload.liters || !payload.pricePerLiter || !payload.plate) {
      message.value = 'Preencha litros, preço do litro e placa.'
      return
    }

    // const { data } = await api.post('/supplies', payload)
    message.value = 'Abastecimento cadastrado com sucesso.'
    // opcional: redirecionar ou limpar
  } catch (err) {
    console.error(err)
    message.value = err?.response?.data?.message || 'Falha ao cadastrar abastecimento.'
  } finally {
    loading.value = false
  }
}
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
      <h1 class="title">Abastecimento</h1>

      <section class="card">
        <h2 class="card-title">Combustível</h2>
        <FuelSection ref="fuelRef" />
      </section>

      <section class="card">
        <h2 class="card-title">Veículo</h2>
        <VehicleSection ref="vehicleRef" />
      </section>

      <section class="card">
        <h2 class="card-title">Em Rota</h2>
        <OnRouteSection ref="routeRef" />
      </section>
      <p v-if="message" class="feedback">{{ message }}</p>
      <div class="bottom-spacer" />
    </main>

    <footer class="action-bar">
      <button class="primary" :disabled="loading" @click="submitSupply">{{ loading ? 'Enviando...' : 'Enviar' }}</button>
    </footer>
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

.bottom-spacer {
  height: 72px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(0, 0, 0, .06);
  display: flex;
  justify-content: center;
}

.action-bar .primary {
  width: 100%;
  max-width: 520px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #0b5d3b;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.action-bar .primary[disabled] {
  opacity: .6;
}

.feedback { color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px 10px; border-radius: 8px; font-size: 14px; }
</style>
