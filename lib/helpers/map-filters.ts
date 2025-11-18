// lib/helpers/map-filters.ts

/**
 * Checa se uma string de data (de uma propriedade GeoJSON) cai dentro
 * de um intervalo de datas fornecido.
 *
 * @param date A string de data da feature (ex: '2024-11-18').
 * @param startDate A data de início do filtro (inclusivo).
 * @param endDate A data de fim do filtro (inclusivo, ajustado para o final do dia).
 * @returns true se a data estiver dentro do intervalo, false caso contrário.
 */
export const isDatePropWithinRange = (date: string, startDate: Date | null, endDate: Date | null): boolean => {
    const itemDate = new Date(date);
    
    // Adicionando uma verificação de segurança: se a data for inválida, excluímos a feature.
    if (isNaN(itemDate.getTime())) return false; 
  
    if (startDate && itemDate < startDate) return false;
    
    if (endDate) {
      // Para incluir o dia final no filtro, ajustamos o limite para o final do dia
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); 
      if (itemDate > adjustedEndDate) return false;
    }
    
    return true;
  };