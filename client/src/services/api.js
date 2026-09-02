const BASE_URL = "https://edureach-mlmz.onrender.com";
async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
        headers: { "Content-Type": "application/json" },
        ...options,
    };
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}
export const api = {
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
};

