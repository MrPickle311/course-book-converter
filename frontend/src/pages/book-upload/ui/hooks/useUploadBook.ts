import React, { useState } from 'react';
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import type { UploadFile, UploadProps } from "antd/lib";
import type { GetProp } from "antd";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export function useUploadBook(onFileUpload: (file: File) => void) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
            setSelectedFile(pdfFile);
        }
    };

    const handleFileInputChange = (file: RcFile) => {
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            return;
        }

        setIsProcessing(true);
        setUploadProgress(0);
        try {
            await onFileUpload(selectedFile);
            setUploadProgress(100);
        } catch (error) {
            console.error('Upload failed in hook', error);
            setIsProcessing(false);
            setUploadProgress(0);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        setIsProcessing(false);
    }

    return {
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
    };
}
