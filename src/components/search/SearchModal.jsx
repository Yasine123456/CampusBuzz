import { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import Avatar from '../common/Avatar';
import * as api from '../../services/api';
import { debounce } from '../../utils/formatters';

const SearchInput = styled.input`
  width: 100%;
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 2px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accentColors.accent}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ResultsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h4`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const UserMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const PostPreview = styled.div`
  flex: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const SearchModal = ({ isOpen, onClose, onUserClick, onPostClick, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState({ users: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery(initialQuery);
            if (initialQuery) {
                performSearch(initialQuery);
            } else {
                setResults({ users: [], posts: [] });
                setSearched(false);
            }
        }
    }, [isOpen, initialQuery]);

    const performSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults({ users: [], posts: [] });
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const result = await api.search(searchQuery);
            if (result.success) {
                setResults({
                    users: result.users || [],
                    posts: result.posts || [],
                });
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((q) => performSearch(q), 300),
        []
    );

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    const handleUserClick = (user) => {
        onClose();
        if (onUserClick) onUserClick(user.username);
    };

    const handlePostClick = (post) => {
        onClose();
        if (onPostClick) onPostClick(post.id);
    };

    const hasResults = results.users.length > 0 || results.posts.length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Search"
            maxWidth="500px"
        >
            <SearchInput
                type="text"
                placeholder="Search users or posts..."
                value={query}
                onChange={handleInputChange}
                autoFocus
            />

            {loading ? (
                <Spinner />
            ) : searched && !hasResults ? (
                <EmptyMessage>No results found for "{query}"</EmptyMessage>
            ) : (
                <>
                    {results.users.length > 0 && (
                        <ResultsSection>
                            <SectionTitle>Users</SectionTitle>
                            {results.users.map(user => (
                                <ResultItem key={user.id} onClick={() => handleUserClick(user)}>
                                    <Avatar user={user} size={40} />
                                    <UserInfo>
                                        <Username>{user.display_name || user.username}</Username>
                                        <UserMeta>@{user.username}</UserMeta>
                                    </UserInfo>
                                </ResultItem>
                            ))}
                        </ResultsSection>
                    )}

                    {results.posts.length > 0 && (
                        <ResultsSection>
                            <SectionTitle>Posts</SectionTitle>
                            {results.posts.map(post => (
                                <ResultItem key={post.id} onClick={() => handlePostClick(post)}>
                                    <Avatar user={post} size={40} />
                                    <PostPreview>{post.content}</PostPreview>
                                </ResultItem>
                            ))}
                        </ResultsSection>
                    )}
                </>
            )}
        </Modal>
    );
};

export default SearchModal;
