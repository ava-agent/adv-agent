/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar, Card, Button, Avatar, Dialog, Toast, Space, TextArea } from 'antd-mobile'
import { LeftOutline, DownlandOutline, HeartOutline, MessageOutline } from 'antd-mobile-icons'
import { DataService } from '../services/dataService'
import { GPXParser } from '../services/gpxParser'
import { RouteMap } from '../components/RouteMap'
import { ElevationChart } from '../components/ElevationChart'
import type { Route, Review, GPXData } from '../types'

const difficultyLabels = ['', '休闲', '入门', '进阶', '挑战', '极限']
const difficultyColors = ['', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7']

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [route, setRoute] = useState<Route | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (id) {
      fetchRouteDetail()
      checkFavoriteStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchRouteDetail = async () => {
    setLoading(true)
    try {
      const foundRoute = await DataService.getRoute(id || '')
      if (foundRoute) {
        setRoute(foundRoute)
        const routeReviews = await DataService.getReviews(id || '')
        setReviews(routeReviews)
      } else {
        // 如果没有找到，使用默认示例数据
        const allRoutes = await DataService.getRoutes()
        if (allRoutes.length > 0) {
          setRoute(allRoutes[0])
          const routeReviews = await DataService.getReviews(allRoutes[0]._id)
          setReviews(routeReviews)
        } else {
          setRoute(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch route detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    if (id) {
      const favorite = await DataService.isFavorite(id)
      setIsLiked(favorite)
    }
  }

  const handleDownload = () => {
    if (!route) return

    if (route.gpxData) {
      // 有原始 GPX 数据，直接下载
      downloadGPX(route.gpxData, route.title)
    } else if (route.geometry && route.geometry.coordinates.length > 0) {
      // 从 geometry 生成 GPX 数据
      const gpxContent = generateGPXFromRoute(route)
      downloadGPX(gpxContent, route.title)
    } else {
      Dialog.alert({
        content: '该路线暂无GPX文件',
        confirmText: '知道了'
      })
    }
  }

  const generateGPXFromRoute = (route: Route): string => {
    const points = route.geometry.coordinates.map(coord => ({
      lat: coord[1],
      lon: coord[0],
      ele: route.elevationData?.[route.geometry.coordinates.indexOf(coord)] || 100
    }))

    const gpxData: GPXData = {
      name: route.title,
      points,
      distance: route.distanceKm,
      elevationGain: route.elevationGainM,
      elevationLoss: 0,
      estimatedTime: route.estimatedTimeMin
    }

    return GPXParser.generateGPX(gpxData, route.title)
  }

  const downloadGPX = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.gpx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // 增加下载计数
    if (route) {
      const updatedRoute = { ...route, downloadCount: route.downloadCount + 1 }
      setRoute(updatedRoute)
    }

    Toast.show({ content: '开始下载GPX文件', icon: 'success' })
  }

  const handleAddReview = useCallback(() => {
    setShowReviewForm(true)
  }, [])

  const handleSubmitReview = useCallback(async () => {
    if (!reviewComment.trim()) {
      Toast.show({ content: '请输入评价内容', icon: 'fail' })
      return
    }
    if (!route) return

    setSubmittingReview(true)
    try {
      const newReview: Review = {
        _id: `review_${Date.now()}`,
        routeId: route._id,
        userId: 'current_user',
        userName: '当前用户',
        userAvatar: '',
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      }

      await DataService.addReview(newReview)
      setReviews(prev => [newReview, ...prev])
      setShowReviewForm(false)
      setReviewComment('')
      setReviewRating(5)
      Toast.show({ content: '评价发布成功', icon: 'success' })
    } catch (error) {
      console.error('Failed to submit review:', error)
      Toast.show({ content: '发布失败，请重试', icon: 'fail' })
    } finally {
      setSubmittingReview(false)
    }
  }, [reviewComment, reviewRating, route])

  const handleLike = async () => {
    if (!route) return

    try {
      const newState = await DataService.toggleFavorite(route._id)
      setIsLiked(newState)

      Toast.show({
        content: newState ? '已添加到收藏' : '已取消收藏',
        icon: newState ? 'success' : 'fail'
      })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      Toast.show({
        content: '操作失败，请重试',
        icon: 'fail'
      })
    }
  }

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

  if (!route) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        路线不存在
      </div>
    )
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
  }

  // 使用真实的地图组件渲染路线
  const createRoutePreview = () => {
    const coordinates = route.geometry?.coordinates || []
    if (coordinates.length < 2) return null

    return <RouteMap coordinates={coordinates} difficultyLevel={route.difficultyLevel} height="350px" />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
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
          onBack={() => navigate(-1)}
          backArrow={<LeftOutline style={{ fontSize: 24, color: 'var(--text-primary)' }} />}
          right={
            <Space>
              <Button
                size="small"
                fill="none"
                onClick={handleLike}
                style={{ padding: '8px' }}
              >
                <HeartOutline
                  style={{
                    fontSize: 24,
                    color: isLiked ? 'var(--accent-orange)' : 'var(--text-secondary)',
                    fill: isLiked ? 'var(--accent-orange)' : 'none'
                  }}
                />
              </Button>
              <Button
                size="small"
                fill="none"
                onClick={handleDownload}
                style={{ padding: '8px' }}
              >
                <DownlandOutline style={{ fontSize: 24, color: 'var(--text-secondary)' }} />
              </Button>
            </Space>
          }
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            路线详情
          </span>
        </NavBar>
      </div>

      {/* 路线预览图 */}
      <div style={{ padding: '16px' }}>
        {createRoutePreview()}
      </div>

      {/* 路线信息 */}
      <div style={{ padding: '0 16px 100px' }}>
        <Card style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
        }}>
          {/* 标题和难度 */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 12px',
              lineHeight: 1.3,
            }}>
              {route.title}
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRadius: '9999px',
                background: `${difficultyColors[route.difficultyLevel]}20`,
                color: difficultyColors[route.difficultyLevel],
                border: `1px solid ${difficultyColors[route.difficultyLevel]}40`,
              }}>
                {difficultyLabels[route.difficultyLevel]}
              </span>

              {route.terrainTags.map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
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
          </div>

          {/* 描述 */}
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 24px',
          }}>
            {route.description}
          </p>

          {/* 统计数据 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            padding: '20px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}>
            {[
              { value: route.distanceKm, unit: 'km', label: '总距离', icon: '🛣️' },
              { value: route.elevationGainM, unit: 'm', label: '累计爬升', icon: '⛰️' },
              { value: formatTime(route.estimatedTimeMin), unit: '', label: '预估时间', icon: '⏱️' },
            ].map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--accent-orange)',
                  marginBottom: '2px',
                }}>
                  {stat.value}{stat.unit}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* 高程图表 */}
          {route.elevationData && route.elevationData.length > 0 && (
            <ElevationChart
              elevationData={route.elevationData}
              distanceKm={route.distanceKm}
              height="150px"
            />
          )}

          {/* 上传者信息 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <Avatar
              src={route.uploader?.avatarUrl || ''}
              fallback={<div style={{ fontSize: 24 }}>🏍️</div>}
              style={{ '--size': '48px' } as any}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '2px',
              }}>
                {route.uploader?.nickname || '未知用户'}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                路线贡献者 · {route.downloadCount} 次下载
              </div>
            </div>
            <Button
              size="small"
              style={{
                background: 'var(--accent-orange)',
                color: 'white',
                border: 'none',
                fontSize: '12px',
              }}
            >
              关注
            </Button>
          </div>
        </Card>

        {/* 评价列表 */}
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
              评价 ({reviews.length})
            </h2>
            <Button
              size="small"
              onClick={handleAddReview}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <MessageOutline style={{ fontSize: 14, marginRight: 4 }} />
              写评价
            </Button>
          </div>

          {/* 评价表单 */}
          {showReviewForm && (
            <Card
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-orange)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '16px',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  评分
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        fontSize: '28px',
                        cursor: 'pointer',
                        color: star <= reviewRating ? 'var(--accent-gold)' : 'var(--border-default)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      {star <= reviewRating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  评价内容
                </div>
                <TextArea
                  placeholder="分享你的骑行体验..."
                  value={reviewComment}
                  onChange={setReviewComment}
                  rows={3}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={() => {
                    setShowReviewForm(false)
                    setReviewComment('')
                    setReviewRating(5)
                  }}
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  取消
                </Button>
                <Button
                  size="small"
                  loading={submittingReview}
                  onClick={handleSubmitReview}
                  style={{
                    background: 'var(--accent-orange)',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  发布评价
                </Button>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.map(review => (
              <Card
                key={review._id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Avatar
                    src={review.userAvatar}
                    fallback={<div style={{ fontSize: 20 }}>👤</div>}
                    style={{ '--size': '40px' } as any}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}>
                        {review.userName}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        {review.createdAt}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--accent-gold)',
                      marginBottom: '8px',
                      letterSpacing: '2px',
                    }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.6,
                    }}>
                      {review.comment}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 底部下载按钮 */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: 'linear-gradient(transparent, var(--bg-primary) 30%)',
          zIndex: 100,
        }}>
          <Button
            block
            size="large"
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-orange-dark) 100%)',
              color: 'white',
              border: 'none',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
            }}
          >
            <DownlandOutline style={{ fontSize: 20, marginRight: 8 }} />
            下载GPX文件
          </Button>
        </div>
      </div>
    </div>
  )
}
