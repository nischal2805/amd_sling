'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Invoices', {
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
      invoice_number: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: 'USD' },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue'),
        defaultValue: 'draft',
      },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      paid_at: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Invoices');
  },
};
