import { useEffect, useState } from "react";
import { supabase } from "@/utils";
import { describeAuditAction } from "@/utils/auditLabels";

import styles from "./AdminLogs.module.scss";
import { Text, Title } from "@/components";

type LogEntry = {
  id: string;
  actor_role: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  changed_fields: Record<string, unknown> | null;
  created_at: string;
};

const describeChanges = (entry: LogEntry): string => {
  if (entry.action !== "update") return "—";
  if (!entry.changed_fields) return "—";
  return Object.keys(entry.changed_fields).join(", ");
};

export const AdminLogs = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);

      const { data, error: fetchError } = await supabase
        .from("admin_audit_log")
        .select(
          "id, actor_role, action, table_name, record_id, changed_fields, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (fetchError) {
        setError("Не удалось загрузить журнал");
        setIsLoading(false);
        return;
      }

      setEntries((data as LogEntry[]) ?? []);
      setIsLoading(false);
    };

    fetchLogs();
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className={styles.wrapper}>
      <Title>Журнал действий</Title>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ?
        <Text size="xs" mode="secondary">
          Загружаем...
        </Text>
      : entries.length === 0 ?
        <Text size="xs" mode="secondary">
          Журнал пока пуст
        </Text>
      : <table className={styles.table}>
          <thead>
            <tr>
              <th>Время</th>
              <th>Роль</th>
              <th>Действие</th>
              <th>Объект</th>
              <th>Изменённые поля</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className={styles.time}>{formatTime(entry.created_at)}</td>
                <td>{entry.actor_role ?? "—"}</td>
                <td>{describeAuditAction(entry.action, entry.table_name)}</td>
                <td className={styles.changes}>
                  {entry.table_name}
                  {entry.record_id !== null ? ` #${entry.record_id}` : ""}
                </td>
                <td className={styles.changes}>{describeChanges(entry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    </section>
  );
};
