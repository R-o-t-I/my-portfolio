import { useCallback, useRef, useEffect } from "react";

export const useSound = (url: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Предзагрузка файла при монтировании компонента
    const audio = new Audio(url);
    audio.preload = "auto";
    audioRef.current = audio;
  }, [url]);

  const playSound = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 1;
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.warn("Ошибка воспроизведения:", err.message);
      });
    } else {
      console.error("Аудио объект не создан для пути:", url);
    }
  }, []);

  return playSound;
};
