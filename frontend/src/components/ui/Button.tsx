import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, children, disabled, ...props },
    ref
  ) => {
    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
      secondary: "bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800",
      outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
      ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
