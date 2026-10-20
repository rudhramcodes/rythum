import { lazy, Suspense } from 'react';
import App from './App';

const Portal = lazy(() => import('./pages/Portal'));
const Admin = lazy(() => import('./pages/Admin'));

export default function Root() {
  if (/^\/portal(?:\/|$)/.test(window.location.pathname)) return <Suspense fallback={<div className="route-loading" role="status"><span>RYTHUM SHASTRI.</span><p>Opening your inquiries…</p></div>}><Portal /></Suspense>;
  return /^\/admin(?:\/|$)/.test(window.location.pathname)
    ? <Suspense fallback={<div className="route-loading" role="status"><span>RYTHUM SHASTRI.</span><p>Opening your workspace…</p></div>}><Admin /></Suspense>
    : <App />;
}
