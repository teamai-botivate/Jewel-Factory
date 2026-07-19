import { redirect } from 'next/navigation';

// The /portal selector was replaced by the landing-page login popup.
// Keep this route as a redirect so old links/bookmarks still work.
export default function PortalRedirect() {
  redirect('/');
}
