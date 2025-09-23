<script setup>
import { ref } from 'vue'

const plate = ref('')
const fuel = ref('')
const odometer = ref('')

const odoPhoto = ref(null)
const odoInput = ref(null)
function triggerOdoUpload() { odoInput.value?.click() }
function onOdoChange(e) { odoPhoto.value = e.target.files?.[0] ?? null }
defineExpose({
  getData() {
    return {
      plate: plate.value,
      fuelType: fuel.value,
      odometer: Number(odometer.value) || 0,
      odoPhoto: odoPhoto.value || null,
    }
  }
})
</script>

<template>
  <div class="grid">
    <label class="field">
      <span>Placa</span>
      <input v-model="plate" placeholder="ABC-1234" autocapitalize="characters" @input="plate = plate.toUpperCase()" />
    </label>

    <label class="field">
      <span>Tipo de combust.</span>
      <input v-model="fuel" placeholder="Diesel, Gasolina..." autocapitalize="words" />
    </label>
    <label class="field">
      <span>Hodometro</span>
      <input v-model="odometer" type="number" inputmode="numeric" placeholder="0" />
    </label>

    <div class="field file">
      <span>Foto do hodometro legível</span>
      <input ref="odoInput" type="file" accept="image/*" @change="onOdoChange" style="display:none" />
      <button type="button" class="upload" aria-label="upload" @click="triggerOdoUpload">⬆</button>
      <small v-if="odoPhoto" class="hint">{{ odoPhoto.name }}</small>
    </div>
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
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 16px;
}

.file {
  grid-column: 1 / -1;
  align-items: flex-start;
}

.upload {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #0b5d3b;
  color: #fff;
  border: none;
}

.hint {
  color: #6b7280;
  font-size: 11px;
  margin-top: 4px;
}

/* Tema fixo claro: sem variação por prefers-color-scheme */
</style>
