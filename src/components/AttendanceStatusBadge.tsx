
import { AttendanceStatus } from "@/types";
import { cn } from "@/lib/utils";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
}

const AttendanceStatusBadge = ({ status, className }: AttendanceStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "present":
        return {
          color: "bg-status-present/10 text-status-present border-status-present/20",
          label: "Present"
        };
      case "absent":
        return {
          color: "bg-status-absent/10 text-status-absent border-status-absent/20",
          label: "Absent"
        };
      case "late":
        return {
          color: "bg-status-late/10 text-status-late border-status-late/20",
          label: "Late"
        };
      case "excused":
        return {
          color: "bg-status-excused/10 text-status-excused border-status-excused/20",
          label: "Excused"
        };
    }
  };

  const { color, label } = getStatusConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
        color,
        className
      )}
    >
      {label}
    </span>
  );
};

export default AttendanceStatusBadge;
