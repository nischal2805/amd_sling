const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    assigned_to: DataTypes.UUID,
    title: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    description: DataTypes.TEXT,
    category: {
        type: DataTypes.STRING(100),
        defaultValue: 'General'
    },
    priority: {
        type: DataTypes.STRING(20),
        defaultValue: 'medium'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'todo'
    },
    due_date: DataTypes.DATEONLY,
    deal_id: DataTypes.UUID
}, {
    tableName: 'tickets',
    underscored: true
});

module.exports = Ticket;
