// ResponsiveLayout 组件 - 响应式布局容器，根据屏幕尺寸切换导航方式
import type { ReactNode } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { DesktopNav } from './DesktopNav'
import { TabBar } from 'antd-mobile'
import { CompassOutline, UploadOutline, UserOutline, LocationOutline } from 'antd-mobile-icons'

interface ResponsiveLayoutProps {
  children: ReactNode
  activeTab?: string
  onTabChange?: (key: string) => void
  showNav?: boolean
}

export function ResponsiveLayout({
  children,
  activeTab = '/',
  onTabChange,
  showNav = true
}: ResponsiveLayoutProps) {
  const { isMobile } = useBreakpoint()

  const tabs = [
    { key: '/', title: '首页', icon: <CompassOutline /> },
    { key: '/explore', title: '探索', icon: <LocationOutline /> },
    { key: '/upload', title: '上传', icon: <UploadOutline /> },
    { key: '/profile', title: '我的', icon: <UserOutline /> },
  ]

  // 移动端布局：底部导航栏
  if (isMobile) {
    return (
      <div className="responsive-layout responsive-layout--mobile">
        <div className="responsive-layout__body">
          {children}
        </div>
        {showNav && (
          <div className="responsive-layout__bottom-nav">
            <TabBar
              activeKey={activeTab}
              onChange={(key) => onTabChange?.(key)}
            >
              {tabs.map(item => (
                <TabBar.Item
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                />
              ))}
            </TabBar>
          </div>
        )}
      </div>
    )
  }

  // 桌面端布局：侧边导航栏 + 主内容区
  return (
    <div className="responsive-layout responsive-layout--desktop">
      {showNav && <DesktopNav className="responsive-layout__sidebar" />}
      <main className="responsive-layout__main">
        <div className="responsive-layout__content">
          {children}
        </div>
      </main>
    </div>
  )
}
