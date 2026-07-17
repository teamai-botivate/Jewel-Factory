import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

export const metadata = { title: 'Store Manager Login' };

export default function StoreManagerLoginPage() {
  return (
    <StaffLoginForm
      title="Store Manager Login"
      subtitle="Sign in to your store's kiosk and restock."
      loginPath="/api/branch-manager/login"
      redirectTo="/store-manager"
      footerLinks={[{ prompt: 'Retailer / HO?', label: 'Staff portal', href: '/portal' }]}
    />
  );
}
