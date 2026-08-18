import styles from './Pagination.module.css';

/**
 * 리스트 우측에 세로로 붙는 페이지네이션.
 * 스크롤해도 따라오도록 sticky로 고정한다.
 */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className={styles.pager} aria-label="리스트 페이지 이동">
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="이전 페이지"
      >
        <span aria-hidden="true">↑</span>
      </button>

      <ol className={styles.numbers}>
        {pages.map((number) => (
          <li key={number}>
            <button
              type="button"
              className={number === page ? styles.numberActive : styles.number}
              onClick={() => onChange(number)}
              aria-label={`${number}페이지`}
              aria-current={number === page ? 'page' : undefined}
            >
              {number}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        <span aria-hidden="true">↓</span>
      </button>
    </nav>
  );
}

export default Pagination;
