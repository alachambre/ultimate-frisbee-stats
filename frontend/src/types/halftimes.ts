export interface Halftime {
  id: number;
  game_id: number;
  halftime_timestamp: string; // ISO datetime with 'Z'
  comments: string | null;
  created_at: string; // ISO datetime with 'Z'
}

export interface HalftimeCreate {
  game_id: number;
  halftime_timestamp?: string | null;
  comments?: string | null;
}

export interface HalftimeUpdate {
  halftime_timestamp?: string | null;
  comments?: string | null;
}
