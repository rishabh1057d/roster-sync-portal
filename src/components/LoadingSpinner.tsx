
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner = ({ size = 24, className }: LoadingSpinnerProps) => {
  return (
    <div className="flex justify-center items-center p-4">
      <Loader
        size={size}
        className={cn("animate-spin text-muted-foreground", className)}
      />
    </div>
  );
};

export default LoadingSpinner;
