const variantClasses = {
  primary: 'bg-teal-main text-white hover:bg-teal-main/90',
  emphasis: 'bg-teal-strong text-white hover:bg-teal-strong/90',
  secondary: 'bg-teal-subtle text-teal-strong hover:bg-teal-subtle/80',
  neutral: 'bg-[#eef1ef] text-text-secondary hover:bg-[#e5eae7]',
  text: 'bg-transparent text-teal-strong hover:bg-teal-subtle/60',
}

const sizeClasses = {
  54: 'h-[54px] px-4',
  48: 'h-12 px-4',
  44: 'h-11 px-3',
  38: 'h-[38px] px-3',
}

/** 주요 진행과 보조 행동에 사용하는 재사용 버튼이다. */
export const Button = ({
  children,
  variant = 'primary',
  size = 48,
  type = 'button',
  leadingIcon,
  className = '',
  ...props
}) => {
  const classes = [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-body font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong',
    variantClasses[variant] ?? variantClasses.primary,
    sizeClasses[size] ?? sizeClasses[48],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {leadingIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leadingIcon}
        </span>
      )}
      {children}
    </button>
  )
}
