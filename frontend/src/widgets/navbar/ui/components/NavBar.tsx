import {Avatar, Button, Flex, Layout, Typography} from "antd";
import {LogoutButton} from "@/shared/ui/components/LogoutButton.tsx";
import {useAuth} from "@/shared/lib/context/AuthContext.tsx";
import {ArrowLeftOutlined, ReadOutlined, UserOutlined} from "@ant-design/icons";

const { Header } = Layout;

interface NavBarProps{
    myBooksOnClick: () => void,
    backOnClick: () => void,
    appState: string,
    settingsOnClick: () => void
}

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const NavBar = (props: NavBarProps) => {

    const { user, logout } = useAuth();

    return (
    <Header
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--ant-color-bg-container)',
            borderBottom: '1px solid var(--ant-color-border-secondary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
    >
        <Flex
            align="center"
            justify="space-between"
            style={{width: '100%', maxWidth: '72rem'}}
        >
            <Flex align="center" gap={16}>
                <Flex vertical style={{lineHeight: 1.4}}>
                    <Typography.Text strong style={{fontSize: '1rem'}}>
                        PDF Course Generator
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{fontSize: '0.85rem'}}>
                        Welcome back, {user !== null ? user.name : ""}
                    </Typography.Text>
                </Flex>
            </Flex>

            <Flex align="center" gap={12}>
                {props.appState !== 'upload' && (
                    <Button
                        size="small"
                        onClick={props.backOnClick}
                        icon={<ArrowLeftOutlined/>}
                    >
                        Back
                    </Button>
                )}
                <Button
                    size="small"
                    onClick={props.myBooksOnClick}
                    icon={<ReadOutlined/>}
                >
                    My books
                </Button>
                <Button
                    type="text"
                    onClick={props.settingsOnClick}
                    style={{ height: 'auto', padding: '4px 8px' }}
                >
                    <Flex align="center" gap={8}>
                        <Avatar
                            style={{ backgroundColor: 'var(--primary)' }}
                            icon={<UserOutlined />}
                        >
                            {getInitials(user?.name || '')}
                        </Avatar>
                        <Typography.Text strong style={{ fontSize: '0.875rem' }}>
                            {user?.name.split(' ')[0] || ''}
                        </Typography.Text>
                    </Flex>
                </Button>
                <LogoutButton
                    onClick={logout}
                />
            </Flex>
        </Flex>
    </Header>)
}
