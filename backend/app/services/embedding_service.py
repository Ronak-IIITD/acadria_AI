"""
Embedding Service - Generates embeddings using Gemini API and calculates cosine similarity.
Uses Google's embedding API (no local models) for semantic search.
"""

import os
from typing import List, Optional
import numpy as np
import google.generativeai as genai


class EmbeddingService:
    """
    Service for generating embeddings and calculating similarity.
    Uses Gemini's embedding-001 model via API (no local model downloads).
    """

    def __init__(self):
        """Initialize Gemini API for embeddings"""
        api_key = os.getenv("GEMINI_API_KEY")
        self.api_available = False

        if api_key:
            genai.configure(api_key=api_key)
            self.api_available = True
            print("✅ Embedding service initialized with Gemini API")
        else:
            print("⚠️  WARNING: GEMINI_API_KEY not set. Falling back to keyword search.")

    def is_available(self) -> bool:
        """Return True if remote embeddings can be generated"""
        return self.api_available

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text using Gemini API.

        Args:
            text: Text to embed (max ~10,000 characters recommended)

        Returns:
            List of 768 floats representing the embedding vector

        Raises:
            Exception: If API call fails
        """
        if not self.api_available:
            return None

        try:
            # Call Gemini embedding API
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",  # Optimized for document retrieval
            )

            embedding = result["embedding"]
            print(f"✅ Generated embedding (dimension: {len(embedding)})")
            return embedding

        except Exception as e:
            print(f"❌ Error generating embedding: {str(e)}")
            return None

    def generate_query_embedding(self, query: str) -> Optional[List[float]]:
        """
        Generate embedding for a search query using Gemini API.
        Uses query-specific task type for better retrieval.

        Args:
            query: User's search query

        Returns:
            List of 768 floats representing the query embedding
        """
        if not self.api_available:
            return None

        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query",  # Optimized for queries
            )

            return result["embedding"]

        except Exception as e:
            print(f"❌ Error generating query embedding: {str(e)}")
            return None

    def batch_generate_embeddings(
        self, texts: List[str]
    ) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts (with rate limiting consideration).

        Args:
            texts: List of texts to embed

        Returns:
            List of embeddings (one per text)
        """
        embeddings: List[Optional[List[float]]] = []

        if not self.api_available:
            # Preserve alignment with texts so upstream logic can fall back
            return [None for _ in texts]

        for i, text in enumerate(texts):
            try:
                embedding = self.generate_embedding(text)
                embeddings.append(embedding)

                if (i + 1) % 10 == 0:
                    print(f"📊 Progress: {i + 1}/{len(texts)} embeddings generated")

            except Exception as e:
                print(f"⚠️  Failed to embed text {i}: {str(e)}")
                embeddings.append(None)

        print(f"✅ Generated {len(embeddings)} embeddings total")
        return embeddings

    @staticmethod
    def cosine_similarity(
        vec1: Optional[List[float]], vec2: Optional[List[float]]
    ) -> float:
        """
        Calculate cosine similarity between two vectors.

        Formula: similarity = (A · B) / (||A|| × ||B||)
        Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)

        Args:
            vec1: First embedding vector
            vec2: Second embedding vector

        Returns:
            Similarity score (0.0 to 1.0 typically)
        """
        if vec1 is None or vec2 is None:
            return 0.0

        try:
            # Convert to numpy arrays for efficient computation
            a = np.array(vec1, dtype=np.float32)
            b = np.array(vec2, dtype=np.float32)

            # Calculate dot product and magnitudes
            dot_product = np.dot(a, b)
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)

            # Avoid division by zero
            if norm_a == 0 or norm_b == 0:
                return 0.0

            # Calculate cosine similarity
            similarity = dot_product / (norm_a * norm_b)

            # Clamp to [0, 1] range (in case of floating point errors)
            return float(max(0.0, min(1.0, similarity)))

        except Exception as e:
            print(f"❌ Error calculating cosine similarity: {str(e)}")
            return 0.0

    @staticmethod
    def find_top_k_similar(
        query_embedding: List[float], document_embeddings: List[List[float]], k: int = 3
    ) -> List[tuple[int, float]]:
        """
        Find top-k most similar document embeddings to query.

        Args:
            query_embedding: Query vector
            document_embeddings: List of document vectors
            k: Number of top results to return

        Returns:
            List of (index, similarity_score) tuples, sorted by score descending
        """
        similarities = []

        for idx, doc_embedding in enumerate(document_embeddings):
            similarity = EmbeddingService.cosine_similarity(
                query_embedding, doc_embedding
            )
            similarities.append((idx, similarity))

        # Sort by similarity (descending) and take top k
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_k = similarities[:k]

        print(f"🔍 Top {k} similarities: {[f'{score:.3f}' for _, score in top_k]}")
        return top_k


# Global instance for reuse
_embedding_service_instance = None


def get_embedding_service() -> EmbeddingService:
    """Get singleton instance of EmbeddingService"""
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService()
    return _embedding_service_instance
