import { Upload, FileText, X } from 'lucide-react';
import { useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Logo } from './Logo';
import { toast } from 'sonner@2.0.3';

interface SidebarProps {
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
}

export function Sidebar({ uploadedFiles, setUploadedFiles }: SidebarProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'application/rtf', 'text/rtf'].includes(file.type)
    );
    
    if (validFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded`);
    } else {
      toast.error('Please upload valid document files');
    }
  }, [uploadedFiles, setUploadedFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...files]);
      toast.success(`${files.length} file(s) uploaded`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    toast.info('File removed');
  };

  return (
    <aside className="w-80 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="mb-4">
          <Logo className="h-10 w-auto" />
        </div>
        <h3 className="text-foreground mb-1">Study Materials</h3>
        <p className="text-muted-foreground text-sm">Upload your documents</p>
      </div>

      {/* Upload Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <label htmlFor="file-upload">
          <div 
            className="border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer rounded-lg"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 rounded-full bg-muted">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground mb-1">Click to upload</p>
                <p className="text-muted-foreground text-sm">
                  PDF, TXT, DOCX, MD, RTF
                </p>
              </div>
            </div>
          </div>
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.txt,.docx,.md,.rtf,.pptx"
          onChange={handleFileInput}
        />

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-muted-foreground text-sm mb-3">{uploadedFiles.length} document(s)</p>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="bg-muted/40 border border-border p-3 rounded-lg group hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-primary/10">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{file.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center">
            <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No documents yet</p>
          </div>
        )}
      </div>

      {/* AI Model Selector */}
      <div className="p-6 border-t border-border">
        <label className="text-muted-foreground text-sm mb-2 block">AI Model</label>
        <Select defaultValue="gemini">
          <SelectTrigger className="bg-input-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
            <SelectItem value="gpt4">GPT-4 Turbo</SelectItem>
            <SelectItem value="claude">Claude 3 Opus</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
