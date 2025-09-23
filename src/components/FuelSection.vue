<script setup>
import { ref, watch } from 'vue'

const liters = ref('')
const price = ref('')
const total = ref('')

const pumpPhotoFile = ref(null)
const pumpFileInput = ref(null)
function triggerPumpUpload() { pumpFileInput.value?.click() }
function onPumpFileChange(e) { pumpPhotoFile.value = e.target.files?.[0] ?? null }

watch([liters, price], ([l, p]) => {
  const lv = Number(l)
  const pv = Number(p)
  if (!isNaN(lv) && !isNaN(pv)) {
    total.value = (lv * pv).toFixed(2)
  } else {
    total.value = ''
  }
})
</script>

<template>
  <div class="grid">
    <label class="field">
      <span>Qtd em litros</span>
  <input type="number" name="fuelLiters" inputmode="decimal" min="0" step="0.001" v-model="liters" placeholder="0" />
    </label>
    <label class="field">
      <span>Preço do litro</span>
  <input type="number" name="fuelPrice" inputmode="decimal" min="0" step="0.01" v-model="price" placeholder="0,00" />
    </label>

    <label class="field">
      <span>Valor total</span>
      <input type="text" name="fuelTotal" :value="total" disabled readonly aria-readonly="true" />
    </label>
  </div>
  <div class="field file">
    <span>Foto bomba de comb.</span>
    <input ref="pumpFileInput" type="file" accept="image/*" @change="onPumpFileChange" style="display:none" />
    <button type="button" class="upload" aria-label="upload" @click="triggerPumpUpload">⬆</button>
    <small v-if="pumpPhotoFile" class="hint">{{ pumpPhotoFile.name }}</small>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr; /* mobile-first */
  gap: 12px;
}
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
  height: 44px; /* melhor alvo de toque */
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 16px; /* evita zoom no iOS */
}

.file {
  margin-top: 10px;
  align-items: flex-start;
  justify-content: flex-end;
}

.hint {
  color: #6b7280;
  font-size: 11px;
  margin-top: 4px;
}

.upload {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #0b5d3b;
  color: #fff;
  border: none;
}

/* Tema fixo claro: sem variação por prefers-color-scheme */
</style>
