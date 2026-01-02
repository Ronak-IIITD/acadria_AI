import { getAuthHeaders } from '../lib/authHelpers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Upload documents to the backend for RAG processing
 */
export const uploadDocumentsToBackend = async (files: File[]): Promise<{
  success: boolean;
  documents: Array<{ filename: string; document_id: string; status: string }>;
  error?: string;
}> => {
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

    const data = await response.json();
    console.log('✅ Upload successful:', data);

    return {
      success: true,
      documents: data.documents || []
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
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
