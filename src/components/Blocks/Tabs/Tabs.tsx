import React, { useRef, useEffect } from "react";
import styles from "./Tabs.module.scss";
import { type TabsItemProps } from "./TabsItem/TabsItem";

interface TabsProps {
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  mode?: "default" | "secondary" | "accent";
  layoutFillMode?: "auto" | "stretched" | "shrinked";
  withScrollToSelectedTab?: boolean;
  getRootRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({
  selectedId,
  onSelectedIdChange,
  mode = "accent",
  layoutFillMode = "auto",
  withScrollToSelectedTab = true,
  getRootRef,
  children,
  className = "",
}: TabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (withScrollToSelectedTab && selectedId) {
      const activeTab = document.getElementById(selectedId);
      if (activeTab && containerRef.current?.contains(activeTab)) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [selectedId, withScrollToSelectedTab]);

  return (
    <div
      ref={getRootRef || containerRef}
      className={`
        ${styles.tabs_container}
        ${styles[`fill_${layoutFillMode}`]}
        ${className}
      `.trim()}
      role="tablist"
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<TabsItemProps>(child)) return null;

        const anyChild = child as any;

        return React.cloneElement(anyChild, {
          selected: child.props.id === selectedId,
          className:
            `${styles.inherited_item} ${child.props.className || ""}`.trim(),
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (child.props.onClick) child.props.onClick(e);
            if (onSelectedIdChange && child.props.id) {
              onSelectedIdChange(child.props.id);
            }
          },
          "data-mode": mode,
        });
      })}
    </div>
  );
};
