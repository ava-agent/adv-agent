const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 用户资料更新云函数
 * 支持更新昵称、头像、简介、车辆信息
 * 用户只能更新自己的资料（通过 OpenID 验证）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;

  // 解构请求参数
  const { nickName, avatarUrl, bio, bikes } = event;

  try {
    // 检查用户是否存在
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    if (userRes.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    // 构建更新数据（只更新提供的字段）
    const updateData = {};
    if (nickName !== undefined) {
      updateData.nickName = nickName;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }
    if (bio !== undefined) {
      updateData.bio = bio;
    }
    if (bikes !== undefined) {
      // 同时更新 bikes 和 garage 字段以保持兼容性
      updateData.bikes = bikes;
      updateData.garage = bikes;
    }
    updateData.updatedAt = db.serverDate();

    // 执行更新
    const updateRes = await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: updateData
    });

    if (updateRes.updated === 0) {
      return {
        success: false,
        error: '更新失败，请重试'
      };
    }

    // 获取更新后的用户信息
    const updatedUserRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    return {
      success: true,
      data: updatedUserRes.data[0] || null
    };
  } catch (err) {
    console.error('user-update error:', err);
    return {
      success: false,
      error: err.message || '更新失败，请重试'
    };
  }
};
