import { useEffect, useState } from "react";
import { supabase } from "@/utils";

import styles from "./AdminContacts.module.scss";
import { Text, Title } from "@/components";

type ContactRequest = {
  id: number;
  name: string;
  email: string | null;
  social: string | null;
  message: string;
  file_url: unknown;
  created_at: string;
};

type FileType = "image" | "pdf" | "other";

const pickFileUrls = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") return [value];
  if (typeof value === "object" && "ru" in (value as object)) {
    const ru = (value as { ru?: unknown }).ru;
    return typeof ru === "string" ? [ru] : [];
  }
  return [];
};

const getFileType = (url: string): FileType => {
  const path = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(path)) return "image";
  if (path.endsWith(".pdf")) return "pdf";
  return "other";
};

const FilePreview = ({ url }: { url: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const type = getFileType(url);

  return (
    <div>
      <a href={url} target="_blank" rel="noreferrer">
        Скачать
      </a>{" "}
      <button type="button" onClick={() => setIsOpen((v) => !v)}>
        {isOpen ? "Скрыть" : "Показать"}
      </button>
      {isOpen && type === "image" && (
        <div>
          <img
            src={url}
            alt="Вложение"
            style={{ maxWidth: 320, marginTop: 8 }}
          />
        </div>
      )}
      {isOpen && type === "pdf" && (
        <div>
          <iframe
            src={url}
            title="Предпросмотр PDF"
            style={{
              width: 480,
              height: 360,
              marginTop: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </div>
  );
};

export const AdminContacts = () => {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);

      const { data, error: fetchError } = await supabase
        .from("contacts")
        .select("id, name, email, social, message, file_url, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Не удалось загрузить заявки");
        setIsLoading(false);
        return;
      }

      setRequests((data as ContactRequest[]) ?? []);
      setIsLoading(false);
    };

    fetchRequests();
  }, []);

  return (
    <section className={styles.wrapper}>
      <Title>Заявки</Title>

      {error && <Text className={styles.error}>{error}</Text>}

      {isLoading ?
        <Text size="xs" mode="secondary">
          Загружаем...
        </Text>
      : requests.length === 0 ?
        <Text size="xs" mode="secondary">
          Заявок пока нет
        </Text>
      : <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Имя</th>
              <th>Контакты</th>
              <th>Сообщение</th>
              <th>Файл</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const fileUrls = pickFileUrls(request.file_url);

              return (
                <tr key={request.id}>
                  <td>
                    {new Date(request.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className={styles.name}>{request.name}</td>
                  <td>
                    {request.email && (
                      <div>
                        <a href={`mailto:${request.email}`}>{request.email}</a>
                      </div>
                    )}
                    {request.social && <div>{request.social}</div>}
                  </td>
                  <td className={styles.message}>{request.message}</td>
                  <td>
                    {fileUrls.length > 0 ?
                      <div>
                        {fileUrls.map((url) => (
                          <div key={url} style={{ marginBottom: 8 }}>
                            <FilePreview url={url} />
                          </div>
                        ))}
                      </div>
                    : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </section>
  );
};
