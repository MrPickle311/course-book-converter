import React from "react";
import {Button as AntdButton} from 'antd';
import type {SizeType} from "antd/es/config-provider/SizeContext";

interface ButtonProps{
    icon?: React.ReactNode,
    onClick: () => void,
    size?: string
    children: any
}

export const Button = (props: ButtonProps) => <AntdButton
    icon={props.icon}
    onClick={props.onClick}
    size={props.size as SizeType}
>
    {props.children}
</AntdButton>;
