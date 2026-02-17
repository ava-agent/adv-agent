const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { 
    page = 1, 
    pageSize = 20, 
    difficultyLevel, 
    terrainTags,
    minDistance,
    maxDistance,
    bounds // { sw: {lat, lon}, ne: {lat, lon} }
  } = event;
  
  try {
    let query = db.collection('routes').where({
      status: 'active'
    });
    
    // 难度筛选
    if (difficultyLevel) {
      query = query.where({
        difficultyLevel: parseInt(difficultyLevel)
      });
    }
    
    // 地形标签筛选
    if (terrainTags && terrainTags.length > 0) {
      query = query.where({
        terrainTags: _.in(terrainTags)
      });
    }
    
    // 距离范围筛选
    if (minDistance !== undefined || maxDistance !== undefined) {
      const distanceQuery = {};
      if (minDistance !== undefined) distanceQuery.gte = minDistance;
      if (maxDistance !== undefined) distanceQuery.lte = maxDistance;
      query = query.where({
        distanceKm: _.and(distanceQuery)
      });
    }
    
    // 地理围栏筛选
    if (bounds && bounds.sw && bounds.ne) {
      query = query.where({
        'startPoint.lat': _.gte(bounds.sw.lat).and(_.lte(bounds.ne.lat)),
        'startPoint.lon': _.gte(bounds.sw.lon).and(_.lte(bounds.ne.lon))
      });
    }
    
    // 获取总数
    const countRes = await query.count();
    
    // 分页查询
    const listRes = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    return {
      success: true,
      data: {
        list: listRes.data,
        total: countRes.total,
        page,
        pageSize
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};