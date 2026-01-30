import ErrorBoundary from './components/ErrorBoundary';
import AuthGate from './components/AuthGate';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthGate />
    </ErrorBoundary>
  );
}

export default App;
