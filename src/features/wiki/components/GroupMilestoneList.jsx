import { useId, useRef, useState } from 'react'
import plusSmallIcon from '@/assets/icons/wiki/plus-small.svg'
import {
  MILESTONE_MAX_LENGTH,
  getUnlockLabel,
  validateMilestoneContent,
  validateUnlockEpisode,
} from '../utils'

/** 새 행적을 추가하는 중임을 나타내는 편집 대상 값이다. */
const NEW_MILESTONE = 'new'

/**
 * 주요 행적의 내용과 등장 회차를 입력하는 한 줄 폼이다.
 * 검증을 통과해야 저장되며, 실패하면 첫 오류 칸으로 포커스를 옮기고 오류 문구를 연결한다.
 */
const MilestoneEditRow = ({
  initialContent = '',
  initialEpisode = '',
  maxEpisode,
  episodeUnit,
  onSave,
  onCancel,
}) => {
  const baseId = useId()
  const contentRef = useRef(null)
  const episodeRef = useRef(null)
  const [content, setContent] = useState(initialContent)
  const [episode, setEpisode] = useState(String(initialEpisode))
  const [errors, setErrors] = useState({})

  /** 입력을 검사하고 통과하면 저장한다. */
  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {
      content: validateMilestoneContent(content),
      episode: validateUnlockEpisode(episode, { max: maxEpisode, unit: episodeUnit }),
    }
    setErrors(nextErrors)

    if (nextErrors.content) {
      contentRef.current?.focus()
      return
    }
    if (nextErrors.episode) {
      episodeRef.current?.focus()
      return
    }

    onSave({ content, unlockEpisode: Number(episode) })
  }

  return (
    <li>
      <form className="flex min-h-10 items-center gap-2.5" noValidate onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={`${baseId}-content`}>
          행적 내용
        </label>
        <input
          aria-describedby={errors.content ? `${baseId}-content-error` : undefined}
          aria-invalid={Boolean(errors.content) || undefined}
          className="min-w-0 flex-1 bg-transparent text-body-sm text-text-primary placeholder:text-text-muted"
          id={`${baseId}-content`}
          maxLength={MILESTONE_MAX_LENGTH}
          onChange={(event) => setContent(event.target.value)}
          placeholder="추가할 내용을 입력하세요."
          ref={contentRef}
          value={content}
        />
        <label className="sr-only" htmlFor={`${baseId}-episode`}>
          등장 회차
        </label>
        <input
          aria-describedby={errors.episode ? `${baseId}-episode-error` : undefined}
          aria-invalid={Boolean(errors.episode) || undefined}
          className="w-9 shrink-0 bg-transparent text-right text-caption-sm text-text-secondary placeholder:text-text-muted"
          id={`${baseId}-episode`}
          inputMode="numeric"
          onChange={(event) => setEpisode(event.target.value)}
          placeholder={`n${episodeUnit}`}
          ref={episodeRef}
          value={episode}
        />
        <div className="-mr-1 flex shrink-0 items-center text-label font-medium">
          <button className="-my-0.5 min-h-11 px-1 text-blue-action" type="submit">
            저장
          </button>
          <button
            className="-my-0.5 min-h-11 px-1 text-red-destructive"
            onClick={onCancel}
            type="button"
          >
            취소
          </button>
        </div>
      </form>
      {errors.content && (
        <p className="text-caption text-red-error" id={`${baseId}-content-error`} role="alert">
          {errors.content}
        </p>
      )}
      {errors.episode && (
        <p className="text-caption text-red-error" id={`${baseId}-episode-error`} role="alert">
          {errors.episode}
        </p>
      )}
    </li>
  )
}

/**
 * 단체의 주요 행적을 해금 시점과 함께 최신 순으로 보여준다. 행적이 없으면 빈 상태 문구를 표시한다.
 * `editable`이면 입력 줄, `편집`·`삭제` 버튼, 하단 `추가 +`가 나타나며 한 번에 한 줄만 편집한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {Array<{ id: string, content: string, unlockLabel?: string, unlockEpisode?: number }>} [props.milestones=[]] 행적 목록
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {number} [props.maxEpisode] 읽은 진도. 등장 회차의 최댓값이다.
 * @param {boolean} [props.editable=false] 편집 컨트롤 표시 여부
 * @param {(input: { content: string, unlockEpisode: number }) => void} [props.onAdd] 새 행적을 저장할 때 실행
 * @param {(id: string, input: { content: string, unlockEpisode: number }) => void} [props.onUpdate] 행적을 고쳐 저장할 때 실행
 * @param {(id: string) => void} [props.onRemove] `삭제`를 눌렀을 때 실행
 */
export const GroupMilestoneList = ({
  milestones = [],
  episodeUnit = '화',
  maxEpisode,
  editable = false,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const [editingId, setEditingId] = useState(null)
  const sortedMilestones = [...milestones].sort(
    (a, b) => (b.unlockEpisode ?? 0) - (a.unlockEpisode ?? 0),
  )
  const showEmpty = milestones.length === 0 && editingId !== NEW_MILESTONE

  return (
    <section className="flex flex-col gap-1.5 p-3" aria-labelledby="group-milestones-title">
      <div className="flex items-center justify-between">
        <h3 className="text-title-sm font-medium text-text-primary" id="group-milestones-title">
          주요 행적
        </h3>
        {milestones.length > 0 && (
          <span className="text-caption-sm font-medium text-text-muted">최신 순</span>
        )}
      </div>
      {showEmpty && (
        <p className="py-8 text-center text-body text-text-secondary">아직 등록된 행적이 없어요.</p>
      )}
      {(milestones.length > 0 || editingId === NEW_MILESTONE) && (
        <ul>
          {editingId === NEW_MILESTONE && (
            <MilestoneEditRow
              episodeUnit={episodeUnit}
              maxEpisode={maxEpisode}
              onCancel={() => setEditingId(null)}
              onSave={(input) => {
                onAdd?.(input)
                setEditingId(null)
              }}
            />
          )}
          {sortedMilestones.map((milestone) =>
            editingId === milestone.id ? (
              <MilestoneEditRow
                episodeUnit={episodeUnit}
                initialContent={milestone.content}
                initialEpisode={milestone.unlockEpisode ?? ''}
                key={milestone.id}
                maxEpisode={maxEpisode}
                onCancel={() => setEditingId(null)}
                onSave={(input) => {
                  onUpdate?.(milestone.id, input)
                  setEditingId(null)
                }}
              />
            ) : (
              <li className="flex h-10 items-center gap-2.5" key={milestone.id}>
                <p className="min-w-0 flex-1 text-body-sm text-text-primary">{milestone.content}</p>
                <span className="min-w-7 shrink-0 text-right text-caption-sm text-text-secondary opacity-68">
                  {getUnlockLabel(milestone, episodeUnit)}
                </span>
                {editable && (
                  <div className="-mr-1 flex shrink-0 items-center text-label font-medium">
                    <button
                      aria-label={`${milestone.content} 편집`}
                      className="-my-0.5 min-h-11 px-1 text-teal-strong"
                      onClick={() => setEditingId(milestone.id)}
                      type="button"
                    >
                      편집
                    </button>
                    {onRemove && (
                      <button
                        aria-label={`${milestone.content} 삭제`}
                        className="-my-0.5 min-h-11 px-1 text-red-destructive"
                        onClick={() => onRemove(milestone.id)}
                        type="button"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}
      {editable && (
        <button
          className="mx-auto -my-3.5 flex min-h-11 items-center gap-1.5 text-caption font-medium text-text-muted"
          onClick={() => setEditingId(NEW_MILESTONE)}
          type="button"
        >
          추가
          <img alt="" src={plusSmallIcon} />
        </button>
      )}
    </section>
  )
}
