import ErrorBoundary from './components/ErrorBoundary';
import AuthGate from './components/AuthGate';

function App() {
  return (
    <ErrorBoundary>
      <AuthGate />
    </ErrorBoundary>
  );
}

export default App;
