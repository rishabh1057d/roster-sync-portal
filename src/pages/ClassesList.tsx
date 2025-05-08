import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getClasses, deleteClass } from "@/services/classService";
import { Class } from "@/types";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

const ClassesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch classes
    const fetchClasses = async () => {
      try {
        const fetchedClasses = await getClasses(user.id);
        setClasses(fetchedClasses);
        setFilteredClasses(fetchedClasses);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClasses(classes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClasses(
        classes.filter(
          (cls) =>
            cls.name.toLowerCase().includes(query) ||
            cls.description.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, classes]);

  const handleCreateClass = () => {
    navigate("/classes/new");
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      await deleteClass(classToDelete);
      toast.success("Class deleted successfully");
      // Update state
      setClasses(classes.filter((cls) => cls.id !== classToDelete));
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
    setClassToDelete(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="NIET Course Catalog"
        description="Manage your courses and their attendance records"
        actions={
          <Button onClick={handleCreateClass}>
            <Plus size={16} className="mr-2" />
            New Course
          </Button>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          title="No Classes Yet"
          description="Get started by creating your first class to track attendance."
          icon={<Calendar size={40} />}
          action={{
            label: "Create Class",
            onClick: handleCreateClass,
          }}
        />
      ) : (
        <>
          <div className="mt-6 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search classes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border bg-card">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="border-b">
                  <tr className="border-b transition-colors">
                    <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">Description</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">Schedule</th>
                    <th className="h-12 px-4 text-right align-middle font-medium w-[70px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((cls) => (
                    <tr
                      key={cls.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/classes/${cls.id}`)}
                    >
                      <td className="p-4 align-middle font-medium">
                        {cls.name}
                      </td>
                      <td className="p-4 align-middle hidden md:table-cell">
                        <div className="line-clamp-1">{cls.description}</div>
                      </td>
                      <td className="p-4 align-middle hidden sm:table-cell">
                        {cls.schedule}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/classes/${cls.id}/edit`);
                            }}>
                              <Edit size={16} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClassToDelete(cls.id);
                              }}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this class and all associated attendance records.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassesList;
