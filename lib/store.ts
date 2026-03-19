import { create } from 'zustand'

interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  attendeeCount: number
  notes: string | null
  room: { id: string; name: string; color: string; slug: string; floor: string; capacity: number }
  contact: { id: string; name: string; email: string; phone: string | null; company: string }
  salesRep: { id: string; name: string; email: string }
}

interface Room {
  id: string
  name: string
  slug: string
  capacity: number
  type: string
  floor: string
  color: string
}

interface SalesRep {
  id: string
  name: string
  email: string
}

interface AppState {
  meetings: Meeting[]
  rooms: Room[]
  salesReps: SalesRep[]
  selectedMeetingId: string | null
  isQuickBookOpen: boolean
  setMeetings: (meetings: Meeting[]) => void
  setRooms: (rooms: Room[]) => void
  setSalesReps: (reps: SalesRep[]) => void
  selectMeeting: (id: string | null) => void
  setQuickBookOpen: (open: boolean) => void
  refreshData: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  meetings: [],
  rooms: [],
  salesReps: [],
  selectedMeetingId: null,
  isQuickBookOpen: false,
  setMeetings: (meetings) => set({ meetings }),
  setRooms: (rooms) => set({ rooms }),
  setSalesReps: (reps) => set({ salesReps: reps }),
  selectMeeting: (id) => set({ selectedMeetingId: id }),
  setQuickBookOpen: (open) => set({ isQuickBookOpen: open }),
  refreshData: async () => {
    try {
      const [meetingsRes, roomsRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/rooms'),
      ])
      if (meetingsRes.ok) {
        const data = await meetingsRes.json()
        set({ meetings: data.meetings || data })
      }
      if (roomsRes.ok) {
        const data = await roomsRes.json()
        set({ rooms: data.rooms || data })
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  },
}))
