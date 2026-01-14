import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerElement = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border: 3px solid ${({ theme }) => theme.colors.bgTertiary};
  border-top-color: ${({ theme }) => theme.accentColors.accent};
  border-radius: ${({ theme }) => theme.radii.full};
  animation: ${spin} 1s linear infinite;
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme, $fullPage }) => $fullPage ? theme.spacing['2xl'] : theme.spacing.lg};
  ${({ $fullPage }) => $fullPage && `
    min-height: 200px;
  `}
`;

const Spinner = ({ size = 40, fullPage = false }) => {
    return (
        <SpinnerContainer $fullPage={fullPage}>
            <SpinnerElement $size={size} />
        </SpinnerContainer>
    );
};

export default Spinner;
