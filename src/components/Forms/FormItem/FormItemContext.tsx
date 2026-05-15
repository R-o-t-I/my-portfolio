import { createContext, useContext } from "react";

interface FormItemContextProps {
  id: string;
  disabled?: boolean;
  isError?: boolean;
}

export const FormItemContext = createContext<FormItemContextProps | null>(null);
export const useFormItem = () => useContext(FormItemContext);
