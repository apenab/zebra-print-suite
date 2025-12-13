import { useMemo, useState } from "react";
import { useZebraPrinters, useZebraPrinterIO } from "react-zebra-print";

function App() {
  const { printers, loading, error, refresh } = useZebraPrinters();
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(
    null
  );
  const [dataToSend, setDataToSend] = useState("^XA^FO50,50^ADN,36,20^FDZebra demo^FS^XZ");

  const selectedPrinter = useMemo(
    () => printers.find((printer) => printer.id === selectedPrinterId) ?? null,
    [printers, selectedPrinterId]
  );

  const {
    sendToPrinter,
    readFromPrinter,
    sending,
    reading,
    error: ioError,
    lastResponse,
  } = useZebraPrinterIO({
    device: selectedPrinter
      ? { uid: selectedPrinter.id, name: selectedPrinter.name }
      : null,
  });

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

  const combinedError = error ?? ioError;

  const handleSend = async () => {
    if (!selectedPrinter) return;
    try {
      await sendToPrinter(dataToSend);
    } catch {
      // Error is already captured by the hook.
    }
  };

  const handleRead = async () => {
    if (!selectedPrinter) return;
    try {
      await readFromPrinter();
    } catch {
      // Error is already captured by the hook.
    }
  };

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
        {combinedError ? (
          <p style={{ color: "crimson" }}>Error: {combinedError.message}</p>
        ) : null}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Select printer</h2>
        {printers.length === 0 ? (
          <p>No printers available.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {printers.map((printer) => (
              <label key={printer.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="radio"
                  name="selectedPrinter"
                  value={printer.id}
                  checked={selectedPrinterId === printer.id}
                  onChange={() => setSelectedPrinterId(printer.id)}
                />
                <span>
                  <strong>{printer.name}</strong>
                  {printer.isDefault ? " (default)" : null}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: "grid", gap: "0.75rem", maxWidth: 720 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span>Data to send (ZPL or raw):</span>
          <textarea
            value={dataToSend}
            onChange={(e) => setDataToSend(e.target.value)}
            rows={4}
            style={{ padding: "0.5rem", fontFamily: "monospace", resize: "vertical" }}
            disabled={!selectedPrinter || sending}
          />
        </label>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={handleSend} disabled={!selectedPrinter || sending}>
            {sending ? "Sending…" : "Send to printer"}
          </button>
          <button onClick={handleRead} disabled={!selectedPrinter || reading}>
            {reading ? "Reading…" : "Read from printer"}
          </button>
        </div>

        <div style={{ padding: "0.75rem", border: "1px solid #ddd", borderRadius: 8 }}>
          <strong>Last response:</strong>
          <pre style={{ whiteSpace: "pre-wrap", margin: "0.5rem 0 0", fontFamily: "monospace" }}>
            {lastResponse ?? "No response yet."}
          </pre>
        </div>
      </section>
    </main>
  );
}

export default App;
