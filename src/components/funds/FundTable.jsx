const holdings = [
  {
    stock: "BEL",
    entry: 310,
    cmp: 372,
    target: 420,
    sl: 290,
    status: "Active",
  },
  {
    stock: "E2E Networks",
    entry: 1950,
    cmp: 2640,
    target: 3000,
    sl: 1850,
    status: "Active",
  },
  {
    stock: "Antelopus",
    entry: 520,
    cmp: 702,
    target: 800,
    sl: 480,
    status: "Active",
  },
];

export default function FundTable() {
  return (
    <div style={{ maxWidth: "1200px", margin: "60px auto" }}>
      <h2 style={{ marginBottom: "25px" }}>VTKS Dynamic Fund</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <thead
          style={{
            background: "#2563eb",
            color: "#fff",
          }}
        >
          <tr>
            <th style={{ padding: "15px" }}>Stock</th>
            <th>Entry</th>
            <th>CMP</th>
            <th>Return</th>
            <th>Target</th>
            <th>SL</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {holdings.map((item) => {
            const ret = (((item.cmp - item.entry) / item.entry) * 100).toFixed(
              2
            );

            return (
              <tr
                key={item.stock}
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <td style={{ padding: "18px" }}>{item.stock}</td>
                <td>₹{item.entry}</td>
                <td>₹{item.cmp}</td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  +{ret}%
                </td>
                <td>₹{item.target}</td>
                <td>₹{item.sl}</td>
                <td>{item.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}