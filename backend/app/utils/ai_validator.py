"""
AI Response Validation and Sanitization
Validates structured JSON from AI and normalizes LaTeX expressions
"""

import json
import re
from typing import List, Dict, Any


def normalize_latex(latex: str) -> str:
    """
    Sanitize and normalize LaTeX expressions.
    Removes malformed tags, fixes common syntax issues, and ensures clean output.
    """
    if not latex:
        return latex
    
    s = latex
    
    # CRITICAL: Remove malformed HTML-like tags that AI hallucinates
    # Remove <mb>, <mb1>, </mb>, <m>, </m>, etc.
    s = re.sub(r'<\/?mb\d*>', '', s, flags=re.IGNORECASE)
    s = re.sub(r'<\/?m\d*>', '', s, flags=re.IGNORECASE)
    
    # Remove stray dollar-tag combinations
    s = re.sub(r'<\$+', '', s)
    s = re.sub(r'\$+>', '', s)
    
    # Fix common garbage like "C$$2/mb>" → "+ C"
    s = re.sub(r'C\$\$\d+/mb>', '+ C', s, flags=re.IGNORECASE)
    
    # Unescape double backslashes → single backslash
    s = s.replace('\\\\', '\\')
    
    # Convert \(...\) and \[...\] to dollar delimiters
    s = s.replace('\\(', '$').replace('\\)', '$')
    s = s.replace('\\[', '$$').replace('\\]', '$$')
    
    # Remove stray <> angle brackets (should not be in LaTeX)
    if re.search(r'[<>]', s):
        # Only remove if they're not part of comparison operators in context
        # Be cautious - this is a simple heuristic
        pass
    
    # Collapse multiple consecutive $$ into one
    s = re.sub(r'\$\$\s*\$\$', '$$', s)
    
    # Trim whitespace
    s = s.strip()
    
    return s


def validate_ai_blocks(raw_text: str) -> List[Dict[str, str]]:
    """
    Validate and sanitize AI response in structured JSON format.
    
    Args:
        raw_text: Raw JSON string from AI model
        
    Returns:
        List of validated blocks with 'type' and 'value' keys
        
    Raises:
        ValueError: If JSON is invalid or structure is wrong
    """
    # Try to parse JSON
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {e}")
    
    # Validate structure
    if not isinstance(parsed, list):
        raise ValueError("Expected array of blocks")
    
    validated_blocks = []
    
    for i, block in enumerate(parsed):
        if not isinstance(block, dict):
            raise ValueError(f"Block {i} is not an object")
        
        if 'type' not in block or 'value' not in block:
            raise ValueError(f"Block {i} missing 'type' or 'value' field")
        
        block_type = block['type']
        block_value = block['value']
        
        if block_type not in ['text', 'math', 'code']:
            raise ValueError(f"Block {i} has invalid type: {block_type}")

        # Sanitize based on type
        if block_type == 'math':
            # Normalize LaTeX
            normalized = normalize_latex(str(block_value))

            # Validation: ensure no angle brackets remain in math
            if re.search(r'[<>]', normalized):
                raise ValueError(f"Block {i}: Illegal characters in LaTeX")

            validated_blocks.append({
                'type': 'math',
                'value': normalized
            })
        elif block_type == 'code':
            # Code block - preserve as is, include language if present
            code_block = {
                'type': 'code',
                'value': str(block_value)
            }
            if 'language' in block:
                code_block['language'] = str(block['language'])
            validated_blocks.append(code_block)
        else:
            # Text block - just ensure it's a string
            validated_blocks.append({
                'type': 'text',
                'value': str(block_value)
            })
    
    return validated_blocks


def auto_fix_latex(latex: str) -> str:
    """
    Apply automatic corrections to common LaTeX mistakes.
    Use cautiously - only for safe, simple transforms.
    """
    s = latex
    
    # Replace √ with \sqrt{...} if pattern allows (simple cases only)
    # This is complex, so we'll skip for now to avoid breaking things
    
    # Balance \left and \right pairs
    left_count = len(re.findall(r'\\left', s))
    right_count = len(re.findall(r'\\right', s))
    
    if left_count > right_count:
        # Add missing \right)
        s = s + ' \\right)'
    elif right_count > left_count:
        # Add missing \left(
        s = '\\left( ' + s
    
    # Common fixes
    s = s.replace('\\left\\frac', '\\left(\\frac')
    s = re.sub(r'\\right([+\-])', r'\\right)\1', s)
    
    # Remove duplicate "+ C + C"
    s = s.replace('+ C + C', '+ C')
    
    return s


def extract_suggestions_and_sources(text: str) -> tuple:
    """
    Extract suggestions and sources from AI text (for backward compatibility).
    
    Returns:
        (suggestions_list, sources_list, cleaned_text)
    """
    suggestions = []
    sources = []
    
    # Extract suggestions block
    suggestion_match = re.search(r'<SUGGESTIONS>(.*?)</SUGGESTIONS>', text, re.DOTALL)
    if suggestion_match:
        text = text.replace(suggestion_match.group(0), '').strip()
        suggestion_text = suggestion_match.group(1).strip()
        suggestions = [s.strip() for s in suggestion_text.split('\n') if s.strip()]
    
    # Extract sources block
    source_match = re.search(r'<SOURCES>(.*?)</SOURCES>', text, re.DOTALL)
    if source_match:
        text = text.replace(source_match.group(0), '').strip()
        source_text = source_match.group(1).strip()
        sources = [s.strip() for s in source_text.split('\n') if s.strip()]
    
    return suggestions, sources, text


def convert_text_to_blocks(text: str) -> List[Dict[str, str]]:
    """
    Fallback: Convert plain text response to block format.
    Attempts to detect and separate math from text.
    
    This is less reliable than structured JSON but provides backward compatibility.
    """
    blocks = []
    
    # Simple heuristic: split by display math delimiters
    parts = re.split(r'(\$\$.*?\$\$)', text, flags=re.DOTALL)
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Check if it's a math block
        if part.startswith('$$') and part.endswith('$$'):
            # Extract LaTeX content (remove delimiters)
            latex = part[2:-2].strip()
            normalized = normalize_latex(latex)
            blocks.append({'type': 'math', 'value': normalized})
        else:
            # Text block
            # Check for inline math and extract separately
            # This is complex, so for now just treat as text
            blocks.append({'type': 'text', 'value': part})
    
    return blocks
