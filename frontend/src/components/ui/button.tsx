import * as React from "react";
import {
  Button as AntButton,
  type ButtonProps as AntButtonProps,
} from "antd";

import { cn } from "./utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon";

type ButtonProps = Omit<AntButtonProps, "type" | "size" | "variant"> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
  };

const variantToAntType: Record<ButtonVariant, AntButtonProps["type"]> = {
  default: "primary",
  destructive: "primary",
  outline: "default",
  secondary: "default",
  ghost: "text",
  link: "link",
};

const sizeToAntSize: Record<ButtonSize, AntButtonProps["size"]> = {
  default: "middle",
  sm: "small",
  lg: "large",
  icon: "middle",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild,
      children,
      variant = "default",
      size = "default",
      danger,
      className,
      ...props
    },
    ref,
  ) {
    const isDanger = danger ?? variant === "destructive";
    const antType = variantToAntType[variant];
    const antSize = sizeToAntSize[size];
    const iconClasses =
      size === "icon"
        ? "h-9 w-9 min-h-0 min-w-0 px-0 flex items-center justify-center"
        : undefined;

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref,
        className: cn(className, children.props.className, iconClasses),
        ...props,
      });
    }

    const variantClass =
      variant === "destructive" ? "bcc-btn-destructive" : undefined;

    return (
      <AntButton
        ref={ref}
        type={antType}
        size={antSize}
        danger={isDanger}
        className={cn(className, iconClasses, variantClass)}
        {...props}
      >
        {children}
      </AntButton>
    );
  },
);

export { Button, type ButtonVariant, type ButtonSize };

