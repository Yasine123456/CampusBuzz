import styled from '@emotion/styled';

const AvatarWrapper = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: linear-gradient(135deg, ${({ theme }) => theme.accentColors.accent}, ${({ theme }) => theme.accentColors.accentDark});
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: ${({ $size }) => $size * 0.42}px;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    ${({ $clickable }) => $clickable && `transform: scale(1.05);`}
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Avatar = ({
    user,
    size = 48,
    onClick,
    className,
}) => {
    // Get display initial
    const getInitial = () => {
        if (user?.display_name) {
            return user.display_name.charAt(0).toUpperCase();
        }
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return '?';
    };

    return (
        <AvatarWrapper
            $size={size}
            $clickable={!!onClick}
            onClick={onClick}
            className={className}
        >
            {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.username || 'User'} />
            ) : (
                getInitial()
            )}
        </AvatarWrapper>
    );
};

export default Avatar;
