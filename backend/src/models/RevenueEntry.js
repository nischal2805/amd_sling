const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RevenueEntry = sequelize.define('RevenueEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  deal_id: DataTypes.UUID,
  brand_id: DataTypes.UUID,
  source_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  source_name: DataTypes.STRING(255),
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  platform: DataTypes.STRING(50),
  notes: DataTypes.TEXT
}, {
  tableName: 'revenue_entries',
  underscored: true
});

module.exports = RevenueEntry;
