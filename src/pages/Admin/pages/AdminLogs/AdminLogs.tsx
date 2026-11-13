import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils";
import { describeAuditAction } from "@/utils/auditLabels";

import styles from "./AdminLogs.module.scss";
import { Text, Title } from "@/components";

type Localized = { ru?: string; en?: string } | null;

type LogEntry = {
  id: string;
  actor_role: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  record_label: string | null; // снапшот имени из базы
  changed_fields: Record<string, unknown> | null;
  created_at: string;
};

// Извлекаем человекочитаемое имя из строки таблицы.
// Для таблиц, которых нет в списке, имена не запрашиваем — покажем сырое "#id".
const LABEL_EXTRACTORS: Record<
  string,
  (row: Record<string, unknown>) => string | null
> = {
  projects: (row) => {
    const title = (row.title as Localized) ?? null;
    const slug = row.slug as string | null;
    return title?.ru || title?.en || slug || null;
  },
  skills: (row) => {
    const name = (row.name as Localized) ?? null;
    return name?.ru || name?.en || null;
  },
  projects_categories: (row) => {
    const name = (row.name as Localized) ?? null;
    return name?.ru || name?.en || (row.slug as string | null) || null;
  },
  skills_categories: (row) => {
    const name = (row.name as Localized) ?? null;
    return name?.ru || name?.en || null;
  },
  admin_users: (row) => (row.email as string | null) ?? null,
  contacts: (row) =>
    (row.name as string | null) ?? (row.email as string | null) ?? null,
};

const loadDisplayNames = async (
  logs: LogEntry[],
): Promise<Map<string, string>> => {
  // Собираем id по таблицам: одна таблица — один запрос вместо запроса на строку
  const idsByTable = new Map<string, Set<string>>();

  for (const entry of logs) {
    if (!entry.record_id) continue;
    if (!LABEL_EXTRACTORS[entry.table_name]) continue;

    const ids = idsByTable.get(entry.table_name) ?? new Set();
    ids.add(entry.record_id);
    idsByTable.set(entry.table_name, ids);
  }

  const names = new Map<string, string>();

  await Promise.all(
    [...idsByTable.entries()].map(async ([table, ids]) => {
      const { data } = await supabase
        .from(table)
        .select("*")
        .in("id", [...ids]);

      for (const row of ((data ?? []) as Record<string, unknown>[]) || []) {
        const label = LABEL_EXTRACTORS[table](row);
        if (label) names.set(`${table}:${String(row.id)}`, label);
      }
    }),
  );

  return names;
};

const describeChanges = (entry: LogEntry): string => {
  if (entry.action !== "update") return "—";
  if (!entry.changed_fields) return "—";
  return Object.keys(entry.changed_fields).join(", ");
};

export const AdminLogs = () => {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);

      const { data, error: fetchError } = await supabase
        .from("admin_audit_log")
        .select(
          "id, actor_role, action, table_name, record_id, record_label, changed_fields, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (fetchError) {
        setError(t("admin.logs.error", "Не удалось загрузить журнал"));
        setIsLoading(false);
        return;
      }

      const logs = (data as LogEntry[]) ?? [];
      setEntries(logs);
      setIsLoading(false);

      // Имена догружаем фоном: таблица рисуется сразу, названия подтекут следом
      const displayNameMap = await loadDisplayNames(logs);
      setNames(displayNameMap);
    };

    fetchLogs();
  }, [t]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatObject = (entry: LogEntry): { label: string; hint?: string } => {
    const idPart = entry.record_id !== null ? ` #${entry.record_id}` : "";
    const raw = `${entry.table_name}${idPart}`;

    if (!entry.record_id) return { label: entry.table_name };

    const name =
      entry.record_label ?? names.get(`${entry.table_name}:${entry.record_id}`);
    if (!name) return { label: raw, hint: raw };

    return { label: name, hint: raw };
  };

  return (
    <section className={styles.wrapper}>
      <Title>{t("admin.logs.title", "Журнал действий")}</Title>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ?
        <Text size="xs" mode="secondary">
          {t("admin.logs.loading", "Загружаем...")}
        </Text>
      : entries.length === 0 ?
        <Text size="xs" mode="secondary">
          {t("admin.logs.empty", "Журнал пока пуст")}
        </Text>
      : <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.logs.col.time", "Время")}</th>
              <th>{t("admin.logs.col.role", "Роль")}</th>
              <th>{t("admin.logs.col.action", "Действие")}</th>
              <th>{t("admin.logs.col.object", "Объект")}</th>
              <th>{t("admin.logs.col.changed_fields", "Изменённые поля")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const object = formatObject(entry);

              return (
                <tr key={entry.id}>
                  <td className={styles.time}>
                    {formatTime(entry.created_at)}
                  </td>
                  <td>{entry.actor_role ?? "—"}</td>
                  <td>
                    {describeAuditAction(entry.action, entry.table_name, t)}
                  </td>
                  <td className={styles.changes} title={object.hint}>
                    {object.label}
                  </td>
                  <td className={styles.changes}>{describeChanges(entry)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </section>
  );
};
