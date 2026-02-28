const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deliverable = sequelize.define('Deliverable', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deal_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: DataTypes.STRING(50),
  platform: DataTypes.STRING(50),
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'not_started'
  },
  deadline: DataTypes.DATEONLY,
  requirements: DataTypes.TEXT,
  notes: DataTypes.TEXT
}, {
  tableName: 'deliverables',
  underscored: true
});

module.exports = Deliverable;
