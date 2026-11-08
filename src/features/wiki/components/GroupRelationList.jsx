import { GroupDragHandle } from './GroupDragHandle'
import { GroupSearchBar } from './GroupSearchBar'
import { GroupSummary } from './GroupSummary'

/** 우호·적대 관계 구역의 제목과 데이터 키 목록이다. */
const RELATION_SECTIONS = [
  { key: 'friendly', title: '우호', borderClass: 'border-teal-strong' },
  { key: 'hostile', title: '대립', borderClass: 'border-red-destructive' },
  { key: 'neutral', title: '중립', borderClass: 'border-text-muted' },
]

/**
 * 단체와 다른 단체의 관계를 우호, 대립, 중립으로 나누어 보여준다.
 * 우호·대립·중립 구역 제목은 항목이 없어도 항상 보여주고, 관계가 하나도 없으면 빈 상태 문구도 함께 표시한다.
 * `editable`이면 `관계` 제목, 단체 검색 줄, 항목별 `삭제` 버튼이 나타난다(Figma 편집 상태).
 *
 * @param {object} props 컴포넌트 props
 * @param {{ friendly?: Array, hostile?: Array, neutral?: Array }} [props.relations={}] 관계별 단체 목록. 각 단체는 `{ id, name, scale, memberCount, imageUrl }`
 * @param {boolean} [props.editable=false] 편집 컨트롤 표시 여부
 * @param {(query: string) => void} [props.onAdd] 단체 검색 줄에서 `추가`를 눌렀을 때 실행. 없으면 비활성
 * @param {(id: string) => void} [props.onRemove] `삭제`를 눌렀을 때 실행
 */
export const GroupRelationList = ({ relations = {}, editable = false, onAdd, onRemove }) => {
  const hasRelations = RELATION_SECTIONS.some((section) => relations[section.key]?.length > 0)

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {editable && (
        <>
          <h3 className="text-title-sm font-medium text-text-primary" id="group-relation-title">
            관계
          </h3>
          <GroupSearchBar label="단체 검색" onAdd={onAdd} />
        </>
      )}
      {!hasRelations && (
        <p className="py-8 text-center text-body text-text-secondary">아직 등록된 관계가 없어요.</p>
      )}
      {RELATION_SECTIONS.map((section) => (
        <section aria-labelledby={`group-relation-${section.key}`} key={section.key}>
          <h3
            className="mb-2 text-title-sm font-bold text-text-primary"
            id={`group-relation-${section.key}`}
          >
            {section.title}
          </h3>
          <ul>
            {(relations[section.key] ?? []).map((group) => (
              <li
                className={`flex items-center gap-3.5 border-l p-3 ${section.borderClass}`}
                key={group.id}
              >
                {editable && <GroupDragHandle />}
                <GroupSummary
                  className="min-w-0 flex-1"
                  imageUrl={group.imageUrl}
                  memberCount={group.memberCount}
                  name={group.name}
                  scale={group.scale}
                  size="small"
                />
                {editable && onRemove && (
                  <button
                    aria-label={`${group.name} 삭제`}
                    className="-mr-1 min-h-11 shrink-0 px-1 text-label font-medium text-red-destructive"
                    onClick={() => onRemove(group.id)}
                    type="button"
                  >
                    삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
