import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router/index.js";
import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";
import axios from "axios";

axios.defaults.withCredentials = true;

const app = createApp(App);

app.use(PrimeVue, {
  // Nenhum dark mode: não definir seletor de dark, mantendo apenas o tema claro
  theme: {
    options: {
      darkModeSelector: false,
    },
  },
});

app.use(router);

app.mount("#app");
