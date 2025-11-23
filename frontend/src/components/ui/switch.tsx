"use client";

import { Switch as AntSwitch, type SwitchProps as AntSwitchProps } from "antd";

import { cn } from "./utils";

type SwitchProps = Omit<AntSwitchProps, "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
};

function Switch({ className, onCheckedChange, ...props }: SwitchProps) {
  return (
    <AntSwitch
      data-slot="switch"
      className={cn("bcc-switch", className)}
      size="small"
      onChange={(checked) => onCheckedChange?.(checked)}
      {...props}
    />
  );
}

export { Switch };

