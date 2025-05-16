// src/utils/formatRoomId.ts
export function formatRoomId(raw: string): string {
    const parts = raw.split('_');
    // if it’s exactly 4 parts, we assume the 3rd is the room number:
    //   ["110031","HotelClassicInn","202","Suite"] → "202"
    if (parts.length === 4) {
      return parts[2];
    }
    // otherwise, drop the first two and the last one:
    //   ["110031","HotelClassicInn","Suite","1","Suite"] → ["Suite","1"] → "Suite 1"
    if (parts.length > 4) {
      return parts.slice(2, parts.length - 1).join(' ');
    }
    // fallback
    return raw;
  }