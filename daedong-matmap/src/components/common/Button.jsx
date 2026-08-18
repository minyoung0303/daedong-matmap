import styles from './Button.module.css';

/**
 * 공통 버튼.
 *
 * active를 넘기면 토글 버튼으로 취급해서 aria-pressed를 붙인다.
 * (넘기지 않으면 aria-pressed 없이 일반 버튼으로 렌더된다.)
 */
function Button({ children, type = 'button', variant = 'solid', size = 'md', active, className = '', ...rest }) {
  const classNames = [styles.button, styles[variant], styles[size], active ? styles.active : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classNames} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}

export default Button;
