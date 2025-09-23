import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";

const app = createApp(App);

app.use(PrimeVue, {
  // Nenhum dark mode: não definir seletor de dark, mantendo apenas o tema claro
  theme: {
    options: {
      darkModeSelector: false,
    },
  },
});

app.mount("#app");
