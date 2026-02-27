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
User.hasMany(Brand, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Brand.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Deal, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Deal.belongsTo(User, { foreignKey: 'user_id' });

Brand.hasMany(Deal, { foreignKey: 'brand_id', onDelete: 'SET NULL' });
Deal.belongsTo(Brand, { foreignKey: 'brand_id' });

Deal.hasMany(Deliverable, { foreignKey: 'deal_id', onDelete: 'CASCADE' });
Deliverable.belongsTo(Deal, { foreignKey: 'deal_id' });

User.hasMany(Revenue, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Revenue.belongsTo(User, { foreignKey: 'user_id' });

Deal.hasMany(Revenue, { foreignKey: 'deal_id', onDelete: 'SET NULL' });
Revenue.belongsTo(Deal, { foreignKey: 'deal_id' });

Brand.hasMany(Revenue, { foreignKey: 'brand_id', onDelete: 'SET NULL' });
Revenue.belongsTo(Brand, { foreignKey: 'brand_id' });

User.hasMany(Invoice, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Invoice.belongsTo(User, { foreignKey: 'user_id' });

Deal.hasMany(Invoice, { foreignKey: 'deal_id', onDelete: 'SET NULL' });
Invoice.belongsTo(Deal, { foreignKey: 'deal_id' });

Brand.hasMany(Invoice, { foreignKey: 'brand_id', onDelete: 'SET NULL' });
Invoice.belongsTo(Brand, { foreignKey: 'brand_id' });

User.hasMany(PlatformConnection, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PlatformConnection.belongsTo(User, { foreignKey: 'user_id' });

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
