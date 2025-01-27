export class StorageQueue {
    private static instance: StorageQueue;
    private queue: Array<() => Promise<void>> = [];
    private processing = false;
  
    static getInstance(): StorageQueue {
      if (!StorageQueue.instance) {
        StorageQueue.instance = new StorageQueue();
      }
      return StorageQueue.instance;
    }
  
    async enqueue(operation: () => Promise<void>) {
      this.queue.push(operation);
      if (!this.processing) {
        await this.processQueue();
      }
    }
  
    private async processQueue() {
      if (this.processing) return;
      this.processing = true;
  
      while (this.queue.length > 0) {
        const operation = this.queue.shift();
        if (operation) {
          try {
            await operation();
          } catch (error) {
            console.error('Storage operation failed:', error);
          }
        }
      }
  
      this.processing = false;
    }
  }