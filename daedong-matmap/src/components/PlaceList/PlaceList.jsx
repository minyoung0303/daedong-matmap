import LoadingSpinner from '../common/LoadingSpinner.jsx';
import Button from '../common/Button.jsx';
import Pagination from '../Pagination/Pagination.jsx';
import { SEARCH_STATUS } from '../../hooks/useSearchPlaces.js';
import { openExternalUrl } from '../../api/platform.js';
import { formatDistance } from '../../utils/format.js';
import styles from './PlaceList.module.css';

/**
 * 검색 결과 리스트. 한 페이지에 5개씩 보여주고 페이지네이션은 우측에 세로로 붙는다.
 *
 * UX/UI는 아직 확정 전이라 카드 한 장에 들어갈 정보만 구조로 잡아뒀다.
 * 표현 방식을 바꿀 때는 아래 map() 안쪽과 PlaceList.module.css만 손대면 된다.
 */
function PlaceList({
  pageItems = [],
  startIndex = 0,
  foundCount = 0,
  unfilteredCount = 0,
  totalCount = 0,
  truncated = false,
  filterLabel = '',
  status,
  errorMessage,
  selectedId,
  onSelect,
  onRetry,
  onClearFilter,
  page,
  totalPages,
  onPageChange,
}) {
  if (status === SEARCH_STATUS.IDLE) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderTitle}>무엇을 찾을까요?</p>
        <p className={styles.placeholderText}>
          위에서 장소나 음식 종류를 고르면 주변 2km를 찾아봐요. 가게 이름으로 직접 검색해도 돼요.
        </p>
      </div>
    );
  }

  if (status === SEARCH_STATUS.LOADING) {
    return <LoadingSpinner label="주변 장소를 찾고 있어요" />;
  }

  if (status === SEARCH_STATUS.ERROR) {
    return (
      <div className={styles.placeholder} role="alert">
        <p className={styles.placeholderTitle}>검색에 실패했어요</p>
        <p className={styles.placeholderText}>{errorMessage}</p>
        <Button onClick={onRetry}>다시 시도</Button>
      </div>
    );
  }

  if (foundCount === 0) {
    // 필터 때문에 비어 있는 경우와 검색 자체가 비어 있는 경우를 구분한다.
    if (filterLabel) {
      return (
        <div className={styles.placeholder}>
          <p className={styles.placeholderTitle}>{filterLabel}에 맞는 곳이 없어요</p>
          <p className={styles.placeholderText}>필터를 해제하면 주변 {unfilteredCount}곳을 볼 수 있어요.</p>
          <Button onClick={onClearFilter}>필터 해제</Button>
        </div>
      );
    }

    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderTitle}>결과가 없어요</p>
        <p className={styles.placeholderText}>다른 카테고리나 검색어로 찾아보세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.summary}>
        {filterLabel && <span className={styles.filterLabel}>{filterLabel}</span>}
        가까운 순 <strong>{foundCount}</strong>곳
        {filterLabel && <span className={styles.note}> / 전체 {unfilteredCount}곳 중</span>}
        {!filterLabel && truncated && <span className={styles.note}> (주변 {totalCount}곳 중 가까운 순)</span>}
      </p>

      <div className={styles.row}>
        <ul className={styles.list}>
          {pageItems.map((place, index) => {
            const isSelected = place.id === selectedId;

            return (
              <li key={place.id} className={isSelected ? styles.itemSelected : styles.item}>
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => onSelect?.(place.id)}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <span className={styles.rank}>{startIndex + index + 1}</span>

                  <span className={styles.body}>
                    <span className={styles.titleRow}>
                      <span className={styles.name}>{place.name}</span>
                      <span className={styles.distance}>{formatDistance(place.distance)}</span>
                    </span>

                    {place.category && <span className={styles.category}>{place.category}</span>}
                    {place.address && <span className={styles.address}>{place.address}</span>}
                    {place.phone && <span className={styles.phone}>{place.phone}</span>}
                  </span>
                </button>

                {place.placeUrl && (
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => openExternalUrl(place.placeUrl)}
                  >
                    카카오맵에서 보기
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>
    </div>
  );
}

export default PlaceList;
