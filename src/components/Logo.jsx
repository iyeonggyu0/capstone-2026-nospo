import logo from '@/assets/icons/nav/logo.svg'

/** NOSPO 브랜드 로고를 재사용 가능한 이미지로 렌더링한다. */
export const Logo = ({ className = '', imageClassName = 'size-8' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img className={imageClassName} src={logo} alt="" />
      <span className="text-title leading-7 font-bold text-text-primary">NOSPO</span>
    </div>
  )
}
