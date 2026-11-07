const themeClasses = {
  amber: 'bg-amber-background text-amber-foreground',
  teal: 'bg-teal-subtle text-text-secondary',
}

const iconLabels = {
  sparkles: '보상 안내',
  'shield-check': '보호 안내',
}

/** 아이콘 에셋을 전달받기 전에도 의미를 유지하는 안내 아이콘 자리다. */
const NoticeIcon = ({ iconType }) => {
  if (iconType === 'none') {
    return null
  }

  return (
    <span
      className="flex size-[17px] shrink-0 items-center justify-center text-label font-bold"
      aria-label={iconLabels[iconType]}
      role="img"
    >
      {iconType === 'shield-check' ? '✓' : '✦'}
    </span>
  )
}

/**
 * 안내의 표현·문구·아이콘을 직접 props로 받아 문맥에 맞게 조합하는 공통 컴포넌트다.
 * `icon`을 전달하면 `iconType`의 기본 아이콘 대신 서비스 아이콘을 사용한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} [props.content=''] 안내 문구
 * @param {'amber' | 'teal'} [props.theme='amber'] 안내 배경과 글자 색상 테마
 * @param {'sparkles' | 'shield-check' | 'none'} [props.iconType='none'] 기본 아이콘 타입
 * @param {import('react').ReactNode} [props.icon] 기본 아이콘을 대체할 React 노드
 * @param {string} [props.className=''] 컨테이너에 추가할 Tailwind 클래스
 * @returns {import('react').ReactElement} 안내 문구와 선택 아이콘을 담은 상태 영역
 */
export const Notice = ({
  content = '',
  theme = 'amber',
  iconType = 'none',
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex w-full items-center gap-2 overflow-hidden rounded-lg px-3 py-2.5 text-caption ${themeClasses[theme] ?? themeClasses.amber} ${className}`}
      role="status"
    >
      {icon ?? <NoticeIcon iconType={iconType} />}
      <p className="min-w-0 flex-1">{content}</p>
    </div>
  )
}
