import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

export const metadata = { title: 'Store Manager Login' };

export default function ManagerLoginPage() {
  return (
    <StaffLoginForm
      title="Manager Login"
      subtitle="Sign in to manage orders and customer requests."
      loginPath="/api/manager/login"
      redirectTo="/store/dashboard"
      forgotHref="/store/manager/forgot-password"
      footerLinks={[{ prompt: 'Store Owner?', label: 'Sign in here', href: '/store/login' }]}
    />
  );
}
