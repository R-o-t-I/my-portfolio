import { supabase } from "./index";

const BUCKET = "portfolio";

// Загружает файл в папку проекта (по slug) и возвращает публичный URL.
// fileName фиксированный — "Logo" или "Snippet", поэтому upsert перезапишет старый файл.
export const uploadProjectImage = async (
  file: File,
  folder: string, // slug проекта
  fileName: string, // "Logo" | "Snippet"
): Promise<string> => {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${folder}/${fileName}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) throw new Error("Не удалось загрузить изображение");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
