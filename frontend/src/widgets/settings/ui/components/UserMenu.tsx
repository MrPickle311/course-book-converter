import {Drawer, Flex, Radio, Switch, Typography} from 'antd';
import {useTheme} from '@/features/user-settings/config/ThemeContext.tsx';
import {useSettings} from '@/features/user-settings/config/SettingsContext.tsx';
import {SettingOutlined} from '@ant-design/icons';

const Text = Typography.Text;

interface UserMenuProps{
  onClose: () => void,
  isOpen: boolean
}

export function UserMenu(props: UserMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const { pageSize, setPageSize, imageSize, setImageSize } = useSettings();

  const ImageSizeSettings = () => 
  <Flex vertical gap={12}>
    <Text strong>
      Study Images
    </Text>
    <Flex vertical gap={8}>
      <Flex align="center" justify="space-between">
        <Text>
          Global image size
        </Text>
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
    <Text type="secondary" style={{ fontSize: '0.75rem' }}>
      Controls the width of all images in study notes.
    </Text>
  </Flex>;
  
  const PaginationSettings = () => 
  <Flex vertical gap={12}>
    <Text strong>
      Pagination
    </Text>
    <Flex align="center" justify="space-between">
      <Text>
        Books per page
      </Text>
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
    <Text type="secondary" style={{fontSize: '0.75rem'}}>
      Choose how many books to display per page in the library
    </Text>
  </Flex>;
  
  const ThemeToggle = () => 
  <Flex vertical gap={12}>
    <Text strong>
      Appearance
    </Text>
    <Flex align="center" justify="space-between">
      <Text>
        {theme === 'light' ? 'Light mode' : 'Dark mode'}
      </Text>
      <Switch
          checked={theme === 'dark'}
          onChange={toggleTheme}
          checkedChildren="Dark"
          unCheckedChildren="Light"
      />
    </Flex>
    <Text type="secondary" style={{fontSize: '0.75rem'}}>
      Toggle between light and dark theme
    </Text>
  </Flex>;
  
  return (
      <Drawer
          title={
            <Flex align="center" gap={8}>
              <SettingOutlined/>
              <span>User Settings</span>
            </Flex>
          }
          placement="right"
          onClose={props.onClose}
          open={props.isOpen}
          width={320}
      >
        <Flex vertical gap={24}>
          <ThemeToggle/>
          <PaginationSettings/>
          <ImageSizeSettings/>
        </Flex>
      </Drawer>
  );
}