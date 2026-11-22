import { useState } from 'react'
import { DetailTabs } from '@/components/common-ui'
import { TAB_OPTIONS } from '../constants'
import {
  GroupDetailError,
  GroupDetailHeader,
  GroupDetailSkeleton,
  GroupNotFound,
} from './GroupDetailScreen'
import { GroupHeader } from './GroupHeader'
import { GroupMemberList } from './GroupMemberList'
import { GroupMilestoneList } from './GroupMilestoneList'
import { GroupRelationList } from './GroupRelationList'
import { GroupSummary } from './GroupSummary'

/**
 * 단체 정보가 준비되었을 때의 읽기 전용 본문이다. 요약, 탭, 탭별 목록을 보여준다.
 * 삭제·검색·편집 컨트롤과 순서 손잡이, 하단 제출 영역이 없다.
 */
const GroupViewDetailContent = ({ group, progressLabel, maxEpisode, episodeUnit, onBack }) => {
  const [tab, setTab] = useState('members')

  return (
    <>
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
          <GroupMemberList episodeUnit={episodeUnit} members={group.members ?? []} />
        )}
        {tab === 'relations' && <GroupRelationList relations={group.relations ?? {}} />}
        {tab === 'milestones' && (
          <GroupMilestoneList episodeUnit={episodeUnit} milestones={group.milestones ?? []} />
        )}
      </section>
    </>
  )
}

/**
 * 위키 내용(보기)의 단체 상세 화면이다. 현재 진도, 단체 요약, 탭(구성원, 관계, 주요 행적)을 읽기 전용으로 보여준다.
 * 데이터는 직접 가져오지 않고 부모가 전달하며, 로딩·단체 없음·오류 상태를 모두 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {{ id?: string, name: string, scale?: string, memberCount?: number, imageUrl?: string, members?: Array, relations?: object, milestones?: Array }} [props.group] 단체 정보
 * @param {string} [props.progressLabel] 우측 알약에 표시할 현재 진도 문구 (예: 2권 7장 수정)
 * @param {number} [props.maxEpisode] 읽은 진도. 헤더의 `진도 변경` 안내에 쓴다.
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {'ready' | 'loading' | 'error'} [props.status='ready'] 화면 상태
 * @param {() => void} [props.onRetry] 오류 상태에서 `다시 시도`를 눌렀을 때 실행
 * @param {() => void} [props.onBack] 헤더의 뒤로가기와 단체 없음 화면의 `돌아가기`를 눌렀을 때 실행. 이동은 부모(페이지)가 처리한다.
 */
export const GroupViewDetailScreen = ({
  group,
  progressLabel,
  maxEpisode,
  episodeUnit = '화',
  status = 'ready',
  onRetry,
  onBack,
}) => {
  if (status === 'ready' && group) {
    return (
      <GroupViewDetailContent
        episodeUnit={episodeUnit}
        group={group}
        key={group.id ?? group.name}
        maxEpisode={maxEpisode}
        onBack={onBack}
        progressLabel={progressLabel}
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
