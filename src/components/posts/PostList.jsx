import { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import PostCard from './PostCard';
import Spinner from '../common/Spinner';
import * as api from '../../services/api';
import { POSTS_POLL_INTERVAL } from '../../utils/constants';

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  opacity: 0.5;
`;

const PostList = ({
    onUserClick,
    onHashtagClick,
    onCommentClick,
    newPost,
}) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPosts = useCallback(async () => {
        try {
            const result = await api.getPosts();
            if (result.success && result.posts) {
                setPosts(result.posts);
            }
            setError(null);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Poll for updates
    useEffect(() => {
        const interval = setInterval(fetchPosts, POSTS_POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchPosts]);

    // Add new post to top of list
    useEffect(() => {
        if (newPost) {
            setPosts(prev => [newPost, ...prev]);
        }
    }, [newPost]);

    const handlePostDeleted = (postId) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    if (loading) {
        return <Spinner fullPage />;
    }

    if (error) {
        return (
            <EmptyState>
                <p>{error}</p>
            </EmptyState>
        );
    }

    if (posts.length === 0) {
        return (
            <EmptyState>
                <EmptyIcon>📭</EmptyIcon>
                <h3>No posts yet</h3>
                <p>Be the first to share something on campus!</p>
            </EmptyState>
        );
    }

    return (
        <div>
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onUserClick={onUserClick}
                    onHashtagClick={onHashtagClick}
                    onCommentClick={onCommentClick}
                    onPostDeleted={handlePostDeleted}
                />
            ))}
        </div>
    );
};

export default PostList;
