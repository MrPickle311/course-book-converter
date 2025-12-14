import { Card, Button, Progress, Flex, Typography, Spin, Steps, theme } from 'antd';
import { CloudUploadOutlined, FilePdfOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUploadBook } from '../hooks/useUploadBook.ts';
import { getUploadBookStyles } from '../styles/styles.ts';

const { useToken } = theme;

interface Course {
  id: string;
  completed: boolean;
  userId: string;
}

interface UploadBookProps {
  onFileUpload: (file: File) => void;
  userCourses?: Course[];
}

export function UploadBook({ onFileUpload, userCourses = [] }: UploadBookProps) {
  const { token } = useToken();

  const {
    isDragOver,
    isProcessing,
    uploadProgress,
    selectedFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleUpload,
    handleRemoveFile
  } = useUploadBook(onFileUpload);

  const styles = getUploadBookStyles(token, isDragOver);

  void userCourses;

  return (
    <Flex vertical gap={32} style={styles.container}>
      <Flex vertical align="center" gap={16} style={styles.header}>
        <Typography.Title level={2} style={styles.title}>
          Turn a PDF book into a course with notes and tasks
        </Typography.Title>
        <Typography.Text style={styles.mutedText}>Convert PDFs into interactive study material in minutes.</Typography.Text>
      </Flex>

      <Card>
        <div
          style={styles.dropZone}
          role="button"
          aria-label="Upload PDF by drag-and-drop or choose a file"
          title="Upload PDF by drag-and-drop or choose a file"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <Flex vertical gap={16} align="center">
              <CloudUploadOutlined style={styles.iconLarge} />
              <Flex vertical gap={8}>
                <Typography.Text>Drag and drop your PDF book here</Typography.Text>
                <Typography.Text style={styles.smallMutedText}>or</Typography.Text>
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <Button>Choose File</Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                </label>
              </Flex>
              <Typography.Text style={styles.extraSmallMutedText}>
                Only PDF files are supported
              </Typography.Text>
            </Flex>
          ) : (
            <Flex vertical gap={16} align="center">
              <FilePdfOutlined style={styles.iconFile} />
              <Flex vertical gap={8} align="center">
                <Typography.Text>{selectedFile.name}</Typography.Text>
                <Typography.Text style={styles.smallMutedText}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography.Text>
                {!isProcessing ? (
                  <Flex gap={8} justify="center">
                    <Button type="primary" onClick={handleUpload}>Process PDF</Button>
                    <Button icon={<DeleteOutlined />} onClick={handleRemoveFile}>
                      Remove
                    </Button>
                  </Flex>
                ) : (
                  <Flex vertical gap={16} align="center" style={styles.processingContainer}>
                    <Flex vertical gap={8} align="center" style={{ width: '100%' }}>
                      {uploadProgress < 100 ? (
                        <Flex align="center" gap={8}>
                          <Spin size="small" />
                          <Typography.Text style={styles.smallMutedText}>
                            Processing PDF...
                          </Typography.Text>
                        </Flex>
                      ) : (
                        <Flex align="center" gap={8}>
                          <CheckCircleOutlined style={styles.successIcon} />
                          <Typography.Text style={styles.smallMutedText}>
                            Processing complete!
                          </Typography.Text>
                        </Flex>
                      )}
                      <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
                      <Typography.Text style={styles.extraSmallMutedText}>
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
      </Card>

      <Flex justify="center">
        <Steps
          current={-1}
          items={[
            { title: 'Upload PDF', description: 'Upload your technical book in PDF format' },
            { title: 'Select Chapter', description: 'Choose a chapter from the extracted table of contents' },
            { title: 'Learn & Practice', description: 'Study generated notes and complete interactive tasks' },
          ]}
        />
      </Flex>
    </Flex>
  );
}