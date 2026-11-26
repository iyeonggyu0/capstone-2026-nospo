import { useState } from 'react'
import chevronLeft from '@/assets/icons/header/chevron-left.svg'
import { Logo } from '@/components/Logo'

/** 헤더 로고를 Figma의 22px 한 줄 헤더에 맞춰 작게 보여주는 클래스다. */
const LOGO_CLASS = 'gap-1 [&>span]:text-label [&>span]:leading-5.5'

/**
 * 단체 화면 맨 위의 한 줄 헤더다. 왼쪽에 로고(`onBack`이 있으면 뒤로가기 화살표와 함께), 오른쪽에 `진도 변경`을 둔다.
 * `진도 변경`을 누르면 현재 진도 기준으로 작성 중이라는 알림을 화면 아래에 띄우며, 진도를 실제로 바꾸는 동작은 아직 없다.
 * 공통 레이아웃의 기본 헤더 대신 단체 화면이 직접 그리므로, 클릭 영역은 최소 36px로 유지한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {() => void} [props.onBack] 뒤로가기를 눌렀을 때 실행. 없으면 화살표 없이 로고만 보여준다.
 * @param {number} [props.currentEpisode] 현재 진도(읽은 회차). 없으면 `진도 변경`은 비활성이다.
 * @param {string} [props.episodeUnit='화'] 진도 단위
 */
export const GroupHeader = ({ onBack, currentEpisode, episodeUnit = '화' }) => {
  const [notice, setNotice] = useState('')
  const logo = <Logo className={LOGO_CLASS} imageClassName="size-5.5" />

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-5">
        {onBack ? (
          <button
            aria-label="뒤로 가기"
            className="-my-2 -ml-2 flex min-h-9 min-w-9 items-center gap-2 pl-2 text-teal-strong"
            onClick={onBack}
            type="button"
          >
            <img alt="" aria-hidden="true" className="size-5" src={chevronLeft} />
            {logo}
          </button>
        ) : (
          logo
        )}
        <button
          className="-my-2 -mr-1 min-h-9 min-w-9 px-1 text-label font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentEpisode == null}
          onClick={() =>
            setNotice(`현재 진도 ${currentEpisode}${episodeUnit} 기준으로 작성 중이에요.`)
          }
          type="button"
        >
          진도 변경
        </button>
      </header>
      {notice && (
        <div
          className="fixed inset-x-5 bottom-36 z-20 mx-auto max-w-87.5 rounded-lg bg-text-primary px-4 py-3 text-label text-white"
          role="status"
        >
          <div className="flex items-center justify-between gap-3">
            <span>{notice}</span>
            <button
              aria-label="알림 닫기"
              className="-my-2 -mr-2 min-h-9 min-w-9 shrink-0 px-2"
              onClick={() => setNotice('')}
              type="button"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
