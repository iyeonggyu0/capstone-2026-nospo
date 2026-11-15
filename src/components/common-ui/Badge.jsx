const variantClasses = {
  book: 'bg-teal-subtle text-teal-strong',
  genre: 'bg-blue-info-light text-blue-info',
  token: 'bg-amber-background text-amber-foreground',
  progress: 'bg-teal-subtle text-teal-strong',
  review: 'bg-amber-background text-amber-foreground',
}

const markerClasses = {
  book: 'hidden',
  genre: 'hidden',
  token: 'size-2.5 rounded-full bg-amber-foreground',
  progress: 'hidden',
  review: 'hidden',
}

const ProgressIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" className="size-3.5">
    <path
      d="M8 1.5 13 3.4v3.8c0 3.2-2.1 5.8-5 7.3-2.9-1.5-5-4.1-5-7.3V3.4L8 1.5Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.3"
    />
    <path
      d="m5.8 7.7 1.5 1.5 2.9-3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.3"
    />
  </svg>
)

/** 도서 종류·토큰·진도·검수 상태를 짧게 표시하는 뱃지다. */
export const Badge = ({ variant = 'book', children, leadingIcon, className = '', ...props }) => (
  <span
    className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-label-sm font-medium ${variantClasses[variant] ?? variantClasses.book} ${className}`}
    {...props}
  >
    {leadingIcon || variant === 'progress' ? (
      <span
        aria-hidden="true"
        className="inline-flex size-3.5 shrink-0 items-center justify-center"
      >
        {leadingIcon ?? <ProgressIcon />}
      </span>
    ) : (
      <span aria-hidden="true" className={markerClasses[variant] ?? markerClasses.book} />
    )}
    {children}
  </span>
)
