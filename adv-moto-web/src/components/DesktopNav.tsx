// DesktopNav 组件 - 桌面端侧边导航栏
import { NavLink } from 'react-router-dom'
import { CompassOutline, UploadOutline, UserOutline, LocationOutline } from 'antd-mobile-icons'
import { LocalStorage } from '../services/storage'

interface DesktopNavProps {
  className?: string
}

export function DesktopNav({ className = '' }: DesktopNavProps) {
  const user = LocalStorage.getCurrentUser()

  const navItems = [
    { key: '/', title: '首页', icon: <CompassOutline fontSize={20} /> },
    { key: '/explore', title: '探索', icon: <LocationOutline fontSize={20} /> },
    { key: '/upload', title: '上传', icon: <UploadOutline fontSize={20} /> },
    { key: '/profile', title: '我的', icon: <UserOutline fontSize={20} /> },
  ]

  return (
    <aside className={`desktop-nav ${className}`}>
      {/* Logo 区域 */}
      <div className="desktop-nav__logo">
        <div className="desktop-nav__logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 17h6M9 13h6M9 9h6M12 3v2M5 7l-2 4 2 4M19 7l2 4-2 4" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="desktop-nav__logo-text">
          <h1>ADV MOTO</h1>
          <span>HUB</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="desktop-nav__menu">
        {navItems.map(item => (
          <NavLink
            key={item.key}
            to={item.key}
            className={({ isActive }) => `desktop-nav__item ${isActive ? 'desktop-nav__item--active' : ''}`}
          >
            <span className="desktop-nav__item-icon">{item.icon}</span>
            <span className="desktop-nav__item-title">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* 用户信息区域 */}
      {user && (
        <div className="desktop-nav__user">
          <div className="desktop-nav__user-avatar">
            <img src={user.avatarUrl || '/default-avatar.png'} alt={user.nickname} />
          </div>
          <div className="desktop-nav__user-info">
            <div className="desktop-nav__user-name">{user.nickname}</div>
            <div className="desktop-nav__user-level">
              {user.isPremium ? (
                <span className="desktop-nav__user-badge desktop-nav__user-badge--premium">
                  VIP
                </span>
              ) : (
                <span className="desktop-nav__user-badge">普通会员</span>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
