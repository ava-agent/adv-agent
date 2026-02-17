/**
 * RouteMap Component
 *
 * Displays route on an interactive map using MapLibre GL
 * Shows the route path, start/end markers, and auto-fits bounds
 */

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface RouteMapProps {
  coordinates: number[][]
  difficultyLevel: number
  height?: string
}

const difficultyColors: Record<number, string> = {
  1: '#22c55e', // Green
  2: '#3b82f6', // Blue
  3: '#f59e0b', // Yellow
  4: '#ef4444', // Red
  5: '#a855f7', // Purple
}

export function RouteMap({ coordinates, difficultyLevel, height = '400px' }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || coordinates.length === 0) return

    // Calculate initial center
    const centerLon = coordinates[0][0]
    const centerLat = coordinates[0][1]

    // Create map instance
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: {}
      } as maplibregl.StyleSpecification,
      center: [centerLon, centerLat],
      zoom: 10,
      attributionControl: false
    } as maplibregl.MapOptions)

    // Add OSM tile source
    mapInstance.addSource('osm-tiles', {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    })

    // Add OSM tile layer
    mapInstance.addLayer({
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19
    })

    // Add route source (GeoJSON)
    mapInstance.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    })

    // Add route line layer
    mapInstance.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': difficultyColors[difficultyLevel] || '#ff6b35',
        'line-width': 4,
        'line-opacity': 0.8
      }
    })

    // Add route outline (for better visibility)
    mapInstance.addLayer({
      id: 'route-outline',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 6,
        'line-opacity': 0.3
      }
    }, 'osm-tiles') // Add below tiles

    // Create start and end markers
    const startPoint = coordinates[0]
    const endPoint = coordinates[coordinates.length - 1]

    // Create start marker element
    const startMarker = document.createElement('div')
    startMarker.className = 'map-marker'
    startMarker.style.cssText = `
      width: 24px; height: 24px;
      background: #22c55e;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
    `
    startMarker.innerHTML = '起'

    // Create end marker element
    const endMarker = document.createElement('div')
    endMarker.className = 'map-marker'
    endMarker.style.cssText = `
      width: 24px; height: 24px;
      background: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
    `
    endMarker.innerHTML = '终'

    // Add markers to map
    new maplibregl.Marker({ element: startMarker })
      .setLngLat({ lon: startPoint[0], lat: startPoint[1] })
      .addTo(mapInstance)

    new maplibregl.Marker({ element: endMarker })
      .setLngLat({ lon: endPoint[0], lat: endPoint[1] })
      .addTo(mapInstance)

    // Fit map to show entire route
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend([coord[0], coord[1]])
    }, new maplibregl.LngLatBounds())

    mapInstance.fitBounds(bounds, {
      padding: {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60
      },
      maxZoom: 14
    })

    map.current = mapInstance

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, difficultyLevel])

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: height,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative'
      }}
    />
  )
}
