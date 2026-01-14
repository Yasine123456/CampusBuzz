import styled from '@emotion/styled';

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: ${({ theme, $isAmber }) =>
        $isAmber ? '#f59e0b' : theme.accentColors.accent};
    border-color: ${({ theme, $isAmber }) =>
        $isAmber ? '#d97706' : theme.accentColors.accentDark};
  }

  &:checked + span::before {
    transform: translateX(22px);
    background-color: white;
  }

  &:focus + span {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accentColors.accent}33;
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 2px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: all ${({ theme }) => theme.transitions.fast};

  &::before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: ${({ theme }) => theme.colors.textMuted};
    border-radius: ${({ theme }) => theme.radii.full};
    transition: all ${({ theme }) => theme.transitions.fast};
  }
`;

const ToggleSwitch = ({ checked, onChange, isAmber = false, ...props }) => {
    return (
        <SwitchLabel>
            <SwitchInput
                type="checkbox"
                checked={checked}
                onChange={onChange}
                $isAmber={isAmber}
                {...props}
            />
            <Slider />
        </SwitchLabel>
    );
};

export default ToggleSwitch;
