const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deal = sequelize.define('Deal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  brand_id: DataTypes.UUID,
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  total_value: DataTypes.DECIMAL(10, 2),
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  stage: {
    type: DataTypes.STRING(50),
    defaultValue: 'inbound'
  },
  description: DataTypes.TEXT,
  posting_deadline: DataTypes.DATEONLY,
  start_date: DataTypes.DATEONLY,
  end_date: DataTypes.DATEONLY,
  email_thread_id: DataTypes.STRING(255),
  contract_sent_at: DataTypes.DATE,
  contract_signed_at: DataTypes.DATE,
  invoice_sent_at: DataTypes.DATE,
  payment_received_at: DataTypes.DATE
}, {
  tableName: 'deals',
  underscored: true
});

module.exports = Deal;
