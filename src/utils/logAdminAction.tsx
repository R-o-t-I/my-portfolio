import { supabase } from "@/utils";
import type { AdminRole } from "@/hooks/useAdminAuth";

type LogParams = {
  actorRole: AdminRole;
  action: string;
  tableName: string;
  recordId?: string | number;
};

export const logAdminAction = async ({
  actorRole,
  action,
  tableName,
  recordId,
}: LogParams) => {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    await supabase.from("admin_audit_log").insert({
      actor_id: userId,
      actor_role: actorRole,
      action,
      table_name: tableName,
      record_id: recordId ?? null,
    });
  } catch {
    // журнал не критичен для работы страницы
  }
};
