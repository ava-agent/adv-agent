// GPX 文件解析服务

import type { GPXData, GPXTrackPoint } from '../types'

export class GPXParser {
  /**
   * 解析 GPX 文件内容
   */
  static parse(gpxContent: string): GPXData {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(gpxContent, 'text/xml')

    // 检查解析错误
    const parseError = xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      throw new Error('GPX 文件格式错误')
    }

    // 尝试获取 track points (trkpt)
    let trackPoints = xmlDoc.getElementsByTagName('trkpt')

    // 如果没有 trkpt，尝试 route points (rtept)
    if (trackPoints.length === 0) {
      trackPoints = xmlDoc.getElementsByTagName('rtept')
    }

    // 如果还是没有，尝试 waypoint (wpt)
    if (trackPoints.length === 0) {
      trackPoints = xmlDoc.getElementsByTagName('wpt')
    }

    if (trackPoints.length === 0) {
      throw new Error('GPX 文件中没有找到轨迹点')
    }

    const points: GPXTrackPoint[] = []

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i]
      const lat = parseFloat(point.getAttribute('lat') || '0')
      const lon = parseFloat(point.getAttribute('lon') || '0')

      if (isNaN(lat) || isNaN(lon)) continue

      const eleNode = point.getElementsByTagName('ele')[0]
      const timeNode = point.getElementsByTagName('time')[0]

      const pt: GPXTrackPoint = {
        lat,
        lon,
      }

      if (eleNode && eleNode.textContent) {
        pt.ele = parseFloat(eleNode.textContent)
      }

      if (timeNode && timeNode.textContent) {
        pt.time = timeNode.textContent
      }

      points.push(pt)
    }

    if (points.length < 2) {
      throw new Error('GPX 文件中有效轨迹点少于2个')
    }

    // 计算距离和高程数据
    const stats = this.calculateStats(points)

    // 获取路线名称
    const nameNode = xmlDoc.getElementsByTagName('name')[0]
    const name = nameNode?.textContent || undefined

    return {
      name,
      points,
      ...stats
    }
  }

  /**
   * 计算统计数据
   */
  private static calculateStats(points: GPXTrackPoint[]) {
    let totalDistance = 0
    let elevationGain = 0
    let elevationLoss = 0
    let lastEle = points[0].ele || 0

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]

      // 计算两点间距离（Haversine 公式）
      totalDistance += this.calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon)

      // 计算高程变化
      if (curr.ele !== undefined) {
        const eleDiff = curr.ele - lastEle
        if (eleDiff > 0) {
          elevationGain += eleDiff
        } else {
          elevationLoss += Math.abs(eleDiff)
        }
        lastEle = curr.ele
      }
    }

    // 估算时间（假设平均速度 30km/h）
    const avgSpeed = 30 // km/h
    const estimatedTime = Math.round((totalDistance / avgSpeed) * 60) // 分钟

    return {
      distance: Math.round(totalDistance * 100) / 100, // 保留两位小数
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss),
      estimatedTime
    }
  }

  /**
   * 使用 Haversine 公式计算两点间距离（单位：km）
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // 地球半径（km）
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * 生成 GeoJSON LineString 坐标
   */
  static toGeoJSONCoordinates(gpxData: GPXData): number[][] {
    return gpxData.points.map(p => [p.lon, p.lat])
  }

  /**
   * 提取高程数据数组
   */
  static getElevationData(gpxData: GPXData): number[] {
    return gpxData.points.map(p => p.ele || 0)
  }

  /**
   * 生成 GPX 文件内容（用于下载）
   */
  static generateGPX(gpxData: GPXData, title: string): string {
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="ADV Moto Hub" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${this.escapeXml(title)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${this.escapeXml(title)}</name>
    <trkseg>
`
    gpxData.points.forEach(point => {
      gpx += `      <trkpt lat="${point.lat}" lon="${point.lon}">`
      if (point.ele !== undefined) {
        gpx += `\n        <ele>${point.ele}</ele>`
      }
      if (point.time) {
        gpx += `\n        <time>${point.time}</time>`
      }
      gpx += `\n      </trkpt>\n`
    })

    gpx += `    </trkseg>
  </trk>
</gpx>`

    return gpx
  }

  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * 读取文件内容
   */
  static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          resolve(content)
        } else {
          reject(new Error('文件读取失败'))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }
}
