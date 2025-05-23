import * as React from 'react';
import { css } from '@emotion/css';
import { ThemeContext } from './themeContext';
import { useContext, useState, useEffect } from 'react';
import { fetchPreviewData, PreviewData } from '../mockPreviewAPI';

interface TabPreviewProps {
    url: string;
    title: string;
    lastActive?: number | null;
    isVisible: boolean;
}

const previewContainerStyle = (theme: any, isVisible: boolean) => css({
    background: theme.background,
    border: `1px solid ${theme.lightBorder}`,
    borderRadius: '6px',
    padding: isVisible ? '12px' : '0px',
    marginTop: isVisible ? '8px' : '0px',
    marginBottom: isVisible ? '4px' : '0px',
    marginLeft: '24px', // Indent to align with tab content
    marginRight: '8px',
    boxShadow: isVisible ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
    fontSize: '0.85rem', // Increased from 0.75rem - just slightly smaller than tab title
    maxHeight: isVisible ? '200px' : '0px',
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
});

const previewContentStyle = css({
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
});

const previewImageStyle = css({
    width: '60px',
    height: '45px',
    borderRadius: '4px',
    objectFit: 'cover',
    flexShrink: 0,
    backgroundColor: '#f0f0f0',
    border: '1px solid #e0e0e0',
});

const previewInfoStyle = css({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
});

const previewDescriptionStyle = (theme: any) => css({
    color: theme.foreground,
    lineHeight: 1.3,
    fontSize: '0.8rem', // Increased from 0.7rem
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const previewMetaStyle = (theme: any) => css({
    display: 'flex',
    justifyContent: 'space-between',
    color: theme.closedGray,
    fontSize: '0.75rem', // Increased from 0.65rem
    marginTop: '2px',
});

const loadingStyle = (theme: any) => css({
    color: theme.closedGray,
    fontStyle: 'italic',
    fontSize: '0.8rem', // Increased from 0.7rem
    padding: '20px 0',
    textAlign: 'center',
});

const errorStyle = (theme: any) => css({
    color: theme.closedGray,
    fontSize: '0.8rem', // Increased from 0.7rem
    padding: '12px 0',
    textAlign: 'center',
});

export const TabPreview: React.FC<TabPreviewProps> = ({
    url,
    title,
    lastActive,
    isVisible,
}) => {
    const theme = useContext(ThemeContext);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isVisible && !previewData && !loading) {
            setLoading(true);
            setError(null);
            
            fetchPreviewData(url)
                .then(data => {
                    setPreviewData(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Failed to load preview');
                    setLoading(false);
                });
        }
    }, [isVisible, url, previewData, loading]);

    // Format last active time
    const formatLastActive = (timestamp: number | null | undefined): string => {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className={previewContainerStyle(theme, isVisible)}>
            {loading && (
                <div className={loadingStyle(theme)}>
                    Loading preview...
                </div>
            )}
            
            {error && (
                <div className={errorStyle(theme)}>
                    {error}
                </div>
            )}
            
            {previewData && !loading && !error && (
                <div className={previewContentStyle}>
                    {previewData.image && (
                        <img
                            src={previewData.image}
                            alt="Preview"
                            className={previewImageStyle}
                            onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}
                    
                    <div className={previewInfoStyle}>
                        {previewData.description && (
                            <div className={previewDescriptionStyle(theme)}>
                                {previewData.description}
                            </div>
                        )}
                        
                        <div className={previewMetaStyle(theme)}>
                            <span>{previewData.domain}</span>
                            {lastActive && (
                                <span>{formatLastActive(lastActive)}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};