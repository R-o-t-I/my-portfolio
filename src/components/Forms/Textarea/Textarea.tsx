import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  type TextareaHTMLAttributes,
} from "react";

import styles from "./Textarea.module.scss";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  error?: boolean;
  onSubmit?: () => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      maxRows = 4,
      error,
      className = "",
      disabled,
      value: controlledValue,
      onChange,
      onFocus,
      onBlur,
      onSubmit,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState("");
    const localRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef =
      (ref as React.RefObject<HTMLTextAreaElement>) || localRef;

    const value = controlledValue ?? internalValue;
    const [focused, setFocused] = useState(false);

    const resize = (forceAutoHeight = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (forceAutoHeight) {
        textarea.style.height = "auto";
      }

      const computed = getComputedStyle(textarea);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const padding =
        parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);

      const collapsedHeight = lineHeight + padding;
      const maxHeight = lineHeight * maxRows + padding;
      const scrollHeight = textarea.scrollHeight;

      // ФИКС: Если поле пустое, игнорируем scrollHeight браузера и ставим базу.
      // Если не пустое, проверяем порог в 6px, чтобы не прыгала первая строка.
      const isEmpty = value.toString().trim() === "";

      const targetHeight =
        isEmpty || scrollHeight <= collapsedHeight + 6 ?
          collapsedHeight
        : Math.min(scrollHeight, maxHeight);

      textarea.style.transition = "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      textarea.style.height = `${targetHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    };

    useEffect(() => {
      if (focused) {
        resize(true);
      }
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      if (controlledValue === undefined) {
        setInternalValue(e.target.value);
      }
      resize();
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const computed = getComputedStyle(textarea);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const padding =
        parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);

      textarea.style.transition = "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      textarea.style.height = `${lineHeight + padding}px`;
      textarea.style.overflowY = "hidden";

      setFocused(false);
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setFocused(true);
      resize(true);
      onFocus?.(e);
    };

    return (
      <div
        className={`${styles.wrapper} ${error ? styles.status_error : ""} ${disabled ? styles.disabled : ""} ${className}`.trim()}
      >
        <textarea
          {...props}
          ref={textareaRef}
          value={value}
          disabled={disabled}
          className={styles.textarea}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !disabled) {
              e.preventDefault();
              onSubmit?.();
            }
            props.onKeyDown?.(e);
          }}
        />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
