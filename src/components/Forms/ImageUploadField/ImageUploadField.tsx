import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  FILE_ACCEPT_ATTR,
  getErrorMessage,
  getFileError,
  getSlugError,
  sanitizeFileName,
  sanitizePathSegment,
  sanitizeSlug,
  uploadProjectImage,
} from "@/utils";

import styles from "./ImageUploadField.module.scss";

import { Button } from "@/components";

interface ImageUploadFieldProps {
  value: string; // текущий URL (пустая строка = нет картинки)
  folder: string; // slug проекта
  fileName: string; // имя файла без расширения
  subfolder?: string; // необязательная подпапка, например "Screenshots/ios"
  onChange: (url: string) => void;
}

export const ImageUploadField = ({
  value,
  folder,
  fileName,
  subfolder,
  onChange,
}: ImageUploadFieldProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Живая ошибка слага: считается на каждом рендере
  const slugError = getSlugError(folder, t);
  const isSlugValid = slugError === null;

  const handleFile = async (file: File | undefined) => {
    if (!file || isUploading) return;

    if (!folder.trim()) {
      setError(t("admin.error.slug_required"));
      return;
    }

    const slugProblem = getSlugError(folder, t);
    const fileProblem = getFileError(file, t);

    if (slugProblem || fileProblem) {
      setError(slugProblem ?? fileProblem);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const cleanFolder = sanitizeSlug(folder);
      const cleanName = sanitizeFileName(fileName);
      // Подпапку чистим посегментно; регистр сохраняем — "Screenshots" не станет "screenshots"
      const cleanSubfolder = subfolder
        ?.split("/")
        .map((part) => sanitizePathSegment(part))
        .filter(Boolean)
        .join("/");
      const url = await uploadProjectImage(
        file,
        cleanSubfolder ? `${cleanFolder}/${cleanSubfolder}` : cleanFolder,
        cleanName,
      );

      if (isMounted.current) onChange(url);
    } catch (e) {
      if (isMounted.current) {
        setError(getErrorMessage(e, t("admin.error.file_upload")));
      }
    } finally {
      if (isMounted.current) setIsUploading(false);
    }
  };

  return (
    <div className={styles.field}>
      {value && (
        <div className={styles.preview}>
          <img src={value} alt="" />
          <button
            type="button"
            className={styles.remove}
            onClick={() => onChange("")}
            title={t("admin.upload.label_remove")}
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT_ATTR}
        style={{ display: "none" }}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ""; // чтобы повторный выбор того же файла сработал
        }}
      />
      <div className={styles.button_wrapper}>
        <Button
          type="button"
          disabled={isUploading || !isSlugValid}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ?
            t("admin.upload.button_uploading")
          : value ?
            t("admin.upload.button_replace")
          : t("admin.upload.button_upload")}
        </Button>
      </div>
      {(slugError ?? error) && (
        <span className={styles.error} role="alert">
          {slugError ?? error}
        </span>
      )}
    </div>
  );
};
