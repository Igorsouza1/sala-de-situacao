
// Helper to format 4-digit time strings (e.g., "1430") into HH:mm format
export const formatTime = (timeString: string | undefined) => {
    if (!timeString || String(timeString).length < 3) return "Hora não informada"
    const paddedTime = String(timeString).padStart(4, "0")
    return `${paddedTime.slice(0, 2)}:${paddedTime.slice(2)}`
  }