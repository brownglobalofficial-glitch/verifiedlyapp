import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageSkeleton from "@/components/PageSkeleton";

interface Props {
  children: React.ReactNode;
}

/**
 * Redirects to /login if no active session. Preserves intended destination
 * via ?next=... so the user lands back here after auth.
 */
const AuthGuard = ({ children }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setChecked(true);
      if (!session) {
        const next = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?next=${next}`, { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setChecked(true);
      if (!session) {
        const next = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?next=${next}`, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, location.search]);

  if (!checked) return <PageSkeleton />;
  if (!authed) return <PageSkeleton />;
  return <>{children}</>;
};

export default AuthGuard;
