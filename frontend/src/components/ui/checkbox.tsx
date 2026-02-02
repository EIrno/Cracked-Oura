import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLButtonElement,
    {
        checked?: boolean
        onCheckedChange?: (checked: boolean) => void
    } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        ref={ref}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary text-primary-foreground" : "border-primary",
            className
        )}
        {...props}
    >
        {checked && (
            <div className={cn("flex items-center justify-center text-current")}>
                <Check className="h-3 w-3" />
            </div>
        )}
    </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
