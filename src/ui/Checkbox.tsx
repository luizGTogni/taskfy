import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  'aria-label'?: string;
}

export function Checkbox({ checked, onChange, ...rest }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={`${styles.box} ${checked ? styles.checked : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      {...rest}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5L6.5 12L13 4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
