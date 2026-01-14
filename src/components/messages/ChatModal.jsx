import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getTimeAgo } from '../../utils/formatters';
import { MESSAGES_POLL_INTERVAL, MAX_MESSAGE_LENGTH } from '../../utils/constants';

const ChatContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 1001;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.glassBorder};
`;

const BackButton = styled(Button)`
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ChatUserInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ChatUsername = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  ${({ $isMine, theme }) => $isMine ? `
    align-self: flex-end;
    background: ${theme.accentColors.accent};
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background: ${theme.colors.bgTertiary};
    color: ${theme.colors.textPrimary};
    border-bottom-left-radius: 4px;
  `}
`;

const MessageContent = styled.p`
  margin: 0;
  word-break: break-word;
`;

const MessageTime = styled.span`
  display: block;
  font-size: 0.65rem;
  opacity: 0.7;
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-align: ${({ $isMine }) => $isMine ? 'right' : 'left'};
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-top: 1px solid ${({ theme }) => theme.colors.glassBorder};
`;

const MessageInput = styled.input`
  flex: 1;
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 2px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColors.accent};
  }
`;

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const ChatModal = ({ isOpen, onClose, conversation, otherUser }) => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && conversation) {
            fetchMessages();
            markAsRead();
        }
    }, [isOpen, conversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages
    useEffect(() => {
        if (!isOpen || !conversation) return;

        const interval = setInterval(fetchMessages, MESSAGES_POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [isOpen, conversation]);

    const fetchMessages = async () => {
        if (!conversation?.id) return;

        try {
            const result = await api.getMessages(conversation.id);
            if (result.success) {
                setMessages(result.messages || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        if (!conversation?.id) return;
        try {
            await api.markConversationRead(conversation.id);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleSend = async () => {
        if (!messageText.trim() || sending) return;

        const text = messageText.trim();
        setMessageText('');
        setSending(true);

        try {
            const result = await api.sendMessage(
                otherUser?.id,
                text,
                conversation?.id
            );

            if (result.success && result.message) {
                setMessages(prev => [...prev, result.message]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessageText(text); // Restore on error
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <ChatContainer>
            <ChatHeader>
                <BackButton variant="ghost" iconOnly onClick={onClose}>
                    <BackIcon />
                </BackButton>
                <ChatUserInfo>
                    <Avatar user={otherUser} size={36} />
                    <ChatUsername>
                        @{otherUser?.username}
                    </ChatUsername>
                </ChatUserInfo>
                <BackButton variant="ghost" iconOnly onClick={onClose}>
                    ✕
                </BackButton>
            </ChatHeader>

            <MessagesContainer>
                {loading ? (
                    <Spinner />
                ) : (
                    <>
                        {messages.map(message => (
                            <MessageBubble
                                key={message.id}
                                $isMine={message.sender_id === currentUser?.id}
                            >
                                <MessageContent>{message.content}</MessageContent>
                                <MessageTime $isMine={message.sender_id === currentUser?.id}>
                                    {getTimeAgo(message.created_at)}
                                </MessageTime>
                            </MessageBubble>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </MessagesContainer>

            <InputContainer>
                <MessageInput
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    onKeyPress={handleKeyPress}
                    maxLength={MAX_MESSAGE_LENGTH}
                />
                <Button onClick={handleSend} disabled={!messageText.trim() || sending}>
                    <SendIcon />
                </Button>
            </InputContainer>
        </ChatContainer>
    );
};

export default ChatModal;
