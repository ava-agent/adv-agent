import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Selector, TextArea, Toast, Card, NavBar } from 'antd-mobile'
import { UploadOutline, CheckCircleOutline, LeftOutline } from 'antd-mobile-icons'
import { DataService } from '../services/dataService'
import { GPXParser } from '../services/gpxParser'
import type { GPXData } from '../types'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Container } from '../components/Container'

const difficultyOptions = [
  { label: '休闲 - 铺装路面', value: 1 },
  { label: '入门 - 少量碎石', value: 2 },
  { label: '进阶 - 混合地形', value: 3 },
  { label: '挑战 - 技术路段', value: 4 },
  { label: '极限 - 硬派越野', value: 5 },
]

const terrainOptions = [
  { label: '碎石', value: '碎石' },
  { label: '涉水', value: '涉水' },
  { label: '泥泞', value: '泥泞' },
  { label: '沙地', value: '沙地' },
  { label: '高海拔', value: '高海拔' },
  { label: '单行道', value: '单行道' },
]

export default function Upload() {
  const navigate = useNavigate()
  const { isMobile, isDesktop } = useBreakpoint()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [parsedGPX, setParsedGPX] = useState<GPXData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.gpx')) {
        await parseGPXFile(file)
      } else {
        Toast.show({ content: '请选择GPX文件', icon: 'fail' })
      }
    }
  }

  const parseGPXFile = async (file: File) => {
    setSelectedFile(file)
    setParseError(null)

    try {
      const content = await GPXParser.readFile(file)
      const gpxData = GPXParser.parse(content)
      setParsedGPX(gpxData)
      Toast.show({ content: '文件解析成功！', icon: 'success' })

      form.setFieldsValue({
        distance: gpxData.distance,
        elevation: gpxData.elevationGain,
      })
    } catch (err) {
      console.error('GPX 解析失败', err)
      setParseError('GPX 文件解析失败，请检查文件格式')
      Toast.show({ content: 'GPX 解析失败', icon: 'fail' })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.name.endsWith('.gpx')) {
        await parseGPXFile(file)
      } else {
        Toast.show({ content: '请选择GPX文件', icon: 'fail' })
      }
    }
  }

  const handleUpload = async () => {
    const values = form.getFieldsValue()

    if (!selectedFile) {
      Toast.show({ content: '请先选择GPX文件', icon: 'fail' })
      return
    }

    if (!values.title) {
      Toast.show({ content: '请填写路线名称', icon: 'fail' })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Use DataService to create the route with file upload
      const result = await DataService.createRoute({
        title: values.title,
        description: values.description || '暂无描述',
        difficultyLevel: values.difficulty?.[0] || 1,
        terrainTags: values.terrain || [],
        gpxFile: selectedFile
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.route) {
        Toast.show({ content: '上传成功！', icon: 'success' })

        setTimeout(() => {
          navigate(`/route/${result.route!._id}`)
        }, 1000)
      } else {
        Toast.show({
          content: result.error || '上传失败，请重试',
          icon: 'fail'
        })
      }
    } catch (err) {
      clearInterval(progressInterval)
      console.error('上传失败', err)
      Toast.show({ content: '上传失败，请重试', icon: 'fail' })
    }

    setUploading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* 桌面端标题栏 */}
      {isDesktop && (
        <div style={{
          padding: '32px 0',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '32px',
        }}>
          <Container>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              上传路线
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              margin: '8px 0 0',
            }}>
              分享你的骑行路线，与社区一起探索
            </p>
          </Container>
        </div>
      )}

      {/* 移动端顶部导航 */}
      {isMobile && (
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
          >
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              上传路线
            </span>
          </NavBar>
        </div>
      )}

      <Container>
        <div style={{
          display: isDesktop ? 'grid' : 'block',
          gridTemplateColumns: isDesktop ? '1fr 360px' : 'auto',
          gap: isDesktop ? '48px' : '0',
          paddingBottom: isMobile ? '100px' : '80px',
        }}>
          {/* 左侧主要内容 */}
          <div>
            {/* 文件上传区域 */}
            <Card style={{
              background: 'var(--bg-card)',
              border: `2px dashed ${isDragging ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-xl)',
              marginBottom: isDesktop ? '32px' : '24px',
              transition: 'all 0.3s ease',
            }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  padding: isDesktop ? '60px 40px' : '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />

                {parsedGPX ? (
                  <div className="animate-scale-in">
                    <div style={{
                      width: isDesktop ? '100px' : '80px',
                      height: isDesktop ? '100px' : '80px',
                      background: 'linear-gradient(135deg, var(--success) 0%, #16a34a 100%)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 8px 30px rgba(34, 197, 94, 0.3)',
                    }}>
                      <CheckCircleOutline style={{ fontSize: isDesktop ? 50 : 40, color: 'white' }} />
                    </div>
                    <div style={{
                      fontSize: isDesktop ? '18px' : '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}>
                      {selectedFile?.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      marginBottom: isDesktop ? '16px' : '12px',
                    }}>
                      {(selectedFile?.size || 0) / 1024 > 1024
                        ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(1)} MB`
                        : `${((selectedFile?.size || 0) / 1024).toFixed(1)} KB`}
                    </div>
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      padding: isDesktop ? '16px' : '12px',
                      marginTop: isDesktop ? '16px' : '12px',
                      textAlign: 'left',
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        解析结果：
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: isDesktop ? '12px' : '8px'
                      }}>
                        <span>📍 {parsedGPX.points.length} 个轨迹点</span>
                        <span>🛣️ {parsedGPX.distance.toFixed(1)} km</span>
                        <span>⛰️ +{parsedGPX.elevationGain}m</span>
                        <span>⬇️ -{parsedGPX.elevationLoss}m</span>
                      </div>
                    </div>
                    <Button
                      size="small"
                      style={{
                        marginTop: '16px',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        setParsedGPX(null)
                      }}
                    >
                      重新选择
                    </Button>
                  </div>
                ) : (
                  <div className={isDragging ? 'animate-scale-in' : ''}>
                    <div style={{
                      width: isDesktop ? '100px' : '80px',
                      height: isDesktop ? '100px' : '80px',
                      background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-orange-dark) 100%)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 8px 30px rgba(255, 107, 53, 0.3)',
                    }}>
                      <UploadOutline style={{ fontSize: isDesktop ? 50 : 40, color: 'white' }} />
                    </div>
                    <div style={{
                      fontSize: isDesktop ? '18px' : '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}>
                      点击或拖拽上传GPX文件
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                    }}>
                      支持 .gpx 格式文件
                    </div>
                    {parseError && (
                      <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: 'var(--error)',
                      }}>
                        {parseError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {uploading && (
                <div style={{ padding: '0 40px 20px' }}>
                  <div style={{
                    height: '4px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, var(--accent-orange), var(--accent-gold))',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{
                    textAlign: 'center',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}>
                    上传中... {uploadProgress}%
                  </div>
                </div>
              )}
            </Card>

            {/* 表单 */}
            <Card style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: isDesktop ? '22px' : '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 24px',
              }}>
                路线信息
              </h3>

              <Form
                form={form}
                layout="vertical"
                footer={
                  <Button
                    block
                    type="submit"
                    size="large"
                    loading={uploading}
                    disabled={!selectedFile || uploading}
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-orange-dark) 100%)',
                      color: 'white',
                      border: 'none',
                      height: isDesktop ? '52px' : '48px',
                      fontSize: isDesktop ? '17px' : '16px',
                      fontWeight: 600,
                      boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
                      marginTop: isDesktop ? '32px' : '24px',
                    }}
                  >
                    {uploading ? '上传中...' : '发布路线'}
                  </Button>
                }
                onFinish={handleUpload}
              >
                <Form.Item
                  name="title"
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>路线名称</span>}
                  rules={[{ required: true, message: '请输入路线名称' }]}
                >
                  <Input
                    placeholder="例如：北京延庆穿越线"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      padding: isDesktop ? '14px 18px' : '12px 16px',
                      fontSize: '15px',
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>路线描述</span>}
                >
                  <TextArea
                    placeholder="描述一下这条路线的特点、注意事项..."
                    rows={isDesktop ? 5 : 4}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      padding: isDesktop ? '14px 18px' : '12px 16px',
                      fontSize: '15px',
                    }}
                  />
                </Form.Item>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                  gap: isDesktop ? '20px' : '0',
                }}>
                  <Form.Item
                    name="difficulty"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>难度等级</span>}
                  >
                    <Selector
                      options={difficultyOptions}
                      columns={1}
                      multiple={false}
                    />
                  </Form.Item>

                  <Form.Item
                    name="terrain"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>路况标签</span>}
                  >
                    <Selector
                      options={terrainOptions}
                      columns={3}
                      multiple
                    />
                  </Form.Item>
                </div>
              </Form>
            </Card>
          </div>

          {/* 右侧提示区域 - 仅桌面端 */}
          {isDesktop && (
            <div>
              <div style={{
                position: 'sticky',
                top: '32px',
              }}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(46, 196, 182, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--accent-cyan)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <UploadOutline style={{ fontSize: 24, color: 'white' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}>
                        上传提示
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        遵循以下指南获得更好的体验
                      </div>
                    </div>
                  </div>
                  <ul style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    paddingLeft: '20px',
                    lineHeight: 2,
                  }}>
                    <li>GPX文件可以从导航设备或手机App导出</li>
                    <li>建议路线长度在50-300km之间</li>
                    <li>详细描述有助于其他骑士了解路线特点</li>
                    <li>数据将保存在本地浏览器中</li>
                    <li>选择合适的难度等级方便他人参考</li>
                  </ul>
                </Card>

                <Card style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  marginTop: '24px',
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}>
                      需要帮助？
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      查看我们的指南了解如何导出GPX文件
                    </div>
                  </div>
                  <Button
                    size="small"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--accent-orange)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    查看指南
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* 移动端提示卡片 */}
        {isMobile && (
          <Card style={{
            background: 'linear-gradient(135deg, rgba(46, 196, 182, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginTop: '16px',
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--accent-cyan)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <UploadOutline style={{ fontSize: 20, color: 'white' }} />
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  上传提示
                </div>
                <ul style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  paddingLeft: '16px',
                  lineHeight: 1.8,
                }}>
                  <li>GPX文件可以从导航设备或手机App导出</li>
                  <li>建议路线长度在50-300km之间</li>
                  <li>详细描述有助于其他骑士了解路线特点</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </Container>
    </div>
  )
}
