-- Ghost Mode Feature - Database Migration
-- Add columns for anonymous posting and post expiration

ALTER TABLE posts 
ADD COLUMN is_ghost BOOLEAN DEFAULT FALSE AFTER image_url,
ADD COLUMN expires_at DATETIME NULL AFTER is_ghost;

-- Add index for efficient expiration queries
CREATE INDEX idx_expires_at ON posts(expires_at);
