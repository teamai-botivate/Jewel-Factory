import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Manager Forgot Password' };

export default function ManagerForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      title="Forgot password"
      apiPath="/api/manager/forgot-password"
      backHref="/store/manager/login"
    />
  );
}
