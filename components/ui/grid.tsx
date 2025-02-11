import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(({ className, ...props }, ref) => {
  return <div className={cn("grid", className)} ref={ref} {...props} />
})
Grid.displayName = "Grid"

export { Grid }

