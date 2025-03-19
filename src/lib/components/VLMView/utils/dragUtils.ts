/**
 * Utility functions for drag and drop operations in the VLM table
 */

/**
 * Handle the start of a column drag operation
 */
export function handleDragStart(e: DragEvent, column: string): { event: DragEvent, column: string } {
    return { event: e, column };
  }
  
  /**
   * Handle a column being dragged over another column
   */
  export function handleDragOver(e: DragEvent, column: string): { event: DragEvent, column: string } {
    e.preventDefault();
    return { event: e, column };
  }
  
  /**
   * Handle a column being dropped onto another column
   */
  export function handleDrop(
    e: DragEvent, 
    column: string, 
    draggedColumn: string | null, 
    visibleColumns: string[], 
    allColumns: string[]
  ): { 
    event: DragEvent; 
    column: string; 
    newColumns?: string[]; 
  } {
    e.preventDefault();
    
    if (!draggedColumn || !allColumns) {
      return { event: e, column };
    }
    
    const draggedIndex = visibleColumns.indexOf(draggedColumn);
    const dropIndex = visibleColumns.indexOf(column);
  
    if (draggedIndex !== -1 && dropIndex !== -1) {
      // Make a copy of the columns array
      const newColumns = [...allColumns];
  
      // Remove draggedColumn from its current position
      const draggedItem = newColumns.splice(newColumns.indexOf(draggedColumn), 1)[0];
  
      // Insert at new position relative to the drop target
      const targetIndex = newColumns.indexOf(column);
      newColumns.splice(targetIndex, 0, draggedItem);
  
      return { event: e, column, newColumns };
    }
  
    return { event: e, column };
  }
  
  /**
   * Reorder columns based on a drag and drop operation
   */
  export function reorderColumns(
    originalColumns: string[], 
    draggedColumn: string, 
    targetColumn: string
  ): string[] {
    if (!originalColumns || !draggedColumn || !targetColumn) {
      return originalColumns;
    }
  
    // Make a copy of the original array
    const newColumns = [...originalColumns];
    
    const draggedIndex = newColumns.indexOf(draggedColumn);
    const targetIndex = newColumns.indexOf(targetColumn);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      return originalColumns;
    }
    
    // Remove the dragged item
    const [removed] = newColumns.splice(draggedIndex, 1);
    
    // Insert at the target position
    newColumns.splice(targetIndex, 0, removed);
    
    return newColumns;
  }