import { useMemo } from "react";
import { useZebraPrinters } from "react-zebra-print";

function App() {
  const { printers, loading, error, refresh } = useZebraPrinters();

  const statusMessage = useMemo(() => {
    if (loading) {
      return "Finding Zebra Printers...";
    }

    if (error) {
      return `Error: ${error.message}`;
    }

    if (printers.length === 0) {
      return "No Zebra printers found.";
    }

    return `${printers.length} printer(s) available.`;
  }, [error, loading, printers.length]);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: 640,
      }}
    >
      <h1>React Zebra Print Demo</h1>

      <section style={{ marginBottom: "1rem" }}>
        <p>{statusMessage}</p>
        <button onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      <ul>
        {printers.map((printer) => (
          <li key={printer.id}>
            <strong>{printer.name}</strong>
            {printer.isDefault ? " (default)" : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
