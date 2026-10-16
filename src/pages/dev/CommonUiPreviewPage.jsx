import {
  Badge,
  Button,
  DetailTabs,
  RelationshipFilter,
  ReviewTabs,
  TextLink,
  WikiCategory,
} from '@/components/common-ui'

const sections = [
  {
    id: 'wiki-category',
    title: 'Wiki category',
    description: '위키 인물·단체·관계도 유형을 선택합니다.',
  },
  {
    id: 'detail-tabs',
    title: 'Detail tabs',
    description: '인물·단체 상세 정보의 섹션을 전환합니다.',
  },
  {
    id: 'relationship-filter',
    title: 'Relationship filter',
    description: '관계도에 표시할 관계 범위를 선택합니다.',
  },
  {
    id: 'review-tabs',
    title: 'Review tabs',
    description: '신청한 위키를 검수 상태별로 확인합니다.',
  },
  { id: 'buttons', title: 'Button', description: '화면에 쓰이는 주요 진행과 보조 행동입니다.' },
  { id: 'badges', title: 'Badge', description: '도서 유형·토큰·진도·검수 상태를 표시합니다.' },
]

// 미리보기 전용 예시 데이터이며, 실제 화면에서는 API 결과를 전달한다.
const reviewTabPreviewOptions = [
  { value: 'all', label: '전체', count: 5 },
  { value: 'reviewing', label: '검수 중', count: 2 },
  { value: 'revision', label: '수정 요청', count: 1 },
  { value: 'approved', label: '승인', count: 2 },
]

/** 공통 UI 카탈로그에서 한 컴포넌트 묶음을 표시한다. */
const Section = ({ id, title, description, children }) => (
  <section className="border-b border-border py-6" id={id}>
    <h2 className="text-title-sm font-bold">{title}</h2>
    <p className="mt-1 text-label text-text-secondary">{description}</p>
    <div className="mt-4">{children}</div>
  </section>
)

/** 공통 UI 컴포넌트와 상호작용 상태를 한 화면에서 확인한다. */
const CommonUiPreviewPage = () => (
  <main className="h-dvh overflow-y-auto bg-canvas px-5 pb-10">
    <header className="sticky top-0 z-10 -mx-5 border-b border-border bg-canvas/95 px-5 py-5 backdrop-blur">
      <h1 className="text-title font-bold">NOSPO 공통 UI</h1>
      <p className="mt-1 text-label text-text-secondary">버튼, 탭, 필터, 뱃지 컴포넌트 미리보기</p>
    </header>

    <nav aria-label="컴포넌트 목차" className="flex gap-2 overflow-x-auto py-4">
      {sections.map((section) => (
        <a
          className="shrink-0 rounded-full bg-teal-subtle px-3 py-2 text-label text-teal-strong"
          href={`#${section.id}`}
          key={section.id}
        >
          {section.title}
        </a>
      ))}
    </nav>

    <Section {...sections[0]}>
      <WikiCategory />
      <WikiCategory
        className="mt-3 w-full"
        options={[
          { value: 'person', label: '인물', count: 7 },
          { value: 'group', label: '단체' },
        ]}
      />
      <p className="mt-1 text-caption text-text-muted">넓은 선택 버튼</p>
    </Section>

    <Section {...sections[1]}>
      <DetailTabs />
      <DetailTabs
        className="mt-4 max-w-full"
        options={[
          { value: 'group', label: '구성원' },
          { value: 'relationship', label: '관계' },
          { value: 'history', label: '주요 행적' },
        ]}
        defaultValue="relationship"
      />
    </Section>

    <Section {...sections[2]}>
      <RelationshipFilter />
    </Section>

    <Section {...sections[3]}>
      <ReviewTabs options={reviewTabPreviewOptions} />
    </Section>

    <Section {...sections[4]}>
      <div className="flex w-full flex-col items-start gap-2">
        <Button className="w-full" size={54} variant="primary">
          회원가입
        </Button>
        <Button className="w-full" size={48} variant="emphasis">
          ✨ AI 토큰 1개로 관계도 만들기
        </Button>
        <Button className="w-full" size={44} variant="emphasis">
          검수 제출
        </Button>
        <Button size={38} variant="primary">
          위키 보기
        </Button>
        <Button size={38} variant="neutral">
          바로 이어 읽기
        </Button>
        <TextLink to="/wiki/register">위키에 기여하고 토큰 받기</TextLink>
      </div>
    </Section>

    <Section {...sections[5]}>
      <div className="flex flex-col items-start gap-2">
        <Badge>책</Badge>
        <Badge variant="genre">소설</Badge>
        <Badge variant="token">보유 토큰 3개</Badge>
        <Badge variant="progress">2권 7장까지</Badge>
        <Badge variant="review">수정 요청</Badge>
      </div>
    </Section>
  </main>
)

export default CommonUiPreviewPage
