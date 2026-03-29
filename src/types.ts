export interface Run {
  id: number;
  date: string; // YYYY-MM-DD
  distance: number;
  unit: string; // 'mi' or 'km'
  duration: number; // total seconds (or minutes depending on how we want to display, seconds is better for precision)
  notes: string | null;
  created_at: string;
}
