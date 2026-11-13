import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils";

export type AdminRole = "admin" | "editor";

export const useAdminAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isRoleChecked, setIsRoleChecked] = useState(false);

  const userId = session?.user.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setIsRoleChecked(false);
      return;
    }

    setIsRoleChecked(false);

    supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Диагностика: пустой результат из-за RLS тоже приходит как ошибка PGRST116
          console.warn(
            "[useAdminAuth] role query error:",
            error.code,
            error.message,
          );
        }
        setRole((data?.role as AdminRole | undefined) ?? null);
        setIsRoleChecked(true);
      });
  }, [userId]);

  const isRolePending = session !== null && !isRoleChecked;

  return {
    session,
    role,
    isAdmin: role === "admin",
    isEditor: role === "editor",
    isLoading: isSessionLoading || isRolePending,
  };
};
