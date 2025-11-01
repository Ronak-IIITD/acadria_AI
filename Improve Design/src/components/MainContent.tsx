import { Upload, MessageSquare, Sparkles, Send, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar } from './ui/avatar';
import { useTheme } from './ThemeProvider';
import { Logo } from './Logo';
import { toast } from 'sonner@2.0.3';

interface MainContentProps {
  hasFiles: boolean;
  setUploadedFiles: (files: File[]) => void;
}

export function MainContent({ hasFiles }: MainContentProps) {
  const [message, setMessage] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleSend = () => {
    if (message.trim()) {
      toast.success('Question sent! AI is processing...');
      setMessage('');
    }
  };

  const features = [
    {
      icon: Upload,
      title: 'Upload',
      description: 'Add your study materials',
    },
    {
      icon: MessageSquare,
      title: 'Ask',
      description: 'Type your questions',
    },
    {
      icon: Sparkles,
      title: 'Learn',
      description: 'Get AI-powered insights',
    }
  ];

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Sun className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Avatar className="h-9 w-9 border border-border">
              <div className="bg-primary w-full h-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm">R</span>
              </div>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-16 mt-8">
            <div className="inline-flex p-4 rounded-full bg-accent mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-foreground mb-3">Welcome to StudySync AI</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload your study materials and ask questions. Get intelligent answers based on your documents.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="border border-border bg-card hover:bg-accent/50 transition-all"
              >
                <div className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-full bg-accent mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          {hasFiles && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="bg-card border border-border p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Documents</p>
                <p className="text-foreground">3</p>
              </Card>
              <Card className="bg-card border border-border p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Questions</p>
                <p className="text-foreground">0</p>
              </Card>
              <Card className="bg-card border border-border p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Time</p>
                <p className="text-foreground">2m</p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-center">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={hasFiles ? "Ask a question about your documents..." : "Upload a document to start..."}
              disabled={!hasFiles}
              className="bg-input-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleSend}
              disabled={!hasFiles || !message.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs text-center mt-3">
            AI responses are based on your uploaded documents
          </p>
        </div>
      </div>
    </main>
  );
}
