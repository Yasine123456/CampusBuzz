import styled from '@emotion/styled';

const ContainerWrapper = styled.main`
  max-width: 600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Container = ({ children, ...props }) => {
    return (
        <ContainerWrapper {...props}>
            {children}
        </ContainerWrapper>
    );
};

export default Container;
