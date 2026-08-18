import { useCallback, useState } from 'react';

/**
 * 리스트를 pageSize개씩 나눠 보여주는 페이지네이션 훅.
 *
 * page를 effect로 리셋하지 않고 렌더 중에 clamp한다.
 * (effect에서 setState를 하면 불필요한 렌더가 한 번 더 생긴다.)
 * 새 검색을 시작할 때는 호출부에서 reset()을 불러준다.
 */
export function usePagination(items = [], pageSize = 5) {
  const [requestedPage, setRequestedPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);

  const startIndex = (page - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  const reset = useCallback(() => setRequestedPage(1), []);

  return { page, totalPages, pageItems, startIndex, setPage: setRequestedPage, reset };
}
