const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

import { getClerkToken } from '../lib/clerkToken';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getClerkToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  filename: string;
  document_id?: string;
  status: 'success' | 'error';
  chunks?: number;
  error?: string;
}

export interface BatchUploadResponse {
  documents: UploadResult[];
  total: number;
  successful: number;
  failed: number;
  batch_id: string;
}

/**
 * Upload documents to the backend for RAG processing
 * Supports batch uploads up to 100 files
 */
export const uploadDocumentsToBackend = async (
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<BatchUploadResponse | null> => {
  try {
    console.log(`📤 Uploading ${files.length} files to backend...`);

    // Create FormData
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    // Get auth headers (but don't include Content-Type for FormData)
    const authHeaders = await getAuthHeaders() as Record<string, string>;
    delete authHeaders['Content-Type']; // Let browser set multipart/form-data

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data: BatchUploadResponse = await response.json();
    console.log('✅ Upload successful:', data);

    // Report individual file progress
    if (onProgress) {
      data.documents.forEach((doc, idx) => {
        onProgress({
          filename: doc.filename,
          progress: 100,
          status: doc.status === 'success' ? 'completed' : 'error',
          error: doc.error
        });
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
};

/**
 * Upload a single file with progress tracking using XMLHttpRequest
 */
export const uploadSingleFile = (
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const doc = data.documents?.[0];
          resolve({
            filename: file.name,
            document_id: doc?.document_id,
            status: doc?.status === 'success' ? 'success' : 'error',
            chunks: doc?.chunks,
            error: doc?.error
          });
        } catch {
          resolve({
            filename: file.name,
            status: 'error',
            error: 'Failed to parse response'
          });
        }
      } else {
        resolve({
          filename: file.name,
          status: 'error',
          error: `Upload failed: ${xhr.status}`
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        filename: file.name,
        status: 'error',
        error: 'Network error'
      });
    });

    xhr.addEventListener('abort', () => {
      resolve({
        filename: file.name,
        status: 'error',
        error: 'Upload cancelled'
      });
    });

    getAuthHeaders().then((headers) => {
      delete headers['Content-Type'];
      
      xhr.open('POST', `${BACKEND_URL}/api/upload`);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, String(value));
      });

      const formData = new FormData();
      formData.append('files', file);
      
      xhr.send(formData);
    }).catch(reject);

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }
  });
};

/**
 * Delete a document from the backend
 */
export const deleteDocumentFromBackend = async (documentId: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Delete error:', error);
    return false;
  }
};

/**
 * List all documents from the backend
 */
export const listDocumentsFromBackend = async (): Promise<{
  documents: Array<{ id: string; filename: string; chunks: number }>;
}> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/documents`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ List documents error:', error);
    return { documents: [] };
  }
};

/**
 * Get upload progress for a batch
 */
export const getUploadProgress = async (batchId: string): Promise<UploadProgress | null> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/upload/progress/${batchId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Get progress error:', error);
    return null;
  }
};
