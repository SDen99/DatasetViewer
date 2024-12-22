// virtualizedTable.ts
export class VirtualizedTableManager {
    private rowHeight = 40; // Default row height
    private viewportHeight = 0;
    private scrollTop = 0;
    private data: any[];
    private buffer = 10; // Extra rows to render above/below viewport

    constructor(data: any[]) {
        this.data = data;
    }

    public updateViewport(scrollTop: number, viewportHeight: number) {
        this.scrollTop = scrollTop;
        this.viewportHeight = viewportHeight;
    }

    public getVisibleRange() {
        const startIndex = Math.floor(this.scrollTop / this.rowHeight) - this.buffer;
        const visibleRows = Math.ceil(this.viewportHeight / this.rowHeight) + 2 * this.buffer;
        return {
            start: Math.max(0, startIndex),
            end: Math.min(this.data.length, startIndex + visibleRows)
        };
    }

    public getVisibleData(columns: string[]) {
        const { start, end } = this.getVisibleRange();
        return {
            items: this.data.slice(start, end).map(row => {
                const visibleRow: Record<string, any> = {};
                columns.forEach(col => visibleRow[col] = row[col]);
                return visibleRow;
            }),
            startIndex: start,
            totalHeight: this.data.length * this.rowHeight
        };
    }
}