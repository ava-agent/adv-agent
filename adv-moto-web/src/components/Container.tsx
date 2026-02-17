// Container 组件 - 限制内容最大宽度
import type { CSSProperties, ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
  maxWidth?: number
}

export function Container({ children, style, className, maxWidth = 1200 }: ContainerProps) {
  const containerStyle: CSSProperties = {
    maxWidth: `${maxWidth}px`,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '16px',
    paddingRight: '16px',
    ...style,
  }

  return (
    <div className={className} style={containerStyle}>
      {children}
    </div>
  )
}
