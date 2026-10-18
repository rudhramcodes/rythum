import { lazy, Suspense } from 'react';
import App from './App';

const Admin = lazy(() => import('./pages/Admin'));

export default function Root() {
  return /^\/admin(?:\/|$)/.test(window.location.pathname)
    ? <Suspense fallback={<p role="status">Loading workspace…</p>}><Admin /></Suspense>
    : <App />;
}
