<?php
// media.php - Media helper functions for CampusBuzz

require_once 'db_connection.php';

/**
 * Get all media for a specific entity
 * 
 * @param PDO $pdo Database connection
 * @param string $entityType Type of entity ('post', 'user_avatar', 'user_banner')
 * @param int $entityId ID of the entity
 * @return array Array of media objects
 */
function getMediaForEntity($pdo, $entityType, $entityId)
{
    $stmt = $pdo->prepare("
        SELECT id, url, media_type, position, width, height, alt_text, created_at
        FROM media 
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY position ASC
    ");
    $stmt->execute([$entityType, $entityId]);
    return $stmt->fetchAll();
}

/**
 * Get media for multiple entities at once (batch operation)
 * 
 * @param PDO $pdo Database connection
 * @param string $entityType Type of entity
 * @param array $entityIds Array of entity IDs
 * @return array Associative array keyed by entity_id
 */
function getMediaForEntities($pdo, $entityType, $entityIds)
{
    if (empty($entityIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($entityIds), '?'));
    $stmt = $pdo->prepare("
        SELECT id, entity_id, url, media_type, position, width, height, alt_text, created_at
        FROM media 
        WHERE entity_type = ? AND entity_id IN ($placeholders)
        ORDER BY entity_id, position ASC
    ");
    $stmt->execute(array_merge([$entityType], $entityIds));
    $results = $stmt->fetchAll();

    // Group by entity_id
    $grouped = [];
    foreach ($results as $media) {
        $entityId = $media['entity_id'];
        if (!isset($grouped[$entityId])) {
            $grouped[$entityId] = [];
        }
        $grouped[$entityId][] = $media;
    }

    return $grouped;
}

/**
 * Create a new media entry
 * 
 * @param PDO $pdo Database connection
 * @param string $entityType Type of entity
 * @param int $entityId ID of the entity
 * @param string $url URL of the media
 * @param int $position Position/order of the media
 * @param string $mediaType Type of media ('image', 'video', 'gif')
 * @param array $metadata Optional metadata (width, height, file_size, alt_text)
 * @return int ID of created media
 */
function createMedia($pdo, $entityType, $entityId, $url, $position = 0, $mediaType = 'image', $metadata = [])
{
    $stmt = $pdo->prepare("
        INSERT INTO media (entity_type, entity_id, url, media_type, position, width, height, file_size, alt_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $entityType,
        $entityId,
        $url,
        $mediaType,
        $position,
        $metadata['width'] ?? null,
        $metadata['height'] ?? null,
        $metadata['file_size'] ?? null,
        $metadata['alt_text'] ?? null
    ]);

    return $pdo->lastInsertId();
}

/**
 * Create multiple media entries for an entity
 * 
 * @param PDO $pdo Database connection
 * @param string $entityType Type of entity
 * @param int $entityId ID of the entity
 * @param array $urls Array of media URLs
 * @param string $mediaType Type of media
 * @return array Array of created media IDs
 */
function createMediaBatch($pdo, $entityType, $entityId, $urls, $mediaType = 'image')
{
    $mediaIds = [];
    foreach ($urls as $position => $url) {
        if (!empty($url)) {
            $mediaIds[] = createMedia($pdo, $entityType, $entityId, $url, $position, $mediaType);
        }
    }
    return $mediaIds;
}

/**
 * Delete a specific media entry
 * 
 * @param PDO $pdo Database connection
 * @param int $mediaId ID of the media to delete
 * @return bool Success status
 */
function deleteMedia($pdo, $mediaId)
{
    $stmt = $pdo->prepare("DELETE FROM media WHERE id = ?");
    return $stmt->execute([$mediaId]);
}

/**
 * Delete all media for an entity
 * 
 * @param PDO $pdo Database connection
 * @param string $entityType Type of entity
 * @param int $entityId ID of the entity
 * @return bool Success status
 */
function deleteMediaForEntity($pdo, $entityType, $entityId)
{
    $stmt = $pdo->prepare("DELETE FROM media WHERE entity_type = ? AND entity_id = ?");
    return $stmt->execute([$entityType, $entityId]);
}

/**
 * Update or replace avatar for a user
 * Deletes existing avatar and creates new one
 * 
 * @param PDO $pdo Database connection
 * @param int $userId User ID
 * @param string $url New avatar URL
 * @return int ID of created media
 */
function updateUserAvatar($pdo, $userId, $url)
{
    // Delete existing avatar
    deleteMediaForEntity($pdo, 'user_avatar', $userId);
    
    // Create new avatar
    return createMedia($pdo, 'user_avatar', $userId, $url);
}

/**
 * Get user avatar URL
 * 
 * @param PDO $pdo Database connection
 * @param int $userId User ID
 * @return string|null Avatar URL or null
 */
function getUserAvatarUrl($pdo, $userId)
{
    $media = getMediaForEntity($pdo, 'user_avatar', $userId);
    return !empty($media) ? $media[0]['url'] : null;
}

/**
 * Get user banner URL
 * 
 * @param PDO $pdo Database connection
 * @param int $userId User ID
 * @return string|null Banner URL or null
 */
function getUserBannerUrl($pdo, $userId)
{
    $media = getMediaForEntity($pdo, 'user_banner', $userId);
    return !empty($media) ? $media[0]['url'] : null;
}
