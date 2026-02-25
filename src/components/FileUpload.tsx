import React, { useCallback, useState, useEffect, useRef } from 'react';
import type { StudyFile } from '../types';
import UploadIcon from './icons/UploadIcon';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { uploadDocumentsToBackend, type UploadProgress } from '../services/uploadService';
import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

// Add Mammoth.js type declaration for global script
declare const mammoth: any;

// Configure the PDF.js worker to use the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface FileUploadProps {
  onFilesAdded: (files: StudyFile[]) => void;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number; // 0-100, or -1 for error
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  chunks?: number;
}

const SUPPORTED_EXTENSIONS = ['pdf', 'txt', 'docx', 'md', 'rtf', 'pptx'];

const getFileType = (fileName: string): StudyFile['type'] => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'PDF';
    if (extension === 'docx') return 'DOCX';
    if (extension === 'pptx') return 'PPTX';
    if (extension === 'md') return 'MD';
    if (extension === 'rtf') return 'RTF';
    return 'TXT';
};

const isFileTypeSupported = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    return SUPPORTED_EXTENSIONS.includes(extension);
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const parsePdfContent = async (base64: string): Promise<string> => {
  try {
    console.log('[PDF Parser] Starting PDF parsing, base64 length:', base64.length);
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('[PDF Parser] Binary conversion complete, bytes length:', bytes.length);
    
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    console.log('[PDF Parser] Loading task created, waiting for PDF...');
    const pdf = await loadingTask.promise;
    console.log('[PDF Parser] PDF loaded successfully, number of pages:', pdf.numPages);
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .filter((item: any): item is { str: string } => 'str' in item)
            .map((item: { str: string }) => item.str)
            .join(' ');
        fullText += pageText + '\n\n';
        console.log(`[PDF Parser] Page ${i}/${pdf.numPages} processed, text length:`, pageText.length);
    }
    if (!fullText.trim()) {
        throw new Error('PDF contains no text content.');
    }
    console.log('[PDF Parser] PDF parsing complete, total text length:', fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error('[PDF Parser] ERROR - Failed to parse PDF content:', error);
    if (error instanceof Error) {
      console.error('[PDF Parser] ERROR details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error('PDF parsing failed due to an unknown error.');
  }
};

const parseDocxContent = async (base64: string): Promise<string> => {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
        if (!result.value.trim()) {
            throw new Error('DOCX contains no text content.');
        }
        return result.value;
    } catch (error) {
        console.error('Failed to parse DOCX content:', error);
        throw new Error(error instanceof Error && error.message.includes('no text') ? error.message : 'Corrupted or invalid DOCX file.');
    }
};


const FileUpload: React.FC<FileUploadProps> = ({ onFilesAdded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<{ name: string }[]>([]);

  // Refs to manage timeouts for cleanup logic
  const cleanupTimeoutRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  // Auto-clear rejection message after a few seconds
  useEffect(() => {
    if (rejectedFiles.length > 0) {
      const timer = setTimeout(() => setRejectedFiles([]), 7000);
      return () => clearTimeout(timer);
    }
  }, [rejectedFiles]);

  // Gracefully clear the upload UI after processing is complete, with bug fixes for timeout handling.
  useEffect(() => {
    const cleanupTimers = () => {
        if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };

    if (isUploading && uploadingFiles.length > 0) {
        const allDone = uploadingFiles.every(f => f.progress === 100 || f.progress === -1);
        
        if (allDone) {
            const successfulFiles = uploadingFiles.filter(f => f.progress === 100);
            const filesWithErrors = uploadingFiles.filter(f => f.progress === -1);

            cleanupTimeoutRef.current = window.setTimeout(() => {
                if (filesWithErrors.length > 0) {
                    setUploadingFiles(filesWithErrors);
                    
                    errorTimeoutRef.current = window.setTimeout(() => {
                        setUploadingFiles([]);
                        setIsUploading(false);
                    }, 7000);
                } else {
                    setUploadingFiles([]);
                    setIsUploading(false);
                }
            }, successfulFiles.length > 0 ? 1000 : 0);
        }
    }
    
    return cleanupTimers;
  }, [uploadingFiles, isUploading]);


  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    // When a new upload starts, clear any previous error messages to avoid UI clutter.
    setRejectedFiles([]);

    const allFiles = Array.from(fileList);
    const validFiles: File[] = [];
    const invalidFiles: { name: string }[] = [];

    for (const file of allFiles) {
        if (isFileTypeSupported(file.name)) {
            validFiles.push(file);
        } else {
            invalidFiles.push({ name: file.name });
        }
    }

    if (invalidFiles.length > 0) {
        setRejectedFiles(invalidFiles);
    }

    if (validFiles.length === 0) {
        // If the new selection has no valid files, ensure any old processing errors
        // that might be visible are also cleared.
        setUploadingFiles([]);
        return; // No valid files to process
    }

    setIsUploading(true);

    const initialUploadState: UploadingFile[] = validFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      status: 'pending',
    }));
    setUploadingFiles(initialUploadState);

    const processedFiles: StudyFile[] = [];

    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const tempId = initialUploadState[i].id;
        
        try {
            console.log(`[File Upload] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
            setUploadingFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: 20 } : f));
            const base64Content = await fileToBase64(file);
            console.log(`[File Upload] Base64 conversion complete for ${file.name}, length: ${base64Content.length}`);
            setUploadingFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: 50 } : f));
            
            const fileType = getFileType(file.name);
            console.log(`[File Upload] File type detected: ${fileType}`);
            let textContent = '';
            
            // Validation step: Try to parse content to catch corrupted/empty files early.
            if (fileType === 'PDF') {
                console.log(`[File Upload] Starting PDF parsing for ${file.name}`);
                textContent = await parsePdfContent(base64Content);
                console.log(`[File Upload] PDF parsing successful, content length: ${textContent.length}`);
            } else if (fileType === 'DOCX') {
                textContent = await parseDocxContent(base64Content);
            } else { // For text-based formats like TXT, MD, RTF
                try {
                    const binaryString = atob(base64Content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    textContent = new TextDecoder('utf-8').decode(bytes);
                    
                    if (!textContent.trim()) {
                        throw new Error('File contains no text content.');
                    }
                } catch (error) {
                    console.error('Text file decode error:', error);
                    throw new Error('Could not read text file. File may be corrupted or use unsupported encoding.');
                }
            }
            
            setUploadingFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: 80 } : f));

            processedFiles.push({
                id: `${file.name}-${Date.now()}`,
                name: file.name,
                type: getFileType(file.name),
                size: file.size,
                content: base64Content,
            });
            
            setUploadingFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: 100 } : f));
        } catch (error) {
            console.error(`[File Upload] ERROR processing ${file.name}:`, error);
            if (error instanceof Error) {
              console.error(`[File Upload] ERROR details:`, {
                message: error.message,
                name: error.name,
                stack: error.stack
              });
            }
            const message = error instanceof Error ? error.message : 'File could not be read.';
            setUploadingFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: -1, errorMessage: message } : f));
        }
    }

    if(processedFiles.length > 0) {
      // First, add files to local state for immediate UI update
      onFilesAdded(processedFiles);

      // Then, upload to backend for RAG processing
      console.log('📤 Uploading files to backend for RAG processing...');
      const filesToUpload = [...validFiles];

      uploadDocumentsToBackend(filesToUpload).then(result => {
        if (result && result.successful > 0) {
          console.log('✅ Files uploaded to backend successfully:', result.documents);
          
          // Update file statuses
          const updatedFiles = uploadingFiles.map(f => {
            const uploadResult = result.documents.find(d => d.filename === f.name);
            if (uploadResult?.status === 'success') {
              return { ...f, progress: 100, status: 'completed' as const, chunks: uploadResult.chunks };
            } else if (uploadResult?.status === 'error') {
              return { ...f, progress: -1, status: 'error' as const, errorMessage: uploadResult.error };
            }
            return f;
          });
          setUploadingFiles(updatedFiles);
        } else if (result && result.failed > 0) {
          console.error('❌ Some files failed to upload:', result.documents);
        }
      }).catch(error => {
        console.error('❌ Backend upload error:', error);
      });
    }
  }, [onFilesAdded]);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  }, [processFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (isUploading) return;
    processFiles(event.dataTransfer.files);
  }, [processFiles, isUploading]);

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out group ${
          isUploading
            ? 'p-4 border-gray-400/70 dark:border-gray-500/50'
            : isDragOver 
              ? 'p-6 border-solid border-blue-500 dark:border-blue-400 bg-blue-500/20 scale-105 shadow-xl' 
              : 'p-6 border-gray-400/70 dark:border-gray-500/50 hover:border-gray-500 dark:hover:border-gray-400'
        }`}
      >
        {isUploading || uploadingFiles.length > 0 ? (
          <div className="w-full">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 text-left">
                  {isUploading ? "Processing files..." : "Upload Complete"}
              </h3>
              <ul className="space-y-3">
                  {uploadingFiles.map(file => (
                      <li key={file.id} className="animate-fade-in">
                          <div className="flex items-center gap-3">
                              {/* Status Icon */}
                              <div className="flex-shrink-0">
                                  {file.status === 'completed' && (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                  )}
                                  {file.status === 'error' && (
                                      <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  {(file.status === 'pending' || file.status === 'processing') && (
                                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                  )}
                              </div>
                              
                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate pr-2" title={file.name}>
                                          {file.name}
                                      </span>
                                      <span className={`text-xs font-semibold flex-shrink-0 ${
                                          file.status === 'error' ? 'text-red-500' : 
                                          file.status === 'completed' ? 'text-green-500' : 'text-gray-500'
                                      }`}>
                                          {file.status === 'error' ? 'Failed' : 
                                           file.status === 'completed' ? `${file.chunks || 0} chunks` : 
                                           `${file.progress}%`}
                                      </span>
                                  </div>
                                  <div className="w-full bg-gray-300/70 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                      <div
                                          className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                                              file.status === 'error' ? 'bg-red-500' : 
                                              file.status === 'completed' ? 'bg-green-500' : 'bg-blue-600'
                                          }`}
                                          style={{ width: `${file.status === 'error' ? 100 : Math.max(0, file.progress)}%` }}
                                      ></div>
                                  </div>
                                  {file.status === 'error' && file.errorMessage && (
                                      <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 text-left">{file.errorMessage}</p>
                                  )}
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
              
              {/* Summary */}
              {uploadingFiles.every(f => f.status !== 'pending' && f.status !== 'processing') && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                              {uploadingFiles.filter(f => f.status === 'completed').length} of {uploadingFiles.length} files uploaded
                          </span>
                          {uploadingFiles.some(f => f.status === 'error') && (
                              <span className="text-red-500 font-medium">
                                  {uploadingFiles.filter(f => f.status === 'error').length} failed
                              </span>
                          )}
                      </div>
                  </div>
              )}
          </div>
        ) : (
          <>
              <UploadIcon className={`mx-auto h-10 w-10 transition-colors ${isDragOver ? 'text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
              <label
                  htmlFor="file-upload"
                  className="mt-2 block text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer"
              >
                  <span>{isDragOver ? 'Release to upload files!' : 'Click to upload or drag & drop'}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} disabled={isUploading} accept=".pdf,.txt,.docx,.md,.rtf,.pptx" />
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">PDF, TXT, DOCX, MD, RTF, PPTX supported (up to 100 files)</p>
          </>
        )}
      </div>

      {rejectedFiles.length > 0 && (
        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 border border-red-400/50 dark:border-red-600/50 rounded-lg text-red-800 dark:text-red-200 animate-fade-in transition-opacity duration-300">
            <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <div>
                    <p className="text-sm font-semibold mb-1">Unsupported file type(s):</p>
                    <ul className="text-xs list-disc pl-5 space-y-0.5">
                        {rejectedFiles.map(file => <li key={file.name} className="truncate" title={file.name}>{file.name}</li>)}
                    </ul>
                    <p className="text-xs mt-2 font-medium">Please upload PDF, TXT, DOCX, MD, RTF, or PPTX files only.</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;