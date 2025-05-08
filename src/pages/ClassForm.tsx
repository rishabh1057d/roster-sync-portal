
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createClass, getClass, updateClass } from "@/services/classService";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";

const ClassForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const isEditMode = classId !== "new";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && classId) {
      // Fetch class details for editing
      const fetchClassDetails = async () => {
        try {
          const classDetails = await getClass(classId);
          setName(classDetails.name);
          setDescription(classDetails.description);
          setSchedule(classDetails.schedule);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching class:", error);
          toast.error("Class not found");
          navigate("/classes");
        }
      };
      
      fetchClassDetails();
    }
  }, [classId, isEditMode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && classId) {
        // Update existing class
        const updatedClass = await updateClass(classId, {
          name,
          description,
          schedule
        });

        toast.success("Class updated successfully");
        navigate(`/classes/${classId}`);
      } else {
        // Create new class
        const newClass = await createClass({
          name,
          description,
          schedule,
          userId: user.id
        });

        toast.success("Class created successfully");
        navigate(`/classes/${newClass.id}`);
      }
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("An error occurred while saving the class");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? "Edit Class" : "Create New Class"}
        description={
          isEditMode
            ? "Update class details and schedule"
            : "Set up a new class for attendance tracking"
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/classes")}>
            <ChevronLeft size={16} className="mr-2" />
            Back to Classes
          </Button>
        }
      />

      <Card className="max-w-2xl mx-auto mt-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mathematics 101"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the class"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g., MWF 9:00 AM - 10:30 AM"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/classes")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader size={16} className="mr-2 animate-spin" />
                ) : null}
                {isEditMode ? "Update Class" : "Create Class"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassForm;
