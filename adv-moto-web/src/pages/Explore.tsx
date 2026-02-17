import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Selector, Button, SearchBar } from 'antd-mobile'
import { RightOutline, EnvironmentOutline, FilterOutline } from 'antd-mobile-icons'
import { DataService } from '../services/dataService'
import type { Route } from '../types'
import { useBreakpoint } from '../hooks/useBreakpoint'

const difficultyLabels = ['', '休闲', '入门', '进阶', '挑战', '极限']
const difficultyColors = ['', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7']
const terrainOptions = [
  { label: '碎石', value: '碎石' },
  { label: '涉水', value: '涉水' },
  { label: '泥泞', value: '泥泞' },
  { label: '沙地', value: '沙地' },
  { label: '高海拔', value: '高海拔' },
]

export default function Explore() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isMobile, isDesktop } = useBreakpoint()
  const [routes, setRoutes] = useState<Route[]>([])
  const [allRoutes, setAllRoutes] = useState<Route[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<number[]>([])
  const [selectedTerrain, setSelectedTerrain] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const loadedRoutes = await DataService.getRoutes()
        setAllRoutes(loadedRoutes)
        setRoutes(loadedRoutes)
      } catch (error) {
        console.error('Failed to load routes:', error)
        setAllRoutes([])
        setRoutes([])
      } finally {
        setLoading(false)
      }
    }

    loadRoutes()
  }, [])

  useEffect(() => {
    let filtered = allRoutes

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.terrainTags.some(t => t.toLowerCase().includes(q))
      )
    }

    if (selectedDifficulty.length > 0) {
      filtered = filtered.filter(r => r.difficultyLevel === selectedDifficulty[0])
    }

    if (selectedTerrain.length > 0) {
      filtered = filtered.filter(r =>
        selectedTerrain.some(t => r.terrainTags.includes(t))
      )
    }

    setRoutes(filtered)
  }, [selectedDifficulty, selectedTerrain, searchQuery, allRoutes])

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>加载中...</p>
      </div>
    )
  }

  // 移动端布局
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '80px' }}>
        {/* 顶部标题栏 */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FilterOutline style={{ fontSize: 24, color: 'var(--accent-orange)' }} />
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              探索路线
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            找到 {routes.length} 条精彩路线
          </p>
          <div style={{ marginTop: '12px' }}>
            <SearchBar
              placeholder="搜索路线..."
              value={searchQuery}
              onChange={setSearchQuery}
              style={{
                '--background': 'rgba(255,255,255,0.05)',
                '--border-radius': '9999px',
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* 筛选面板 */}
        <div style={{ padding: '16px' }}>
          <Card style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                难度等级
              </div>
              <Selector
                options={[
                  { label: '全部', value: 0 },
                  { label: '休闲', value: 1 },
                  { label: '入门', value: 2 },
                  { label: '进阶', value: 3 },
                  { label: '挑战', value: 4 },
                  { label: '极限', value: 5 },
                ]}
                value={selectedDifficulty}
                onChange={setSelectedDifficulty}
                multiple={false}
              />
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                地形类型
              </div>
              <Selector
                options={terrainOptions}
                value={selectedTerrain}
                onChange={setSelectedTerrain}
                multiple
              />
            </div>
          </Card>
        </div>

        {/* 路线列表 */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {routes.map(route => (
              <div
                key={route._id}
                onClick={() => navigate(`/route/${route._id}`)}
                className="card card-interactive"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: `linear-gradient(135deg, ${difficultyColors[route.difficultyLevel]}20 0%, ${difficultyColors[route.difficultyLevel]}40 100%)`,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <EnvironmentOutline style={{ fontSize: 28, color: difficultyColors[route.difficultyLevel] }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {route.title}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {route.description}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
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
                            padding: '3px 8px',
                            fontSize: '11px',
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
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '8px',
                    }}>
                      {route.distanceKm}km • ↗ {route.elevationGainM}m • ⏱️ {route.estimatedTimeMin}分钟
                    </div>
                  </div>
                  <RightOutline style={{ fontSize: 20, color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 桌面/平板端布局
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '32px' }}>
      {/* 顶部标题栏 */}
      <div style={{
        padding: isDesktop ? '32px 0' : '24px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        marginBottom: '24px',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isDesktop ? '0 32px' : '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <FilterOutline style={{ fontSize: 28, color: 'var(--accent-orange)' }} />
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isDesktop ? '28px' : '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  探索路线
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  找到 <strong style={{ color: 'var(--accent-orange)' }}>{routes.length}</strong> 条精彩路线
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <SearchBar
                placeholder="搜索路线..."
                value={searchQuery}
                onChange={setSearchQuery}
                style={{
                  '--background': 'rgba(255,255,255,0.05)',
                  '--border-radius': '9999px',
                  width: '260px',
                } as React.CSSProperties}
              />
            <Button
              size="large"
              onClick={() => setShowMap(!showMap)}
              style={{
                background: showMap ? 'var(--accent-orange)' : 'var(--bg-elevated)',
                color: 'white',
                border: 'none',
                height: '44px',
                minWidth: '44px',
              }}
            >
              {showMap ? '隐藏地图' : '显示地图'}
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isDesktop ? '0 32px' : '0 16px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '300px 1fr' : '1fr', gap: '24px' }}>
          {/* 筛选面板 */}
          <div>
            <Card style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              position: 'sticky',
              top: '0',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 16px',
                }}>
                  筛选条件
                </h3>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  难度等级
                </div>
                <Selector
                  options={[
                    { label: '全部', value: 0 },
                    { label: '休闲', value: 1 },
                    { label: '入门', value: 2 },
                    { label: '进阶', value: 3 },
                    { label: '挑战', value: 4 },
                    { label: '极限', value: 5 },
                  ]}
                  value={selectedDifficulty}
                  onChange={setSelectedDifficulty}
                  multiple={false}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  地形类型
                </div>
                <Selector
                  options={terrainOptions}
                  value={selectedTerrain}
                  onChange={setSelectedTerrain}
                  multiple
                />
              </div>
            </Card>
          </div>

          {/* 路线列表 */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
              gap: '16px',
            }}>
              {routes.map(route => (
                <Card
                  key={route._id}
                  onClick={() => navigate(`/route/${route._id}`)}
                  className="card card-interactive"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    height: '100%',
                  }}
                >
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: `linear-gradient(135deg, ${difficultyColors[route.difficultyLevel]}20 0%, ${difficultyColors[route.difficultyLevel]}40 100%)`,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}>
                      <EnvironmentOutline style={{ fontSize: 32, color: difficultyColors[route.difficultyLevel] }} />
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '18px',
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
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      margin: '0 0 12px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {route.description}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
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
                            padding: '4px 10px',
                            fontSize: '11px',
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
                      gap: '16px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      <span>{route.distanceKm}km</span>
                      <span>↗ {route.elevationGainM}m</span>
                      <span>⏱️ {route.estimatedTimeMin}分钟</span>
                      <span>📥 {route.downloadCount}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
