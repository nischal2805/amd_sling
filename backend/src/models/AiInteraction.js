const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiInteraction = sequelize.define('AiInteraction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: DataTypes.STRING(50),
  input_summary: DataTypes.TEXT,
  output_text: DataTypes.TEXT,
  deal_id: DataTypes.UUID,
  tokens_used: DataTypes.INTEGER
}, {
  tableName: 'ai_interactions',
  underscored: true,
  updatedAt: false
});

module.exports = AiInteraction;
