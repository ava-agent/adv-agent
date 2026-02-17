import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar, Card, Button } from 'antd-mobile'
import { RightOutline, FireFill, CompassOutline, UploadOutline } from 'antd-mobile-icons'
import { DataService } from '../services/dataService'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Container } from '../components/Container'

/* eslint-disable react-hooks/set-state-in-effect */

interface Route {
  _id: string
  title: string
  description: string
  difficultyLevel: number
  terrainTags: string[]
  distanceKm: number
  elevationGainM: number
  downloadCount: number
}

const difficultyLabels = ['', '休闲', '入门', '进阶', '挑战', '极限']
const difficultyColors = ['', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7']

export default function Home() {
  const navigate = useNavigate()
  const { isMobile, isDesktop, isTablet } = useBreakpoint()
  const [routes, setRoutes] = useState<Route[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const fetchRoutes = useCallback(async () => {
    try {
      const allRoutes = await DataService.getRoutes()
      setRoutes(allRoutes.slice(0, 6))
    } catch (error) {
      console.error('Failed to fetch routes:', error)
      setRoutes([])
    }
  }, [])

  useEffect(() => {
    setIsVisible(true)
    fetchRoutes()
  }, [fetchRoutes])

  const handleSearch = (val: string) => {
    if (val) {
      navigate(`/explore?q=${encodeURIComponent(val)}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div
        className="hero-section"
        style={{
          position: 'relative',
          padding: isDesktop ? '80px 0 100px' : '60px 20px 80px',
          background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          overflow: 'hidden',
        }}
      >
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '-10%',
          width: isDesktop ? '500px' : '300px',
          height: isDesktop ? '500px' : '300px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '-5%',
          width: isDesktop ? '350px' : '200px',
          height: isDesktop ? '350px' : '200px',
          background: 'radial-gradient(circle, rgba(46,196,182,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
        }} />

        {/* Logo和标题 */}
        <Container>
          <div
            className={isVisible ? 'animate-fade-in-up' : ''}
            style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
          >
            {!isDesktop && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-orange-dark) 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(255,107,53,0.3)',
                }}>
                  <UploadOutline style={{ fontSize: 28, color: 'white' }} />
                </div>
              </div>
            )}

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: isDesktop ? '56px' : '36px',
              fontWeight: 700,
              margin: '0 0 8px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              <span className="gradient-text">ADV</span>
              <span style={{ color: 'var(--text-primary)' }}> MOTO</span>
            </h1>

            <p style={{
              fontSize: isDesktop ? '18px' : '14px',
              color: 'var(--text-secondary)',
              marginBottom: isDesktop ? '48px' : '32px',
              letterSpacing: '1px',
            }}>
              探索未知的骑行世界
            </p>

            {/* 搜索框 */}
            <div
              className={isVisible ? 'animate-fade-in-up delay-200' : ''}
              style={{
                maxWidth: isDesktop ? '600px' : '400px',
                margin: '0 auto',
              }}
            >
              <SearchBar
                placeholder="搜索路线、地点..."
                onSearch={handleSearch}
                style={{
                  '--background': 'rgba(255,255,255,0.05)',
                  '--border-radius': '9999px',
                } as React.CSSProperties}
              />
            </div>

            {/* 快捷统计 */}
            <div
              className={isVisible ? 'animate-fade-in-up delay-300' : ''}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: isDesktop ? '80px' : '40px',
                marginTop: isDesktop ? '60px' : '40px',
              }}
            >
              {[
                { value: `${routes.length}+`, label: '路线', icon: '🛣️' },
                { value: '8,500+', label: '骑士', icon: '🏍️' },
                { value: '50,000+', label: '公里', icon: '📍' },
              ].map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: isDesktop ? '32px' : '24px',
                    fontWeight: 600,
                    color: 'var(--accent-orange)',
                    marginBottom: '4px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: isDesktop ? '14px' : '12px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'center',
                  }}>
                    {stat.icon}
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* 热门路线 */}
      <Container>
        <div style={{ padding: isMobile ? '0 16px 24px' : '0 0 32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isDesktop ? '24px' : '16px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: isDesktop ? '28px' : '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              热门路线
            </h2>
            <Button
              fill='none'
              style={{
                color: 'var(--accent-orange)',
                fontSize: '13px',
                padding: '4px 8px',
              }}
              onClick={() => navigate('/explore')}
            >
              查看全部 <RightOutline style={{ fontSize: 12 }} />
            </Button>
          </div>

          {/* 网格布局 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: isDesktop ? '24px' : '16px',
          }}>
            {routes.map((route, index) => (
              <div
                key={route._id}
                className={isVisible ? 'animate-fade-in-up' : ''}
                style={{
                  animationDelay: `${400 + index * 100}ms`,
                }}
                onClick={() => navigate(`/route/${route._id}`)}
              >
                <Card
                  className="card card-interactive"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                >
                  {/* 路线封面 */}
                  <div
                    style={{
                      width: '100%',
                      height: isDesktop ? '200px' : '140px',
                      background: `linear-gradient(135deg, ${difficultyColors[route.difficultyLevel]}20 0%, ${difficultyColors[route.difficultyLevel]}40 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '10px',
                      height: '10px',
                      background: difficultyColors[route.difficultyLevel],
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${difficultyColors[route.difficultyLevel]}`,
                    }} />
                    <CompassOutline style={{
                      fontSize: isDesktop ? 64 : 48,
                      color: difficultyColors[route.difficultyLevel],
                      opacity: 0.8,
                    }} />
                  </div>

                  {/* 路线信息 */}
                  <div style={{ padding: isDesktop ? '0 4px' : '0' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: isDesktop ? '18px' : '17px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {route.title}
                    </h3>

                    <p style={{
                      fontSize: isDesktop ? '14px' : '13px',
                      color: 'var(--text-secondary)',
                      margin: '0 0 12px',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {route.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderRadius: '9999px',
                        background: `${difficultyColors[route.difficultyLevel]}15`,
                        color: difficultyColors[route.difficultyLevel],
                        border: `1px solid ${difficultyColors[route.difficultyLevel]}30`,
                      }}>
                        {difficultyLabels[route.difficultyLevel]}
                      </span>

                      {route.terrainTags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 500,
                            borderRadius: '9999px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: '12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      <span>{route.distanceKm}km</span>
                      <span>↗ {route.elevationGainM}m</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FireFill style={{ fontSize: 12, color: 'var(--accent-orange)' }} />
                        {route.downloadCount}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* 社区亮点 */}
      <Container>
        <div style={{ padding: isMobile ? '0 16px 100px' : '0 0 80px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isDesktop ? '28px' : '20px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
          }}>
            社区亮点
          </h2>

          <Card style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(46,196,182,0.1) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? '24px' : '16px' }}>
              <div style={{
                width: isDesktop ? '72px' : '56px',
                height: isDesktop ? '72px' : '56px',
                background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-gold) 100%)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FireFill style={{ fontSize: isDesktop ? 40 : 32, color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: isDesktop ? '18px' : '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px',
                }}>
                  本周热门骑士
                </h3>
                <p style={{
                  fontSize: isDesktop ? '14px' : '13px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}>
                  @大漠孤烟 分享了3条新路线，获得256个赞
                </p>
              </div>
              <Button
                size='small'
                style={{
                  background: 'var(--accent-orange)',
                  color: 'white',
                  border: 'none',
                }}
              >
                关注
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  )
}
