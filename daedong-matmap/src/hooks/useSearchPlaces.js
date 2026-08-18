import { useCallback, useRef, useState } from 'react';
import { DEFAULT_RADIUS, searchByCategory, searchByKeyword } from '../api/kakao.js';

/**
 * 장소 검색 상태를 관리하는 훅.
 * 로딩 / 성공 / 실패를 상태로 노출해서 리스트 UI가 분기할 수 있게 한다.
 */

export const SEARCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export function useSearchPlaces() {
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState(SEARCH_STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [truncated, setTruncated] = useState(false);

  // 버튼을 빠르게 여러 번 누르면 응답이 뒤섞일 수 있어서
  // 마지막 요청의 결과만 반영한다.
  const requestIdRef = useRef(0);

  const search = useCallback(async ({ type = 'category', value, label, center, radius = DEFAULT_RADIUS }) => {
    if (!center || !value) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus(SEARCH_STATUS.LOADING);
    setErrorMessage('');
    setQuery({ type, value, label, center, radius });

    try {
      const runner = type === 'category' ? searchByCategory : searchByKeyword;
      const result = await runner(value, {
        lat: center.lat,
        lng: center.lng,
        radius,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setPlaces(result.places);
      setTotalCount(result.totalCount);
      setTruncated(result.truncated);
      setStatus(SEARCH_STATUS.SUCCESS);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setPlaces([]);
      setTotalCount(0);
      setTruncated(false);
      setErrorMessage(error.message);
      setStatus(SEARCH_STATUS.ERROR);
    }
  }, []);

  const retry = useCallback(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  return { places, status, errorMessage, query, totalCount, truncated, search, retry };
}
