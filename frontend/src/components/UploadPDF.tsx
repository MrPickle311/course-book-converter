import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Flex, Typography, Spin } from 'antd';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  void userCourses;

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

  const mutedTextStyle = { color: 'var(--muted-foreground)' };
  const smallMutedTextStyle = { fontSize: '0.875rem', color: 'var(--muted-foreground)' };
  const extraSmallMutedTextStyle = { fontSize: '0.75rem', color: 'var(--muted-foreground)' };

  const dropZoneBaseStyle: React.CSSProperties = {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'var(--border)',
    borderRadius: 12,
    padding: 32,
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    maxWidth: 520,
    margin: '0 auto',
    backgroundColor: 'var(--card)',
  };

  const dropZoneStyle: React.CSSProperties = isDragOver
    ? {
        ...dropZoneBaseStyle,
        borderColor: '#a5b4fc',
        backgroundColor: 'rgba(165, 180, 252, 0.12)',
      }
    : { ...dropZoneBaseStyle, borderColor: '#d4d4d8' };

  const stepCircleStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  };

  return (
    <Flex vertical gap={32} style={{ maxWidth: '60rem', margin: '0 auto' }}>
      <Flex vertical align="center" gap={16} style={{ textAlign: 'center' }}>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>
          Turn a PDF book into a course with notes and tasks
        </Typography.Title>
        <Typography.Text style={mutedTextStyle}>Convert PDFs into interactive study material in minutes.</Typography.Text>
      </Flex>

      <Card>
        <CardContent style={{ padding: 32 }}>
          <div
            style={dropZoneStyle}
            role="button"
            aria-label="Upload PDF by drag-and-drop or choose a file"
            title="Upload PDF by drag-and-drop or choose a file"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!selectedFile ? (
              <Flex vertical gap={16} align="center">
                <Upload style={{ width: 48, height: 48, color: 'var(--muted-foreground)' }} />
                <Flex vertical gap={8}>
                  <Typography.Text>Drag and drop your PDF book here</Typography.Text>
                  <Typography.Text style={smallMutedTextStyle}>or</Typography.Text>
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                      Choose File
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />
                    </label>
                  </Button>
                </Flex>
                <Typography.Text style={extraSmallMutedTextStyle}>
                  Only PDF files are supported
                </Typography.Text>
              </Flex>
            ) : (
              <Flex vertical gap={16} align="center">
                <FileText style={{ width: 48, height: 48, color: 'var(--primary)' }} />
                <Flex vertical gap={8} align="center">
                  <Typography.Text>{selectedFile.name}</Typography.Text>
                  <Typography.Text style={smallMutedTextStyle}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography.Text>
                  {!isProcessing ? (
                    <Flex gap={8} justify="center">
                      <Button onClick={handleUpload}>Process PDF</Button>
                      <Button variant="outline" onClick={() => setSelectedFile(null)}>
                        Remove
                      </Button>
                    </Flex>
                  ) : (
                    <Flex vertical gap={16} align="center">
                      <Flex vertical gap={8} align="center">
                        {uploadProgress < 100 ? (
                          <Flex align="center" gap={8}>
                            <Spin size="small" />
                            <Typography.Text style={smallMutedTextStyle}>
                              Processing PDF...
                            </Typography.Text>
                          </Flex>
                        ) : (
                          <Flex align="center" gap={8}>
                            <CheckCircle style={{ width: 16, height: 16, color: '#16a34a' }} />
                            <Typography.Text style={smallMutedTextStyle}>
                              Processing complete!
                            </Typography.Text>
                          </Flex>
                        )}
                        <Progress value={uploadProgress} style={{ width: '100%', maxWidth: 320 }} />
                        <Typography.Text style={extraSmallMutedTextStyle}>
                          {uploadProgress < 100
                            ? 'Extracting table of contents...'
                            : 'Redirecting to table of contents...'}
                        </Typography.Text>
                      </Flex>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            )}
          </div>
        </CardContent>
      </Card>

      <Flex
        wrap="wrap"
        justify="center"
        gap={32}
        style={{ textAlign: 'center' }}
      >
        {[
          { title: 'Upload PDF', description: 'Upload your technical book in PDF format' },
          { title: 'Select Chapter', description: 'Choose a chapter from the extracted table of contents' },
          { title: 'Learn & Practice', description: 'Study generated notes and complete interactive tasks' },
        ].map((item, idx) => (
          <Flex key={item.title} vertical gap={8} align="center" style={{ width: 220 }}>
            <div style={{ ...stepCircleStyle, backgroundColor: '#e5e7eb' }}>
              <span style={{ color: '#4b5563', fontWeight: 600 }}>{idx + 1}</span>
            </div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {item.title}
            </Typography.Title>
            <Typography.Text style={smallMutedTextStyle}>{item.description}</Typography.Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}