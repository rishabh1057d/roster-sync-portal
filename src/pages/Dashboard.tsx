
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getClasses, getAttendanceStats, initializeMockData } from "@/services/dataService";
import { Class } from "@/types";
import { AlertCircle, Users, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initialize mock data for demonstration
    initializeMockData(user.id);
    
    // Fetch classes
    const fetchedClasses = getClasses(user.id);
    setClasses(fetchedClasses);
    setIsLoading(false);
  }, [user]);

  const handleCreateClass = () => {
    navigate("/classes/new");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="NIET Faculty Dashboard"
        description="Welcome to Noida Institute of Engineering and Technology's Attendance Management System"
        actions={
          <Button onClick={handleCreateClass}>
            <Plus size={16} className="mr-2" />
            Create Course
          </Button>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          title="No Courses Created"
          description="Get started by creating your first course to track student attendance."
          icon={<AlertCircle size={40} />}
          action={{
            label: "Create Course",
            onClick: handleCreateClass,
          }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {classes.map((cls) => {
            const stats = getAttendanceStats(cls.id);
            const totalAttendance = stats.present + stats.absent + stats.late + stats.excused;
            
            return (
              <Card key={cls.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-xl truncate">{cls.name}</span>
                    <Badge variant="outline" className="ml-2 whitespace-nowrap">
                      {cls.schedule}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Total records: {totalAttendance}
                      </span>
                    </div>
                    
                    {totalAttendance > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        <div className="flex flex-col items-center p-2 rounded bg-status-present/10">
                          <span className="text-status-present font-bold">{stats.present}</span>
                          <span className="text-xs">Present</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-status-absent/10">
                          <span className="text-status-absent font-bold">{stats.absent}</span>
                          <span className="text-xs">Absent</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-status-late/10">
                          <span className="text-status-late font-bold">{stats.late}</span>
                          <span className="text-xs">Late</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-status-excused/10">
                          <span className="text-status-excused font-bold">{stats.excused}</span>
                          <span className="text-xs">Excused</span>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2 justify-between"
                      onClick={() => navigate(`/classes/${cls.id}`)}
                    >
                      View Class
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
