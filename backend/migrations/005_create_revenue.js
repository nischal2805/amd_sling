'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Revenues', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      deal_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Deals', key: 'id' },
        onDelete: 'SET NULL',
      },
      brand_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Brands', key: 'id' },
        onDelete: 'SET NULL',
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: 'USD' },
      source_type: { type: Sequelize.STRING, allowNull: false },
      platform: { type: Sequelize.STRING, allowNull: true },
      received_at: { type: Sequelize.DATEONLY, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Revenues');
  },
};
