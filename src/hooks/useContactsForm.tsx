import { useState, useRef, useEffect } from "react";
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
  file: null,
};

const COOLDOWN_MS = 60 * 1000;
const STORAGE_KEY = "last_submit_timestamp";

export const useContactsForm = (
  onSuccess: () => void,
  onError: (err: unknown) => void,
) => {
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrorsState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Оптимизированное управление кулдауном через единый интервал
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
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: "Файл слишком большой. Максимум 10 МБ",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, file: selectedFile }));
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    const formErrors = validateContactsForm(formData);
    if (Object.keys(formErrors).length > 0 || errors.file) {
      setErrors((prev) => ({ ...prev, ...formErrors }));
      return;
    }

    const currentFormData = { ...formData };

    try {
      setIsSubmitting(true);
      let uploadedFileUrl = null;

      if (currentFormData.file) {
        uploadedFileUrl = await uploadFile(currentFormData.file);
      }

      const { error: insertError } = await supabase.from("contacts").insert([
        {
          name: currentFormData.name.trim(),
          email: currentFormData.email.trim() || null,
          social: currentFormData.social.trim() || null,
          message: currentFormData.message.trim(),
          file_url: uploadedFileUrl,
        },
      ]);

      if (insertError) throw insertError;

      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCooldownLeft(COOLDOWN_MS / 1000);

      // Сначала очищаем форму в UI, чтобы всё отвисло мгновенно
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Вызываем алерт только после полной очистки состояния формы
      onSuccess();
    } catch (err) {
      onError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
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
