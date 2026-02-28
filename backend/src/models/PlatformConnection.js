const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformConnection = sequelize.define('PlatformConnection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refresh_token: DataTypes.TEXT,
  token_expires_at: DataTypes.DATE,
  platform_user_id: DataTypes.STRING(255),
  platform_username: DataTypes.STRING(255),
  platform_email: DataTypes.STRING(255),
  instagram_user_id: DataTypes.STRING(255),
  additional_data: DataTypes.JSONB,
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_synced_at: DataTypes.DATE
}, {
  tableName: 'platform_connections',
  underscored: true
});

module.exports = PlatformConnection;
