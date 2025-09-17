// Helper to format date strings (e.g., "2024-05-20") into a local format (e.g., "20/05/2024")
export const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Data não informada"
    try {
      const date = new Date(dateString)
      // Adjust for timezone offset to prevent date from shifting
      const userTimezoneOffset = date.getTimezoneOffset() * 60000
      return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString("pt-BR")
    } catch (e) {
      return "Data inválida"
    }
  }