"use client";

import { useState, FormEvent } from "react";

interface Room {
  id: string;
  name: string;
  slug: string;
  color: string;
  capacity: number;
  floor?: string;
}

interface SalesRep {
  id: string;
  name: string;
  email?: string;
}

interface QuickBookModalProps {
  rooms: Room[];
  salesReps: SalesRep[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface AlternativeSlot {
  room: string;
  startTime: string;
  endTime: string;
}

export default function QuickBookModal({
  rooms,
  salesReps,
  isOpen,
  onClose,
  onCreated,
}: QuickBookModalProps) {
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [salesRepId, setSalesRepId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);

  if (!isOpen) return null;

  const resetForm = () => {
    setContactName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setRoomId("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setSalesRepId("");
    setTitle("");
    setNotes("");
    setAttendeeCount(1);
    setError(null);
    setAlternatives([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setAlternatives([]);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          company,
          email,
          phone: phone || undefined,
          roomId,
          date,
          startTime: `${date}T${startTime}:00`,
          endTime: `${date}T${endTime}:00`,
          salesRepId,
          title,
          notes: notes || undefined,
          attendeeCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alternatives && data.alternatives.length > 0) {
          setAlternatives(data.alternatives);
          setError("Time slot conflict. See alternative slots below.");
        } else {
          setError(data.error || "Failed to create meeting.");
        }
        return;
      }

      resetForm();
      onCreated();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectAlternative = (slot: AlternativeSlot) => {
    const altRoom = rooms.find((r) => r.name === slot.room || r.id === slot.room);
    if (altRoom) setRoomId(altRoom.id);
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    setStartTime(
      `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`
    );
    setEndTime(
      `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`
    );
    setAlternatives([]);
    setError(null);
  };

  const inputClass =
    "w-full bg-base border border-border rounded-lg px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block font-body text-xs text-text-secondary mb-1.5 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-text-primary">Quick Book Meeting</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Contact Name */}
            <div>
              <label className={labelClass}>Contact Name</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>

            {/* Company */}
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@acme.com"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className={inputClass}
              />
            </div>

            {/* Meeting Title */}
            <div className="col-span-2">
              <label className={labelClass}>Meeting Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product Demo & Partnership Discussion"
                className={inputClass}
              />
            </div>

            {/* Room */}
            <div>
              <label className={labelClass}>Room</label>
              <select
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select room...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Rep */}
            <div>
              <label className={labelClass}>Sales Rep</label>
              <select
                required
                value={salesRepId}
                onChange={(e) => setSalesRepId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select rep...</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Attendee Count */}
            <div>
              <label className={labelClass}>Attendee Count</label>
              <input
                type="number"
                min={1}
                required
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 1)}
                className={inputClass}
              />
            </div>

            {/* Start Time */}
            <div>
              <label className={labelClass}>Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* End Time */}
            <div>
              <label className={labelClass}>End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional details..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Alternative Slots */}
          {alternatives.length > 0 && (
            <div className="mt-4">
              <p className="font-body text-xs text-text-secondary mb-2 uppercase tracking-wider">
                Available Alternative Slots
              </p>
              <div className="grid grid-cols-1 gap-2">
                {alternatives.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectAlternative(slot)}
                    className="flex items-center justify-between px-4 py-2.5 bg-elevated border border-border-subtle rounded-lg hover:border-gold/30 hover:bg-gold/5 transition-all duration-200 cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-body text-sm text-text-primary">{slot.room}</span>
                      <span className="font-mono text-xs text-text-muted ml-3">
                        {new Date(slot.startTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        -{" "}
                        {new Date(slot.endTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                    <span className="font-body text-xs text-gold">Select</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 font-body text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-elevated transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gold/90 hover:bg-gold text-base font-body text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-gold/10"
            >
              {submitting ? "Booking..." : "Book Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
