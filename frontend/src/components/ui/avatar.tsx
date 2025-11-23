"use client";

import * as React from "react";
import {
  Avatar as AntAvatar,
  type AvatarProps as AntAvatarProps,
} from "antd";

import { cn } from "./utils";

function Avatar({ className, ...props }: AntAvatarProps) {
  return (
    <AntAvatar
      data-slot="avatar"
      className={cn("flex size-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };

