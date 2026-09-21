import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState<string>('loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(JSON.stringify(data)))
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Stop-list client</h1>
      <p>Backend health:</p>
      {error ? <p style={{ color: 'red' }}>Error: {error}</p> : <pre>{health}</pre>}
    </main>
  );
}

export default App;