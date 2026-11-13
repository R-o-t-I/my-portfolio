import { useEffect, useState, type RefObject } from "react";

// Расстояние от нижней границы элемента до низа окна браузера.
// listen: когда false — значение фиксируется без подписки на события.
export const useToBottomWindow = (
  ref: RefObject<HTMLElement | null>,
  listen = true,
): number => {
  const measure = () =>
    window.innerHeight - (ref.current?.getBoundingClientRect().bottom ?? 0);

  const [bottom, setBottom] = useState(measure);

  useEffect(() => {
    if (!listen) return;

    const handleChange = () => setBottom(measure());

    document.addEventListener("scroll", handleChange, { passive: true });
    window.addEventListener("resize", handleChange, { passive: true });

    return () => {
      document.removeEventListener("scroll", handleChange);
      window.removeEventListener("resize", handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen]);

  return bottom;
};
