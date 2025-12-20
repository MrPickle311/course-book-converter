import {Button, Card, Flex, Progress, Spin, Steps, theme, Typography} from 'antd';
import {CheckCircleOutlined, CloudUploadOutlined, DeleteOutlined, FilePdfOutlined} from '@ant-design/icons';
import {useUploadBook} from '../hooks/useUploadBook.ts';
import {getUploadBookStyles} from '../styles/styles.ts';
import type {Course} from "@/entities/course/model/types.ts";

const { useToken } = theme;

interface UploadBookProps {
  onFileUpload: (file: File) => void;
  userCourses?: Course[];
}

const FlowSteps  = () =>
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

export function UploadBook(props: UploadBookProps) {
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
  } = useUploadBook(props.onFileUpload);

  const styles = getUploadBookStyles(token, isDragOver);

    const Introduction = () =>
    <Flex vertical align="center" gap={16} style={styles.header}>
        <Typography.Title level={2} style={styles.title}>
            Turn a PDF book into a course with notes and tasks
        </Typography.Title>
        <Typography.Text style={styles.mutedText}>Convert PDFs into interactive study material in minutes.</Typography.Text>
    </Flex>

    const UploadWindow = () =>
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


    const DeleteButton = () =>
    <Flex gap={8} justify="center">
        <Button type="primary" onClick={handleUpload}>Process PDF</Button>
        <Button icon={<DeleteOutlined/>} onClick={handleRemoveFile}>
            Remove
        </Button>
    </Flex>;

    const ProcessingCompleteDialog = () =>
    <Flex align="center" gap={8}>
        <CheckCircleOutlined style={styles.successIcon}/>
        <Typography.Text style={styles.smallMutedText}>
            Processing complete!
        </Typography.Text>
    </Flex>;


    const ProcessingInProgressDialog = () =>
    <Flex align="center" gap={8}>
        <Spin size="small"/>
        <Typography.Text style={styles.smallMutedText}>
            Processing PDF...
        </Typography.Text>
    </Flex>;

    const ProcessingInformation = () =>
    <Flex vertical gap={16} align="center" style={styles.processingContainer}>
        <Flex vertical gap={8} align="center" style={{width: '100%'}}>
            {uploadProgress < 100 ? <ProcessingInProgressDialog/> : <ProcessingCompleteDialog/>}
            <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'}/>
        </Flex>
    </Flex>;

    const ProcessingWindow = () =>
    <Flex vertical gap={16} align="center">
        <FilePdfOutlined style={styles.iconFile}/>
        <Flex vertical gap={8} align="center">
            <Typography.Text>{selectedFile?.name || ''}</Typography.Text>
            <Typography.Text style={styles.smallMutedText}>
                {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB
            </Typography.Text>
            {!isProcessing ? <DeleteButton/> : <ProcessingInformation/>}
        </Flex>
    </Flex>;

    return (
    <Flex vertical gap={32} style={styles.container}>
      <Introduction/>
      <Card>
        <Flex
          vertical
          align="center"
          justify="center"
          style={styles.dropZone}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Upload PDF by drag-and-drop or choose a file"
          title="Upload PDF by drag-and-drop or choose a file"
        >
          {!selectedFile ? <UploadWindow />: <ProcessingWindow />}
        </Flex>
      </Card>
      <FlowSteps/>
    </Flex>
  );
}