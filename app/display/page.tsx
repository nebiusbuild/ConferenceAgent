import DisplayBoard from '@/components/DisplayBoard';

interface RoomMeeting {
  id: string;
  title: string;
  company: string;
  startTime: string;
  endTime: string;
}

interface RoomData {
  id: string;
  name: string;
  slug: string;
  color: string;
  capacity: number;
  floor: string;
  currentMeeting: RoomMeeting | null;
  nextMeeting: RoomMeeting | null;
}

async function fetchRooms(): Promise<RoomData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/rooms`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rooms = Array.isArray(data) ? data : data.rooms || [];

    const now = new Date();

    return rooms.map((room: Record<string, unknown>) => {
      const meetings = (room.meetings as Array<Record<string, unknown>>) || [];
      const sortedMeetings = meetings
        .map((m) => ({
          id: m.id as string,
          title: m.title as string,
          company: (m.contact as { company?: string })?.company || '',
          startTime: m.startTime as string,
          endTime: m.endTime as string,
        }))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      const currentMeeting = sortedMeetings.find(
        (m) => new Date(m.startTime) <= now && new Date(m.endTime) > now
      ) || null;

      const nextMeeting = sortedMeetings.find(
        (m) => new Date(m.startTime) > now
      ) || null;

      return {
        id: room.id as string,
        name: room.name as string,
        slug: room.slug as string,
        color: room.color as string,
        capacity: room.capacity as number,
        floor: (room.floor as string) || '',
        currentMeeting,
        nextMeeting,
      };
    });
  } catch {
    return [];
  }
}

export default async function DisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ floor?: string }>;
}) {
  const params = await searchParams;
  const allRooms = await fetchRooms();
  const floor = params.floor;
  const rooms = floor
    ? allRooms.filter((r) => r.floor?.toLowerCase() === floor.toLowerCase())
    : allRooms;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <h1
            className="text-3xl font-light tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold)' }}
          >
            Concierge
          </h1>
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {floor ? `Floor ${floor}` : 'All Rooms'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sage)' }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}
          >
            Live
          </span>
        </div>
      </header>

      <main className="p-8">
        <DisplayBoard initialRooms={rooms} floor={floor} />
      </main>
    </div>
  );
}
