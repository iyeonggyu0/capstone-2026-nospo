import { Link } from 'react-router-dom'
import logoText from '@/assets/logo-text.svg'
import { ROUTES } from '@/constants/routes'

// 책등 일러스트는 피그마의 고유 색상을 유지한다.
const bookSpines = [
  { number: '01', className: 'h-[170px] w-[54px] bg-[#f6cc7a]' },
  { number: '02', className: 'h-[236px] w-[72px] bg-[#539689]' },
  { number: '03', className: 'h-[198px] w-[60px] bg-[#78b3a8]' },
  { number: '04', className: 'h-[218px] w-[78px] bg-teal-subtle' },
  { number: '05', className: 'h-[150px] w-[46px] bg-[#fedea0]' },
  { number: '06', className: 'hidden h-[190px] w-[46px] bg-[#539689] @min-[380px]:block' },
]

/** 서비스 소개와 회원가입·로그인으로의 이동을 제공한다. */
const OnboardingPage = () => (
  <main className="h-full overflow-y-auto bg-canvas">
    <div className="@container flex min-h-full flex-col px-5 py-7">
      <header className="flex h-5 items-center justify-end">
        <span
          role="img"
          aria-label="NOSPO"
          className="h-[11px] w-[50px] bg-[#fedea0] mask-contain mask-center mask-no-repeat"
          style={{ maskImage: `url(${logoText})` }}
        />
      </header>

      <div className="mt-[46px] flex h-[236px] items-end gap-2 overflow-hidden" aria-hidden="true">
        {bookSpines.map(({ number, className }) => (
          <div
            key={number}
            className={`shrink grow rounded-xl pt-3.5 pl-3 text-label-sm font-medium text-text-primary/78 ${className}`}
          >
            {number}
          </div>
        ))}
      </div>

      <h1 className="mt-[34px] text-headline font-bold text-text-primary">
        책마다, 사람마다 다른 당신의
        <br />
        읽기 진도를 지켜요.
      </h1>
      <p className="mt-4 max-w-[340px] text-body text-text-secondary">
        작품을 찾고 현재 지점을 설정한 뒤, 스포일러 없는 정보를 확인하세요.
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-10 text-center text-body">
        <Link
          className="flex h-[54px] items-center justify-center rounded-xl bg-teal-strong text-white"
          to={ROUTES.AUTH_SIGNUP}
        >
          회원가입
        </Link>
        <Link className="font-medium text-text-primary" to={ROUTES.AUTH_LOGIN}>
          로그인
        </Link>
      </div>
    </div>
  </main>
)

export default OnboardingPage
