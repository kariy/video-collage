import { WindowsProvider } from './context/WindowsContext';
import { Desktop } from './components/Desktop';

function App() {
  return (
    <WindowsProvider>
      <Desktop />
    </WindowsProvider>
  );
}

export default App;
