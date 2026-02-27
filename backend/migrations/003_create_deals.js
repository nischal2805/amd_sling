'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Deals', {
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
      brand_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Brands', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      stage: {
        type: Sequelize.ENUM('inbound', 'negotiation', 'contract_sent', 'in_production', 'completed', 'cancelled'),
        defaultValue: 'inbound',
        allowNull: false,
      },
      value: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currency: { type: Sequelize.STRING(3), defaultValue: 'USD' },
      posting_deadline: { type: Sequelize.DATEONLY, allowNull: true },
      contract_url: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Deals');
  },
};
