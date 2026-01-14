import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '../../utils/constants';

const AvatarUploadSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const AvatarPreview = styled(Avatar)`
  width: 100px;
  height: 100px;
  font-size: 2.5rem;
`;

const HiddenInput = styled.input`
  display: none;
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Input = styled.input`
  width: 100%;
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 2px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accentColors.accent}20;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 2px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accentColors.accent}20;
  }
`;

const CharCounter = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: ${({ theme, $warning }) => $warning ? theme.colors.warning : theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};

  button {
    flex: 1;
  }
`;

const EditProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
    const { updateUserProfile } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setSaving] = useState(false);

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setDisplayName(user.display_name || '');
            setBio(user.bio || '');
            setAvatarPreview(user.avatar_url);
            setAvatarFile(null);
        }
    }, [isOpen, user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAvatarFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let avatarUrl = user?.avatar_url;

            // Upload new avatar if selected
            if (avatarFile) {
                const uploadResult = await api.uploadImage(avatarFile);
                if (uploadResult.success && uploadResult.url) {
                    avatarUrl = uploadResult.url;
                }
            }

            // Update profile
            const result = await api.updateProfile(displayName, bio, avatarUrl);

            if (result.success) {
                // Update auth context
                updateUserProfile({
                    display_name: displayName,
                    bio,
                    avatar_url: avatarUrl,
                });

                if (onProfileUpdated) {
                    onProfileUpdated({
                        ...user,
                        display_name: displayName,
                        bio,
                        avatar_url: avatarUrl,
                    });
                }

                onClose();
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Profile"
            maxWidth="400px"
        >
            <form onSubmit={handleSubmit}>
                <AvatarUploadSection>
                    <AvatarPreview
                        user={{ ...user, avatar_url: avatarPreview }}
                        size={100}
                    />
                    <HiddenInput
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => document.getElementById('avatarInput').click()}
                    >
                        📷 Change Photo
                    </Button>
                </AvatarUploadSection>

                <FormGroup>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value.slice(0, MAX_DISPLAY_NAME_LENGTH))}
                        placeholder="Your display name"
                        maxLength={MAX_DISPLAY_NAME_LENGTH}
                    />
                    <CharCounter $warning={displayName.length > MAX_DISPLAY_NAME_LENGTH * 0.8}>
                        {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
                    </CharCounter>
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="bio">Bio</Label>
                    <TextArea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                        placeholder="Tell us about yourself..."
                        maxLength={MAX_BIO_LENGTH}
                    />
                    <CharCounter $warning={bio.length > MAX_BIO_LENGTH * 0.8}>
                        {bio.length}/{MAX_BIO_LENGTH}
                    </CharCounter>
                </FormGroup>

                <FormActions>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </FormActions>
            </form>
        </Modal>
    );
};

export default EditProfileModal;
