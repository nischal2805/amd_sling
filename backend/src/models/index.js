const sequelize = require('../config/database');
const User = require('./User');
const Brand = require('./Brand');
const Deal = require('./Deal');
const Deliverable = require('./Deliverable');
const RevenueEntry = require('./RevenueEntry');
const Invoice = require('./Invoice');
const PlatformConnection = require('./PlatformConnection');
const ContentPost = require('./ContentPost');
const PostPlatform = require('./PostPlatform');
const AiInteraction = require('./AiInteraction');
const NegotiationNote = require('./NegotiationNote');

// User associations
User.hasMany(Brand, { foreignKey: 'user_id', as: 'brands' });
User.hasMany(Deal, { foreignKey: 'user_id', as: 'deals' });
User.hasMany(RevenueEntry, { foreignKey: 'user_id', as: 'revenue_entries' });
User.hasMany(Invoice, { foreignKey: 'user_id', as: 'invoices' });
User.hasMany(PlatformConnection, { foreignKey: 'user_id', as: 'connections' });
User.hasMany(ContentPost, { foreignKey: 'user_id', as: 'posts' });
User.hasMany(AiInteraction, { foreignKey: 'user_id', as: 'ai_interactions' });

// Brand associations
Brand.belongsTo(User, { foreignKey: 'user_id' });
Brand.hasMany(Deal, { foreignKey: 'brand_id', as: 'deals' });
Brand.hasMany(RevenueEntry, { foreignKey: 'brand_id', as: 'revenue_entries' });

// Deal associations
Deal.belongsTo(User, { foreignKey: 'user_id' });
Deal.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Deal.hasMany(Deliverable, { foreignKey: 'deal_id', as: 'deliverables' });
Deal.hasMany(Invoice, { foreignKey: 'deal_id', as: 'invoices' });
Deal.hasMany(RevenueEntry, { foreignKey: 'deal_id', as: 'revenue_entries' });
Deal.hasMany(ContentPost, { foreignKey: 'deal_id', as: 'posts' });
Deal.hasMany(AiInteraction, { foreignKey: 'deal_id', as: 'ai_interactions' });

// Deliverable associations
Deliverable.belongsTo(Deal, { foreignKey: 'deal_id' });

// RevenueEntry associations
RevenueEntry.belongsTo(User, { foreignKey: 'user_id' });
RevenueEntry.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });
RevenueEntry.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

// Invoice associations
Invoice.belongsTo(User, { foreignKey: 'user_id' });
Invoice.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });

// PlatformConnection associations
PlatformConnection.belongsTo(User, { foreignKey: 'user_id' });

// ContentPost associations
ContentPost.belongsTo(User, { foreignKey: 'user_id' });
ContentPost.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });
ContentPost.hasMany(PostPlatform, { foreignKey: 'post_id', as: 'platforms' });

// PostPlatform associations
PostPlatform.belongsTo(ContentPost, { foreignKey: 'post_id' });

// AiInteraction associations
AiInteraction.belongsTo(User, { foreignKey: 'user_id' });
AiInteraction.belongsTo(Deal, { foreignKey: 'deal_id' });

// NegotiationNote associations
NegotiationNote.belongsTo(User, { foreignKey: 'user_id' });
NegotiationNote.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
NegotiationNote.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });
Brand.hasMany(NegotiationNote, { foreignKey: 'brand_id', as: 'negotiation_notes' });
Deal.hasMany(NegotiationNote, { foreignKey: 'deal_id', as: 'negotiation_notes' });
User.hasMany(NegotiationNote, { foreignKey: 'user_id', as: 'negotiation_notes' });

module.exports = {
  sequelize,
  User,
  Brand,
  Deal,
  Deliverable,
  RevenueEntry,
  Invoice,
  PlatformConnection,
  ContentPost,
  PostPlatform,
  AiInteraction,
  NegotiationNote
};
