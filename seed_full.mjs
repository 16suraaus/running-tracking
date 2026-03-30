const runs = [
  { type: 'regular', distance: 13.1, duration: 105*60, unit: 'mi', date: '2026-03-22T08:00:00Z', notes: 'Weekend long run' },
  { type: 'regular', distance: 5.5, duration: 45*60, unit: 'mi', date: '2026-03-25T10:00:00Z', notes: 'Easy recovery run' },
  { type: 'regular', distance: 3.2, duration: 25*60 + 15, unit: 'mi', date: '2026-03-27T08:00:00Z', notes: 'Tempo push' },
  { 
    type: 'interval', distance: 4.5, duration: 40*60, unit: 'mi', date: '2026-03-24T09:00:00Z', 
    intervals: [
      { id: '1', groupId: 'set1', distance: 800, duration: 195, rest: 90 },
      { id: '2', groupId: 'set1', distance: 800, duration: 192, rest: 90 },
      { id: '3', groupId: 'set2', distance: 400, duration: 85, rest: 60 },
      { id: '4', groupId: 'set2', distance: 400, duration: 82, rest: 60 }
    ],
    notes: 'Ladder workout'
  },
  { 
    type: 'interval', distance: 3.5, duration: 30*60, unit: 'mi', date: '2026-03-28T09:00:00Z', 
    intervals: [
      { id: '1', groupId: 'set1', distance: 400, duration: 80, rest: 60 },
      { id: '2', groupId: 'set1', distance: 400, duration: 82, rest: 60 },
      { id: '3', groupId: 'set1', distance: 400, duration: 79, rest: 60 }
    ],
    notes: 'Track session 3x400'
  }
];

const runSeed = async () => {
  await fetch('http://localhost:3000/api/reset');
  console.log('Database resetting...');
  for (const r of runs) {
    await fetch('http://localhost:3000/api/runs', { 
      method: 'POST', 
      body: JSON.stringify(r), 
      headers: {'Content-Type': 'application/json'} 
    });
    console.log(`Seeded run: ${r.notes}`);
  }
  console.log('Seeding complete.');
};

runSeed();
