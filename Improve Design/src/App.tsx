import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  return (
    <ThemeProvider>
      <div className="size-full flex bg-background">
        <Sidebar 
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />
        <MainContent 
          hasFiles={uploadedFiles.length > 0}
          setUploadedFiles={setUploadedFiles}
        />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
