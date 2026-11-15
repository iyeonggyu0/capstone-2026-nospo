import { Link, useLocation } from 'react-router-dom'
import homeIcon from '@/assets/icons/nav/nav-home.svg'
import myIcon from '@/assets/icons/nav/nav-my.svg'
import recordIcon from '@/assets/icons/nav/nav-record.svg'
import wikiIcon from '@/assets/icons/nav/nav-wiki.svg'
import { ROUTES } from '@/constants/routes'

const navigationItems = [
  {
    label: '홈',
    to: ROUTES.HOME,
    icon: homeIcon,
    isActive: (path) => path === ROUTES.HOME,
    inactiveIconClass: 'opacity-50',
  },
  {
    label: '위키',
    to: ROUTES.WIKI,
    icon: wikiIcon,
    isActive: (path) => path.startsWith('/wiki'),
    activeIconClass: 'brightness-[0.15]',
  },
  {
    label: '기록',
    to: ROUTES.READING,
    icon: recordIcon,
    isActive: (path) => path === ROUTES.READING,
    activeIconClass: 'brightness-[0.15]',
  },
  {
    label: 'MY',
    to: ROUTES.MY,
    icon: myIcon,
    isActive: (path) => path.startsWith(ROUTES.MY),
    activeIconClass: 'brightness-[0.15]',
  },
]

/** 피그마 시안에 맞춘 모바일 하단 공통 내비게이션이다. */
export const BottomNavigation = () => {
  const { pathname } = useLocation()

  return (
    <nav
      className="z-10 shrink-0 border-t border-[#eee] bg-surface px-2 py-3"
      aria-label="주요 메뉴"
    >
      <ul className="flex h-[50px]">
        {navigationItems.map(
          ({ label, to, icon, isActive, activeIconClass, inactiveIconClass }) => {
            const active = isActive(pathname)

            return (
              <li key={label} className="flex-1">
                <Link
                  className={`flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10px] leading-[18px] ${
                    active ? 'font-bold text-text-primary' : 'font-medium text-text-muted'
                  }`}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="flex h-[26px] items-center justify-center">
                    <img
                      className={`max-h-[18px] max-w-[19px] ${active ? (activeIconClass ?? '') : (inactiveIconClass ?? '')}`}
                      src={icon}
                      alt=""
                      aria-hidden="true"
                    />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            )
          },
        )}
      </ul>
    </nav>
  )
}
