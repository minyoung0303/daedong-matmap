import { useCallback, useMemo, useState } from 'react';
import Map from './components/Map/Map.jsx';
import PlaceList from './components/PlaceList/PlaceList.jsx';
import PlaceSheet from './components/PlaceSheet/PlaceSheet.jsx';
import Search from './components/Search/Search.jsx';
import { useCurrentLocation, LOCATION_STATUS } from './hooks/useCurrentLocation.js';
import { useSearchPlaces } from './hooks/useSearchPlaces.js';
import { usePagination } from './hooks/usePagination.js';
import { CUISINES, DEFAULT_RADIUS, PLACE_GROUPS, countByCuisine, filterByCuisines } from './api/kakao.js';
import { DEFAULT_CENTER, PAGE_SIZE } from './config.js';
import { isInToss } from './api/platform.js';
import './App.css';

/** 토스앱/샌드박스 안인지. 렌더 중에 바뀌지 않는 값이라 모듈 수준에서 한 번만 구한다. */
const inToss = isInToss();

function App() {
  const { coords, status: locationStatus, message: locationMessage } = useCurrentLocation();
  const {
    places,
    status: searchStatus,
    errorMessage,
    totalCount,
    truncated,
    query,
    search,
    retry,
  } = useSearchPlaces();

  const [selectedCuisineIds, setSelectedCuisineIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // 상세 시트로 열어둔 장소. 지도 선택(selectedId)과 분리해서
  // 마커만 눌렀을 때는 시트가 뜨지 않고 지도만 이동하게 한다.
  const [sheetPlaceId, setSheetPlaceId] = useState(null);

  // 위치를 못 받으면 기본 좌표로 검색한다.
  const center = useMemo(() => coords ?? DEFAULT_CENTER, [coords]);

  const activeGroupCode = query?.type === 'category' ? query.value : null;
  const activeGroup = PLACE_GROUPS.find((group) => group.code === activeGroupCode) ?? null;

  // 음식 종류 필터는 밥집처럼 supportsCuisine이 켜진 종류에서만 쓴다.
  const showCuisines = Boolean(activeGroup?.supportsCuisine) && places.length > 0;

  // 필터는 이미 받아온 결과를 걸러내기만 한다. 추가 API 호출이 없다.
  const cuisineCounts = useMemo(() => (showCuisines ? countByCuisine(places) : {}), [showCuisines, places]);

  const visiblePlaces = useMemo(
    () => (showCuisines ? filterByCuisines(places, selectedCuisineIds) : places),
    [showCuisines, places, selectedCuisineIds]
  );

  const { page, totalPages, pageItems, startIndex, setPage, reset: resetPage } = usePagination(
    visiblePlaces,
    PAGE_SIZE
  );

  const filterLabel = useMemo(
    () =>
      CUISINES.filter((cuisine) => selectedCuisineIds.includes(cuisine.id))
        .map((cuisine) => cuisine.label)
        .join('·'),
    [selectedCuisineIds]
  );

  const runSearch = useCallback(
    (type, value, label) => {
      setSelectedId(null);
      setSheetPlaceId(null);
      setSelectedCuisineIds([]);
      resetPage();
      search({ type, value, label, center, radius: DEFAULT_RADIUS });
    },
    [center, resetPage, search]
  );

  const handleSearchGroup = useCallback((code, label) => runSearch('category', code, label), [runSearch]);

  const handleSearchKeyword = useCallback((keyword) => runSearch('keyword', keyword, keyword), [runSearch]);

  const handleRefresh = useCallback(() => {
    if (query) {
      runSearch(query.type, query.value, query.label);
    }
  }, [query, runSearch]);

  const handleToggleCuisine = useCallback(
    (cuisineId) => {
      setSelectedId(null);
      resetPage();
      setSelectedCuisineIds((current) =>
        current.includes(cuisineId) ? current.filter((id) => id !== cuisineId) : [...current, cuisineId]
      );
    },
    [resetPage]
  );

  const handleClearCuisines = useCallback(() => {
    setSelectedId(null);
    resetPage();
    setSelectedCuisineIds([]);
  }, [resetPage]);

  /** 지도 마커 클릭: 지도만 이동하고 시트는 열지 않는다. */
  const handleSelect = useCallback((id) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  /** 리스트 항목 클릭: 지도를 이동하고 상세 시트까지 연다. */
  const handleOpenSheet = useCallback((id) => {
    setSelectedId(id);
    setSheetPlaceId(id);
  }, []);

  const handleCloseSheet = useCallback(() => setSheetPlaceId(null), []);

  const handlePageChange = useCallback(
    (nextPage) => {
      setSelectedId(null);
      setSheetPlaceId(null);
      setPage(nextPage);
    },
    [setPage]
  );

  const headline = filterLabel || query?.label;
  const sheetPlace = useMemo(
    () => visiblePlaces.find((item) => item.id === sheetPlaceId) ?? null,
    [visiblePlaces, sheetPlaceId]
  );

  return (
    <div className="app">
      <header className="app__header">
        {/*
          토스 내비게이션 바가 앱 이름을 이미 보여주기 때문에 미니앱 안에서는 제목을 숨긴다.
          (출시 체크리스트: 내비게이션바 중앙에 브랜드 로고와 미니앱 이름이 표시돼요)
          브라우저에서 개발할 때는 내비바가 없으므로 그대로 보여준다.
        */}
        {!inToss && <h1 className="app__title">대동맛지도</h1>}
        <p className="app__subtitle">{headline ? `내 주변 ${headline}` : '내 주변 맛집을 찾아봐요'}</p>
      </header>

      <Search
        activeGroupCode={activeGroupCode}
        showCuisines={showCuisines}
        selectedCuisineIds={selectedCuisineIds}
        cuisineCounts={cuisineCounts}
        radius={DEFAULT_RADIUS}
        disabled={locationStatus === LOCATION_STATUS.LOADING}
        canRefresh={Boolean(query)}
        onSearchGroup={handleSearchGroup}
        onSearchKeyword={handleSearchKeyword}
        onToggleCuisine={handleToggleCuisine}
        onClearCuisines={handleClearCuisines}
        onRefresh={handleRefresh}
      />

      {locationMessage && (
        <p className="app__notice" role="status">
          {locationMessage}
        </p>
      )}

      {/* 지도에는 현재 페이지의 5곳만 찍는다. 45곳을 한꺼번에 찍으면 축척이 너무 넓어진다. */}
      <Map
        center={center}
        currentPosition={coords}
        places={pageItems}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      <main className="app__list">
        <PlaceList
          pageItems={pageItems}
          startIndex={startIndex}
          foundCount={visiblePlaces.length}
          unfilteredCount={places.length}
          totalCount={totalCount}
          truncated={truncated}
          filterLabel={filterLabel}
          status={searchStatus}
          errorMessage={errorMessage}
          selectedId={selectedId}
          onSelect={handleOpenSheet}
          onRetry={retry}
          onClearFilter={handleClearCuisines}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>

      {/* key를 주면 다른 장소를 열 때 시트가 새로 마운트되어 이전 상세가 남지 않는다. */}
      {sheetPlace && <PlaceSheet key={sheetPlace.id} place={sheetPlace} onClose={handleCloseSheet} />}
    </div>
  );
}

export default App;
