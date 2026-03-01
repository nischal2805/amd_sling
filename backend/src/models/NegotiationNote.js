const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NegotiationNote = sequelize.define('NegotiationNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  brand_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  deal_id: DataTypes.UUID,
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  note_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'general',
    comment: 'budget_range, discount, payment_terms, revision_demand, rate_card, general'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.TEXT,
    comment: 'JSON string for structured data like amounts, percentages'
  }
}, {
  tableName: 'negotiation_notes',
  underscored: true
});

module.exports = NegotiationNote;
