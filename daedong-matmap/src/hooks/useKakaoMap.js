import { useEffect, useRef, useState } from 'react';
import { loadKakaoSdk } from '../api/kakao.js';

/**
 * 지도 인스턴스 생성과 생명주기만 담당하는 훅.
 * 마커 같은 오버레이는 지도를 넘겨받은 쪽(Map 컴포넌트)에서 관리한다.
 *
 * @param {{ initialCenter: {lat:number, lng:number}, level?: number }} params
 */
export function useKakaoMap({ initialCenter, level = 5 }) {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 지도는 최초 1회만 생성한다. 이후 중심 이동은 Map 컴포넌트가 처리한다.
  const initialCenterRef = useRef(initialCenter);

  useEffect(() => {
    let cancelled = false;

    loadKakaoSdk()
      .then((kakao) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        const center = initialCenterRef.current;
        const instance = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });

        setMap(instance);
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [level]);

  return { containerRef, map, errorMessage };
}
