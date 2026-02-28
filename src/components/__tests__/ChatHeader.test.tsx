import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from '../ChatHeader';

const signOutMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@clerk/clerk-react', () => ({
  useClerk: () => ({
    signOut: signOutMock,
  }),
}));

describe('ChatHeader', () => {
  const defaultProps = {
    onMenuClick: vi.fn(),
    fileCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct branding (Acadira AI)', () => {
    render(<ChatHeader {...defaultProps} />);
    
    expect(screen.getByText(/Acadira/)).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('displays correct file count for single file', () => {
    render(<ChatHeader {...defaultProps} fileCount={1} />);
    
    expect(screen.getByText('1 source selected')).toBeInTheDocument();
  });

  it('displays correct file count for multiple files', () => {
    render(<ChatHeader {...defaultProps} fileCount={3} />);
    
    expect(screen.getByText('3 sources selected')).toBeInTheDocument();
  });

  it('displays zero files correctly', () => {
    render(<ChatHeader {...defaultProps} fileCount={0} />);
    
    expect(screen.getByText('0 sources selected')).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', () => {
    const mockClick = vi.fn();
    render(<ChatHeader {...defaultProps} onMenuClick={mockClick} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('renders progress button when onProgressClick is provided', () => {
    const mockProgressClick = vi.fn();
    render(
      <ChatHeader 
        {...defaultProps} 
        onProgressClick={mockProgressClick} 
      />
    );
    
    expect(screen.getByLabelText('View study progress')).toBeInTheDocument();
  });

  it('does not render progress button when onProgressClick is not provided', () => {
    render(<ChatHeader {...defaultProps} />);
    
    expect(screen.queryByLabelText('View study progress')).not.toBeInTheDocument();
  });

  it('calls onProgressClick when progress button is clicked', () => {
    const mockProgressClick = vi.fn();
    render(
      <ChatHeader 
        {...defaultProps} 
        onProgressClick={mockProgressClick} 
      />
    );
    
    const progressButton = screen.getByLabelText('View study progress');
    fireEvent.click(progressButton);
    
    expect(mockProgressClick).toHaveBeenCalledTimes(1);
  });

  it('renders return to home button with correct aria-label', () => {
    render(<ChatHeader {...defaultProps} />);
    
    expect(screen.getByLabelText('Return to home')).toBeInTheDocument();
  });

  it('shows confirmation dialog when logo is clicked', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(false);
    
    render(<ChatHeader {...defaultProps} />);
    
    const homeButton = screen.getByLabelText('Return to home');
    fireEvent.click(homeButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Return to home? You will be logged out.');
    
    // Restore
    window.confirm = originalConfirm;
  });

  it('logs out when confirmation is accepted', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    render(<ChatHeader {...defaultProps} />);

    const homeButton = screen.getByLabelText('Return to home');
    fireEvent.click(homeButton);

    expect(signOutMock).toHaveBeenCalledTimes(1);

    window.confirm = originalConfirm;
  });
});
