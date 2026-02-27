const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    deal_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue'),
      defaultValue: 'draft',
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
