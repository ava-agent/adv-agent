const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { routeId } = event;
  
  if (!routeId) {
    return {
      success: false,
      error: '路线ID不能为空'
    };
  }
  
  try {
    // 获取路线详情
    const routeRes = await db.collection('routes').doc(routeId).get();
    
    if (!routeRes.data) {
      return {
        success: false,
        error: '路线不存在'
      };
    }
    
    const route = routeRes.data;
    
    // 获取上传者信息
    let uploader = null;
    try {
      const userRes = await db.collection('users').where({
        openid: route.uploaderId
      }).get();
      if (userRes.data.length > 0) {
        uploader = {
          nickname: userRes.data[0].nickname,
          avatarUrl: userRes.data[0].avatarUrl
        };
      }
    } catch (e) {
      console.log('获取上传者信息失败', e);
    }
    
    // 获取评价列表
    const reviewsRes = await db.collection('reviews').where({
      routeId: routeId
    }).orderBy('createdAt', 'desc').limit(20).get();
    
    // waypoints 功能暂未实现，返回空数组
    // TODO: 如需要路标功能，需先创建 waypoints 集合

    return {
      success: true,
      data: {
        route: {
          ...route,
          uploader
        },
        reviews: reviewsRes.data,
        waypoints: []
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};