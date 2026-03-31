export interface Interval {
  id: string; // unique frontend ID
  groupId: string; // groups reps together (e.g. the "3x600m" block)
  distance: number;
  unit: string; // typically 'm'
  duration: number; // actual time taken in seconds
  rest: number; // rest taken after this rep in seconds
}

export interface Run {
  id: number;
  date: string; // YYYY-MM-DD
  distance: number; // total overall distance
  unit: string; // 'mi' or 'km'
  duration: number; // total overall duration
  notes: string | null;
  type: 'regular' | 'interval';
  intervals?: Interval[] | null;
  created_at: string;
  shoe_id?: number | null;
  shoe_name?: string | null;
  shoe_brand?: string | null;
  rpe?: number | null;
}

export interface Shoe {
  id: number;
  brand: string;
  name: string;
  is_default: boolean;
  retired: boolean;
  total_distance?: number;
}
