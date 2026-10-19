import { lazy, Suspense } from 'react';
import App from './App';

const Portal = lazy(() => import('./pages/Portal'));
const Admin = lazy(() => import('./pages/Admin'));

export default function Root() {
  if (/^\/portal(?:\/|$)/.test(window.location.pathname)) return <Suspense fallback={<p role="status">Loading your inquiries…</p>}><Portal /></Suspense>;
  return /^\/admin(?:\/|$)/.test(window.location.pathname)
    ? <Suspense fallback={<p role="status">Loading workspace…</p>}><Admin /></Suspense>
    : <App />;
}
