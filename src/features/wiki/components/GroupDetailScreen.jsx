import { useState } from 'react'
import { Badge, Button, DetailTabs } from '@/components/common-ui'
import { SCREEN_MIN_HEIGHT_CLASS } from '../constants'
import { useGroupDetailDraft } from '../hooks/useGroupDetailDraft'
import { GroupMemberList } from './GroupMemberList'
import { GroupMilestoneList } from './GroupMilestoneList'
import { GroupRelationList } from './GroupRelationList'
import { GroupSubmitBar } from './GroupSubmitBar'
import { GroupSummary } from './GroupSummary'

/** 상세 화면의 탭 목록이다. */
const TAB_OPTIONS = [
  { value: 'members', label: '구성원' },
  { value: 'relations', label: '관계' },
  { value: 'milestones', label: '주요 행적' },
]

/** 제목 `단체 정보`와 현재 진도 알약을 한 줄로 보여준다. */
const GroupDetailHeader = ({ progressLabel }) => (
  <div className="flex h-10 items-center gap-2.5">
    <h1 className="min-w-0 flex-1 text-title font-bold text-text-primary" id="group-detail-title">
      단체 정보
    </h1>
    {progressLabel && <Badge variant="progress">{progressLabel}</Badge>}
  </div>
)

/** 단체 정보를 불러오는 동안 요약 카드와 목록 모양의 자리표시를 보여준다. */
const GroupDetailSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-3" role="status" aria-busy="true">
    <span className="sr-only">단체 정보를 불러오는 중이에요.</span>
    <div aria-hidden="true" className="h-39.5 rounded-lg bg-canvas" />
    <div aria-hidden="true" className="h-10 rounded bg-canvas" />
    <div aria-hidden="true" className="h-40 rounded-lg bg-canvas" />
  </div>
)

/** 단체 정보를 불러오지 못했을 때 안내하고 다시 시도할 수 있게 한다. */
const GroupDetailError = ({ onRetry }) => (
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
  onAddMember,
  onAddRelation,
  onSubmit,
  isSubmitting,
  submitError,
  onSaveDraft,
}) => {
  const [tab, setTab] = useState('members')
  const draft = useGroupDetailDraft(group)
  const isEdit = mode === 'edit'

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
            editable={isEdit}
            episodeUnit={episodeUnit}
            members={draft.members}
            onAdd={onAddMember ?? draft.addMember}
            onRemove={draft.removeMember}
          />
        )}
        {tab === 'relations' && (
          <GroupRelationList
            editable={isEdit}
            onAdd={onAddRelation ?? draft.addRelation}
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
            onUpdate={draft.updateMilestone}
          />
        )}
      </section>
      {isEdit && (
        <GroupSubmitBar
          errorMessage={submitError}
          isSubmitting={isSubmitting}
          onDiscard={draft.reset}
          onSaveDraft={onSaveDraft}
          onSubmit={onSubmit && draft.hasChanges ? handleSubmit : undefined}
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
 * @param {(query: string) => void} [props.onAddMember] 구성원 검색 줄에서 `추가`를 눌렀을 때 실행. 없으면 입력한 이름으로 구성원을 추가한다
 * @param {(query: string) => void} [props.onAddRelation] 관계 단체 검색 줄에서 `추가`를 눌렀을 때 실행. 없으면 입력한 이름으로 `우호` 관계를 추가한다
 * @param {(draft: { members: Array, relations: object, milestones: Array }) => void} [props.onSubmit] `검수 제출`을 눌렀을 때 편집한 내용과 함께 실행. 없으면 비활성
 * @param {boolean} [props.isSubmitting=false] 제출 요청 중인지 여부
 * @param {string} [props.submitError] 제출 실패 안내 문구
 * @param {() => void} [props.onSaveDraft] `임시 저장`을 눌렀을 때 실행. 없으면 비활성
 */
export const GroupDetailScreen = ({
  group,
  progressLabel,
  mode = 'view',
  maxEpisode,
  episodeUnit = '화',
  status = 'ready',
  onRetry,
  onAddMember,
  onAddRelation,
  onSubmit,
  isSubmitting = false,
  submitError,
  onSaveDraft,
}) => {
  if (status === 'ready' && group) {
    return (
      <GroupDetailContent
        episodeUnit={episodeUnit}
        group={group}
        isSubmitting={isSubmitting}
        key={group.id ?? group.name}
        maxEpisode={maxEpisode}
        mode={mode}
        onAddMember={onAddMember}
        onAddRelation={onAddRelation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        progressLabel={progressLabel}
        submitError={submitError}
      />
    )
  }

  return (
    <section className="flex flex-col gap-3 px-5 pt-3 pb-6" aria-labelledby="group-detail-title">
      <GroupDetailHeader progressLabel={progressLabel} />
      {status === 'loading' && <GroupDetailSkeleton />}
      {status === 'error' && <GroupDetailError onRetry={onRetry} />}
      {status === 'ready' && (
        <p className="py-10 text-center text-body text-text-secondary">단체를 찾을 수 없어요.</p>
      )}
    </section>
  )
}
