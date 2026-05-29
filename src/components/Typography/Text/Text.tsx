import styles from "./Text.module.scss";

interface TextProps {
  variant?: "p" | "span" | "label";
  mode?: "primary" | "secondary" | "accent";
  size?: "xs" | "sm" | "md" | "lg";
  align?: "left" | "center" | "right" | "justify";
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
}

export const Text = ({
  variant = "p",
  mode = "primary",
  size = "md",
  align = "left",
  children,
  className = "",
  uppercase = false,
}: TextProps) => {
  const Component = variant;

  return (
    <Component
      className={`
        ${styles.text}
        ${styles[`mode_${mode}`]}
        ${styles[`size_${size}`]}
        ${styles[`align_${align}`]}
        ${uppercase && styles.uppercase}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};
