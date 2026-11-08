/** 요약 카드 크기(large·small)별 클래스 모음이다. */
const sizeStyles = {
  large: {
    avatar: 'size-[132px]',
    name: 'text-headline font-bold',
    value: 'text-body font-medium',
  },
  small: {
    avatar: 'size-20',
    name: 'text-title font-bold',
    value: 'text-body',
  },
}

/** 단체 이미지를 보여주고, 이미지가 없으면 글자 없이 연한 빈 상자로 자리를 채운다. */
const SummaryAvatar = ({ imageUrl, className }) => {
  if (imageUrl) {
    return <img className={`shrink-0 rounded-lg object-cover ${className}`} src={imageUrl} alt="" />
  }

  return (
    <div
      className={`shrink-0 rounded-lg bg-control-neutral ${className}`}
      role="img"
      aria-label="단체 이미지 준비 중"
    />
  )
}

/** `규모`, `인원`처럼 항목 이름과 값을 한 줄로 보여준다. */
const SummaryRow = ({ label, value, valueClassName }) => (
  <div className="flex items-center gap-2">
    <span className="w-9 shrink-0 text-caption text-text-secondary">{label}</span>
    <span className={`min-w-0 flex-1 text-text-primary ${valueClassName}`}>{value}</span>
  </div>
)

/**
 * 단체의 이미지, 이름, 규모, 인원을 요약해서 보여준다.
 * 상세 화면 머리에는 `large`, 관계 목록의 항목에는 `small`을 사용한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.name 단체 이름
 * @param {string} [props.scale] 단체 규모 (예: 중)
 * @param {number} [props.memberCount] 인원 수
 * @param {string} [props.imageUrl] 단체 대표 이미지 주소
 * @param {'large' | 'small'} [props.size='large'] 요약 크기
 * @param {string} [props.className=''] 컨테이너에 추가할 Tailwind 클래스
 */
export const GroupSummary = ({
  name,
  scale,
  memberCount,
  imageUrl,
  size = 'large',
  className = '',
}) => {
  const styles = sizeStyles[size] ?? sizeStyles.large
  const NameTag = size === 'large' ? 'h2' : 'h4'

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <SummaryAvatar className={styles.avatar} imageUrl={imageUrl} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <NameTag className={`truncate text-text-primary ${styles.name}`}>{name}</NameTag>
        {scale != null && <SummaryRow label="규모" value={scale} valueClassName={styles.value} />}
        {memberCount != null && (
          <SummaryRow label="인원" value={`${memberCount}명`} valueClassName={styles.value} />
        )}
      </div>
    </div>
  )
}
