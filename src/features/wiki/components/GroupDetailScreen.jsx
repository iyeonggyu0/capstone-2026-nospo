import { useState } from 'react'
import { Badge, Button, DetailTabs } from '@/components/common-ui'
import { SCREEN_MIN_HEIGHT_CLASS, TAB_OPTIONS } from '../constants'
import { useGroupDetailDraft } from '../hooks/useGroupDetailDraft'
import { getMemberCandidates } from '../utils'
import { GroupHeader } from './GroupHeader'
import { GroupMemberList } from './GroupMemberList'
import { GroupMilestoneList } from './GroupMilestoneList'
import { GroupRelationList } from './GroupRelationList'
import { GroupSubmitBar } from './GroupSubmitBar'
import { GroupSummary } from './GroupSummary'

/** 제목 `단체 정보`와 현재 진도 알약을 한 줄로 보여준다. */
export const GroupDetailHeader = ({ progressLabel }) => (
  <div className="flex h-10 items-center gap-2.5">
    <h1 className="min-w-0 flex-1 text-title font-bold text-text-primary" id="group-detail-title">
      단체 정보
    </h1>
    {progressLabel && <Badge variant="progress">{progressLabel}</Badge>}
  </div>
)

/** 단체 정보를 불러오는 동안 요약 카드와 목록 모양의 자리표시를 보여준다. */
export const GroupDetailSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-3" role="status" aria-busy="true">
    <span className="sr-only">단체 정보를 불러오는 중이에요.</span>
    <div aria-hidden="true" className="h-39.5 rounded-lg bg-canvas" />
    <div aria-hidden="true" className="h-10 rounded bg-canvas" />
    <div aria-hidden="true" className="h-40 rounded-lg bg-canvas" />
  </div>
)

/** 단체 정보를 불러오지 못했을 때 안내하고 다시 시도할 수 있게 한다. */
export const GroupDetailError = ({ onRetry }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center" role="alert">
    <p className="text-body text-text-secondary">단체 정보를 불러오지 못했어요.</p>
    <Button
      className="max-w-40"
      color="secondary"
      height="38px"
      onClick={onRetry}
      text="다시 시도"
    />
  </div>
)

/** 단체를 찾을 수 없을 때 안내하고, 이전 화면으로 돌아갈 수 있는 버튼을 함께 보여준다. */
export const GroupNotFound = ({ onBack }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center">
    <p className="text-body text-text-secondary">단체를 찾을 수 없어요.</p>
    {onBack && (
      <Button
        className="max-w-40"
        color="secondary"
        height="38px"
        onClick={onBack}
        text="돌아가기"
      />
    )}
  </div>
)

/**
 * 단체 정보가 준비되었을 때의 본문이다. 요약, 탭, 탭별 내용을 보여주고
 * 편집 모드에서는 초안을 관리하며 하단 검수 제출 영역을 함께 보여준다.
 */
const GroupDetailContent = ({
  group,
  progressLabel,
  mode,
  maxEpisode,
  episodeUnit,
  memberCandidates,
  onAddMember,
  onAddRelation,
  onSubmit,
  canSubmitUnchanged,
  isSubmitting,
  submitError,
  saveDraftError,
  onSaveDraft,
  onBack,
}) => {
  const [tab, setTab] = useState('members')
  const draft = useGroupDetailDraft(group)
  const isEdit = mode === 'edit'

  /**
   * 지금 편집한 구성원·관계·주요 행적을 임시 저장하도록 부모에게 넘긴다.
   * 저장에 성공하면 지금 내용을 새 기준으로 삼고 이전 화면으로 이동한다. 저장에 실패하면 화면에 머물러 다시 시도할 수 있다.
   */
  const handleSaveDraft = () => {
    const saved = onSaveDraft({
      members: draft.members,
      relations: draft.relations,
      milestones: draft.milestones,
    })
    if (saved === false) return

    draft.markSaved()
    onBack?.()
  }

  /** 저장하지 않고 나간다. 이번에 바꾼 내용은 처음(또는 마지막 임시 저장) 상태로 되돌리고 이전 화면으로 이동한다. */
  const handleDiscard = () => {
    draft.reset()
    onBack?.()
  }

  /** 편집한 내용을 제출하고, 성공하면 그 내용을 새 기준으로 삼는다. 실패하면 편집 내용을 그대로 둔다. */
  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      await onSubmit({
        members: draft.members,
        relations: draft.relations,
        milestones: draft.milestones,
      })
      draft.markSaved()
    } catch {
      // 실패 문구는 부모가 submitError로 보여주며, 편집한 내용은 그대로 둔다.
    }
  }

  return (
    <div className={`flex flex-col ${SCREEN_MIN_HEIGHT_CLASS}`}>
      <GroupHeader currentEpisode={maxEpisode} episodeUnit={episodeUnit} onBack={onBack} />
      <section
        className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-6"
        aria-labelledby="group-detail-title"
      >
        <GroupDetailHeader progressLabel={progressLabel} />
        <GroupSummary
          className="rounded-lg bg-surface p-3 ring-1 ring-border ring-inset"
          imageUrl={group.imageUrl}
          memberCount={group.memberCount}
          name={group.name}
          scale={group.scale}
        />
        <DetailTabs onChange={setTab} options={TAB_OPTIONS} value={tab} />
        {tab === 'members' && (
          <GroupMemberList
            candidates={getMemberCandidates(memberCandidates, draft.members, maxEpisode)}
            editable={isEdit}
            episodeUnit={episodeUnit}
            members={draft.members}
            onAdd={onAddMember ?? draft.addMember}
            onRemove={draft.removeMember}
            onReorder={draft.moveMember}
          />
        )}
        {tab === 'relations' && (
          <GroupRelationList
            editable={isEdit}
            onAdd={onAddRelation ?? draft.addRelation}
            onMove={draft.moveRelation}
            onRemove={draft.removeRelation}
            relations={draft.relations}
          />
        )}
        {tab === 'milestones' && (
          <GroupMilestoneList
            editable={isEdit}
            episodeUnit={episodeUnit}
            maxEpisode={maxEpisode}
            milestones={draft.milestones}
            onAdd={draft.addMilestone}
            onRemove={draft.removeMilestone}
            onReorder={draft.moveMilestone}
            onUpdate={draft.updateMilestone}
          />
        )}
      </section>
      {isEdit && (
        <GroupSubmitBar
          errorMessage={submitError}
          isSubmitting={isSubmitting}
          onDiscard={handleDiscard}
          onSaveDraft={onSaveDraft ? handleSaveDraft : undefined}
          saveDraftError={saveDraftError}
          onSubmit={onSubmit && (draft.hasChanges || canSubmitUnchanged) ? handleSubmit : undefined}
        />
      )}
    </div>
  )
}

/**
 * 단체 상세 화면이다. 현재 진도, 단체 요약, 탭(구성원, 관계, 주요 행적)을 조합한다.
 * `mode="edit"`이면 추가·삭제·편집 컨트롤과 검수 제출 영역이 나타난다.
 * 데이터는 직접 가져오지 않고 부모가 전달하며, 로딩·없음·오류 상태를 모두 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {{ id?: string, name: string, scale?: string, memberCount?: number, imageUrl?: string, members?: Array, relations?: object, milestones?: Array }} [props.group] 단체 정보
 * @param {string} [props.progressLabel] 우측 알약에 표시할 현재 진도 문구 (예: 2권 7장 수정)
 * @param {'view' | 'edit'} [props.mode='view'] 보기 또는 편집 모드
 * @param {number} [props.maxEpisode] 읽은 진도. 행적의 등장 회차 최댓값이다.
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {'ready' | 'loading' | 'error'} [props.status='ready'] 화면 상태
 * @param {() => void} [props.onRetry] 오류 상태에서 `다시 시도`를 눌렀을 때 실행
 * @param {Array<{ id: string, name: string, unlockEpisode?: number }>} [props.memberCandidates] 구성원으로 고를 수 있는 인물 목록. 이미 구성원인 인물은 화면에서 제외한다.
 * @param {(person: { id: string, name: string, unlockEpisode?: number }) => void} [props.onAddMember] 구성원 검색 줄에서 고른 인물을 `추가`했을 때 실행. 없으면 그 인물을 구성원 끝에 추가한다
 * @param {(query: string) => void} [props.onAddRelation] 관계 단체 검색 줄에서 `추가`를 눌렀을 때 실행. 없으면 입력한 이름으로 `우호` 관계를 추가한다
 * @param {(draft: { members: Array, relations: object, milestones: Array }) => void} [props.onSubmit] `검수 제출`을 눌렀을 때 편집한 내용과 함께 실행. 없으면 비활성
 * @param {boolean} [props.canSubmitUnchanged=false] 편집한 내용이 없어도 `검수 제출`을 누를 수 있게 할지 여부. 새로 추가한 단체처럼 단체 자체가 제출 대상일 때 쓴다.
 * @param {boolean} [props.isSubmitting=false] 제출 요청 중인지 여부
 * @param {string} [props.submitError] 제출 실패 안내 문구
 * @param {string} [props.saveDraftError] 임시 저장 실패 안내 문구. 있으면 하단에 안내를 보여주고, 화면에 머물러 `임시 저장 후 돌아가기`로 다시 시도할 수 있다.
 * @param {(draft: { members: Array, relations: object, milestones: Array }) => boolean | void} [props.onSaveDraft] `임시 저장`을 눌렀을 때 편집한 내용과 함께 실행. 없으면 비활성. 저장에 실패했으면 `false`를 돌려준다.
 * @param {() => void} [props.onBack] 헤더의 뒤로가기, 단체 없음 화면의 `돌아가기`, 그리고 `저장 안 함`·`임시 저장 후 돌아가기`를 끝낸 뒤 실행. 이동은 부모(페이지)가 처리한다. 없으면 뒤로가기 화살표와 `돌아가기` 버튼을 보여주지 않고, `저장 안 함`·`임시 저장 후 돌아가기` 뒤에도 화면에 머문다.
 */
export const GroupDetailScreen = ({
  group,
  progressLabel,
  mode = 'view',
  maxEpisode,
  episodeUnit = '화',
  memberCandidates = [],
  status = 'ready',
  onRetry,
  onAddMember,
  onAddRelation,
  onSubmit,
  canSubmitUnchanged = false,
  isSubmitting = false,
  submitError,
  saveDraftError,
  onSaveDraft,
  onBack,
}) => {
  if (status === 'ready' && group) {
    return (
      <GroupDetailContent
        canSubmitUnchanged={canSubmitUnchanged}
        episodeUnit={episodeUnit}
        group={group}
        isSubmitting={isSubmitting}
        key={group.id ?? group.name}
        maxEpisode={maxEpisode}
        memberCandidates={memberCandidates}
        mode={mode}
        onAddMember={onAddMember}
        onAddRelation={onAddRelation}
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        progressLabel={progressLabel}
        saveDraftError={saveDraftError}
        submitError={submitError}
      />
    )
  }

  return (
    <>
      <GroupHeader currentEpisode={maxEpisode} episodeUnit={episodeUnit} onBack={onBack} />
      <section className="flex flex-col gap-3 px-5 pt-3 pb-6" aria-labelledby="group-detail-title">
        <GroupDetailHeader progressLabel={progressLabel} />
        {status === 'loading' && <GroupDetailSkeleton />}
        {status === 'error' && <GroupDetailError onRetry={onRetry} />}
        {status === 'ready' && <GroupNotFound onBack={onBack} />}
      </section>
    </>
  )
}
