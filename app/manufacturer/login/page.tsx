import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

export const metadata = { title: 'Manufacturer Login' };

export default function ManufacturerLoginPage() {
  return (
    <StaffLoginForm
      title="Manufacturer Login"
      subtitle="Admin panel — catalog, stores & orders."
      loginPath="/api/manufacturer/login"
      redirectTo="/manufacturer/dashboard"
      footerLinks={[{ prompt: 'Not the manufacturer?', label: 'Back to home', href: '/' }]}
    />
  );
}
