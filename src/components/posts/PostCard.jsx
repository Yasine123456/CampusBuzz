import { useState } from 'react';
import styled from '@emotion/styled';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { getTimeAgo, getTimeUntilExpiration, escapeHtml } from '../../utils/formatters';

const PostCardWrapper = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  ${({ $isGhost, theme }) => $isGhost && `
    border: 1px dashed ${theme.colors.textMuted};
    opacity: 0.9;
  `}
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PostAuthor = styled.div`
  flex: 1;
`;

const PostUsername = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const PostTime = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const GhostBadge = styled.span`
  background: ${({ theme }) => theme.colors.bgTertiary};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 0.7rem;
`;

const PostContent = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: pre-wrap;
  word-break: break-word;

  .mention {
    color: ${({ theme }) => theme.accentColors.accent};
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }

  .hashtag {
    color: ${({ theme }) => theme.accentColors.accentLight};
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
`;

const MediaGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  
  ${({ $count }) => {
        if ($count === 1) return 'grid-template-columns: 1fr;';
        if ($count === 2) return 'grid-template-columns: 1fr 1fr;';
        if ($count === 3) return 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;';
        return 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;';
    }}
`;

const MediaImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  ${({ $first, $count }) => $first && $count === 3 && `
    grid-row: 1 / 3;
    height: 100%;
  `}
`;

const PostActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.glassBorder};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme, $active }) => $active ? theme.accentColors.accent : theme.colors.textMuted};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: none;
  font-family: inherit;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.bgTertiary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const DeleteButton = styled(ActionButton)`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: ${({ theme }) => theme.colors.error}20;
  }
`;

// Icons
const HeartIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const BookmarkIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const formatContent = (content) => {
    if (!content) return '';

    // Escape HTML first
    let formatted = escapeHtml(content);

    // Replace @mentions
    formatted = formatted.replace(
        /@(\w+)/g,
        '<span class="mention" data-username="$1">@$1</span>'
    );

    // Replace #hashtags
    formatted = formatted.replace(
        /#(\w+)/g,
        '<span class="hashtag" data-tag="$1">#$1</span>'
    );

    return formatted;
};

const PostCard = ({
    post,
    onUserClick,
    onHashtagClick,
    onCommentClick,
    onPostDeleted,
    onPostUpdated
}) => {
    const { user: currentUser } = useAuth();
    const [liked, setLiked] = useState(post.is_liked);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [bookmarked, setBookmarked] = useState(post.is_bookmarked);
    const [deleting, setDeleting] = useState(false);

    const isOwner = currentUser?.id === post.user_id;
    const isGhost = post.is_ghost || post.is_anonymous;
    const displayName = isGhost ? 'Anonymous' : (post.display_name || post.username);

    const handleLike = async () => {
        try {
            if (liked) {
                await api.unlikePost(post.id);
                setLiked(false);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                await api.likePost(post.id);
                setLiked(true);
                setLikeCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleBookmark = async () => {
        try {
            await api.toggleBookmark(post.id);
            setBookmarked(!bookmarked);
        } catch (error) {
            console.error('Bookmark error:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        setDeleting(true);
        try {
            await api.deletePost(post.id);
            if (onPostDeleted) {
                onPostDeleted(post.id);
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleContentClick = (e) => {
        const target = e.target;
        if (target.classList.contains('mention')) {
            const username = target.dataset.username;
            if (onUserClick) onUserClick(username);
        }
        if (target.classList.contains('hashtag')) {
            const tag = target.dataset.tag;
            if (onHashtagClick) onHashtagClick(tag);
        }
    };

    const media = post.media || post.images || [];

    return (
        <PostCardWrapper $isGhost={isGhost}>
            <PostHeader>
                <Avatar
                    user={isGhost ? null : post}
                    onClick={() => !isGhost && onUserClick?.(post.username)}
                />
                <PostAuthor>
                    <PostUsername onClick={() => !isGhost && onUserClick?.(post.username)}>
                        {displayName}
                    </PostUsername>
                    <PostTime>
                        {getTimeAgo(post.created_at)}
                        {isGhost && post.expires_at && (
                            <GhostBadge>👻 {getTimeUntilExpiration(post.expires_at)}</GhostBadge>
                        )}
                    </PostTime>
                </PostAuthor>
            </PostHeader>

            <PostContent
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
            />

            {media.length > 0 && (
                <MediaGrid $count={media.length}>
                    {media.map((img, index) => (
                        <MediaImage
                            key={index}
                            src={img.url || img}
                            alt={`Post image ${index + 1}`}
                            $first={index === 0}
                            $count={media.length}
                        />
                    ))}
                </MediaGrid>
            )}

            <PostActions>
                <ActionButton $active={liked} onClick={handleLike}>
                    <HeartIcon filled={liked} />
                    {likeCount > 0 && likeCount}
                </ActionButton>

                <ActionButton onClick={() => onCommentClick?.(post.id)}>
                    <CommentIcon />
                    {post.comments_count > 0 && post.comments_count}
                </ActionButton>

                <ActionButton $active={bookmarked} onClick={handleBookmark}>
                    <BookmarkIcon filled={bookmarked} />
                </ActionButton>

                {isOwner && (
                    <DeleteButton onClick={handleDelete} disabled={deleting}>
                        <TrashIcon />
                    </DeleteButton>
                )}
            </PostActions>
        </PostCardWrapper>
    );
};

export default PostCard;
