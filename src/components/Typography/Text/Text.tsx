import styles from "./Text.module.scss";

interface TextProps {
  variant?: "p" | "span" | "label";
  mode?: "primary" | "secondary" | "accent";
  size?: "xs" | "sm" | "md" | "lg";
  align?: "left" | "center" | "right" | "justify";
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
  noWrap?: boolean;
}

export const Text = ({
  variant = "p",
  mode = "primary",
  size = "md",
  align = "left",
  children,
  className = "",
  uppercase = false,
  noWrap = false,
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
        ${noWrap && styles.noWrap}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};
