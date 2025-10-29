import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

function App() {
  const [playerId, setPlayerId] = useState("");
  const [zone, setZone] = useState(1);
  const [packageCode, setPackageCode] = useState("MLBB_86");
  const [currency, setCurrency] = useState("IDR");
  const [qty, setQty] = useState(1);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const packages = [
    { code: "MLBB_86", label: "86 Diamonds", priceIDR: 10000, priceMYR: 3.5 },
    { code: "MLBB_170", label: "170 Diamonds", priceIDR: 20000, priceMYR: 7 },
    { code: "MLBB_344", label: "344 Diamonds", priceIDR: 40000, priceMYR: 14 },
    { code: "MLBB_514", label: "514 Diamonds", priceIDR: 60000, priceMYR: 21 },
  ];

  function getSelectedPackage() {
    return packages.find((p) => p.code === packageCode);
  }

  const formattedPrice = () => {
    const pkg = getSelectedPackage();
    if (!pkg) return "-";
    return currency === "IDR" ? `Rp ${pkg.priceIDR * qty}` : `RM ${(pkg.priceMYR * qty).toFixed(2)}`;
  };

  async function handleCreateOrder(e) {
    e.preventDefault();
    setMessage("");
    if (!playerId) {
      setMessage("Masukkan Player ID terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, zone, packageCode, qty, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat order");
      setOrder(data);
      setMessage("Order dibuat. Klik pembayaran untuk lanjut ke FPX.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayNow() {
    if (!order) return setMessage("Buat order dulu.");
    if (order.payUrl) {
      window.open(order.payUrl, "_blank");
      setMessage("Pembayaran dibuka di tab baru. Setelah bayar, sistem akan mengirim top-up otomatis.");
      pollOrderStatus(order.orderId);
    } else {
      setMessage("Tidak ada URL pembayaran. Cek kembali backend.");
    }
  }

  async function pollOrderStatus(orderId, attempts = 0) {
    if (attempts > 20) return setMessage("Menunggu konfirmasi pembayaran... masih pending.");
    try {
      const res = await fetch(`/api/order-status?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (data.status === "paid") {
        setMessage("Pembayaran diterima — melakukan top-up otomatis sekarang...");
        await triggerTopup(orderId);
      } else if (data.status === "delivered") {
        setMessage("Top-up berhasil! Cek game kamu.");
      } else if (data.status === "failed") {
        setMessage("Transaksi gagal: " + (data.detail || "unknown"));
      } else {
        setTimeout(() => pollOrderStatus(orderId, attempts + 1), 3000);
      }
    } catch (err) {
      setMessage("Gagal cek status order: " + err.message);
    }
  }

  async function triggerTopup(orderId) {
    try {
      const res = await fetch(`/api/trigger-topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Top-up gagal");
      if (data.status === "delivered") {
        setMessage("Top-up berhasil — order selesai.");
      } else {
        setMessage("Top-up diproses: " + (data.status || "processing"));
      }
    } catch (err) {
      setMessage("Error topup: " + err.message);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0b0b0f,#000)", color: "#e6e6e6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 980, width: "100%", background: "#07070a", border: "1px solid #222", borderRadius: 16, padding: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>MOBAYUREN</h1>
            <p style={{ color: "#9aa0a6" }}>Top-up MLBB otomatis • FPX ready • VIP-Reseller integration</p>
          </div>
          <div style={{ textAlign: "right", color: "#9aa0a6" }}>
            <div style={{ fontSize: 12 }}>Dark Mode</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Auto Top-up</div>
          </div>
        </header>

        <main style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <section style={{ flex: 1, minWidth: 320, background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))", padding: 16, borderRadius: 12 }}>
            <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label>
                <div style={{ fontSize: 12, color: "#9aa0a6" }}>Player ID</div>
                <input value={playerId} onChange={(e) => setPlayerId(e.target.value)} placeholder="Contoh: 123456789" style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid #222", padding: 10, borderRadius: 8, color: "#fff" }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: "#9aa0a6" }}>Zone / Server</div>
                <input type="number" value={zone} min={1} onChange={(e) => setZone(Number(e.target.value))} style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid #222", padding: 10, borderRadius: 8, color: "#fff" }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: "#9aa0a6" }}>Paket Diamond</div>
                <select value={packageCode} onChange={(e) => setPackageCode(e.target.value)} style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid #222", padding: 10, borderRadius: 8, color: "#fff" }}>
                  {packages.map((p) => (
                    <option key={p.code} value={p.code}>{p.label} — {currency === "IDR" ? `Rp ${p.priceIDR}` : `RM ${p.priceMYR}`}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#9aa0a6" }}>Qty</div>
                  <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid #222", padding: 10, borderRadius: 8, color: "#fff" }} />
                </label>

                <label style={{ width: 120 }}>
                  <div style={{ fontSize: 12, color: "#9aa0a6" }}>Currency</div>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid #222", padding: 10, borderRadius: 8, color: "#fff" }}>
                    <option value="IDR">IDR</option>
                    <option value="MYR">MYR</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#9aa0a6" }}>Total</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{formattedPrice()}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={loading} style={{ padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", fontWeight: 700 }}>
                    {loading ? "Memproses..." : "Buat Order"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <aside style={{ width: 320, background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))", padding: 16, borderRadius: 12 }}>
            <h3 style={{ marginBottom: 8 }}>Ringkasan Order</h3>
            <div style={{ color: "#cbd5e1", marginBottom: 12 }}>
              <div>Player ID: <strong>{playerId || "-"}</strong></div>
              <div>Zone: <strong>{zone}</strong></div>
              <div>Paket: <strong>{getSelectedPackage()?.label || "-"}</strong></div>
              <div>Qty: <strong>{qty}</strong></div>
              <div>Currency: <strong>{currency}</strong></div>
              <div>Total: <strong>{formattedPrice()}</strong></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={handlePayNow} disabled={!order} style={{ padding: 10, borderRadius: 10, border: order ? "1px solid #10b981" : "1px solid #444", background: "transparent", color: "#fff" }}>
                Bayar via FPX
              </button>

              <div style={{ fontSize: 12, color: "#9aa0a6" }}>Atau hubungi admin via WhatsApp jika ada masalah.</div>

              <div style={{ marginTop: 12, fontSize: 12, color: "#9aa0a6" }}>
                <strong>Catatan teknis (backend):</strong>
                <ul>
                  <li>Buat endpoint <code>/api/create-order</code> untuk membuat order & session FPX.</li>
                  <li>Webhook FPX untuk update status pembayaran.</li>
                  <li>Setelah paid, panggil API VIP-Reseller (Digiflazz/VIP) untuk top-up otomatis.</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: "#f59e0b" }}>{message}</div>
          </aside>
        </main>

        <footer style={{ marginTop: 16, fontSize: 12, color: "#9aa0a6" }}>
          © MOBAYUREN • Contoh UI & flow otomatis • Implementasikan backend untuk produksi
        </footer>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);