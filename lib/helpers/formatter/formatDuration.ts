// Helper to convert duration in minutes to a human-readable format
export const formatDuration = (minutes: number | undefined) => {
    if (minutes === undefined || minutes === null) return "Duração não informada"
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    let result = ""
    if (hours > 0) {
      result += `${hours} hora${hours > 1 ? "s" : ""}`
    }
    if (remainingMinutes > 0) {
      if (result) result += " e "
      result += `${remainingMinutes} minuto${remainingMinutes > 1 ? "s" : ""}`
    }
    return result || "Menos de um minuto"
  }