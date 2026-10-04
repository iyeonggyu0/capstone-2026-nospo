import { Outlet, ScrollRestoration } from 'react-router-dom'

/** 모든 페이지를 모바일 또는 iPhone 미리보기 프레임 안에 렌더링한다. */
export const RootLayout = () => {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-[480px]:max-w-none min-[481px]:min-h-[844px] min-[481px]:max-w-[390px]">
      <Outlet />
      <ScrollRestoration />
    </div>
  )
}
