import { Link } from 'react-router-dom'

/** 배경 없이 텍스트 위계만 적용하는 내부 이동 링크다. */
export const TextLink = ({ children, className = '', ...props }) => (
  <Link
    className={`inline-flex min-h-9 w-fit items-center px-3 text-label font-medium text-teal-strong hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong ${className}`}
    {...props}
  >
    {children}
  </Link>
)
