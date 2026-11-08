import { Link } from 'react-router-dom'
import chevronRightSmall from '@/assets/icons/wiki/chevron-right-small.svg'
import { getGroupDetailPath } from '../utils'

/** 단체 이미지를 보여주고, 이미지가 없으면 글자 없이 연한 빈 상자로 자리를 채운다. */
const GroupImage = ({ imageUrl }) => {
  if (imageUrl) {
    return <img className="aspect-square w-full rounded-xl object-cover" src={imageUrl} alt="" />
  }

  return (
    <div
      className="aspect-square w-full rounded-xl bg-control-neutral"
      role="img"
      aria-label="단체 이미지 준비 중"
    />
  )
}

/**
 * 단체 한 곳을 카드로 보여주고 상세 화면으로 이동할 수 있게 한다.
 * `onDelete`를 전달하면 `삭제` 버튼이 나타난다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.id 단체 식별자
 * @param {string} props.name 단체 이름
 * @param {number} [props.memberCount] 인원 수
 * @param {string} [props.imageUrl] 단체 대표 이미지 주소
 * @param {(id: string) => void} [props.onDelete] `삭제`를 눌렀을 때 실행. 없으면 버튼을 숨긴다.
 */
export const GroupCard = ({ id, name, memberCount, imageUrl, onDelete }) => {
  return (
    <article className="flex flex-col gap-2.5">
      <GroupImage imageUrl={imageUrl} />
      <div className="flex flex-col gap-0.5">
        <h2 className="text-body font-medium text-text-primary">{name}</h2>
        <div className="flex items-center justify-between text-caption-sm leading-4.5 text-text-muted">
          <span>{memberCount}명</span>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                aria-label={`${name} 삭제`}
                className="-my-3.5 min-h-11 pr-0.5 pl-1 text-red-destructive"
                onClick={() => onDelete(id)}
                type="button"
              >
                삭제
              </button>
            )}
            <Link
              className="-my-3.5 inline-flex min-h-11 items-center gap-1"
              to={getGroupDetailPath(id, 'edit')}
              aria-label={`${name} 수정하기`}
            >
              수정하기
              <img alt="" src={chevronRightSmall} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
