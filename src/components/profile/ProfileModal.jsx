import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import PostCard from '../posts/PostCard';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ProfileAvatar = styled(Avatar)`
  width: 80px;
  height: 80px;
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const DisplayName = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Username = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin: ${({ theme }) => theme.spacing.xs} 0;
`;

const Major = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  margin: ${({ theme }) => theme.spacing.xs} 0;
`;

const Bio = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: ${({ theme }) => theme.spacing.md} 0;
  max-width: 300px;
`;

const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-weight: 700;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const JoinedDate = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const PostsSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.glassBorder};
  padding-top: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PostsTitle = styled.h4`
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmptyPosts = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ProfileModal = ({
    isOpen,
    onClose,
    userId,
    username,
    onEditClick,
    onMessageClick,
}) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = currentUser?.id === profile?.id;

    useEffect(() => {
        if (isOpen && (userId || username)) {
            fetchProfile();
        }
    }, [isOpen, userId, username]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            let result;
            if (userId) {
                result = await api.getProfile(userId);
            } else if (username) {
                result = await api.getProfileByUsername(username);
            }

            if (result?.success && result.user) {
                setProfile(result.user);
                setFollowing(result.user.is_following);

                // Fetch user's posts
                const postsResult = await api.getUserPosts(result.user.id);
                if (postsResult?.success) {
                    setPosts(postsResult.posts || []);
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!profile) return;

        setFollowLoading(true);
        try {
            if (following) {
                await api.unfollowUser(profile.id);
                setFollowing(false);
                setProfile(prev => ({
                    ...prev,
                    followers_count: Math.max(0, (prev.followers_count || 0) - 1)
                }));
            } else {
                await api.followUser(profile.id);
                setFollowing(true);
                setProfile(prev => ({
                    ...prev,
                    followers_count: (prev.followers_count || 0) + 1
                }));
            }
        } catch (error) {
            console.error('Follow error:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const formatJoinDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Profile"
            maxWidth="500px"
        >
            {loading ? (
                <Spinner />
            ) : profile ? (
                <>
                    <ProfileHeader>
                        <ProfileAvatar user={profile} size={80} />
                        <DisplayName>{profile.display_name || profile.username}</DisplayName>
                        <Username>@{profile.username}</Username>
                        {profile.major && <Major>📚 {profile.major}</Major>}
                        {profile.bio && <Bio>{profile.bio}</Bio>}

                        <Stats>
                            <Stat>
                                <StatValue>{profile.posts_count || 0}</StatValue>
                                <StatLabel>Posts</StatLabel>
                            </Stat>
                            <Stat>
                                <StatValue>{profile.followers_count || 0}</StatValue>
                                <StatLabel>Followers</StatLabel>
                            </Stat>
                            <Stat>
                                <StatValue>{profile.following_count || 0}</StatValue>
                                <StatLabel>Following</StatLabel>
                            </Stat>
                        </Stats>

                        <JoinedDate>Joined {formatJoinDate(profile.created_at)}</JoinedDate>

                        <ActionButtons>
                            {isOwnProfile ? (
                                <Button variant="secondary" onClick={() => onEditClick?.(profile)}>
                                    ✏️ Edit Profile
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant={following ? 'secondary' : 'primary'}
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                    >
                                        {following ? 'Unfollow' : 'Follow'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => onMessageClick?.(profile)}
                                    >
                                        💬 Message
                                    </Button>
                                </>
                            )}
                        </ActionButtons>
                    </ProfileHeader>

                    <PostsSection>
                        <PostsTitle>Posts</PostsTitle>
                        {posts.length === 0 ? (
                            <EmptyPosts>No posts yet</EmptyPosts>
                        ) : (
                            posts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))
                        )}
                    </PostsSection>
                </>
            ) : (
                <EmptyPosts>User not found</EmptyPosts>
            )}
        </Modal>
    );
};

export default ProfileModal;
