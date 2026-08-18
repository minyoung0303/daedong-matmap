import { useState } from 'react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import { CUISINES, PLACE_GROUPS } from '../../api/kakao.js';
import styles from './Search.module.css';

/**
 * 검색 영역.
 *
 * 1) 자유 키워드 검색
 * 2) 장소 종류 (밥집 / 카페 / 편의점) - 카카오 카테고리 그룹 코드로 검색
 * 3) 음식 종류 - 밥집을 선택했을 때만 노출되는 다중 선택 필터.
 *    새로 검색하지 않고 이미 받아온 결과를 걸러낸다.
 */
function Search({
  activeGroupCode,
  showCuisines = false,
  selectedCuisineIds = [],
  cuisineCounts = {},
  radius,
  disabled = false,
  canRefresh = false,
  onSearchGroup,
  onSearchKeyword,
  onToggleCuisine,
  onClearCuisines,
  onRefresh,
}) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = keyword.trim();

    if (trimmed) {
      onSearchKeyword(trimmed);
    }
  };

  return (
    <div className={styles.bar}>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <Input
          ariaLabel="가게 이름이나 메뉴 검색"
          placeholder="가게 이름, 메뉴로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          disabled={disabled}
          enterKeyHint="search"
        />
        <Button type="submit" disabled={disabled || !keyword.trim()}>
          검색
        </Button>
      </form>

      <div className={styles.groups} role="group" aria-label="장소 종류">
        {PLACE_GROUPS.map(({ id, code, label }) => (
          <Button
            key={id}
            active={activeGroupCode === code}
            disabled={disabled}
            onClick={() => onSearchGroup(code, label)}
          >
            {label}
          </Button>
        ))}
      </div>

      {showCuisines && (
        <div className={styles.chips} role="group" aria-label="음식 종류 필터 (여러 개 선택 가능)">
          <Button
            variant="chip"
            size="sm"
            active={selectedCuisineIds.length === 0}
            onClick={onClearCuisines}
          >
            전체
          </Button>

          {CUISINES.map(({ id, label }) => {
            const count = cuisineCounts[id] ?? 0;

            return (
              <Button
                key={id}
                variant="chip"
                size="sm"
                active={selectedCuisineIds.includes(id)}
                disabled={count === 0}
                onClick={() => onToggleCuisine(id)}
              >
                {label}
                <span className={styles.count}>{count}</span>
              </Button>
            );
          })}
        </div>
      )}

      <div className={styles.meta}>
        <span className={styles.radius}>반경 {radius / 1000}km</span>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={disabled || !canRefresh}>
          현재 위치로 다시 검색
        </Button>
      </div>
    </div>
  );
}

export default Search;
