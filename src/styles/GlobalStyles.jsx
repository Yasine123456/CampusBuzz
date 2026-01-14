import { Global, css } from '@emotion/react';

const GlobalStyles = ({ theme }) => (
    <Global
        styles={css`
      /* Reset & Base Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html {
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: ${theme.fonts.sans};
        background: ${theme.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.colors.bgPrimary} 0%, #1a1f35 100%)`
                : theme.colors.bgPrimary};
        color: ${theme.colors.textPrimary};
        line-height: 1.6;
        min-height: 100vh;
        overflow-x: hidden;
      }

      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-family: ${theme.fonts.display};
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: ${theme.spacing.md};
      }

      h1 { font-size: 2.5rem; }
      h2 { font-size: 2rem; }
      h3 { font-size: 1.5rem; }
      h4 { font-size: 1.25rem; }

      a {
        color: ${theme.accentColors.accentLight};
        text-decoration: none;
        transition: color ${theme.transitions.fast};
      }

      a:hover {
        color: ${theme.accentColors.accent};
      }

      /* Utility Classes */
      .hidden {
        display: none !important;
      }

      .text-center {
        text-align: center;
      }

      /* Animations */
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Scrollbar styling */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: ${theme.colors.bgSecondary};
      }

      ::-webkit-scrollbar-thumb {
        background: ${theme.colors.borderColor};
        border-radius: ${theme.radii.full};
      }

      ::-webkit-scrollbar-thumb:hover {
        background: ${theme.colors.textMuted};
      }

      /* Focus outline */
      :focus-visible {
        outline: 2px solid ${theme.accentColors.accent};
        outline-offset: 2px;
      }
    `}
    />
);

export default GlobalStyles;
