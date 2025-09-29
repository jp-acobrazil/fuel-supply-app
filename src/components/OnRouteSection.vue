<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  enabled: { type: Boolean, default: true }
})

const cnpj = ref('')
const station = ref('')
const notes = ref('')

// util: mantém apenas números e limita a 14 dígitos
const cleanCnpj = (v) => (v ?? '').toString().replace(/\D/g, '').slice(0, 14)

// v-model com saneamento automático
const cnpjModel = computed({
  get: () => cnpj.value,
  set: (v) => { cnpj.value = cleanCnpj(v) }
})

defineExpose({
  getData() {
    if (!props.enabled) {
      return { stationCnpj: '', stationName: '', obs: '' }
    }
    return {
      stationCnpj: cnpj.value,
      stationName: station.value,
      obs: notes.value
    }
  },
  setData(data = {}) {
    if ('stationCnpj' in data) cnpj.value = cleanCnpj(data.stationCnpj)
    if ('stationName' in data) station.value = data.stationName ?? ''
    if ('obs' in data) notes.value = data.obs ?? ''
  }
})
</script>

<template>
  <div class="grid" :class="{ disabled: !props.enabled }">
    <label class="field">
      <span>CNPJ do posto</span>
  <input
    v-model="cnpjModel"
    :disabled="!props.enabled"
    inputmode="numeric"
    maxlength="14"
    pattern="\\d{14}"
    placeholder="00.000.000/0000-00"
  />
    </label>
    <label class="field">
      <span>Nome do posto</span>
  <input v-model="station" :disabled="!props.enabled" placeholder="Posto XYZ" />
    </label>

    
    <label class="field">
      <span>Observações</span>
  <textarea v-model="notes" :disabled="!props.enabled" placeholder="Digite aqui..." rows="4" />
    </label>

  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr; /* mobile-first */
  gap: 12px;
}
 .grid.disabled { opacity: .5; pointer-events: none; }
@media (min-width: 480px) {
  .grid { grid-template-columns: 1fr 1fr; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field>span {
  font-size: 12px;
  color: #555;
}

input {
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 16px;
}
textarea {
  min-height: 96px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
  color: #333;
  font-size: 16px;
  resize: vertical;
}

/* (anexos movidos para fora) */

/* Tema fixo claro: sem variação por prefers-color-scheme */
</style>
