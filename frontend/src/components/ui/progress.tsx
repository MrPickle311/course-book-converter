import { Progress as AntProgress, type ProgressProps } from "antd";

import { cn } from "./utils";

type Props = {
  value?: number;
} & Omit<ProgressProps, "percent">;

function Progress({ className, value = 0, ...props }: Props) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <AntProgress
      {...props}
      type="line"
      percent={percent}
      showInfo={false}
      strokeWidth={6}
      strokeLinecap="round"
      className={cn("m-0 [&_.ant-progress-bg]:rounded-full", className)}
      strokeColor="var(--primary)"
      trailColor="rgba(3,2,19,0.08)"
    />
  );
}

export { Progress };

