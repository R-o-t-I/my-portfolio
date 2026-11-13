import type { MouseEvent } from "react";

import style from "./SelectOption.module.scss";

import { Text } from "@/components";

interface SelectOptionProps {
  children: string;
  isActive?: boolean;
  onClick?: () => void;
  onMouseDown?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: () => void;
}

const SelectOption = ({
  children,
  isActive = false,
  onClick,
  onMouseDown,
  onMouseEnter,
}: SelectOptionProps) => {
  return (
    <div
      className={`${style.wrapper} ${isActive ? style.active : ""}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      <Text>{children}</Text>
    </div>
  );
};

export default SelectOption;
