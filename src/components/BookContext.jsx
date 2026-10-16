const captionSizeClasses = {
  label: 'text-label',
  caption: 'text-caption',
}

/**
 * 백엔드 도서 표지와 읽기·검수 상태를 함께 보여주는 공통 도서 컨텍스트 카드다.
 * 제목·초록 메타·작은 메타와 표지를 개별 props로 전달받아 데이터를 소유하지 않는다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.title 도서 제목
 * @param {string} props.accentText 초록색으로 강조할 읽기 또는 검수 상태 문구
 * @param {string} props.captionText 강조 문구 뒤에 표시할 작은 보조 문구
 * @param {string} [props.coverImageSrc] 백엔드가 제공하는 도서 표지 URL
 * @param {string} [props.coverImageAlt=''] 표지 이미지의 대체 텍스트
 * @param {'label' | 'caption'} [props.captionSize='caption'] 보조 문구의 글자 크기
 * @param {string} [props.className=''] 카드 컨테이너에 추가할 Tailwind 클래스
 * @returns {import('react').ReactElement} 도서 표지와 세 단계 텍스트 정보를 담은 카드
 */
export const BookContext = ({
  title,
  accentText,
  captionText,
  coverImageSrc,
  coverImageAlt = '',
  captionSize = 'caption',
  className = '',
}) => {
  return (
    <article className={`flex w-full items-center gap-3 rounded-xl bg-canvas p-3 ${className}`}>
      <div
        className="flex h-[94px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-border"
        role={coverImageSrc ? undefined : 'img'}
        aria-label={coverImageSrc ? undefined : '표지 이미지 준비 중'}
        style={
          coverImageSrc
            ? undefined
            : {
                backgroundImage:
                  'repeating-linear-gradient(-45deg, var(--color-canvas) 0 10px, var(--color-border) 10px 20px)',
              }
        }
      >
        {coverImageSrc ? (
          <img className="size-full object-cover" src={coverImageSrc} alt={coverImageAlt} />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-title-sm font-medium text-text-primary">{title}</h2>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-label whitespace-nowrap">
          <p className="shrink-0 font-medium text-teal-strong">{accentText}</p>
          <span className="shrink-0 text-text-secondary" aria-hidden="true">
            ·
          </span>
          <p
            className={`truncate ${captionSizeClasses[captionSize] ?? captionSizeClasses.caption} text-text-secondary`}
          >
            {captionText}
          </p>
        </div>
      </div>
    </article>
  )
}
