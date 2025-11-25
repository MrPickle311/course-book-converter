import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { Sun, Moon, X } from 'lucide-react';
import { Flex, Typography } from 'antd';

export function UserMenu() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pageSize, setPageSize, imageSize, setImageSize } = useSettings();

  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Flex align="center" gap={12}>
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleOpenSettings}
          className="flex items-center gap-2 px-3"
            >
          <Flex
            align="center"
            justify="center"
            style={{
              width: 24,
              height: 24,
              borderRadius: 9999,
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
                  {getInitials(user.name)}
          </Flex>
          <Typography.Text style={{ fontSize: '0.875rem', fontWeight: 500, marginLeft: 4 }}>
            {user.name.split(' ')[0]}
          </Typography.Text>
            </Button>
      </Flex>

      {/* User Settings Panel */}
      {showSettings && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
                onClick={handleCloseSettings}
              >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '25%',
              minWidth: 300,
              height: '100%',
              backgroundColor: 'var(--background)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex
              align="center"
              justify="space-between"
              style={{ padding: 24, borderBottom: '1px solid var(--border)' }}
            >
              <Typography.Title level={4} style={{ margin: 0 }}>
                User Settings
              </Typography.Title>
              <Button variant="ghost" size="sm" onClick={handleCloseSettings}>
                <X className="h-4 w-4" />
              </Button>
            </Flex>
            
            <Flex vertical gap={24} style={{ padding: 24 }}>
              {/* Theme Toggle */}
              <Flex vertical gap={12}>
                <Typography.Text style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Appearance
                </Typography.Text>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={8}>
                    {theme === 'light' ? (
                      <Sun style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                    ) : (
                      <Moon style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                    )}
                    <Typography.Text style={{ fontSize: '0.875rem' }}>
                      {theme === 'light' ? 'Light mode' : 'Dark mode'}
                    </Typography.Text>
                  </Flex>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </Flex>
                <Typography.Text style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Toggle between light and dark theme
                </Typography.Text>
              </Flex>

              {/* Pagination Settings */}
              <Flex vertical gap={12}>
                <Typography.Text style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Pagination
                </Typography.Text>
                <Flex align="center" justify="space-between">
                  <Typography.Text style={{ fontSize: '0.875rem' }}>
                    Books per page
                  </Typography.Text>
                  <Flex align="center" gap={8}>
                    <Button
                      variant={pageSize === (10 as typeof pageSize) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPageSize(10 as typeof pageSize)}
                    >
                      10
                    </Button>
                    <Button
                      variant={pageSize === (20 as typeof pageSize) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPageSize(20 as typeof pageSize)}
                    >
                      20
                    </Button>
                  </Flex>
                </Flex>
                <Typography.Text style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Choose how many books to display per page in the library
                </Typography.Text>
              </Flex>

              {/* Image size settings */}
              <Flex vertical gap={12}>
                <Typography.Text style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Study Images
                </Typography.Text>
                <Flex align="center" justify="space-between">
                  <Typography.Text style={{ fontSize: '0.875rem' }}>
                    Global image size
                  </Typography.Text>
                  <Flex align="center" gap={8}>
                    <Button
                      variant={imageSize === 'small' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageSize('small')}
                    >
                      Small
                    </Button>
                    <Button
                      variant={imageSize === 'medium' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageSize('medium')}
                    >
                      Medium
                    </Button>
                    <Button
                      variant={imageSize === 'large' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageSize('large')}
                    >
                      Large
                    </Button>
                  </Flex>
                </Flex>
                <Typography.Text style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Controls the width of all images in study notes.
                </Typography.Text>
              </Flex>
            </Flex>
          </div>
        </div>
      )}
    </>
  );
}