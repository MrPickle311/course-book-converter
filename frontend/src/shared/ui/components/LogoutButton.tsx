import {Button} from "antd";
import {LogoutOutlined} from "@ant-design/icons";


interface LogoutButtonProps {
    onClick?: () => void
}

export const LogoutButton = (props: LogoutButtonProps) => <Button
    danger
    size="small"
    onClick={props.onClick}
    icon={<LogoutOutlined />}
>
    Logout
</Button>;

