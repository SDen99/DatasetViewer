/**
 * Utility functions for formatting cell content in the VLM table
 */

/**
 * Format cell content based on type and context
 */
export function formatCellContent(value: any, column: string): string {
    if (value === null || value === undefined) {
      return '';
    }
  
    if (typeof value === 'object') {
      // Special case for PARAMCD and PARAM columns
      if (column === 'PARAMCD') {
        return value.paramcd || value.paramInfo?.codedValue || '';
      } else if (column === 'PARAM') {
        return value.paramInfo?.decode || '';
      }
      
      // For other complex objects, try to extract a display value
      if (value.itemDescription) {
        return value.itemDescription;
      } else if (value.toString && value.toString() !== '[object Object]') {
        return value.toString();
      } else {
        return JSON.stringify(value);
      }
    }
  
    // Convert to string for display
    return String(value);
  }
  
  /**
   * Format comparator symbols for display
   */
  export function formatComparator(comparator: string): string {
    switch (comparator) {
      case 'EQ': return '=';
      case 'NE': return '≠';
      case 'LT': return '<';
      case 'LE': return '≤';
      case 'GT': return '>';
      case 'GE': return '≥';
      case 'IN': return 'in';
      case 'NOTIN': return 'not in';
      default: return comparator;
    }
  }
  
  /**
   * Format a stratification value for display
   */
  export function formatStratificationValue(info: { comparator: string; values: any[] }): string {
    if (!info) return '';
    
    const valueStr = Array.isArray(info.values)
      ? info.values.join(', ')
      : String(info.values || '');
      
    return `${formatComparator(info.comparator)} ${valueStr}`;
  }
  
  /**
   * Format PARAMCD value for display
   */
  export function formatParamcd(value: any): string {
    if (!value) return '';
    
    if (typeof value === 'object') {
      return value.paramcd || value.paramInfo?.codedValue || '';
    }
    
    return String(value);
  }
  
  /**
   * Format PARAM value for display
   */
  export function formatParam(value: any): string {
    if (!value) return '';
    
    if (typeof value === 'object') {
      return value.paramInfo?.decode || '';
    }
    
    return String(value);
  }
  
  /**
   * Get a valid string representation of a value for key generation
   */
  export function getStringValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    
    return String(value);
  }