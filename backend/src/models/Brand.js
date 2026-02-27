const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Brand', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    warmth_score: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
