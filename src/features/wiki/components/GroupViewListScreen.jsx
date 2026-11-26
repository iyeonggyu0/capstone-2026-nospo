import { Link } from 'react-router-dom'
import plusIcon from '@/assets/icons/wiki/plus.svg'
import sparklesIcon from '@/assets/icons/wiki/sparkles.svg'
import { BookContext } from '@/components/BookContext'
import { Notice } from '@/components/Notice'
import { WikiCategory } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { PROGRESS_HINT, REWARD_NOTICE } from '../constants'
import { GroupHeader } from './GroupHeader'
import { GroupListEmpty, GroupListError, GroupListSkeleton } from './GroupListScreen'
import { GroupViewCard } from './GroupViewCard'

/**
 * 위키 내용(보기)의 단체 목록 화면이다. 도서 정보, 유형 칩, 안내, 단체 카드 목록을 읽기 전용으로 보여준다.
 * 편집 화면과 달리 삭제 버튼, 검수 제출 영역, 임시 저장 초안이 없고, 새 단체 추가는 등록/수정 화면으로 이동한다.
 * 데이터는 직접 가져오지 않고 부모가 전달하며, 로딩·빈 목록·오류 상태를 모두 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {{ title: string, progressLabel: string, statusLabel: string, coverImageSrc?: string, currentEpisode?: number }} [props.book] 현재 도서 정보
 * @param {Array<{ id: string, name: string, memberCount?: number, imageUrl?: string }>} [props.groups=[]] 단체 목록
 * @param {number} [props.personCount] `인물` 칩 옆에 표시할 인물 수
 * @param {string} [props.episodeUnit='화'] 진도 단위
 * @param {'ready' | 'loading' | 'error'} [props.status='ready'] 목록 상태
 * @param {() => void} [props.onRetry] 오류 상태에서 `다시 시도`를 눌렀을 때 실행
 * @param {(value: string) => void} [props.onCategoryChange] 유형 칩을 눌렀을 때 실행. 없으면 칩은 눌러도 바뀌지 않는다.
 * @param {object} [props.viewState] 단체 상세(보기)로 이동할 때 함께 넘길 도서·진도 값
 * @param {object} [props.editState] 단체 상세(편집)로 이동할 때 함께 넘길 도서·진도·작성 방식 값
 * @param {string} [props.addTo] `신규 단체 추가`를 눌렀을 때 이동할 주소. 기본은 단체 등록/수정 목록이다.
 * @param {object} [props.addState] `신규 단체 추가`로 이동할 때 함께 넘길 값
 */
export const GroupViewListScreen = ({
  book,
  groups = [],
  personCount,
  episodeUnit = '화',
  status = 'ready',
  onRetry,
  onCategoryChange,
  viewState,
  editState,
  addTo = ROUTES.WIKI_REGISTER_GROUP,
  addState,
}) => {
  const isReady = status === 'ready'
  const categories = [
    { value: 'person', label: '인물', count: personCount },
    { value: 'group', label: '단체' },
  ]

  return (
    <div className="flex flex-col">
      <GroupHeader currentEpisode={book?.currentEpisode} episodeUnit={episodeUnit} />
      <section
        className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-6"
        aria-labelledby="group-view-list-title"
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
        <h1 className="mt-3 text-title font-bold text-text-primary" id="group-view-list-title">
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
        {isReady && groups.length === 0 && <GroupListEmpty />}
        {isReady && groups.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-3.5">
            {groups.map((group) => (
              <li key={group.id}>
                <GroupViewCard {...group} editState={editState} viewState={viewState} />
              </li>
            ))}
          </ul>
        )}
        {isReady && (
          <Link
            className="mx-auto -mb-1 flex min-h-11 items-center gap-1.5 pt-6 text-caption font-medium text-text-secondary"
            state={addState}
            to={addTo}
          >
            신규 단체 추가
            <img alt="" src={plusIcon} />
          </Link>
        )}
      </section>
    </div>
  )
}
