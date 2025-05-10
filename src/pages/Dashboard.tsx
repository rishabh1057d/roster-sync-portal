
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getClasses } from "@/services/classService";
import { Class } from "@/types";
import { AlertCircle, Users, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { toast } from "@/components/ui/sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch classes
    const fetchClasses = async () => {
      try {
        const fetchedClasses = await getClasses(user.id);
        setClasses(fetchedClasses);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
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
            // Mock attendance stats for display
            const stats = {
              present: Math.floor(Math.random() * 25) + 15,
              absent: Math.floor(Math.random() * 10),
              late: Math.floor(Math.random() * 5),
              excused: Math.floor(Math.random() * 3)
            };
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
                        <div className="flex flex-col items-center p-2 rounded bg-green-100/50">
                          <span className="text-green-700 font-bold">{stats.present}</span>
                          <span className="text-xs">Present</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-red-100/50">
                          <span className="text-red-700 font-bold">{stats.absent}</span>
                          <span className="text-xs">Absent</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-yellow-100/50">
                          <span className="text-yellow-700 font-bold">{stats.late}</span>
                          <span className="text-xs">Late</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded bg-blue-100/50">
                          <span className="text-blue-700 font-bold">{stats.excused}</span>
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
