
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClasses } from "@/services/classService";
import { standardizeStudentsAcrossClasses } from "@/services/studentService";
import { initializeMockData } from "@/services/mockDataService";
import { Class } from "@/types";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { toast } from "@/components/ui/sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStandardizing, setIsStandardizing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        // Initialize mock data if needed
        await initializeMockData(user.id);

        // Get classes
        const fetchedClasses = await getClasses(user.id);
        setClasses(fetchedClasses);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleStandardizeStudents = async () => {
    setIsStandardizing(true);
    try {
      const success = await standardizeStudentsAcrossClasses();
      if (success) {
        toast.success("Student data has been standardized across all classes");
      }
    } catch (error) {
      console.error("Error standardizing students:", error);
      toast.error("Failed to standardize student data");
    } finally {
      setIsStandardizing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to your attendance tracker"
        actions={
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={handleStandardizeStudents}
              disabled={isStandardizing}
            >
              <RefreshCw size={16} className={`mr-2 ${isStandardizing ? 'animate-spin' : ''}`} />
              {isStandardizing ? 'Standardizing...' : 'Standardize Students'}
            </Button>
            <Button asChild>
              <Link to="/classes/new">
                <Plus size={16} className="mr-2" />
                New Class
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Your Classes</h2>
        
        {classes.length === 0 ? (
          <EmptyState
            title="No Classes Yet"
            description="Create your first class to get started"
            icon={<BookOpen size={48} />}
            action={{
              label: "Create Class",
              onClick: () => navigate("/classes/new"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <Link to={`/classes/${cls.id}`}>
                  <CardHeader>
                    <CardTitle>{cls.name}</CardTitle>
                    <CardDescription>{cls.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users size={16} className="mr-2" />
                      <span>Students</span>
                    </div>
                    <p className="mt-2 text-sm">{cls.schedule}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
