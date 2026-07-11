import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

export const metadata = { title: 'Store Owner Login' };

export default function StoreLoginPage() {
  return (
    <StaffLoginForm
      title="Store Owner Login"
      subtitle="Access your store portal & dashboard."
      loginPath="/api/store/login"
      redirectTo="/store/dashboard"
      forgotHref="/store/forgot-password"
      footerLinks={[{ prompt: 'New store?', label: 'Register here', href: '/store/register' }]}
    />
  );
}
