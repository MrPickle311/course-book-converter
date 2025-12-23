import { Button, Card, Flex, Progress, Spin, Steps, theme, Typography } from 'antd';
import { CheckCircleOutlined, CloudUploadOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useUploadBook } from '../hooks/useUploadBook.ts';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { uploadApi } from "@/pages/book-upload/api/uploadApi.ts";
import { useAppStyles } from '@/shared/ui/theme/AppStyles.ts';

const { useToken } = theme;

export function UploadBook() {
    const { token } = useToken();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const styles = useAppStyles(token);

    const handleFileUploadCallback = async (file: File) => {
        try {
            const form = { file } as any;
            const resp = await uploadApi.processPdf(form);
            if (resp?.isSuccess && resp.bookId) {
                await queryClient.invalidateQueries({ queryKey: ['books'] });
                navigate(`/book/${resp.bookId}`);
            }
        } catch (e) {
            console.error('Upload failed', e);
        }
    };

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
    } = useUploadBook(handleFileUploadCallback);

    const Introduction = () =>
        <Flex vertical align="center" gap={16} style={{ textAlign: 'center' }}>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>
                Turn a PDF book into a course with notes and tasks
            </Typography.Title>
            <Typography.Text style={styles.textSecondary}>Convert PDFs into interactive study material in minutes.</Typography.Text>
        </Flex>

    const FlowSteps = () =>
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

    const UploadWindow = () =>
        <Flex vertical gap={16} align="center">
            <CloudUploadOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
            <Flex vertical gap={8}>
                <Typography.Text>Drag and drop your PDF book here</Typography.Text>
                <Typography.Text style={{ fontSize: '0.875rem', color: token.colorTextSecondary }}>or</Typography.Text>
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
            <Typography.Text style={{ fontSize: '0.75rem', color: token.colorTextSecondary }}>
                Only PDF files are supported
            </Typography.Text>
        </Flex>


    const DeleteButton = () =>
        <Flex gap={8} justify="center">
            <Button type="primary" onClick={handleUpload}>Process PDF</Button>
            <Button icon={<DeleteOutlined />} onClick={handleRemoveFile}>
                Remove
            </Button>
        </Flex>;

    const ProcessingCompleteDialog = () =>
        <Flex align="center" gap={8}>
            <CheckCircleOutlined style={{ fontSize: 16, color: token.colorSuccess }} />
            <Typography.Text style={{ fontSize: '0.875rem', color: token.colorTextSecondary }}>
                Processing complete!
            </Typography.Text>
        </Flex>;


    const ProcessingInProgressDialog = () =>
        <Flex align="center" gap={8}>
            <Spin size="small" />
            <Typography.Text style={{ fontSize: '0.875rem', color: token.colorTextSecondary }}>
                Processing PDF...
            </Typography.Text>
        </Flex>;

    const ProcessingInformation = () =>
        <Flex vertical gap={16} align="center" style={{ width: '100%', minWidth: 300 }}>
            <Flex vertical gap={8} align="center" style={{ width: '100%' }}>
                {uploadProgress < 100 ? <ProcessingInProgressDialog /> : <ProcessingCompleteDialog />}
                <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
            </Flex>
        </Flex>;

    const ProcessingWindow = () =>
        <Flex vertical gap={16} align="center">
            <FilePdfOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
            <Flex vertical gap={8} align="center">
                <Typography.Text>{selectedFile?.name || ''}</Typography.Text>
                <Typography.Text style={{ fontSize: '0.875rem', color: token.colorTextSecondary }}>
                    {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB
                </Typography.Text>
                {!isProcessing ? <DeleteButton /> : <ProcessingInformation />}
            </Flex>
        </Flex>;

    return (
        <Flex vertical gap={32} style={styles.narrowContainer}>
            <Introduction />
            <Card style={styles.card}>
                <Flex
                    vertical
                    align="center"
                    justify="center"
                    style={styles.dropZone(isDragOver)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    aria-label="Upload PDF by drag-and-drop or choose a file"
                    title="Upload PDF by drag-and-drop or choose a file"
                >
                    {!selectedFile ? <UploadWindow /> : <ProcessingWindow />}
                </Flex>
            </Card>
            <FlowSteps />
        </Flex>
    );
}