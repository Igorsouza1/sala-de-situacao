'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// Handles invitation links to establish a Supabase session
export function InviteSession() {
  const router = useRouter();

  useEffect(() => {
    const handleSession = async () => {
      const supabase = createClient();

      const search = new URLSearchParams(window.location.search);
      const code = search.get('code');
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data.session) {
          await fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
          });
        }
        router.replace('/invite');
        return;
      }

      const hash = window.location.hash;
      if (!hash) return;

      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        const { data } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (data.session) {
          await fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
          });
        }
        router.replace('/invite');
      }
    };

    handleSession();
  }, [router]);

  return null;
}

export default InviteSession;