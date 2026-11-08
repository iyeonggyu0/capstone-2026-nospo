import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/common-ui'
import { EpisodeField } from '@/components/input'
import { GROUP_NAME_MAX_LENGTH, validateGroupName, validateUnlockEpisode } from '../utils'

/**
 * 새 단체의 이름과 등장 회차를 입력받는 모달이다.
 * 네이티브 `<dialog>`를 모달로 열어 포커스 이동과 ESC 닫기를 브라우저가 처리한다.
 * 부모가 이 컴포넌트를 렌더링하는 동안만 열려 있으며, 닫을 때는 `onClose`로 부모가 제거한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string[]} [props.existingNames=[]] 이미 목록에 있는 단체 이름 (중복 검사용)
 * @param {number} [props.maxEpisode] 읽은 진도. 등장 회차의 최댓값이다.
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {(input: { name: string, unlockEpisode: number }) => void} props.onSubmit 검증을 통과한 입력을 전달받는다.
 * @param {() => void} props.onClose 모달이 닫혀야 할 때 실행
 */
export const GroupAddModal = ({
  existingNames = [],
  maxEpisode,
  episodeUnit = '화',
  onSubmit,
  onClose,
}) => {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const episodeRef = useRef(null)
  const baseId = useId()
  const nameErrorId = `${baseId}-name-error`
  const episodeErrorId = `${baseId}-episode-error`
  const [name, setName] = useState('')
  const [episode, setEpisode] = useState('1')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  /** 입력을 검사해 첫 오류 칸으로 포커스를 옮기고, 통과하면 추가한 뒤 닫는다. */
  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {
      name: validateGroupName(name, existingNames),
      episode: validateUnlockEpisode(episode, { max: maxEpisode, unit: episodeUnit }),
    }
    setErrors(nextErrors)

    if (nextErrors.name) {
      nameRef.current?.focus()
      return
    }
    if (nextErrors.episode) {
      episodeRef.current?.focus()
      return
    }

    onSubmit({ name, unlockEpisode: Number(episode) })
    onClose()
  }

  /** 이름 칸에서 Enter를 누르면 줄바꿈 대신 추가를 시도한다. */
  const handleNameKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <dialog
      aria-labelledby={`${baseId}-title`}
      className="m-auto w-79.5 max-w-[calc(100vw-2rem)] rounded-xl bg-surface p-0 text-text-primary backdrop:bg-text-primary/35 backdrop:backdrop-blur-[1.5px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <form className="flex flex-col gap-3 p-6" noValidate onSubmit={handleSubmit}>
        <h2 className="text-title font-bold" id={`${baseId}-title`}>
          신규 단체 추가
        </h2>
        <div>
          <label className="sr-only" htmlFor={`${baseId}-name`}>
            단체 이름
          </label>
          <textarea
            aria-describedby={errors.name ? nameErrorId : undefined}
            aria-invalid={Boolean(errors.name) || undefined}
            className="h-15 w-full resize-none rounded-sm bg-canvas p-2.5 text-caption text-text-primary placeholder:text-text-muted"
            id={`${baseId}-name`}
            maxLength={GROUP_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={handleNameKeyDown}
            placeholder="단체 이름을 입력하세요."
            ref={nameRef}
            value={name}
          />
          {errors.name && (
            <p className="mt-1 text-caption text-red-error" id={nameErrorId} role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <EpisodeField
            aria-describedby={errors.episode ? episodeErrorId : undefined}
            aria-invalid={Boolean(errors.episode) || undefined}
            onChange={(event) => setEpisode(event.target.value)}
            prefix="등장 회차"
            ref={episodeRef}
            unit={episodeUnit}
            value={episode}
          />
          {errors.episode && (
            <p
              className="mt-1 text-center text-caption text-red-error"
              id={episodeErrorId}
              role="alert"
            >
              {errors.episode}
            </p>
          )}
        </div>
        <Button className="mt-3" height="38px" text="추가" type="submit" />
      </form>
    </dialog>
  )
}
