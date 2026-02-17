import { useEffect, useState, type CSSProperties } from 'react'
import { Avatar, Card, Button, Dialog, NavBar, Toast } from 'antd-mobile'
import { RightOutline, StarFill, SetOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import { DataService } from '../services/dataService'
import { useAuth } from '../hooks/useAuth'
import type { User } from '../types'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Container } from '../components/Container'

const MENU_ITEMS_CONFIG = [
  { key: 'my-routes', title: '我的路线', icon: '🛣️', color: '#ff6b35' },
  { key: 'favorites', title: '收藏', icon: '⭐', color: '#f4a261' },
  { key: 'achievements', title: '成就', icon: '🏆', color: '#2ec4b6' },
] as const

export default function Profile() {
  const navigate = useNavigate()
  const { isDesktop } = useBreakpoint()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [myRoutesCount, setMyRoutesCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)

  useEffect(() => {
    fetchUserInfo()
    updateCounts()
  }, [authUser])

  const menuItems = MENU_ITEMS_CONFIG.map(item => {
    const count = item.key === 'my-routes' ? myRoutesCount.toString()
      : item.key === 'favorites' ? favoritesCount.toString()
      : '5'
    return { ...item, count }
  })

  const updateCounts = async () => {
    const favorites = await DataService.getFavorites()
    setMyRoutesCount(0)
    setFavoritesCount(favorites.length)
  }

  const fetchUserInfo = async () => {
    try {
      const currentUser = await DataService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        // Create a default user for demo purposes
        const defaultUser: User = {
          id: 'demo_user',
          nickname: '骑士007',
          avatarUrl: '',
          garage: [
            { id: 'bike1', brand: 'BMW', model: 'R1250GS', year: 2023 },
            { id: 'bike2', brand: 'KTM', model: '790 Adventure', year: 2022 },
          ],
          bikes: [
            { id: 'bike1', brand: 'BMW', model: 'R1250GS', year: 2023 },
            { id: 'bike2', brand: 'KTM', model: '790 Adventure', year: 2022 },
          ],
          isPremium: true,
          createdAt: new Date().toISOString()
        }
        setUser(defaultUser)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBike = () => {
    Dialog.alert({
      content: '添加车辆功能开发中...',
      confirmText: '知道了'
    })
  }

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'my-routes':
        Dialog.alert({
          content: `你上传了 ${myRoutesCount} 条路线`,
          confirmText: '知道了'
        })
        break
      case 'favorites':
        Dialog.alert({
          content: `你收藏了 ${favoritesCount} 条路线`,
          confirmText: '知道了'
        })
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  // 桌面端布局
  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Container>
          {/* 桌面端标题 */}
          <div style={{
            padding: '32px 0',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '32px',
          }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              个人中心
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              margin: '8px 0 0',
            }}>
              管理您的账户和偏好设置
            </p>
          </div>

          {/* 双栏布局 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '32px',
            paddingBottom: '80px',
          }}>
            {/* 左侧主要信息 */}
            <div>
              {/* 用户信息卡片 */}
              <Card style={{
                background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '32px',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  position: 'relative',
                  zIndex: 1,
                  padding: '8px',
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      src={user?.avatarUrl || ''}
                      fallback={<div style={{ fontSize: 56 }}>🏍️</div>}
                      style={{
                        '--size': '120px',
                        border: '4px solid var(--accent-orange)',
                        boxShadow: '0 0 30px rgba(255, 107, 53, 0.3)',
                      } as CSSProperties}
                    />
                    {user?.isPremium && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '-6px',
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f59e0b 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid var(--bg-card)',
                      }}>
                        <StarFill style={{ fontSize: 18, color: 'white' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '32px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '12px',
                    }}>
                      {user?.nickname || '未登录'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {user?.isPremium ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          borderRadius: '9999px',
                          background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                          color: 'var(--accent-gold)',
                          border: '1px solid rgba(244, 162, 97, 0.3)',
                        }}>
                          <StarFill style={{ fontSize: 14 }} />
                          VIP 会员
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 16px',
                          fontSize: '14px',
                          fontWeight: 500,
                          borderRadius: '9999px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          普通用户
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 统计数据 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '24px',
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  {[
                    { value: myRoutesCount.toString(), label: '路线', icon: '🛣️' },
                    { value: '1.2k', label: '获赞', icon: '👍' },
                    { value: favoritesCount > 0 ? favoritesCount.toString() : '0', label: '收藏', icon: '⭐' },
                    { value: '89', label: '骑行', icon: '🏍️' },
                  ].map((stat, index) => (
                    <div key={index} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--accent-orange)',
                        marginBottom: '6px',
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}>
                        <span>{stat.icon}</span>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 我的车库 */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    我的车库
                  </h2>
                  <Button
                    size="small"
                    onClick={handleAddBike}
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    + 添加车辆
                  </Button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                }}>
                  {user?.garage?.map((bike, index) => (
                    <Card
                      key={index}
                      className="card"
                      style={{
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{
                          width: '100px',
                          height: '100px',
                          background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '48px',
                          margin: '0 auto 20px',
                        }}>
                          🏍️
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '8px',
                        }}>
                          {bike.brand} {bike.model}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {bike.year}年款
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div>
              {/* 快捷功能 */}
              <Card style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '24px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 20px',
                }}>
                  快捷功能
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {menuItems.map(item => (
                    <div
                      key={item.key}
                      onClick={() => handleMenuClick(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: `${item.color}20`,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                        }}>
                          {item.title}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 设置列表 */}
              <Card style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                marginBottom: '24px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 20px',
                }}>
                  设置
                </h3>
                {[
                  { title: '账号与安全', icon: '🔐' },
                  { title: '通知设置', icon: '🔔' },
                  { title: '隐私设置', icon: '🔒' },
                  { title: '清除数据', icon: '🗑️', action: () => {
                    Dialog.confirm({
                      content: '确定要清除所有本地数据吗？此操作不可恢复。',
                      onConfirm: () => {
                        DataService.clearCache()
                        window.location.reload()
                      }
                    })
                  }},
                  { title: '关于我们', icon: 'ℹ️' },
                ].map((item, index) => (
                  <div
                    key={index}
                    onClick={item.action || undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 0',
                      borderBottom: index < 4 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: item.action ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <span style={{
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                      }}>
                        {item.title}
                      </span>
                    </div>
                    <RightOutline style={{ fontSize: 18, color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </Card>

              {/* 会员推广 */}
              {!user?.isPremium && (
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(244,162,97,0.15) 100%)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  borderRadius: 'var(--radius-xl)',
                }}>
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-gold) 100%)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      boxShadow: '0 8px 30px rgba(255, 107, 53, 0.3)',
                    }}>
                      <StarFill style={{ fontSize: 36, color: 'white' }} />
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '22px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}>
                      升级会员
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '24px',
                      lineHeight: 1.6,
                    }}>
                      解锁离线地图、无限GPX下载、官方验证路线等专属权益
                    </div>
                    <Button
                      block
                      size="large"
                      onClick={() => {
                        const updatedUser = { ...user!, isPremium: true }
                        setUser(updatedUser)
                        Toast.show({ content: '已升级为会员！', icon: 'success' })
                      }}
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-gold) 100%)',
                        color: 'white',
                        border: 'none',
                        height: '48px',
                        fontSize: '16px',
                        fontWeight: 600,
                        boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
                      }}
                    >
                      立即升级 ¥30/月
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // 移动端布局
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>
      {/* 顶部导航 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 11, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <NavBar
          right={
            <Button
              size="small"
              fill="none"
              style={{ padding: '8px' }}
              onClick={() => {
                DataService.clearCache()
                navigate('/')
              }}
            >
              <SetOutline style={{ fontSize: 24, color: 'var(--text-secondary)' }} />
            </Button>
          }
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            个人中心
          </span>
        </NavBar>
      </div>

      {/* 用户信息卡片 */}
      <div style={{ padding: '16px' }}>
        <Card style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 背景装饰 */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={user?.avatarUrl || ''}
                fallback={<div style={{ fontSize: 40 }}>🏍️</div>}
                style={{
                  '--size': '80px',
                  border: '3px solid var(--accent-orange)',
                  boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
                } as CSSProperties}
              />
              {user?.isPremium && (
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, var(--accent-gold) 0%, #f59e0b 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)',
                }}>
                  <StarFill style={{ fontSize: 14, color: 'white' }} />
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}>
                {user?.nickname || '未登录'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {user?.isPremium ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                    color: 'var(--accent-gold)',
                    border: '1px solid rgba(244, 162, 97, 0.3)',
                  }}>
                    <StarFill style={{ fontSize: 12 }} />
                    会员
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '9999px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    普通用户
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            {[
              { value: myRoutesCount.toString(), label: '路线', icon: '🛣️' },
              { value: '1.2k', label: '获赞', icon: '👍' },
              { value: favoritesCount > 0 ? favoritesCount.toString() : '0', label: '收藏', icon: '⭐' },
            ].map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--accent-orange)',
                  marginBottom: '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}>
                  <span>{stat.icon}</span>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 快捷菜单 */}
        <div style={{ marginTop: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {menuItems.map(item => (
              <div
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  padding: '16px 0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `${item.color}20`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontSize: '24px',
                }}>
                  {item.icon}
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 我的车库 */}
        <div style={{ marginTop: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              我的车库
            </h2>
            <Button
              size="small"
              onClick={handleAddBike}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
              }}
            >
              + 添加车辆
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user?.garage?.map((bike, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}>
                    🏍️
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                    }}>
                      {bike.brand} {bike.model}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {bike.year}年款
                    </div>
                  </div>
                  <RightOutline style={{ fontSize: 20, color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 设置列表 */}
        <div style={{ marginTop: '24px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
          }}>
            设置
          </h2>

          <Card style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {[
              { title: '账号与安全', icon: '🔐' },
              { title: '通知设置', icon: '🔔' },
              { title: '隐私设置', icon: '🔒' },
              { title: '清除数据', icon: '🗑️', action: () => {
                Dialog.confirm({
                  content: '确定要清除所有本地数据吗？此操作不可恢复。',
                  onConfirm: () => {
                    DataService.clearCache()
                    window.location.reload()
                  }
                })
              }},
              { title: '关于我们', icon: 'ℹ️' },
            ].map((item, index) => (
              <div
                key={index}
                onClick={item.action || undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderBottom: index < 4 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: item.action ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                  }}>
                    {item.title}
                  </span>
                </div>
                <RightOutline style={{ fontSize: 18, color: 'var(--text-muted)' }} />
              </div>
            ))}
          </Card>
        </div>

        {/* 会员推广 */}
        {!user?.isPremium && (
          <Card style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(244,162,97,0.15) 100%)',
            border: '1px solid rgba(255,107,53,0.2)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-gold) 100%)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 30px rgba(255, 107, 53, 0.3)',
              }}>
                <StarFill style={{ fontSize: 32, color: 'white' }} />
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}>
                升级会员
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                lineHeight: 1.6,
              }}>
                解锁离线地图、无限GPX下载、官方验证路线等专属权益
              </div>
              <Button
                block
                size="large"
                onClick={() => {
                  const updatedUser = { ...user!, isPremium: true }
                  setUser(updatedUser)
                  Toast.show({ content: '已升级为会员！', icon: 'success' })
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-gold) 100%)',
                  color: 'white',
                  border: 'none',
                  height: '44px',
                  fontSize: '15px',
                  fontWeight: 600,
                  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
                }}
              >
                立即升级 ¥30/月
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
