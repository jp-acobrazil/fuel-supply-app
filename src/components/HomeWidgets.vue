<script setup>
const props = defineProps({
  checklists: { type: Number, default: 44 },
  viagens: { type: Number, default: 16 },
  abertos: { type: Number, default: 44 }
})
</script>

<template>
  <div class="widgets">
    <div class="widget w-checklists">
      <div class="value">{{ props.checklists }}</div>
      <div class="label">Checklists</div>
    </div>
    <div class="widget w-viagens">
      <div class="value">{{ props.viagens }}</div>
      <div class="label">Viagens</div>
    </div>
    <div class="widget w-abertos">
      <div class="value">{{ props.abertos }}</div>
      <div class="label">Checklists em aberto</div>
    </div>
  </div>
</template>

<style scoped>
.widgets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
.widget { border-radius: 14px; padding: 10px 8px; min-height: 72px; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
.value { font-size: 22px; font-weight: 800; line-height: 1; }
.label { font-size: 12px; opacity: .9; text-align: center; }

.w-checklists { background: #f59e0b; }
.w-viagens { background: #3b82f6; }
.w-abertos { background: #ef4444; }
</style>
