import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import bookCoverPreview from '@/assets/images/wiki-book-cover-preview.png'

/** 기존 위키 수정 흐름에서 도서와 수정 시작점을 확인한다. */
const WikiRegisterEntryPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const book = location.state?.book ?? { title: '애주가의 절주 일기' }
  const bookId = location.state?.bookId ?? book.id
  const wikiId = location.state?.wikiId ?? 'preview-wiki'
  const baseWikiVersion = location.state?.baseWikiVersion ?? 1
  const position = location.state?.position ?? { unit: 'EPISODE', value: 32 }

  return (
    <section className="mx-auto flex min-h-[calc(100%-64px)] w-full max-w-[390px] flex-col px-5 py-6">
      <h1 className="text-title font-bold">위키 수정</h1>
      <p className="mt-2 text-label text-text-secondary">
        수정할 도서와 읽은 지점을 확인한 뒤 위키 내용을 편집해요.
      </p>
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-canvas p-3">
        <img
          alt=""
          className="size-[64px] rounded-md object-cover"
          src={book.coverUrl || bookCoverPreview}
        />
        <div className="min-w-0">
          <p className="truncate text-body-lg font-bold">{book.title}</p>
          <p className="mt-1 text-caption text-text-secondary">기존 위키 내용 수정</p>
        </div>
      </div>
      <div className="mt-auto">
        <Button
          className="rounded-lg font-bold"
          height="46px"
          onClick={() =>
            navigate(ROUTES.WIKI_ADD_PAGE, {
              state: { mode: 'UPDATE', book, bookId, wikiId, baseWikiVersion, position },
            })
          }
          text="위키 수정하기"
          textStyle="body"
        />
      </div>
    </section>
  )
}

export default WikiRegisterEntryPage
