const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentPost = sequelize.define('ContentPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  deal_id: DataTypes.UUID,
  title: DataTypes.STRING(500),
  body: DataTypes.TEXT,
  media_url: DataTypes.TEXT,
  media_type: DataTypes.STRING(20),
  youtube_title: DataTypes.STRING(500),
  youtube_description: DataTypes.TEXT,
  youtube_tags: DataTypes.STRING(500),
  youtube_category_id: {
    type: DataTypes.STRING(10),
    defaultValue: '22'
  },
  youtube_privacy: {
    type: DataTypes.STRING(20),
    defaultValue: 'public'
  },
  instagram_caption: DataTypes.TEXT,
  linkedin_text: DataTypes.TEXT,
  twitter_text: DataTypes.STRING(280),
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft'
  },
  scheduled_at: DataTypes.DATE,
  youtube_video_id: DataTypes.STRING(255),
  instagram_media_id: DataTypes.STRING(255),
  linkedin_post_id: DataTypes.STRING(255),
  twitter_tweet_id: DataTypes.STRING(255),
  publish_error: DataTypes.TEXT
}, {
  tableName: 'content_posts',
  underscored: true
});

module.exports = ContentPost;
