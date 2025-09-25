<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const emit = defineEmits(['newChecklist', 'newAbastecimento', 'chat'])
const router = useRouter()

const expanded = ref(false)
function toggleExpand() {
    expanded.value = !expanded.value
}
function goToSupply() {
    expanded.value = false
    router.push({ name: 'supply' })
}
</script>

<template>
    <div class="fabs" :class="{ expanded }">
        <!-- Mostra apenas o botão de abastecimento após expandir -->
        <transition name="fab-fade">
            <button v-if="expanded" class="fab small" aria-label="abastecimento" @click="goToSupply">⛽</button>
        </transition>
        <button class="fab primary" :aria-expanded="expanded" aria-label="abrir ações" @click="toggleExpand">+</button>
    </div>

</template>

<style scoped>
.fabs {
    position: fixed;
    bottom: calc(24px + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 10px; /* espaçamento reduzido entre os botões */
    pointer-events: none;
}

.fab {
    pointer-events: auto;
    width: 56px;
    height: 56px;
    border-radius: 999px;
    border: none;
    background: #fff;
    color: #0b5d3b;
    box-shadow: 0 4px 14px rgba(0, 0, 0, .18);
    font-size: 22px;
    display: grid;
    place-items: center;
    transition: transform .2s ease, opacity .2s ease, background-color .2s ease, box-shadow .2s ease;
}

.fab.small {
    width: 44px;
    height: 44px;
    font-size: 18px;
    background: #f3f4f6;
}

.fab.primary {
    background: #0b5d3b;
    color: #fff;
}

/* Rotação suave do botão "+" quando expandido */
.fabs.expanded .fab.primary {
    transform: rotate(45deg);
}

/* Transição de entrada/saída do botão de ação (⛽) */
.fab-fade-enter-from,
.fab-fade-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
}
.fab-fade-enter-active,
.fab-fade-leave-active {
    transition: opacity .18s ease, transform .18s ease;
}
</style>
