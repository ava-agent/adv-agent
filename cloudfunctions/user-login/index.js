const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;
  
  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({
      openid: OPENID
    }).get();
    
    if (userRes.data.length > 0) {
      // 用户已存在，返回用户信息
      return {
        success: true,
        data: userRes.data[0],
        isNewUser: false
      };
    }
    
    // 新用户，创建用户记录
    const newUser = {
      openid: OPENID,
      nickname: event.nickname || '骑士' + OPENID.slice(-6),
      avatarUrl: event.avatarUrl || '',
      garage: [],
      isPremium: false,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    
    const addRes = await db.collection('users').add({
      data: newUser
    });
    
    return {
      success: true,
      data: { ...newUser, _id: addRes._id },
      isNewUser: true
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};