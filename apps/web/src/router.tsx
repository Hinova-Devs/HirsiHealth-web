import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { loginRoute } from './routes/login';
import { registerRoute } from './routes/register';
import { dashboardRoute } from './routes/dashboard';
import { documentsRoute } from './routes/documents';
import { uploadRoute } from './routes/upload';
import { emergencyRoute } from './routes/emergency';
import { shareRoute } from './routes/share';

// Create tree hierarchy
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  documentsRoute,
  uploadRoute,
  emergencyRoute,
  shareRoute,
]);

// Initialize router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Register router types for type-safety across links
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
