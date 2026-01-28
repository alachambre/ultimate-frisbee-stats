import axios from "axios";
import type { PlayerGameStats } from "../types";

const API_BASE_URL = "http://localhost:8000";

export async function getLiveGameStatistics(gameId: number): Promise<PlayerGameStats[]> {
  const response = await axios.get(`${API_BASE_URL}/statistics/games/${gameId}/live`);
  return response.data;
}
