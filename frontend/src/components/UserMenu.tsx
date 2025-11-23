import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { Sun, Moon, X } from 'lucide-react';

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
      <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleOpenSettings}
          className="flex items-center gap-2 px-3"
            >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {getInitials(user.name)}
          </span>
          <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
            </Button>
      </div>

      {/* User Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={handleCloseSettings}>
          <div className="absolute right-0 top-0 w-1/4 min-w-[300px] bg-background border-l border-border h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">User Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSettings}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Theme Toggle */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {theme === 'light' ? (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                      {theme === 'light' ? 'Light mode' : 'Dark mode'}
                    </span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>

              {/* Pagination Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Pagination</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Books per page</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={pageSize === 10 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPageSize(10)}
                    >
                      10
                    </Button>
                    <Button
                      variant={pageSize === 20 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPageSize(20)}
                    >
                      20
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose how many books to display per page in the library
                </p>
              </div>

              {/* Image size settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Study Images</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Global image size</span>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Controls the width of all images in study notes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}