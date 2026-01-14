import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import WeatherWidget from '../weather/WeatherWidget';

const HeaderWrapper = styled.header`
  background: ${({ theme }) => theme.colors.glassBg};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.glassBorder};
  padding: ${({ theme }) => theme.spacing.md};
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const HeaderContent = styled.div`
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;

  img {
    height: 40px;
    width: auto;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const IconButton = styled(Button)`
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${({ theme }) => theme.colors.error};
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: ${({ theme }) => theme.radii.full};
  min-width: 16px;
  text-align: center;
`;

const ButtonWrapper = styled.div`
  position: relative;
`;

// Icons as components
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const MessagesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const BookmarksIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const NotificationsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const ProfileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const Header = ({
    onSearchClick,
    onSettingsClick,
    onMessagesClick,
    onBookmarksClick,
    onNotificationsClick,
    onProfileClick,
    onLoginClick,
    notificationCount = 0,
    messageCount = 0,
}) => {
    const { theme, accent } = useTheme();
    const { isAuthenticated, logout } = useAuth();

    return (
        <HeaderWrapper>
            <HeaderContent>
                <Logo>
                    <img
                        src={accent === 'amber'
                            ? '/nu/assets/icon-amber-removebg-preview.png'
                            : '/nu/assets/icon-teal-removebg-preview.png'
                        }
                        alt="CampusBuzz"
                    />
                </Logo>

                <WeatherWidget />

                <HeaderActions>
                    {isAuthenticated ? (
                        <>
                            <IconButton variant="ghost" iconOnly onClick={onSearchClick} title="Search">
                                <SearchIcon />
                            </IconButton>

                            <IconButton variant="ghost" iconOnly onClick={onSettingsClick} title="Settings">
                                <SettingsIcon />
                            </IconButton>

                            <ButtonWrapper>
                                <IconButton variant="ghost" iconOnly onClick={onMessagesClick} title="Messages">
                                    <MessagesIcon />
                                </IconButton>
                                {messageCount > 0 && <NotificationBadge>{messageCount}</NotificationBadge>}
                            </ButtonWrapper>

                            <IconButton variant="ghost" iconOnly onClick={onBookmarksClick} title="Bookmarks">
                                <BookmarksIcon />
                            </IconButton>

                            <ButtonWrapper>
                                <IconButton variant="ghost" iconOnly onClick={onNotificationsClick} title="Notifications">
                                    <NotificationsIcon />
                                </IconButton>
                                {notificationCount > 0 && <NotificationBadge>{notificationCount}</NotificationBadge>}
                            </ButtonWrapper>

                            <IconButton variant="ghost" iconOnly onClick={onProfileClick} title="Profile">
                                <ProfileIcon />
                            </IconButton>

                            <IconButton variant="ghost" iconOnly onClick={logout} title="Logout">
                                <LogoutIcon />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <IconButton variant="ghost" iconOnly onClick={onSettingsClick} title="Settings">
                                <SettingsIcon />
                            </IconButton>
                            <Button variant="primary" onClick={onLoginClick}>
                                Login
                            </Button>
                        </>
                    )}
                </HeaderActions>
            </HeaderContent>
        </HeaderWrapper>
    );
};

export default Header;
