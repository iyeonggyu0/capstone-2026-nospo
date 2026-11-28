import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'

/** 위키 상세에서 기존 위키의 등록·수정 흐름으로 진입한다. */
const WikiDetailPage = () => {
  const { wikiId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const book = location.state?.book ?? { title: '애주가의 절주 일기' }
  const bookId = location.state?.bookId ?? book.id
  const baseWikiVersion = location.state?.baseWikiVersion ?? 1
  const position = location.state?.position ?? { unit: 'EPISODE', value: 32 }

  return (
    <section className="mx-auto flex min-h-full w-full max-w-[390px] flex-col px-5 py-6">
      <h1 className="text-title font-bold">{book.title}</h1>
      <p className="mt-2 text-label text-text-secondary">
        등록된 위키 내용을 확인하고 수정할 수 있어요.
      </p>
      <div className="mt-auto pb-5">
        <Button
          className="rounded-lg font-bold"
          height="46px"
          onClick={() =>
            navigate(ROUTES.WIKI_REGISTER, {
              state: { wikiId, book, bookId, baseWikiVersion, position },
            })
          }
          text="위키 수정"
          textStyle="body"
        />
      </div>
    </section>
  )
}

export default WikiDetailPage
