import { useEffect, useState } from 'react';

export function useActiveAfterKeySequence(keySequence: string[]): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let i = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === keySequence[i]) {
        i++;
        if (i === keySequence.length) {
          setActive(true);
        }
      } else {
        i = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keySequence]);

  return active;
}