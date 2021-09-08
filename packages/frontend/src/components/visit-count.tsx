import React, { useEffect, useState } from 'react';
import { VisitCounterResponse } from '../../../api/src/visit-counter';

export const VisitCount: React.FC = () => {
  const number = useVisitCount();
  return (
    <p className="hit-count">
      {number && (
        <span className="hit-count-loaded">Viewed {number} times</span>
      )}
      &nbsp;
    </p>
  );
};

export function useVisitCount(): number {
  const [visitCount, setVisitCount] = useState<number | undefined>();

  useEffect(() => {
    async function func() {
      const host = /localhost/.test(window.location.host)
        ? 'https://cdk-crc-test.kellendonk.ca/api/visits'
        : '/api/visits';

      const res = await fetch(host);
      const resJson: VisitCounterResponse = await res.json();
      const hitCount = resJson.visitCount;
      setVisitCount(hitCount);
    }

    func();
  }, [setVisitCount]);

  return visitCount;
}
