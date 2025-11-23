"use client";

import { Checkbox as AntCheckbox, type CheckboxProps as AntCheckboxProps } from "antd";

import { cn } from "./utils";

type CheckboxProps = Omit<AntCheckboxProps, "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
};

function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <AntCheckbox
      data-slot="checkbox"
      className={cn("bcc-checkbox", className)}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  );
}

export { Checkbox };

