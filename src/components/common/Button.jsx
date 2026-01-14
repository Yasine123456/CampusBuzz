import styled from '@emotion/styled';
import { css } from '@emotion/react';

// Button variants
const variants = {
    primary: (theme) => css`
    background: linear-gradient(135deg, ${theme.accentColors.accent}, ${theme.accentColors.accentDark});
    color: white;
    box-shadow: ${theme.shadows.md};

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.lg}, ${theme.shadows.glow(theme.accent)};
    }
  `,
    secondary: (theme) => css`
    background: ${theme.colors.bgTertiary};
    color: ${theme.colors.textPrimary};

    &:hover:not(:disabled) {
      background: ${theme.colors.bgSecondary};
    }
  `,
    ghost: (theme) => css`
    background: transparent;
    color: ${theme.colors.textSecondary};

    &:hover:not(:disabled) {
      color: ${theme.colors.textPrimary};
      background: ${theme.colors.bgTertiary};
    }
  `,
    danger: (theme) => css`
    background: ${theme.colors.error};
    color: white;

    &:hover:not(:disabled) {
      background: #dc2626;
    }
  `,
};

const StyledButton = styled.button`
  padding: ${({ theme, $iconOnly }) => $iconOnly ? theme.spacing.sm : `${theme.spacing.sm} ${theme.spacing.lg}`};
  border: none;
  border-radius: ${({ theme, $iconOnly }) => $iconOnly ? theme.radii.full : theme.radii.lg};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  min-height: 36px;
  
  ${({ $iconOnly }) => $iconOnly && css`
    width: 36px;
    height: 36px;
    padding: 0;
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ theme, $variant }) => variants[$variant || 'primary'](theme)}
`;

const Button = ({
    children,
    variant = 'primary',
    iconOnly = false,
    ...props
}) => {
    return (
        <StyledButton
            $variant={variant}
            $iconOnly={iconOnly}
            {...props}
        >
            {children}
        </StyledButton>
    );
};

export default Button;
