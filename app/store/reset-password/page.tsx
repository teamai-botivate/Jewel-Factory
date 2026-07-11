import { Suspense } from 'react';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Reset Password' };

export default function StoreResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm
        title="Reset password"
        apiPath="/api/store/reset-password"
        loginHref="/store/login"
      />
    </Suspense>
  );
}
