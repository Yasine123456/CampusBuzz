import styled from '@emotion/styled';
import Modal from '../common/Modal';
import ToggleSwitch from '../common/ToggleSwitch';
import { useTheme } from '../../context/ThemeContext';

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgTertiary};
  border-radius: ${({ theme }) => theme.radii.lg};
  gap: ${({ theme }) => theme.spacing.md};
`;

const SettingsItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SettingsItemLabel = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.95rem;
`;

const SettingsItemDescription = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const SettingsModal = ({ isOpen, onClose }) => {
    const { isDark, isAmber, toggleMode, toggleAccent } = useTheme();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings"
            maxWidth="380px"
        >
            <SettingsList>
                <SettingsItem>
                    <SettingsItemInfo>
                        <SettingsItemLabel>Dark Mode</SettingsItemLabel>
                        <SettingsItemDescription>Switch between light and dark theme</SettingsItemDescription>
                    </SettingsItemInfo>
                    <ToggleSwitch
                        checked={isDark}
                        onChange={toggleMode}
                    />
                </SettingsItem>

                <SettingsItem>
                    <SettingsItemInfo>
                        <SettingsItemLabel>Accent Color</SettingsItemLabel>
                        <SettingsItemDescription>Teal (off) or Amber (on)</SettingsItemDescription>
                    </SettingsItemInfo>
                    <ToggleSwitch
                        checked={isAmber}
                        onChange={toggleAccent}
                        isAmber
                    />
                </SettingsItem>
            </SettingsList>
        </Modal>
    );
};

export default SettingsModal;
