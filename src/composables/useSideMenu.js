import { ref, watch } from 'vue'

const isOpen = ref(false)

export function useSideMenu() {
  function open() { isOpen.value = true }
  function close() { isOpen.value = false }
  function toggle() { isOpen.value = !isOpen.value }
  return { isOpen, open, close, toggle }
}

// Bloqueia scroll do body quando aberto
if (typeof window !== 'undefined') {
  watch(isOpen, (v) => {
    document.documentElement.classList.toggle('no-scroll', v)
    document.body.classList.toggle('no-scroll', v)
  })
}
