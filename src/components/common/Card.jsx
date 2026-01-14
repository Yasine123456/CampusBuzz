import styled from '@emotion/styled';
import { css } from '@emotion/react';

const StyledCard = styled.div`
  background: ${({ theme }) => theme.colors.glassBg};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: all ${({ theme }) => theme.transitions.normal};

  ${({ $hoverable }) => $hoverable && css`
    &:hover {
      box-shadow: ${({ theme }) => theme.shadows.lg};
      transform: translateY(-2px);
    }
  `}

  ${({ $noPadding }) => $noPadding && css`
    padding: 0;
  `}
`;

const Card = ({ children, hoverable = true, noPadding = false, ...props }) => {
    return (
        <StyledCard $hoverable={hoverable} $noPadding={noPadding} {...props}>
            {children}
        </StyledCard>
    );
};

export default Card;
