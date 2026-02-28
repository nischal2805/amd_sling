const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deal_id: DataTypes.UUID,
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft'
  },
  due_date: DataTypes.DATEONLY,
  sent_at: DataTypes.DATE,
  paid_at: DataTypes.DATE,
  notes: DataTypes.TEXT
}, {
  tableName: 'invoices',
  underscored: true
});

module.exports = Invoice;
