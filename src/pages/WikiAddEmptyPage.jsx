import { useLocation, useNavigate } from 'react-router-dom'
import { WikiEmptyStateDialog } from '@/features/wiki'
import { ROUTES } from '@/constants/routes'

/** 검색한 도서의 정보와 읽기 진도를 신규 위키 작성 화면으로 넘긴다. */
const WikiAddEmptyPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const book = location.state?.book ?? (import.meta.env.DEV ? { title: '애주가의 절주 일기' } : {})
  const bookId = location.state?.bookId ?? book.id
  const position = location.state?.position ?? (import.meta.env.DEV ? 32 : undefined)
  const canStartCreation = import.meta.env.DEV || (bookId != null && position != null)

  const startWikiCreation = () => {
    if (!canStartCreation) return

    navigate(ROUTES.WIKI_REGISTER_PERSON, {
      state: {
        mode: 'CREATE',
        book,
        bookId,
        position,
      },
    })
  }

  return (
    <WikiEmptyStateDialog
      book={book}
      disabled={!canStartCreation}
      onClose={() => navigate(-1)}
      onStartCreation={startWikiCreation}
    />
  )
}

export default WikiAddEmptyPage
