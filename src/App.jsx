import { useState, useEffect } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import GlobalStyles from './styles/GlobalStyles';

// Layout components
import Header from './components/layout/Header';
import Container from './components/layout/Container';

// Feature components
import AuthModal from './components/auth/AuthModal';
import SettingsModal from './components/settings/SettingsModal';
import SearchModal from './components/search/SearchModal';
import ProfileModal from './components/profile/ProfileModal';
import EditProfileModal from './components/profile/EditProfileModal';
import NotificationsModal from './components/notifications/NotificationsModal';
import BookmarksModal from './components/bookmarks/BookmarksModal';
import MessagesModal from './components/messages/MessagesModal';
import ChatModal from './components/messages/ChatModal';
import PostComposer from './components/posts/PostComposer';
import PostList from './components/posts/PostList';
import Spinner from './components/common/Spinner';

import * as api from './services/api';
import { NOTIFICATIONS_POLL_INTERVAL, MESSAGES_POLL_INTERVAL } from './utils/constants';

// Main app content (wrapped with contexts)
const AppContent = () => {
  const { theme } = useTheme();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Modal data
  const [profileUsername, setProfileUsername] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentConversation, setCurrentConversation] = useState(null);
  const [chatOtherUser, setChatOtherUser] = useState(null);

  // Notification counts
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  // New post (to add to list immediately)
  const [newPost, setNewPost] = useState(null);

  // Show auth modal if not authenticated after loading
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [authLoading, isAuthenticated]);

  // Close auth modal when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated]);

  // Poll for notification and message counts
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCounts = async () => {
      try {
        const [notifResult, msgResult] = await Promise.all([
          api.getUnreadCount(),
          api.getMessagesUnreadCount(),
        ]);
        if (notifResult?.success) {
          setNotificationCount(notifResult.count || 0);
        }
        if (msgResult?.success) {
          setMessageCount(msgResult.count || 0);
        }
      } catch (error) {
        // Silently fail - counts will just not update
      }
    };

    fetchCounts();
    const notifInterval = setInterval(fetchCounts, NOTIFICATIONS_POLL_INTERVAL);

    return () => clearInterval(notifInterval);
  }, [isAuthenticated]);

  // Handlers
  const handlePostCreated = (post) => {
    setNewPost(post);
  };

  const handleUserClick = (username) => {
    setProfileUsername(username);
    setShowProfileModal(true);
  };

  const handleHashtagClick = (tag) => {
    setSearchQuery(`#${tag}`);
    setShowSearchModal(true);
  };

  const handleCommentClick = (postId) => {
    // TODO: Implement comment expansion
    console.log('Open comments for post:', postId);
  };

  const handleEditProfile = (user) => {
    setEditingProfile(user);
    setShowProfileModal(false);
    setShowEditProfileModal(true);
  };

  const handleMessageFromProfile = (user) => {
    setShowProfileModal(false);
    setChatOtherUser(user);
    setCurrentConversation(null); // Will create new conversation
    setShowChatModal(true);
  };

  const handleConversationClick = (conversation) => {
    setCurrentConversation(conversation);
    setChatOtherUser(conversation.other_user);
    setShowChatModal(true);
  };

  const handleOwnProfileClick = () => {
    if (currentUser) {
      setProfileUsername(currentUser.username);
      setShowProfileModal(true);
    }
  };

  if (authLoading) {
    return (
      <EmotionThemeProvider theme={theme}>
        <GlobalStyles theme={theme} />
        <Spinner fullPage />
      </EmotionThemeProvider>
    );
  }

  return (
    <EmotionThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />

      <div className="app">
        <Header
          onSearchClick={() => setShowSearchModal(true)}
          onSettingsClick={() => setShowSettingsModal(true)}
          onMessagesClick={() => setShowMessagesModal(true)}
          onBookmarksClick={() => setShowBookmarksModal(true)}
          onNotificationsClick={() => setShowNotificationsModal(true)}
          onProfileClick={handleOwnProfileClick}
          onLoginClick={() => setShowAuthModal(true)}
          notificationCount={notificationCount}
          messageCount={messageCount}
        />

        <Container>
          <PostComposer onPostCreated={handlePostCreated} />
          <PostList
            onUserClick={handleUserClick}
            onHashtagClick={handleHashtagClick}
            onCommentClick={handleCommentClick}
            newPost={newPost}
          />
        </Container>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
        }}
        onUserClick={handleUserClick}
        initialQuery={searchQuery}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setProfileUsername(null);
        }}
        username={profileUsername}
        onEditClick={handleEditProfile}
        onMessageClick={handleMessageFromProfile}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => {
          setShowEditProfileModal(false);
          setEditingProfile(null);
        }}
        user={editingProfile || currentUser}
        onProfileUpdated={(updatedUser) => {
          // Refresh profile if viewing own
          if (profileUsername === currentUser?.username) {
            setProfileUsername(null);
            setTimeout(() => setProfileUsername(currentUser.username), 0);
          }
        }}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onUserClick={handleUserClick}
        onPostClick={handleCommentClick}
      />

      {/* Bookmarks Modal */}
      <BookmarksModal
        isOpen={showBookmarksModal}
        onClose={() => setShowBookmarksModal(false)}
        onUserClick={handleUserClick}
      />

      {/* Messages Modal */}
      <MessagesModal
        isOpen={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
        onConversationClick={handleConversationClick}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setCurrentConversation(null);
          setChatOtherUser(null);
        }}
        conversation={currentConversation}
        otherUser={chatOtherUser}
      />
    </EmotionThemeProvider>
  );
};

// App wrapper with all providers
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
