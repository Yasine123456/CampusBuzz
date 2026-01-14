import { css } from '@emotion/react';

// Card glassmorphism effect
export const glassCard = (theme) => css`
  background: ${theme.colors.glassBg};
  backdrop-filter: blur(20px);
  border: 1px solid ${theme.colors.glassBorder};
  border-radius: ${theme.radii.xl};
  box-shadow: ${theme.shadows.md};
  transition: all ${theme.transitions.normal};

  &:hover {
    box-shadow: ${theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

// Container mixin
export const container = css`
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
`;

// Button base style
export const buttonBase = (theme) => css`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.radii.lg};
  font-family: ${theme.fonts.sans};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  text-decoration: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Input field base style
export const inputBase = (theme) => css`
  width: 100%;
  background: ${theme.colors.bgTertiary};
  border: 2px solid ${theme.colors.borderColor};
  border-radius: ${theme.radii.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.sans};
  font-size: 1rem;
  transition: all ${theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${theme.accentColors.accent};
    box-shadow: 0 0 0 3px ${theme.accentColors.accent}20;
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

// Modal backdrop
export const modalBackdrop = (theme) => css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.md};
`;

// Modal content
export const modalContent = (theme) => css`
  background: ${theme.colors.bgSecondary};
  border: 1px solid ${theme.colors.glassBorder};
  border-radius: ${theme.radii.xl};
  padding: ${theme.spacing.xl};
  max-width: 400px;
  width: 100%;
  box-shadow: ${theme.shadows.xl};
  animation: fadeIn 0.2s ease-out, slideUp 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }
`;

// Avatar style
export const avatar = (theme, size = 48) => css`
  width: ${size}px;
  height: ${size}px;
  border-radius: ${theme.radii.full};
  background: linear-gradient(135deg, ${theme.accentColors.accent}, ${theme.accentColors.accentDark});
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: ${size * 0.42}px;
  color: white;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Spinner animation
export const spinner = (theme) => css`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.bgTertiary};
  border-top-color: ${theme.accentColors.accent};
  border-radius: ${theme.radii.full};
  animation: spin 1s linear infinite;
`;

// Truncate text
export const truncate = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Line clamp (multi-line truncation)
export const lineClamp = (lines) => css`
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
