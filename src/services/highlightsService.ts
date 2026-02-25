import { getAuthHeaders } from '../lib/authHelpers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface Highlight {
  id: string;
  document_id: string;
  content: string;
  color: string;
  page_number?: number;
  created_at: string;
}

export interface HighlightsByColor {
  [color: string]: Highlight[];
}

export interface HighlightsSummary {
  total: number;
  by_color: HighlightsByColor;
}

/**
 * Create a new highlight
 */
export const createHighlight = async (
  documentId: string,
  content: string,
  color: string = 'yellow',
  pageNumber?: number
): Promise<Highlight | null> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/highlights`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        content,
        color,
        page_number: pageNumber,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create highlight');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Create highlight error:', error);
    return null;
  }
};

/**
 * Get all highlights for the user
 */
export const getHighlights = async (documentId?: string): Promise<Highlight[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const url = new URL(`${BACKEND_URL}/api/highlights`);
    if (documentId) {
      url.searchParams.append('document_id', documentId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get highlights');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Get highlights error:', error);
    return [];
  }
};

/**
 * Get highlights grouped by color
 */
export const getHighlightsSummary = async (documentId: string): Promise<HighlightsSummary | null> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/highlights/summary?document_id=${documentId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get highlights summary');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Get highlights summary error:', error);
    return null;
  }
};

/**
 * Delete a highlight
 */
export const deleteHighlight = async (highlightId: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/highlights/${highlightId}`, {
      method: 'DELETE',
      headers,
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Delete highlight error:', error);
    return false;
  }
};

/**
 * Get all highlights for a user across all documents
 */
export const getAllHighlights = async (): Promise<Highlight[]> => {
  return getHighlights();
};

/**
 * Search highlights by content
 */
export const searchHighlights = async (query: string, documentId?: string): Promise<Highlight[]> => {
  const highlights = await getHighlights(documentId);
  const lowerQuery = query.toLowerCase();
  return highlights.filter(h => h.content.toLowerCase().includes(lowerQuery));
};
