import portfolio from "../../data/portfolio";

function PortfolioTable() {
  return (
    <div>
      <h2>Current Holdings</h2>

      <table>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Sector</th>
            <th>Entry</th>
            <th>CMP</th>
            <th>Target</th>
            <th>SL</th>
            <th>Return</th>
          </tr>
        </thead>

        <tbody>
          {portfolio.map((item) => (
            <tr key={item.id}>
              <td>{item.stock}</td>
              <td>{item.sector}</td>
              <td>{item.entry}</td>
              <td>{item.cmp}</td>
              <td>{item.target}</td>
              <td>{item.sl}</td>

              <td
                style={{
                  color: item.return >= 0 ? "#22C55E" : "#EF4444",
                  fontWeight: "bold",
                }}
              >
                {item.return}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PortfolioTable;