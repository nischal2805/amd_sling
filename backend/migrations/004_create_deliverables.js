'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Deliverables', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      deal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Deals', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.STRING, allowNull: false },
      platform: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
      details: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Deliverables');
  },
};
