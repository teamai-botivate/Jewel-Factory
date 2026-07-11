import { Suspense } from 'react';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Manager Reset Password' };

export default function ManagerResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm
        title="Reset password"
        apiPath="/api/manager/reset-password"
        loginHref="/store/manager/login"
      />
    </Suspense>
  );
}
