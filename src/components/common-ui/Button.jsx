const colorClasses = {
  emphasis: 'bg-teal-strong text-white hover:bg-teal-strong/90',
  secondary: 'bg-teal-subtle text-teal-strong hover:bg-teal-subtle/80',
  neutral: 'bg-control-neutral text-text-secondary hover:bg-control-neutral-hover',
}

const heightClasses = {
  '54px': 'h-[54px] px-4',
  '48px': 'h-12 px-4',
  '46px': 'h-[46px] px-3',
  '38px': 'h-[38px] px-3',
}

const textStyleClasses = {
  body: 'text-body',
  label: 'text-label',
}

/** 너비 100% 버튼을 표시하고 높이, 색상, 텍스트 스타일을 props로 설정한다. */
export const Button = ({
  text = '',
  height = '48px',
  color = 'emphasis',
  textStyle = 'body',
  type = 'button',
  leadingIcon,
  className = '',
  ...props
}) => {
  const classes = [
    'inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong',
    heightClasses[height] ?? heightClasses['48px'],
    colorClasses[color] ?? colorClasses.emphasis,
    textStyleClasses[textStyle] ?? textStyleClasses.body,
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
      {text}
    </button>
  )
}
