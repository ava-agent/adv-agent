const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;
  
  const { routeId, rating, comment, photos = [] } = event;
  
  if (!routeId || !rating) {
    return {
      success: false,
      error: '路线ID和评分不能为空'
    };
  }
  
  try {
    // 获取用户信息
    const userRes = await db.collection('users').where({
      openid: OPENID
    }).get();
    
    if (userRes.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }
    
    const user = userRes.data[0];
    
    // 创建评价
    const reviewData = {
      routeId,
      userId: OPENID,
      userName: user.nickname,
      userAvatar: user.avatarUrl,
      rating: parseInt(rating),
      comment: comment || '',
      photos,
      createdAt: db.serverDate()
    };
    
    const addRes = await db.collection('reviews').add({
      data: reviewData
    });
    
    return {
      success: true,
      data: {
        _id: addRes._id,
        ...reviewData
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};