import chevronLeft from '@/assets/icons/header/chevron-left.svg'
import { Logo } from '@/components/Logo'

/** 화면 제목·보조 설명·오른쪽 행동을 조합하는 공통 헤더다. */
export const Header = ({
  variant = 'main',
  title,
  subtitle,
  showBackButton = false,
  rightContent,
  onBack,
  compact = false,
}) => {
  const showBack = variant === 'back' || showBackButton

  if (variant === 'context') {
    return (
      <header
        className="flex h-[22px] w-full items-center justify-between px-5"
        aria-label={title ?? 'NOSPO'}
      >
        <p className="text-title leading-6 font-medium text-teal-strong">{title ?? 'NOSPO'}</p>
        {rightContent && (
          <div className="text-label leading-[18px] text-text-primary">{rightContent}</div>
        )}
      </header>
    )
  }

  return (
    <header
      className={`flex w-full gap-3 px-5 pt-5 ${compact ? 'h-16' : 'h-[76px]'} ${showBack ? 'items-center' : 'items-start'}`}
      aria-label={title ?? 'NOSPO'}
    >
      {showBack && (
        <button
          className="-m-2 flex size-9 shrink-0 cursor-pointer items-center justify-center p-2"
          type="button"
          aria-label="뒤로 가기"
          onClick={onBack}
        >
          <img src={chevronLeft} alt="" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <h1 className="text-title leading-7 font-bold text-text-primary">{title}</h1>
            {subtitle && <p className="text-caption leading-4 text-text-secondary">{subtitle}</p>}
          </>
        ) : (
          <Logo />
        )}
      </div>
      {rightContent && (
        <div className="shrink-0 text-label leading-[18px] font-medium text-text-secondary">
          {rightContent}
        </div>
      )}
    </header>
  )
}
