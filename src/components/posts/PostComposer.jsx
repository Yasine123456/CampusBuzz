import { useState, useRef } from 'react';
import styled from '@emotion/styled';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { MAX_POST_LENGTH, MAX_IMAGES_PER_POST, GHOST_EXPIRATION_OPTIONS } from '../../utils/constants';

const ComposerCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TextArea = styled.textarea`
  width: 100%;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 2px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accentColors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accentColors.accent}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ComposerActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ComposerTools = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const HiddenInput = styled.input`
  display: none;
`;

const GhostToggle = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }

  input {
    cursor: pointer;
  }

  span {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ExpirationSelect = styled.select`
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.85rem;
  cursor: pointer;
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CharCounter = styled.span`
  font-size: 0.875rem;
  color: ${({ theme, $warning, $error }) =>
        $error ? theme.colors.error :
            $warning ? theme.colors.warning :
                theme.colors.textMuted};
`;

const ImagePreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ImagePreview = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgTertiary};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveImageBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 14px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PostComposer = ({ onPostCreated }) => {
    const { isAuthenticated } = useAuth();
    const [content, setContent] = useState('');
    const [isGhost, setIsGhost] = useState(false);
    const [expiresIn, setExpiresIn] = useState(3);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isAuthenticated) return null;

    const handleContentChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_POST_LENGTH) {
            setContent(value);
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const remaining = MAX_IMAGES_PER_POST - images.length;
        const newFiles = files.slice(0, remaining);

        if (newFiles.length === 0) return;

        // Add to images array
        setImages(prev => [...prev, ...newFiles]);

        // Create previews
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) return;

        setLoading(true);
        try {
            // Upload images first
            const imageUrls = [];
            for (const file of images) {
                const result = await api.uploadImage(file);
                if (result.success && result.url) {
                    imageUrls.push(result.url);
                }
            }

            // Create post
            const result = await api.createPost(content, imageUrls, isGhost, expiresIn);

            if (result.success) {
                setContent('');
                setImages([]);
                setPreviews([]);
                setIsGhost(false);
                if (onPostCreated) {
                    onPostCreated(result.post);
                }
            }
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setLoading(false);
        }
    };

    const charCount = content.length;
    const isWarning = charCount > MAX_POST_LENGTH * 0.8;
    const isError = charCount >= MAX_POST_LENGTH;

    return (
        <ComposerCard hoverable={false}>
            <TextArea
                placeholder="What's happening on campus? 🎓"
                value={content}
                onChange={handleContentChange}
                maxLength={MAX_POST_LENGTH}
            />

            <ComposerActions>
                <ComposerTools>
                    <Button
                        variant="ghost"
                        iconOnly
                        onClick={() => fileInputRef.current?.click()}
                        title="Add image"
                        disabled={images.length >= MAX_IMAGES_PER_POST}
                    >
                        <ImageIcon />
                    </Button>
                    <HiddenInput
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                    />

                    <GhostToggle>
                        <input
                            type="checkbox"
                            checked={isGhost}
                            onChange={(e) => setIsGhost(e.target.checked)}
                        />
                        <span>👻 Ghost Mode</span>
                    </GhostToggle>

                    {isGhost && (
                        <ExpirationSelect
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(Number(e.target.value))}
                        >
                            {GHOST_EXPIRATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </ExpirationSelect>
                    )}
                </ComposerTools>

                <RightActions>
                    <CharCounter $warning={isWarning} $error={isError}>
                        {charCount}/{MAX_POST_LENGTH}
                    </CharCounter>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || (!content.trim() && images.length === 0)}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </Button>
                </RightActions>
            </ComposerActions>

            {previews.length > 0 && (
                <ImagePreviewGrid>
                    {previews.map((preview, index) => (
                        <ImagePreview key={index}>
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <RemoveImageBtn onClick={() => removeImage(index)}>×</RemoveImageBtn>
                        </ImagePreview>
                    ))}
                </ImagePreviewGrid>
            )}
        </ComposerCard>
    );
};

export default PostComposer;
