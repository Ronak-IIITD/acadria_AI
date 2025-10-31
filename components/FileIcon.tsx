import React from 'react';
import type { StudyFile } from '../types';
import DocumentIcon from './icons/DocumentIcon';
import PdfIcon from './icons/PdfIcon';
import TxtIcon from './icons/TxtIcon';
import DocxIcon from './icons/DocxIcon';
import MdIcon from './icons/MdIcon';
import RtfIcon from './icons/RtfIcon';
import PptxIcon from './icons/PptxIcon';

const FileIcon: React.FC<{ type: StudyFile['type']; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'PDF':
      return <PdfIcon className={className} />;
    case 'DOCX':
      return <DocxIcon className={className} />;
    case 'PPTX':
      return <PptxIcon className={className} />;
    case 'TXT':
      return <TxtIcon className={className} />;
    case 'MD':
      return <MdIcon className={className} />;
    case 'RTF':
      return <RtfIcon className={className} />;
    default:
      return <DocumentIcon className={className} />;
  }
};

export default FileIcon;