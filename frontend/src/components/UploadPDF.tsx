import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useAuth } from './AuthContext';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  completed: boolean;
  userId: string;
}

interface UploadPDFProps {
  onFileUpload: (file: File) => void;
  userCourses?: Course[];
}

export function UploadPDF({ onFileUpload, userCourses = [] }: UploadPDFProps) {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const completedCourses = userCourses.filter(course => course.completed).length;
  const totalCourses = userCourses.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileSelection(pdfFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          onFileUpload(selectedFile);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2>Turn a PDF book into a course with notes and tasks</h2>
        <p className="text-muted-foreground">
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            role="button"
            aria-label="Upload PDF by drag-and-drop or choose a file"
            title="Upload PDF by drag-and-drop or choose a file"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!selectedFile ? (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p>Drag and drop your PDF book here</p>
                  <p className="text-sm text-muted-foreground">or</p>
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose File
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                    </label>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only PDF files are supported
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="w-12 h-12 mx-auto text-primary" />
                <div className="space-y-2">
                  <p>{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!isProcessing ? (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleUpload}>
                        Process PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          {uploadProgress < 100 ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm">Processing PDF...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Processing complete!</span>
                            </>
                          )}
                        </div>
                        <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          {uploadProgress < 100 
                            ? 'Extracting table of contents...' 
                            : 'Redirecting to table of contents...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 text-center">
        <div className="space-y-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary">1</span>
          </div>
          <h3>Upload PDF</h3>
          <p className="text-sm text-muted-foreground">
            Upload your technical book in PDF format
          </p>
        </div>
        <div className="space-y-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary">2</span>
          </div>
          <h3>Select Chapter</h3>
          <p className="text-sm text-muted-foreground">
            Choose a chapter from the extracted table of contents
          </p>
        </div>
        <div className="space-y-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary">3</span>
          </div>
          <h3>Learn & Practice</h3>
          <p className="text-sm text-muted-foreground">
            Study generated notes and complete interactive tasks
          </p>
        </div>
      </div>
    </div>
  );
}