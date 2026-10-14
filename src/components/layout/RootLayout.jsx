import { Outlet, ScrollRestoration } from 'react-router-dom'
import { MainLayout } from './MainLayout'

/** 모든 페이지를 모바일 또는 iPhone 미리보기 프레임 안에 렌더링한다. */
export const RootLayout = () => {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#e7ece9] min-[481px]:p-8">
      <div className="relative h-dvh w-full overflow-hidden bg-canvas min-[481px]:h-[min(844px,calc(100dvh-4rem))] min-[481px]:w-[min(390px,calc(100vw-4rem))] min-[481px]:rounded-[32px] min-[481px]:shadow-[0_20px_50px_rgb(18_25_24_/_0.16)]">
        <MainLayout>
          <Outlet />
        </MainLayout>
        <ScrollRestoration />
      </div>
    </div>
  )
}
