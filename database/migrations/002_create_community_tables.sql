-- Phase 3: Community Features Database Schema
-- Run this migration after 001_create_users_table.sql

-- Workflow Comments System
CREATE TABLE IF NOT EXISTS workflow_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL, -- MongoDB ObjectId reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES workflow_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 2000),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Ratings System
CREATE TABLE IF NOT EXISTS workflow_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL, -- MongoDB ObjectId reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT CHECK (LENGTH(review_text) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, user_id) -- One rating per user per workflow
);

-- User Follow System
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- Users can't follow themselves
);

-- Workflow Favorites/Bookmarks
CREATE TABLE IF NOT EXISTS workflow_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id VARCHAR(255) NOT NULL, -- MongoDB ObjectId reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workflow_id) -- One favorite per user per workflow
);

-- User Activity Feed
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'workflow_created', 'workflow_updated', 'comment_added', 'rating_added', 'user_followed'
    target_type VARCHAR(50) NOT NULL, -- 'workflow', 'user', 'comment'
    target_id VARCHAR(255) NOT NULL, -- Could be workflow_id, user_id, or comment_id
    metadata JSONB, -- Additional activity-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'comment_reply', 'workflow_rated', 'new_follower', 'followed_user_activity'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(500), -- URL to navigate to when notification is clicked
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Collections (User-curated workflow lists)
CREATE TABLE IF NOT EXISTS workflow_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT CHECK (LENGTH(description) <= 1000),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES workflow_collections(id) ON DELETE CASCADE,
    workflow_id VARCHAR(255) NOT NULL, -- MongoDB ObjectId reference
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, workflow_id)
);

-- Report System for Community Moderation
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'workflow', 'comment', 'user'
    target_id VARCHAR(255) NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'spam', 'inappropriate', 'harassment', 'copyright', 'other'
    description TEXT CHECK (LENGTH(description) <= 1000),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_workflow_comments_workflow_id ON workflow_comments(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_user_id ON workflow_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_parent_id ON workflow_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_created_at ON workflow_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_ratings_workflow_id ON workflow_ratings(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_ratings_user_id ON workflow_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_ratings_rating ON workflow_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_workflow_favorites_user_id ON workflow_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_favorites_workflow_id ON workflow_favorites(workflow_id);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_collection_workflows_collection_id ON collection_workflows(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_workflows_workflow_id ON collection_workflows(workflow_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_target_type_id ON content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

-- Triggers for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_comments_updated_at BEFORE UPDATE ON workflow_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_ratings_updated_at BEFORE UPDATE ON workflow_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_collections_updated_at BEFORE UPDATE ON workflow_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 