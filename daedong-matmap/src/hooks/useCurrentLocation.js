import { useCallback, useEffect, useState } from 'react';
import { fetchCurrentLocation, LOCATION_ERROR } from '../api/location.js';

/**
 * 현재 위치를 가져오는 훅.
 * 실제 조회는 api/location.js가 담당한다. (토스 SDK / 브라우저 분기)
 *
 * 권한을 못 받아도 앱은 계속 동작해야 한다. (앱인토스 출시 체크리스트 항목)
 * 그래서 실패하면 호출부가 기본 좌표로 검색하도록 상태만 알려준다.
 */

export const LOCATION_STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed',
};

export function useCurrentLocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState(LOCATION_STATUS.LOADING);
  const [message, setMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentLocation()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setCoords(result);
        setStatus(LOCATION_STATUS.SUCCESS);
        setMessage('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setStatus(LOCATION_STATUS.FAILED);
        setMessage(error?.message ?? '현재 위치를 확인할 수 없습니다.');
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  /** 사용자가 직접 다시 요청할 때 사용한다. */
  const request = useCallback(() => {
    setStatus(LOCATION_STATUS.LOADING);
    setMessage('');
    setReloadToken((token) => token + 1);
  }, []);

  return { coords, status, message, request, LOCATION_ERROR };
}
