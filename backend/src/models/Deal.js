const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Deal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stage: {
      type: DataTypes.ENUM('inbound', 'negotiation', 'contract_sent', 'in_production', 'completed', 'cancelled'),
      defaultValue: 'inbound',
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    posting_deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    contract_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
