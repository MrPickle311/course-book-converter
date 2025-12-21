import {Flex, Spin} from "antd";
import {LoadingOutlined} from "@ant-design/icons";

export const LoadingPage =  () =>
<Flex align="center" justify="center" style={{minHeight: '100vh'}}>
    <Spin indicator={<LoadingOutlined spin/>} size="large"/>
</Flex>;
