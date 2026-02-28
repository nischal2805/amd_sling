const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostPlatform = sequelize.define('PostPlatform', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  platform_post_id: DataTypes.STRING(255),
  published_at: DataTypes.DATE,
  error_message: DataTypes.TEXT
}, {
  tableName: 'post_platforms',
  underscored: true
});

module.exports = PostPlatform;
