import logoImage from 'figma:asset/85939aa154d10e25cae9f1b99e4cae749b56020d.png';
import { useTheme } from './ThemeProvider';

export function Logo({ className = "w-8 h-8", showText = false }: { className?: string; showText?: boolean }) {
  const { theme } = useTheme();
  
  return (
    <img 
      src={logoImage} 
      alt="StudySync AI Logo" 
      className={`${className} ${theme === 'dark' ? 'brightness-110' : 'brightness-100'}`}
      style={{
        filter: theme === 'dark' ? 'brightness(1.1) saturate(1.2)' : 'brightness(1) saturate(1)',
        transform: 'scale(1.7) translateY(-8px)'
      }}
    />
  );
}
