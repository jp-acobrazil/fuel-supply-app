import { createRouter, createWebHistory } from "vue-router";
import axios from "axios";
import DriverHome from "../views/DriverHome.vue";
import Supply from "../views/Supply.vue";

const routes = [
  { path: "/", name: "home", component: DriverHome,  meta: { requiresAuth: true, requiresAuthRoutine: true }, },
  { path: "/cadastrar/:id", name: "supply", component: Supply, meta: { requiresAuth: true, requiresAuthRoutine: true } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // Em ambiente de desenvolvimento, ignorar verificação de autenticação
  if (import.meta.env.DEV) {
    return next();
  }

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_AUTH_URL}/auth/validate-token`,
        { withCredentials: true }
      );
      const isAuthenticated = response.data;

      if (!isAuthenticated) {
        return (window.location.href = `${
          import.meta.env.VITE_API_LOCAL
        }/forbidden`);
      }

      if (to.matched.some((record) => record.meta.requiresAuthRoutine)) {
        const userDetail = await axios.get(
          `${import.meta.env.VITE_API_AUTH_URL}/auth/user-details`,
          { withCredentials: true }
        );

        if (userDetail.data && userDetail.data.rotinas) {
          const rotinaAtual = import.meta.env.VITE_API_ROTINA;
          const usuarioRotinas = userDetail.data.rotinas.map((r) =>
            r.toString()
          );

          if (!usuarioRotinas.includes(rotinaAtual)) {
            return (window.location.href = `${
              import.meta.env.VITE_API_LOCAL
            }/forbidden`);
          }

          // await store.dispatch("setUserDetails", userDetail.data);
        } else {
          console.error("Erro: rotinas do usuário não encontradas");
          return (window.location.href = `${
            import.meta.env.VITE_API_LOCAL
          }/forbidden`);
        }
      }

      next();
    } catch (error) {
      console.error('Erro de autenticação:', error);
      return (window.location.href = `${
        import.meta.env.VITE_API_LOCAL
      }/forbidden`);
    }
  } else {
    next();
  }
});

export default router;
