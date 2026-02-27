const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: { underscored: true },
});

const User = require('./User')(sequelize);
const Brand = require('./Brand')(sequelize);
const Deal = require('./Deal')(sequelize);
const Deliverable = require('./Deliverable')(sequelize);
const Revenue = require('./Revenue')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const PlatformConnection = require('./PlatformConnection')(sequelize);

// Associations
User.hasMany(Brand, { foreignKey: 'user_id', as: 'brands', onDelete: 'CASCADE' });
Brand.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Deal, { foreignKey: 'user_id', as: 'deals', onDelete: 'CASCADE' });
Deal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Brand.hasMany(Deal, { foreignKey: 'brand_id', as: 'deals', onDelete: 'SET NULL' });
Deal.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

Deal.hasMany(Deliverable, { foreignKey: 'deal_id', as: 'deliverables', onDelete: 'CASCADE' });
Deliverable.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });

User.hasMany(Revenue, { foreignKey: 'user_id', as: 'revenues', onDelete: 'CASCADE' });
Revenue.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Deal.hasMany(Revenue, { foreignKey: 'deal_id', as: 'revenues', onDelete: 'SET NULL' });
Revenue.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });

Brand.hasMany(Revenue, { foreignKey: 'brand_id', as: 'revenues', onDelete: 'SET NULL' });
Revenue.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

User.hasMany(Invoice, { foreignKey: 'user_id', as: 'invoices', onDelete: 'CASCADE' });
Invoice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Deal.hasMany(Invoice, { foreignKey: 'deal_id', as: 'invoices', onDelete: 'SET NULL' });
Invoice.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });

Brand.hasMany(Invoice, { foreignKey: 'brand_id', as: 'invoices', onDelete: 'SET NULL' });
Invoice.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

User.hasMany(PlatformConnection, { foreignKey: 'user_id', as: 'platform_connections', onDelete: 'CASCADE' });
PlatformConnection.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Brand,
  Deal,
  Deliverable,
  Revenue,
  Invoice,
  PlatformConnection,
};
