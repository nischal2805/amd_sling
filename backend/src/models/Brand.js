const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  website: DataTypes.STRING(255),
  industry: DataTypes.STRING(100),
  contact_name: DataTypes.STRING(255),
  contact_email: DataTypes.STRING(255),
  total_deals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_revenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  average_deal_value: DataTypes.DECIMAL(10, 2),
  average_payment_days: DataTypes.INTEGER,
  payment_reliability: {
    type: DataTypes.STRING(20),
    defaultValue: 'unknown'
  },
  warmth_score: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  last_collaboration_date: DataTypes.DATEONLY,
  notes: DataTypes.TEXT
}, {
  tableName: 'brands',
  underscored: true
});

module.exports = Brand;
