import { useState } from 'react'
import { AuthField, EpisodeField, Search, TermsRow } from '@/components/input'

const previewOptions = [
  { value: 'search', label: 'Search' },
  { value: 'auth', label: 'Auth field' },
  { value: 'episode', label: 'Episode field' },
  { value: 'terms', label: 'Terms row' },
]
const previewDescriptions = {
  search:
    '이름·저자·ISBN으로 도서를 찾습니다. 검색 입력 350×54px, radius 12의 원본 구조를 유지합니다.',
  auth: '로그인·회원가입의 정보 입력. 폭 350px, 입력 면 높이 46px, radius 8과 확인·오류의 실제 표시를 보존합니다.',
  episode:
    '현재 읽은 화 또는 공개 기준을 입력합니다. 확정된 입력 단위와 주변 설명을 함께 유지합니다.',
  terms: '필수 약관 동의와 전문 보기. 관찰된 체크·제목·요약의 연결 구조를 사용합니다.',
}
const searchTypeLabels = { name: '이름', author: '저자', isbn: 'ISBN' }
const authExamples = [
  { id: 'email', label: '이메일', name: 'email', type: 'email', autoComplete: 'email' },
  {
    id: 'nickname',
    label: '닉네임',
    name: 'nickname',
    type: 'text',
    autoComplete: 'nickname',
    status: 'success',
    message: '사용할 수 있는 닉네임이에요.',
  },
  {
    id: 'password',
    label: '비밀번호',
    name: 'password',
    type: 'password',
    autoComplete: 'new-password',
    status: 'error',
    message: '영문, 숫자를 포함해 10자 이상 입력해 주세요.',
  },
]
const authInitialValues = {
  email: 'yeo***@mail.com',
  nickname: '책갈피여우',
  password: '12345678',
}

/** Figma 보드처럼 컴포넌트 종류별 변형을 한 화면에 모아 스크롤 없이 확인하는 개발용 미리보기다. */
const InputPreviewPage = () => {
  const [preview, setPreview] = useState('search')
  const [query, setQuery] = useState('데미안')
  const [searchType, setSearchType] = useState('name')
  const [lastSearch, setLastSearch] = useState(null)
  const [searchCount, setSearchCount] = useState(0)
  const [authValues, setAuthValues] = useState(authInitialValues)
  const [readingEpisode, setReadingEpisode] = useState('2')
  const [registrationEpisode, setRegistrationEpisode] = useState('2')
  const [isTermsAgreed, setIsTermsAgreed] = useState(true)
  const [termsViewCount, setTermsViewCount] = useState(0)

  /** 검색 API 대신 전달된 조건과 검색 실행 횟수만 기록한다. */
  const handleSearch = (searchRequest) => {
    setLastSearch(searchRequest)
    setSearchCount((count) => count + 1)
  }

  /** 입력한 값을 해당 예제에만 반영한다. 검증은 하지 않고 상태 표시는 고정이다. */
  const updateAuthValue = (id, value) => setAuthValues((current) => ({ ...current, [id]: value }))

  /** 회차는 숫자만 남겨 샘플 값으로 유지한다. 범위 검증은 하지 않는다. */
  const toDigits = (value) => value.replace(/\D/g, '')

  return (
    <main className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden bg-surface p-5">
      <h1 className="sr-only">공통 Input 미리보기</h1>

      <div className="grid shrink-0 grid-cols-2 gap-2" role="group" aria-label="컴포넌트 종류">
        {previewOptions.map((option) => (
          <button
            key={option.value}
            className="min-h-11 rounded-lg border border-border px-3 text-body font-medium text-text-secondary aria-pressed:border-teal-strong aria-pressed:bg-teal-subtle aria-pressed:text-teal-strong"
            type="button"
            aria-pressed={preview === option.value}
            aria-controls={`preview-${option.value}-panel`}
            onClick={() => setPreview(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section
        id="preview-search-panel"
        className="flex min-h-0 flex-col gap-4"
        aria-labelledby="preview-search-title"
        hidden={preview !== 'search'}
      >
        <div>
          <h2 id="preview-search-title" className="text-title-sm font-medium">
            Search
          </h2>
          <p className="text-caption text-text-secondary">{previewDescriptions.search}</p>
        </div>
        <Search
          id="preview-search"
          name="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          onSearch={handleSearch}
        />
        <output className="truncate text-caption text-text-secondary">
          {lastSearch
            ? `최근 검색: ${searchTypeLabels[lastSearch.searchType]} / ${lastSearch.query || '(빈 검색어)'} · 실행 ${searchCount}회`
            : '검색 버튼 또는 Enter로 실행하면 여기에 기록됩니다.'}
        </output>
      </section>

      <section
        id="preview-auth-panel"
        className="flex min-h-0 flex-col gap-4"
        aria-labelledby="preview-auth-title"
        hidden={preview !== 'auth'}
      >
        <div>
          <h2 id="preview-auth-title" className="text-title-sm font-medium">
            Auth field
          </h2>
          <p className="text-caption text-text-secondary">{previewDescriptions.auth}</p>
        </div>
        {authExamples.map(({ id, ...example }) => (
          <AuthField
            key={id}
            {...example}
            id={`preview-auth-${id}`}
            value={authValues[id]}
            onChange={(event) => updateAuthValue(id, event.target.value)}
          />
        ))}
      </section>

      <section
        id="preview-episode-panel"
        className="flex min-h-0 flex-col gap-4"
        aria-labelledby="preview-episode-title"
        hidden={preview !== 'episode'}
      >
        <div>
          <h2 id="preview-episode-title" className="text-title-sm font-medium">
            Episode field
          </h2>
          <p className="text-caption text-text-secondary">{previewDescriptions.episode}</p>
        </div>
        <EpisodeField
          aria-label="읽은 화"
          value={readingEpisode}
          onChange={(event) => setReadingEpisode(toDigits(event.target.value))}
          total="8 챕터"
        />
        <EpisodeField
          prefix="기준 회차"
          unit="화"
          value={registrationEpisode}
          onChange={(event) => setRegistrationEpisode(toDigits(event.target.value))}
        />
        <p className="truncate text-caption text-text-secondary">
          읽은 화 {readingEpisode || '-'} / 기준 회차 {registrationEpisode || '-'}
        </p>
      </section>

      <section
        id="preview-terms-panel"
        className="flex min-h-0 flex-col gap-4"
        aria-labelledby="preview-terms-title"
        hidden={preview !== 'terms'}
      >
        <div>
          <h2 id="preview-terms-title" className="text-title-sm font-medium">
            Terms row
          </h2>
          <p className="text-caption text-text-secondary">{previewDescriptions.terms}</p>
        </div>
        <TermsRow
          title="서비스 이용약관"
          description="서비스 운영과 이용 기준"
          required
          checked={isTermsAgreed}
          onChange={(event) => setIsTermsAgreed(event.target.checked)}
          onView={() => setTermsViewCount((count) => count + 1)}
        />
        <p className="truncate text-caption text-text-secondary">
          {isTermsAgreed ? '동의함' : '동의 안 함'} · 전문 보기 {termsViewCount}회
        </p>
      </section>
    </main>
  )
}

export default InputPreviewPage
