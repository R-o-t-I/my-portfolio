import styles from "./Title.module.scss";

interface TitleProps {
  variant?: "p" | "span" | "label";
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right" | "justify";
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
}

export const Title = ({
  variant = "p",
  size = "md",
  align = "left",
  children,
  className = "",
  uppercase = false,
}: TitleProps) => {
  const Component = variant;

  return (
    <Component
      className={`
        ${styles.title}
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
