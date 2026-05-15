import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useContext,
  useImperativeHandle,
  type TextareaHTMLAttributes,
} from "react";

import { FormItemContext } from "../FormItem/FormItemContext";

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
      id,
      disabled: externalDisabled,
      value: controlledValue,
      onChange,
      onFocus,
      onBlur,
      onSubmit,
      ...props
    },
    ref,
  ) => {
    // Подключаем контекст формы
    const context = useContext(FormItemContext);

    // Приоритет: явные пропсы -> контекст формы -> undefined
    const finalId = id || context?.id;
    const finalDisabled = externalDisabled || context?.disabled;

    const [internalValue, setInternalValue] = useState("");
    const localRef = useRef<HTMLTextAreaElement>(null);

    // Безопасное объединение внешнего ref и внутреннего localRef
    useImperativeHandle(ref, () => localRef.current!);

    const value = controlledValue ?? internalValue;
    const [focused, setFocused] = useState(false);

    const resize = (forceAutoHeight = false) => {
      const textarea = localRef.current;
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
      const textarea = localRef.current;
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
        className={`${styles.wrapper} ${error ? styles.status_error : ""} ${finalDisabled ? styles.disabled : ""} ${className}`.trim()}
      >
        <textarea
          {...props}
          id={finalId}
          ref={localRef}
          value={value}
          disabled={finalDisabled}
          className={styles.textarea}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (
              (e.metaKey || e.ctrlKey) &&
              e.key === "Enter" &&
              !finalDisabled
            ) {
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
