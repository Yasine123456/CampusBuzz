import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import * as api from '../../services/api';
import { getWeatherIcon, getWeatherDescription } from '../../utils/formatters';

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const WidgetWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: default;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.bgSecondary};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  ${({ $loading }) => $loading && `
    .weather-icon {
      animation: ${pulse} 1.5s ease-in-out infinite;
    }
  `}

  ${({ $error }) => $error && `
    opacity: 0.6;
  `}
`;

const IconWrapper = styled.div`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $error }) => $error ? theme.colors.textMuted : theme.accentColors.accent};
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Temp = styled.span`
  font-weight: 600;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
`;

// Weather icons
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const CloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
);

const RainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 19v2M12 19v2M16 19v2" />
    </svg>
);

const SnowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18M5.636 5.636l12.728 12.728M3 12h18M5.636 18.364l12.728-12.728" />
    </svg>
);

const getIconComponent = (iconType) => {
    switch (iconType) {
        case 'sun':
            return <SunIcon />;
        case 'cloud-rain':
        case 'cloud-drizzle':
            return <RainIcon />;
        case 'snowflake':
            return <SnowIcon />;
        case 'cloud':
        case 'cloud-sun':
        default:
            return <CloudIcon />;
    }
};

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const data = await api.getNewcastleWeather();
                if (data && data.current) {
                    setWeather(data.current);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Weather fetch error:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();

        // Refresh every 10 minutes
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
    }, []);

    const temp = weather?.temperature_2m;
    const code = weather?.weather_code ?? 0;
    const iconType = getWeatherIcon(code);
    const description = getWeatherDescription(code);

    return (
        <WidgetWrapper
            $loading={loading}
            $error={error}
            title={error ? 'Weather unavailable' : `Newcastle: ${description}`}
        >
            <IconWrapper className="weather-icon" $error={error}>
                {getIconComponent(iconType)}
            </IconWrapper>
            <Temp>
                {loading ? '...' : error ? '--°' : `${Math.round(temp)}°C`}
            </Temp>
        </WidgetWrapper>
    );
};

export default WeatherWidget;
