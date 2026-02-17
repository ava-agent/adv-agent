const cloud = require('wx-server-sdk');
const xml2js = require('xml2js');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 解析GPX文件
function parseGPX(gpxContent) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(gpxContent, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        const trk = result.gpx.trk;
        const trkseg = trk.trkseg;
        const trkpts = Array.isArray(trkseg.trkpt) ? trkseg.trkpt : [trkseg.trkpt];
        
        const points = trkpts.map(pt => ({
          lat: parseFloat(pt.$.lat),
          lon: parseFloat(pt.$.lon),
          ele: pt.ele ? parseFloat(pt.ele) : 0
        }));
        
        // 计算距离和爬升
        let distance = 0;
        let elevationGain = 0;
        
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          
          // 简化的距离计算（Haversine公式）
          const R = 6371;
          const dLat = (curr.lat - prev.lat) * Math.PI / 180;
          const dLon = (curr.lon - prev.lon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance += R * c;
          
          // 爬升
          if (curr.ele > prev.ele) {
            elevationGain += curr.ele - prev.ele;
          }
        }
        
        // 生成GeoJSON
        const geoJSON = {
          type: 'LineString',
          coordinates: points.map(p => [p.lon, p.lat, p.ele])
        };
        
        resolve({
          points,
          distanceKm: Math.round(distance * 10) / 10,
          elevationGainM: Math.round(elevationGain),
          estimatedTimeMin: Math.round((distance / 40) * 60), // 假设平均40km/h
          startPoint: { lat: points[0].lat, lon: points[0].lon },
          endPoint: { lat: points[points.length - 1].lat, lon: points[points.length - 1].lon },
          geoJSON
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;
  
  const { title, description, difficultyLevel, terrainTags, fileID } = event;
  
  try {
    // 下载GPX文件
    const res = await cloud.downloadFile({
      fileID: fileID
    });
    
    const gpxContent = res.fileContent.toString('utf-8');
    const gpxData = await parseGPX(gpxContent);
    
    // 创建路线记录
    const routeData = {
      uploaderId: OPENID,
      title: title || '未命名路线',
      description: description || '',
      difficultyLevel: difficultyLevel || 1,
      terrainTags: terrainTags || [],
      gpxFileUrl: fileID,
      geometry: gpxData.geoJSON,
      distanceKm: gpxData.distanceKm,
      elevationGainM: gpxData.elevationGainM,
      estimatedTimeMin: gpxData.estimatedTimeMin,
      startPoint: gpxData.startPoint,
      endPoint: gpxData.endPoint,
      photos: [],
      downloadCount: 0,
      isOfficial: false,
      status: 'active',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    
    const addRes = await db.collection('routes').add({
      data: routeData
    });
    
    return {
      success: true,
      data: {
        _id: addRes._id,
        ...routeData
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};