import { type TFunction } from "i18next";

// ─── Журнал аудита: человекочитаемое описание записи ────────────────────
// Словари: admin.audit.ops.* (действия) и admin.audit.tables.* (таблицы).
// Формат строки — admin.audit.entry, чтобы каждая локаль задавала свой порядок слов.

export const describeAuditAction = (
  action: string,
  tableName: string,
  t: TFunction,
): string => {
  const op = t(`admin.audit.ops.${action}`, { defaultValue: action });
  const table = t(`admin.audit.tables.${tableName}`, {
    defaultValue: tableName,
  });
  return t("admin.audit.entry", {
    defaultValue: "{{op}} – {{table}}",
    op,
    table,
  });
};
