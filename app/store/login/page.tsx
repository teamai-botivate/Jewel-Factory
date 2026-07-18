import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

export const metadata = { title: 'Retailer Login' };

export default function StoreLoginPage() {
  return (
    <StaffLoginForm
      title="Retailer Login"
      subtitle="Approvals, stores, staff, branding & B2B orders."
      loginPath="/api/store/login"
      redirectTo="/store/dashboard"
      forgotHref="/store/forgot-password"
      footerLinks={[
        { prompt: 'New retailer?', label: 'Register here', href: '/store/register' },
      ]}
    />
  );
}
