import { Link } from 'react-router-dom'
import chevronRightSmall from '@/assets/icons/wiki/chevron-right-small.svg'
import { getGroupDetailPath, getGroupViewDetailPath } from '../utils'
import { GroupImage } from './GroupCard'

/**
 * 위키 내용(보기)의 단체 카드다. 이미지와 이름을 누르면 단체 상세(보기)로 이동하고,
 * `수정하기`를 누르면 등록/수정 흐름의 단체 상세(편집)로 이동한다. 삭제 버튼은 없다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.id 단체 식별자
 * @param {string} props.name 단체 이름
 * @param {number} [props.memberCount] 인원 수. 모르면 `-`로 보여준다.
 * @param {string} [props.imageUrl] 단체 대표 이미지 주소
 * @param {object} [props.viewState] 단체 상세(보기)로 이동할 때 함께 넘길 도서·진도 값
 * @param {object} [props.editState] 단체 상세(편집)로 이동할 때 함께 넘길 도서·진도·작성 방식 값
 */
export const GroupViewCard = ({ id, name, memberCount, imageUrl, viewState, editState }) => (
  <article className="flex flex-col gap-2.5">
    <Link
      aria-label={`${name} 보기`}
      className="flex flex-col gap-2.5"
      state={viewState}
      to={getGroupViewDetailPath(id)}
    >
      <GroupImage imageUrl={imageUrl} />
      <h2 className="text-body font-medium text-text-primary">{name}</h2>
    </Link>
    <div className="-mt-2 flex items-center justify-between text-caption-sm leading-4.5 text-text-muted">
      <span>{memberCount != null ? `${memberCount}명` : '-'}</span>
      <Link
        aria-label={`${name} 수정하기`}
        className="-my-3.5 inline-flex min-h-11 items-center gap-1"
        state={editState}
        to={getGroupDetailPath(id, 'edit')}
      >
        수정하기
        <img alt="" src={chevronRightSmall} />
      </Link>
    </div>
  </article>
)
