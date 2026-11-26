import { useState } from 'react'
import plusIcon from '@/assets/icons/wiki/plus.svg'
import sparklesIcon from '@/assets/icons/wiki/sparkles.svg'
import { BookContext } from '@/components/BookContext'
import { Notice } from '@/components/Notice'
import { Button, WikiCategory } from '@/components/common-ui'
import {
  PROGRESS_HINT,
  REWARD_NOTICE,
  SAVE_DRAFT_ERROR,
  SCREEN_MIN_HEIGHT_CLASS,
} from '../constants'
import { useGroupDraft } from '../hooks/useGroupDraft'
import { GroupAddModal } from './GroupAddModal'
import { GroupCard } from './GroupCard'
import { GroupHeader } from './GroupHeader'
import { GroupSubmitBar } from './GroupSubmitBar'

/** 단체 목록을 불러오는 동안 카드 모양의 자리표시를 보여준다. */
export const GroupListSkeleton = () => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-3.5" role="status" aria-busy="true">
    <span className="sr-only">단체 목록을 불러오는 중이에요.</span>
    {[0, 1, 2, 3].map((index) => (
      <div key={index} className="flex animate-pulse flex-col gap-2.5" aria-hidden="true">
        <div className="aspect-square w-full rounded-xl bg-canvas" />
        <div className="h-4 w-2/3 rounded bg-canvas" />
        <div className="h-3 w-1/3 rounded bg-canvas" />
      </div>
    ))}
  </div>
)

/** 단체 목록을 불러오지 못했을 때 안내하고 다시 시도할 수 있게 한다. */
export const GroupListError = ({ onRetry }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center" role="alert">
    <p className="text-body text-text-secondary">단체 목록을 불러오지 못했어요.</p>
    <Button
      className="max-w-40"
      color="secondary"
      height="38px"
      onClick={onRetry}
      text="다시 시도"
    />
  </div>
)

/** 등록된 단체가 하나도 없을 때 첫 단체 추가를 안내한다. */
export const GroupListEmpty = () => (
  <div className="py-10 text-center">
    <p className="text-body font-medium text-text-primary">아직 등록된 단체가 없어요.</p>
    <p className="mt-1 text-caption text-text-secondary">아래 버튼으로 첫 단체를 추가해 보세요.</p>
  </div>
)

/**
 * 도서의 단체 위키 목록 화면이다. 도서 정보, 유형 칩, 안내, 단체 카드 목록을 조합한다.
 * 새 단체는 모달로 추가하고 화면 안에 초안으로 보관하며, 변경이 있을 때만 검수 제출 영역을 보여준다.
 * 데이터는 직접 가져오지 않고 부모가 전달하며, 로딩·빈 목록·오류 상태를 모두 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {{ title: string, progressLabel: string, statusLabel: string, coverImageSrc?: string, currentEpisode?: number }} [props.book] 현재 도서 정보. `currentEpisode`는 등장 회차의 최댓값이다.
 * @param {Array<{ id: string, name: string, memberCount: number, imageUrl?: string }>} [props.groups=[]] 단체 목록
 * @param {string | null} [props.editionId] 추가·삭제 초안을 도서별로 구분하는 도서 식별자
 * @param {object} [props.detailState] 단체 카드를 눌러 상세 화면으로 이동할 때 함께 넘길 도서·진도·작성 방식 값
 * @param {number} [props.personCount] `인물` 칩 옆에 표시할 인물 수
 * @param {'view' | 'edit'} [props.mode='edit'] `edit`는 처음부터 삭제 버튼과 검수 제출 영역을 보여준다(Figma 편집 상태). `view`는 이를 숨기고, 단체를 추가·삭제하는 순간 편집 상태가 된다.
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {'ready' | 'loading' | 'error'} [props.status='ready'] 목록 상태
 * @param {() => void} [props.onRetry] 오류 상태에서 `다시 시도`를 눌렀을 때 실행
 * @param {(value: string) => void} [props.onCategoryChange] 유형 칩을 눌렀을 때 실행
 * @param {(changes: { addedGroups: Array, removedGroupIds: string[] }) => Promise<unknown>} [props.onSubmit] `검수 제출`을 눌렀을 때 추가한 단체와 삭제한 단체 식별자와 함께 실행하며 성공하면 resolve, 실패하면 reject한다. 없거나 변경이 없으면 제출 버튼이 비활성
 * @param {boolean} [props.isSubmitting=false] 제출 요청 중인지 여부
 * @param {string} [props.submitError] 제출 실패 안내 문구
 * @param {() => void} [props.onLeave] `저장 안함`·`임시 저장`을 끝낸 뒤 실행. 이전 화면으로 이동하는 일은 부모(페이지)가 처리한다. 없으면 화면에 머문다.
 */
export const GroupListScreen = ({
  book,
  groups = [],
  editionId,
  detailState,
  personCount,
  mode = 'edit',
  episodeUnit = '화',
  status = 'ready',
  onRetry,
  onCategoryChange,
  onSubmit,
  isSubmitting = false,
  submitError,
  onLeave,
}) => {
  const draft = useGroupDraft(groups, editionId)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [saveError, setSaveError] = useState('')
  const isReady = status === 'ready'
  const isEditing = mode === 'edit' || draft.hasChanges

  /** 저장하지 않고 나간다. 이번에 바꾼 내용은 마지막 임시 저장 상태로 되돌리고 이전 화면으로 이동한다. */
  const handleDiscard = () => {
    draft.discard()
    onLeave?.()
  }

  /** 지금 내용을 임시 저장하고 이전 화면으로 이동한다. 저장에 실패하면 안내를 보여주고 화면에 머문다. */
  const handleSaveDraft = () => {
    try {
      draft.save()
    } catch {
      setSaveError(SAVE_DRAFT_ERROR)
      return
    }

    setSaveError('')
    onLeave?.()
  }

  /** 추가한 단체를 제출하고, 성공하면 초안을 비운다. 실패하면 입력한 내용을 그대로 둔다. */
  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      await onSubmit({
        addedGroups: draft.addedGroups,
        removedGroupIds: draft.removedGroupIds,
      })
      draft.reset()
    } catch {
      // 실패 문구는 부모가 submitError로 보여주며, 추가한 단체는 그대로 둔다.
    }
  }

  const categories = [
    { value: 'person', label: '인물', count: personCount },
    { value: 'group', label: '단체' },
  ]

  return (
    <div className={`flex flex-col ${SCREEN_MIN_HEIGHT_CLASS}`}>
      <GroupHeader currentEpisode={book?.currentEpisode} episodeUnit={episodeUnit} />
      <section
        className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-6"
        aria-labelledby="group-list-title"
      >
        {book && (
          <BookContext
            accentText={book.progressLabel}
            captionSize="label"
            captionText={book.statusLabel}
            coverImageSrc={book.coverImageSrc}
            title={book.title}
          />
        )}
        <p className="text-right text-caption-sm leading-4.5 text-text-muted">{PROGRESS_HINT}</p>
        <h1 className="mt-3 text-title font-bold text-text-primary" id="group-list-title">
          위키 내용 편집
        </h1>
        <WikiCategory onChange={onCategoryChange} options={categories} value="group" />
        <Notice
          className="mb-0.5"
          content={REWARD_NOTICE}
          icon={<img alt="" className="size-4.25 shrink-0" src={sparklesIcon} />}
          theme="amber"
        />
        {status === 'loading' && <GroupListSkeleton />}
        {status === 'error' && <GroupListError onRetry={onRetry} />}
        {isReady && draft.groups.length === 0 && <GroupListEmpty />}
        {isReady && draft.groups.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-3.5">
            {draft.groups.map((group) => (
              <li key={group.id}>
                <GroupCard
                  {...group}
                  linkState={detailState}
                  onDelete={isEditing ? draft.removeGroup : undefined}
                />
              </li>
            ))}
          </ul>
        )}
        {isReady && (
          <button
            className="mx-auto -mb-1 flex min-h-11 items-center gap-1.5 pt-6 text-caption font-medium text-text-secondary"
            onClick={() => setIsAddOpen(true)}
            type="button"
          >
            신규 단체 추가
            <img alt="" src={plusIcon} />
          </button>
        )}
      </section>
      {isAddOpen && (
        <GroupAddModal
          episodeUnit={episodeUnit}
          existingNames={draft.groups.map((group) => group.name)}
          maxEpisode={book?.currentEpisode}
          onClose={() => setIsAddOpen(false)}
          onSubmit={draft.addGroup}
        />
      )}
      {isReady && isEditing && (
        <GroupSubmitBar
          errorMessage={submitError}
          isSubmitting={isSubmitting}
          onDiscard={handleDiscard}
          onSaveDraft={handleSaveDraft}
          saveDraftError={saveError || undefined}
          onSubmit={onSubmit && draft.hasChanges ? handleSubmit : undefined}
        />
      )}
    </div>
  )
}
