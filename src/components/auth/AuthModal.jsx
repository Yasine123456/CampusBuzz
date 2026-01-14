import { useState } from 'react';
import styled from '@emotion/styled';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
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

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875rem;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.error}15;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};

  button {
    flex: 1;
  }
`;

const SwitchLink = styled.p`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;

  a {
    color: ${({ theme }) => theme.accentColors.accentLight};
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.glassBorder};
`;

const OAuthButton = styled.a`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-weight: 600;
  font-size: 0.875rem;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: ${({ $variant }) => $variant === 'microsoft' ? '#2f2f2f' : 'white'};
  color: ${({ $variant }) => $variant === 'microsoft' ? 'white' : '#333'};
  border: 1px solid ${({ theme }) => theme.colors.borderColor};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const OAuthNote = styled.p`
  text-align: center;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Microsoft logo
const MicrosoftLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
);

// Google logo
const GoogleLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [major, setMajor] = useState('');

    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await login(username, password);
            } else {
                result = await register(username, email, password, major);
            }

            if (result.success) {
                onClose();
                resetForm();
            } else {
                setError(result.message || 'An error occurred');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setMajor('');
        setError('');
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Welcome to CampusBuzz"
            subtitle="Connect with your campus community"
            showCloseButton={false}
            closeOnBackdrop={false}
        >
            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />
                </FormGroup>

                {!isLogin && (
                    <FormGroup>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </FormGroup>
                )}

                <FormGroup>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                </FormGroup>

                {!isLogin && (
                    <FormGroup>
                        <Label htmlFor="major">Major (Optional)</Label>
                        <Input
                            id="major"
                            type="text"
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            placeholder="e.g. Computer Science"
                        />
                    </FormGroup>
                )}

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <FormActions>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
                    </Button>
                </FormActions>

                <SwitchLink>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <a onClick={switchMode}>{isLogin ? 'Register' : 'Login'}</a>
                </SwitchLink>
            </Form>

            <Divider>
                <OAuthButton href="/auth/microsoft-login.php" $variant="microsoft">
                    <MicrosoftLogo />
                    Sign in with Microsoft
                </OAuthButton>

                <OAuthNote>
                    Northumbria students: use your @northumbria.ac.uk Microsoft account
                </OAuthNote>

                <OAuthButton href="/auth/google-login.php" $variant="google">
                    <GoogleLogo />
                    Sign in with Google
                </OAuthButton>
            </Divider>
        </Modal>
    );
};

export default AuthModal;
