import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import PostCard from '../posts/PostCard';
import * as api from '../../services/api';

const BookmarksList = styled.div`
  max-height: 500px;
  overflow-y: auto;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  opacity: 0.5;
`;

const BookmarksModal = ({ isOpen, onClose, onUserClick, onPostClick }) => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchBookmarks();
        }
    }, [isOpen]);

    const fetchBookmarks = async () => {
        setLoading(true);
        try {
            const result = await api.getBookmarks();
            if (result.success) {
                setBookmarks(result.posts || result.bookmarks || []);
            }
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostDeleted = (postId) => {
        setBookmarks(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bookmarks"
            maxWidth="550px"
        >
            {loading ? (
                <Spinner />
            ) : bookmarks.length === 0 ? (
                <EmptyMessage>
                    <EmptyIcon>🔖</EmptyIcon>
                    <h3>No bookmarks yet</h3>
                    <p>Save posts to view them here later</p>
                </EmptyMessage>
            ) : (
                <BookmarksList>
                    {bookmarks.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onUserClick={onUserClick}
                            onPostDeleted={handlePostDeleted}
                        />
                    ))}
                </BookmarksList>
            )}
        </Modal>
    );
};

export default BookmarksModal;
