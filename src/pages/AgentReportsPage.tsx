import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Upload, Plus, List, FileText } from "lucide-react";

export default function AgentReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reportType: "PHOTO", // VOICE, PHOTO, BOTH
    shopId: "",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmitReport = async () => {
    // TODO: Submit to API
    console.log("Submit report", formData, selectedFiles);
    setShowForm(false);
    setFormData({ title: "", description: "", reportType: "PHOTO", shopId: "" });
    setSelectedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Reports</h1>
          <p className="text-muted-foreground">Submit voice and photo reports for shop visits</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Report</CardTitle>
            <CardDescription>Submit voice or photo evidence from your shop visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Shop</label>
              <Input
                type="text"
                placeholder="Enter shop ID or name"
                value={formData.shopId}
                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={formData.reportType} onValueChange={(val) => setFormData({ ...formData, reportType: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHOTO">Photo Report</SelectItem>
                  <SelectItem value="VOICE">Voice Report</SelectItem>
                  <SelectItem value="BOTH">Both Voice & Photo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                type="text"
                placeholder="Report title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the issue or situation"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {["VOICE", "BOTH"].includes(formData.reportType) && (
              <div>
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  className="w-full gap-2"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? "Stop Recording" : "Record Voice Message"}
                </Button>
              </div>
            )}

            {["PHOTO", "BOTH"].includes(formData.reportType) && (
              <div>
                <label className="text-sm font-medium">Upload Photos</label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload photos</span>
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file) => (
                      <div key={file.name} className="text-sm text-muted-foreground">
                        ✓ {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmitReport} className="flex-1">
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto opacity-50 mb-2" />
                <p>No reports yet. Create your first report to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.shopId}</CardDescription>
                  </div>
                  <Badge>{report.reportType}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.description}</p>
                <div className="mt-4 flex gap-2">
                  {report.voiceUrl && <Badge variant="secondary">🎙️ Voice</Badge>}
                  {report.photoUrls && report.photoUrls.length > 0 && <Badge variant="secondary">📷 {report.photoUrls.length} Photos</Badge>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
