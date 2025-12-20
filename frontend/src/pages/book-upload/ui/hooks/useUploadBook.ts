import React, { useState } from 'react';

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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) {
            return;
        }

        setIsProcessing(true);
        setUploadProgress(0);
        onFileUpload(selectedFile);
        setUploadProgress(100);
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
