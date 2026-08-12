import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
