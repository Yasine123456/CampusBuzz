import { useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { 
    opacity: 0;
    transform: scale(0.95); 
  }
  to { 
    opacity: 1;
    transform: scale(1); 
  }
`;

const Backdrop = styled.div`
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
  padding: ${({ theme }) => theme.spacing.md};
  animation: ${fadeIn} 0.2s ease-out;
`;

const Content = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: ${({ $maxWidth }) => $maxWidth || '400px'};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  animation: ${scaleIn} 0.2s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth,
    showCloseButton = true,
    closeOnBackdrop = true,
}) => {
    // Handle escape key
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <Backdrop onClick={handleBackdropClick}>
            <Content $maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
                {(title || showCloseButton) && (
                    <Header>
                        <div>
                            {title && <Title>{title}</Title>}
                            {subtitle && <Subtitle>{subtitle}</Subtitle>}
                        </div>
                        {showCloseButton && (
                            <CloseButton onClick={onClose} aria-label="Close modal">
                                <CloseIcon />
                            </CloseButton>
                        )}
                    </Header>
                )}
                {children}
            </Content>
        </Backdrop>
    );
};

export default Modal;
