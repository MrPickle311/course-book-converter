import * as React from "react";
import { Tag, type TagProps } from "antd";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type BadgeProps = Omit<TagProps, "color"> & {
  variant?: BadgeVariant;
  asChild?: boolean;
};

function Badge({
  className,
  variant = "default",
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const colors: Record<BadgeVariant, TagProps["color"]> = {
    default: "#111827",
    secondary: "#374151",
    destructive: "#dc2626",
    outline: undefined,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className,
      ...props,
    });
  }

  return (
    <Tag
      bordered={variant === "outline"}
      color={colors[variant]}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  );
}

export { Badge };