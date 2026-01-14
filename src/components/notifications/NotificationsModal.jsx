import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import * as api from '../../services/api';
import { getTimeAgo } from '../../utils/formatters';

const HeaderActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const NotificationsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  background: ${({ theme, $unread }) => $unread ? theme.colors.bgTertiary : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;

const NotificationIcon = styled.div`
  font-size: 1.25rem;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationText = styled.p`
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  font-size: 0.9rem;

  strong {
    font-weight: 600;
  }
`;

const NotificationTime = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const getNotificationIcon = (type) => {
    switch (type) {
        case 'like': return '❤️';
        case 'comment': return '💬';
        case 'follow': return '👤';
        case 'mention': return '📢';
        case 'repost': return '🔄';
        default: return '🔔';
    }
};

const getNotificationText = (notification) => {
    const { type, from_username, from_display_name } = notification;
    const name = from_display_name || from_username;

    switch (type) {
        case 'like':
            return <><strong>{name}</strong> liked your post</>;
        case 'comment':
            return <><strong>{name}</strong> commented on your post</>;
        case 'follow':
            return <><strong>{name}</strong> started following you</>;
        case 'mention':
            return <><strong>{name}</strong> mentioned you in a post</>;
        case 'repost':
            return <><strong>{name}</strong> reposted your post</>;
        default:
            return 'New notification';
    }
};

const NotificationsModal = ({ isOpen, onClose, onUserClick, onPostClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const result = await api.getNotifications();
            if (result.success) {
                setNotifications(result.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.is_read) {
            try {
                await api.markNotificationRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Navigate based on type
        if (notification.type === 'follow') {
            onClose();
            onUserClick?.(notification.from_username);
        } else if (notification.post_id) {
            onClose();
            onPostClick?.(notification.post_id);
        }
    };

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Notifications"
            maxWidth="450px"
        >
            {hasUnread && (
                <HeaderActions>
                    <Button variant="ghost" onClick={handleMarkAllRead}>
                        Mark all as read
                    </Button>
                </HeaderActions>
            )}

            {loading ? (
                <Spinner />
            ) : notifications.length === 0 ? (
                <EmptyMessage>No notifications yet</EmptyMessage>
            ) : (
                <NotificationsList>
                    {notifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            $unread={!notification.is_read}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <Avatar user={notification} size={40} />
                            <NotificationContent>
                                <NotificationText>
                                    {getNotificationText(notification)}
                                </NotificationText>
                                <NotificationTime>
                                    {getTimeAgo(notification.created_at)}
                                </NotificationTime>
                            </NotificationContent>
                            <NotificationIcon>
                                {getNotificationIcon(notification.type)}
                            </NotificationIcon>
                        </NotificationItem>
                    ))}
                </NotificationsList>
            )}
        </Modal>
    );
};

export default NotificationsModal;
