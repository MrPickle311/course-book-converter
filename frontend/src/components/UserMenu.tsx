import { useState } from 'react';
import { Button, Switch, Flex, Typography, Drawer, Avatar, Radio } from 'antd';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';

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
      <Button
        type="text"
        onClick={handleOpenSettings}
        style={{ height: 'auto', padding: '4px 8px' }}
      >
        <Flex align="center" gap={8}>
          <Avatar
            style={{ backgroundColor: 'var(--primary)' }}
            icon={<UserOutlined />}
          >
            {getInitials(user.name)}
          </Avatar>
          <Typography.Text strong style={{ fontSize: '0.875rem' }}>
            {user.name.split(' ')[0]}
          </Typography.Text>
        </Flex>
      </Button>

      {/* User Settings Drawer */}
      <Drawer
        title={
          <Flex align="center" gap={8}>
            <SettingOutlined />
            <span>User Settings</span>
          </Flex>
        }
        placement="right"
        onClose={handleCloseSettings}
        open={showSettings}
        width={320}
      >
        <Flex vertical gap={24}>
          {/* Theme Toggle */}
          <Flex vertical gap={12}>
            <Typography.Text strong>
              Appearance
            </Typography.Text>
            <Flex align="center" justify="space-between">
              <Typography.Text>
                {theme === 'light' ? 'Light mode' : 'Dark mode'}
              </Typography.Text>
              <Switch
                checked={theme === 'dark'}
                onChange={toggleTheme}
                checkedChildren="Dark"
                unCheckedChildren="Light"
              />
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
              Toggle between light and dark theme
            </Typography.Text>
          </Flex>

          {/* Pagination Settings */}
          <Flex vertical gap={12}>
            <Typography.Text strong>
              Pagination
            </Typography.Text>
            <Flex align="center" justify="space-between">
              <Typography.Text>
                Books per page
              </Typography.Text>
              <Radio.Group
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value={10}>10</Radio.Button>
                <Radio.Button value={20}>20</Radio.Button>
              </Radio.Group>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
              Choose how many books to display per page in the library
            </Typography.Text>
          </Flex>

          {/* Image size settings */}
          <Flex vertical gap={12}>
            <Typography.Text strong>
              Study Images
            </Typography.Text>
            <Flex vertical gap={8}>
              <Flex align="center" justify="space-between">
                <Typography.Text>
                  Global image size
                </Typography.Text>
              </Flex>
              <Radio.Group
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                buttonStyle="solid"
                size="small"
                style={{ width: '100%' }}
              >
                <Radio.Button value="small" style={{ width: '33%', textAlign: 'center' }}>Small</Radio.Button>
                <Radio.Button value="medium" style={{ width: '33%', textAlign: 'center' }}>Medium</Radio.Button>
                <Radio.Button value="large" style={{ width: '33%', textAlign: 'center' }}>Large</Radio.Button>
              </Radio.Group>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
              Controls the width of all images in study notes.
            </Typography.Text>
          </Flex>
        </Flex>
      </Drawer>
    </>
  );
}