import axios from "axios";

async function getData(data) {
  try {
    const response = await axios.post("https://api.karavanshop.uz/v1/", data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export default getData;
