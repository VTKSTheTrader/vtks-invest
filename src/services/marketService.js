const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY;

export const fetchLiveCMP = async (stock) => {
  try {
    if (!stock) return null;

    const symbol = `${stock.trim().toUpperCase()}.NSE`;

    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`
    );

    const data = await response.json();

    console.log(symbol, data);

    if (data.status === "error") {
      return null;
    }

    return Number(data.price);
  } catch (err) {
    console.error(err);
    return null;
  }
};