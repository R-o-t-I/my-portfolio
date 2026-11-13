import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  supabase,
  validateContactsForm,
  type FormDataState,
  type FormErrorsState,
} from "@/utils";

const INITIAL_FORM_STATE: FormDataState = {
  name: "",
  email: "",
  social: "",
  message: "",
  files: [],
};

const COOLDOWN_MS = 60 * 1000;
const STORAGE_KEY = "last_submit_timestamp";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ на файл
const MAX_FILES = 10;

// Превью создаём только для изображений; для остальных файлов — null
const createPreview = (file: File): string | null =>
  file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

export const useContactsForm = (
  onSuccess: () => void,
  onError: (err: unknown) => void,
) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_STATE);
  // Параллельно файлам: blob-ссылка на миниатюру или null
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [errors, setErrors] = useState<FormErrorsState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ссылка на актуальные превью для очистки при размонтировании
  const previewsRef = useRef<(string | null)[]>([]);
  previewsRef.current = previews;

  // Отзываем все blob-ссылки, когда форма уходит со страницы
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Управление кулдауном через единый интервал
  useEffect(() => {
    const checkExistingCooldown = () => {
      const lastSubmit = localStorage.getItem(STORAGE_KEY);
      if (!lastSubmit) return 0;

      const timePassed = Date.now() - Number(lastSubmit);
      const timeLeft = Math.ceil((COOLDOWN_MS - timePassed) / 1000);
      return timeLeft > 0 ? timeLeft : 0;
    };

    const initialTimeLeft = checkExistingCooldown();
    if (initialTimeLeft > 0) {
      setCooldownLeft(initialTimeLeft);
    }

    const intervalId = setInterval(() => {
      const timeLeft = checkExistingCooldown();

      if (timeLeft <= 0) {
        setCooldownLeft(0);
        localStorage.removeItem(STORAGE_KEY);
        clearInterval(intervalId);
      } else {
        setCooldownLeft(timeLeft);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isSubmitting]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrorsState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if ((name === "email" || name === "social") && errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    // ИСПРАВЛЕНО: сбрасываем input сразу, чтобы повторный выбор
    // тех же файлов снова вызвал onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!selectedFiles.length) return;

    const tooLarge: string[] = [];
    const valid: File[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) tooLarge.push(file.name);
      else valid.push(file);
    }

    // Не даём превысить лимит количества: лишнее отбрасываем
    const remaining = Math.max(0, MAX_FILES - formData.files.length);
    const accepted = valid.slice(0, remaining);
    const overflow = valid.slice(remaining);

    if (accepted.length) {
      setFormData((prev) => ({ ...prev, files: [...prev.files, ...accepted] }));
      setPreviews((prev) => [...prev, ...accepted.map(createPreview)]);
    }

    if (tooLarge.length) {
      setErrors((prev) => ({
        ...prev,
        file: t("form.error.file_too_large_multi", {
          names: tooLarge.join(", "),
          defaultValue: `Слишком большие файлы (максимум 10 МБ): {{names}}`,
        }),
      }));
    } else if (overflow.length) {
      setErrors((prev) => ({
        ...prev,
        file: t("form.error.file_too_many", {
          count: MAX_FILES,
          defaultValue: `Можно прикрепить не более ${MAX_FILES} файлов`,
        }),
      }));
    } else {
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleRemoveFile = (index: number) => {
    // Отзываем blob-ссылку удалённого файла, чтобы не течь памятью
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const generateFastId = (): string => {
    if (
      typeof window !== "undefined" &&
      typeof window.crypto?.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }
    return (
      Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
    );
  };

  const uploadFile = async (file: File): Promise<string> => {
    const lastDotIndex = file.name.lastIndexOf(".");
    const fileExt =
      lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1) : "";
    const fileName = `${generateFastId()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (cooldownLeft > 0) return;

    const formErrors = validateContactsForm(formData, t);

    if (Object.keys(formErrors).length > 0 || errors.file) {
      setErrors((prev) => ({ ...prev, ...formErrors }));
      return;
    }

    const currentFormData = { ...formData };

    try {
      setIsSubmitting(true);

      // ИЗМЕНЕНО: грузим все файлы параллельно
      const uploadedFileUrls =
        currentFormData.files.length ?
          await Promise.all(currentFormData.files.map(uploadFile))
        : null;

      const { error: insertError } = await supabase.from("contacts").insert([
        {
          name: currentFormData.name.trim(),
          email: currentFormData.email.trim() || null,
          social: currentFormData.social.trim() || null,
          message: currentFormData.message.trim(),
          file_url: uploadedFileUrls, // массив URL или null
        },
      ]);

      if (insertError) throw insertError;

      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCooldownLeft(COOLDOWN_MS / 1000);

      // Отзываем превью успешно отправленных файлов
      previewsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      setFormData(INITIAL_FORM_STATE);
      setPreviews([]);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";

      onSuccess();
    } catch (err) {
      onError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    previews,
    errors,
    isSubmitting,
    cooldownLeft,
    fileInputRef,
    handleChange,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
  };
};
