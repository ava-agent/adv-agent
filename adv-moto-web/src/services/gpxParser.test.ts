import { describe, it, expect } from 'vitest'
import { GPXParser } from './gpxParser'
import type { GPXData } from '../types'

// Minimal valid GPX with trkpt elements
const VALID_GPX_TRKPT = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Test Route</name></metadata>
  <trk>
    <name>Test Route</name>
    <trkseg>
      <trkpt lat="39.9" lon="116.3"><ele>50</ele><time>2024-01-01T00:00:00Z</time></trkpt>
      <trkpt lat="39.91" lon="116.31"><ele>55</ele></trkpt>
      <trkpt lat="39.92" lon="116.32"><ele>60</ele></trkpt>
      <trkpt lat="39.93" lon="116.33"><ele>58</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

const VALID_GPX_RTEPT = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <rte>
    <rtept lat="40.0" lon="116.0"><ele>100</ele></rtept>
    <rtept lat="40.01" lon="116.01"><ele>110</ele></rtept>
    <rtept lat="40.02" lon="116.02"><ele>120</ele></rtept>
  </rte>
</gpx>`

const VALID_GPX_WPT = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="30.0" lon="110.0"><ele>200</ele></wpt>
  <wpt lat="30.01" lon="110.01"><ele>210</ele></wpt>
  <wpt lat="30.02" lon="110.02"><ele>220</ele></wpt>
</gpx>`

describe('GPXParser.parse', () => {
  it('parses trkpt elements correctly', () => {
    const result = GPXParser.parse(VALID_GPX_TRKPT)
    expect(result.points).toHaveLength(4)
    expect(result.points[0].lat).toBe(39.9)
    expect(result.points[0].lon).toBe(116.3)
    expect(result.points[0].ele).toBe(50)
    expect(result.points[0].time).toBe('2024-01-01T00:00:00Z')
  })

  it('parses rtept when no trkpt found', () => {
    const result = GPXParser.parse(VALID_GPX_RTEPT)
    expect(result.points).toHaveLength(3)
    expect(result.points[0].lat).toBe(40.0)
  })

  it('parses wpt when no trkpt or rtept found', () => {
    const result = GPXParser.parse(VALID_GPX_WPT)
    expect(result.points).toHaveLength(3)
    expect(result.points[0].lat).toBe(30.0)
  })

  it('extracts route name from metadata', () => {
    const result = GPXParser.parse(VALID_GPX_TRKPT)
    expect(result.name).toBe('Test Route')
  })

  it('returns undefined name when no name element', () => {
    const gpx = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="10.0" lon="10.0"><ele>10</ele></trkpt>
    <trkpt lat="10.01" lon="10.01"><ele>11</ele></trkpt>
  </trkseg></trk>
</gpx>`
    const result = GPXParser.parse(gpx)
    expect(result.name).toBeUndefined()
  })

  it('throws on invalid XML', () => {
    expect(() => GPXParser.parse('not valid xml <<>')).toThrow('GPX 文件格式错误')
  })

  it('throws when no track points found', () => {
    const gpx = `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"></gpx>`
    expect(() => GPXParser.parse(gpx)).toThrow('GPX 文件中没有找到轨迹点')
  })

  it('throws when fewer than 2 valid points', () => {
    const gpx = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="10.0" lon="10.0"></trkpt>
  </trkseg></trk>
</gpx>`
    expect(() => GPXParser.parse(gpx)).toThrow('GPX 文件中有效轨迹点少于2个')
  })

  it('calculates distance greater than 0', () => {
    const result = GPXParser.parse(VALID_GPX_TRKPT)
    expect(result.distance).toBeGreaterThan(0)
  })

  it('calculates elevation gain correctly', () => {
    const result = GPXParser.parse(VALID_GPX_TRKPT)
    // Points: 50→55→60→58: gain = 5+5=10, loss = 2
    expect(result.elevationGain).toBe(10)
    expect(result.elevationLoss).toBe(2)
  })

  it('calculates estimated time based on distance', () => {
    const result = GPXParser.parse(VALID_GPX_TRKPT)
    // estimatedTime = round((distance / 30) * 60)
    const expected = Math.round((result.distance / 30) * 60)
    expect(result.estimatedTime).toBe(expected)
  })

  it('skips invalid coordinate points', () => {
    const gpx = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="invalid" lon="invalid"></trkpt>
    <trkpt lat="10.0" lon="10.0"></trkpt>
    <trkpt lat="10.01" lon="10.01"></trkpt>
  </trkseg></trk>
</gpx>`
    const result = GPXParser.parse(gpx)
    expect(result.points).toHaveLength(2)
  })
})

describe('GPXParser.toGeoJSONCoordinates', () => {
  it('returns [lon, lat] pairs', () => {
    const data = GPXParser.parse(VALID_GPX_TRKPT)
    const coords = GPXParser.toGeoJSONCoordinates(data)
    expect(coords[0]).toEqual([116.3, 39.9])
    expect(coords).toHaveLength(data.points.length)
  })
})

describe('GPXParser.getElevationData', () => {
  it('returns elevation array with fallback to 0', () => {
    const data: GPXData = {
      points: [
        { lat: 10, lon: 10, ele: 100 },
        { lat: 10.01, lon: 10.01 },
        { lat: 10.02, lon: 10.02, ele: 200 },
      ],
      distance: 5,
      elevationGain: 100,
      elevationLoss: 0,
      estimatedTime: 10
    }
    const elevations = GPXParser.getElevationData(data)
    expect(elevations).toEqual([100, 0, 200])
  })
})

describe('GPXParser.generateGPX', () => {
  it('generates valid GPX XML string', () => {
    const data = GPXParser.parse(VALID_GPX_TRKPT)
    const output = GPXParser.generateGPX(data, 'My Route')
    expect(output).toContain('<?xml version="1.0"')
    expect(output).toContain('<gpx')
    expect(output).toContain('<trkpt')
    expect(output).toContain('My Route')
    expect(output).toContain('lat="39.9"')
  })

  it('escapes special characters in title', () => {
    const data = GPXParser.parse(VALID_GPX_TRKPT)
    const output = GPXParser.generateGPX(data, 'Route & "Test" <1>')
    expect(output).toContain('&amp;')
    expect(output).toContain('&quot;')
    expect(output).toContain('&lt;')
  })

  it('includes elevation when present', () => {
    const data = GPXParser.parse(VALID_GPX_TRKPT)
    const output = GPXParser.generateGPX(data, 'Test')
    expect(output).toContain('<ele>50</ele>')
  })

  it('includes time when present', () => {
    const data = GPXParser.parse(VALID_GPX_TRKPT)
    const output = GPXParser.generateGPX(data, 'Test')
    expect(output).toContain('<time>2024-01-01T00:00:00Z</time>')
  })
})
