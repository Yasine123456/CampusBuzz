import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import * as api from '../../services/api';
import { getTimeAgo } from '../../utils/formatters';

const ConversationsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  display: flex;
  align-items: center;
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

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Username = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Time = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const LastMessage = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.85rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UnreadBadge = styled.span`
  background: ${({ theme }) => theme.accentColors.accent};
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  min-width: 18px;
  text-align: center;
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

const MessagesModal = ({ isOpen, onClose, onConversationClick }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const result = await api.getConversations();
            if (result.success) {
                setConversations(result.conversations || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConversationClick = (conversation) => {
        onClose();
        onConversationClick?.(conversation);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Messages"
            maxWidth="450px"
        >
            {loading ? (
                <Spinner />
            ) : conversations.length === 0 ? (
                <EmptyMessage>
                    <EmptyIcon>💬</EmptyIcon>
                    <h3>No messages yet</h3>
                    <p>Start a conversation from someone's profile</p>
                </EmptyMessage>
            ) : (
                <ConversationsList>
                    {conversations.map(conversation => (
                        <ConversationItem
                            key={conversation.id}
                            $unread={conversation.unread_count > 0}
                            onClick={() => handleConversationClick(conversation)}
                        >
                            <Avatar user={conversation.other_user} size={48} />
                            <ConversationInfo>
                                <ConversationHeader>
                                    <Username>
                                        {conversation.other_user?.display_name || conversation.other_user?.username}
                                    </Username>
                                    <Time>{getTimeAgo(conversation.last_message_at)}</Time>
                                </ConversationHeader>
                                <LastMessage>{conversation.last_message}</LastMessage>
                            </ConversationInfo>
                            {conversation.unread_count > 0 && (
                                <UnreadBadge>{conversation.unread_count}</UnreadBadge>
                            )}
                        </ConversationItem>
                    ))}
                </ConversationsList>
            )}
        </Modal>
    );
};

export default MessagesModal;
