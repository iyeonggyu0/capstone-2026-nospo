import { getUnlockLabel } from '../utils'
import { GroupDragHandle } from './GroupDragHandle'
import { GroupSearchBar } from './GroupSearchBar'

/**
 * 단체의 구성원 목록을 보여준다. 구성원이 없으면 빈 상태 문구를 표시한다.
 * `editable`이면 인물 검색 줄과 `삭제` 버튼이 나타난다.
 *
 * @param {object} props 컴포넌트 props
 * @param {Array<{ id: string, name: string, unlockLabel?: string, unlockEpisode?: number }>} [props.members=[]] 구성원 목록
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {boolean} [props.editable=false] 편집 컨트롤 표시 여부
 * @param {(query: string) => void} [props.onAdd] 인물 검색 줄에서 `추가`를 눌렀을 때 실행. 없으면 비활성
 * @param {(id: string) => void} [props.onRemove] `삭제`를 눌렀을 때 실행
 */
export const GroupMemberList = ({
  members = [],
  episodeUnit = '화',
  editable = false,
  onAdd,
  onRemove,
}) => (
  <section className="flex flex-col gap-1.5 p-3" aria-labelledby="group-members-title">
    <h3 className="text-title-sm font-medium text-text-primary" id="group-members-title">
      구성원
    </h3>
    {editable && <GroupSearchBar label="인물 검색" onAdd={onAdd} />}
    {members.length === 0 ? (
      <p className="py-8 text-center text-body text-text-secondary">아직 등록된 구성원이 없어요.</p>
    ) : (
      <ul>
        {members.map((member) => {
          const unlockLabel = getUnlockLabel(member, episodeUnit)

          return (
            <li className="flex h-18 items-center gap-3 px-3" key={member.id}>
              {editable && <GroupDragHandle />}
              <span aria-hidden="true" className="size-10 shrink-0 rounded-full bg-teal-strong" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-title-sm font-medium text-text-primary">
                  {member.name}
                </p>
                {unlockLabel && <p className="text-caption text-text-secondary">{unlockLabel}</p>}
              </div>
              {editable && onRemove && (
                <button
                  aria-label={`${member.name} 삭제`}
                  className="-mr-1 min-h-11 shrink-0 px-1 text-label font-medium text-red-destructive"
                  onClick={() => onRemove(member.id)}
                  type="button"
                >
                  삭제
                </button>
              )}
            </li>
          )
        })}
      </ul>
    )}
  </section>
)
