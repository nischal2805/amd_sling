const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: DataTypes.STRING(255),
    role: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'General'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active'
    }
}, {
    tableName: 'team_members',
    underscored: true
});

module.exports = TeamMember;
