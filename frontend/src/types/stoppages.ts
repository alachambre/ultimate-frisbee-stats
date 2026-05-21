export type StoppageType = "call" | "injury" | "timeout" | "other";

export interface Stoppage {
  id: number;
  point_id: number;
  stoppage_type?: StoppageType;
  call_timestamp: string; // ISO datetime with 'Z'
  resume_timestamp: string | null; // ISO datetime with 'Z', null until resolved
  comments: string | null;
  created_at: string; // ISO datetime with 'Z'
}

export interface StoppageCreate {
  point_id: number;
  stoppage_type?: StoppageType;
  call_timestamp: string; // ISO datetime
  resume_timestamp?: string | null;
  comments?: string | null;
}

export interface StoppageUpdate {
  stoppage_type?: StoppageType;
  resume_timestamp?: string | null;
  comments?: string | null;
}
