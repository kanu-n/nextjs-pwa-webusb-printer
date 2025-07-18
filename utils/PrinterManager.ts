import { PrinterDevice, PrinterConfig, PrinterConnection, PrintJob, PrinterConnectionType } from '../types/printer';
import { USBPrinterConnection } from './connectivity/USBConnection';
import { NetworkPrinterConnection } from './connectivity/NetworkConnection';
import { BluetoothPrinterConnection } from './connectivity/BluetoothConnection';
import { APIPrinterConnection } from './connectivity/APIConnection';

export class PrinterManager {
  private printers: Map<string, PrinterDevice> = new Map();
  private connections: Map<string, PrinterConnection> = new Map();
  private activePrinterId: string | null = null;
  private printQueue: PrintJob[] = [];
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.loadSavedPrinters();
  }

  // Event management
  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  removeEventListener(event: string, callback: Function) {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  // Printer management
  async addPrinter(config: PrinterConfig): Promise<string> {
    const id = `${config.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const printer: PrinterDevice = {
      id,
      name: config.name,
      type: config.type as PrinterConnectionType,
      status: 'disconnected',
      config
    };

    this.printers.set(id, printer);
    this.savePrinters();
    this.emit('printerAdded', printer);
    
    return id;
  }

  removePrinter(id: string): boolean {
    const printer = this.printers.get(id);
    if (!printer) return false;

    // Disconnect if connected
    if (printer.status === 'connected') {
      this.disconnectPrinter(id);
    }

    this.printers.delete(id);
    this.connections.delete(id);
    
    if (this.activePrinterId === id) {
      this.activePrinterId = null;
    }

    this.savePrinters();
    this.emit('printerRemoved', id);
    return true;
  }

  getPrinters(): PrinterDevice[] {
    return Array.from(this.printers.values());
  }

  getPrinter(id: string): PrinterDevice | undefined {
    return this.printers.get(id);
  }

  getActivePrinter(): PrinterDevice | null {
    return this.activePrinterId ? this.printers.get(this.activePrinterId) || null : null;
  }

  setActivePrinter(id: string): boolean {
    if (!this.printers.has(id)) return false;
    this.activePrinterId = id;
    this.emit('activePrinterChanged', id);
    return true;
  }

  // Connection management
  async connectPrinter(id: string): Promise<void> {
    const printer = this.printers.get(id);
    if (!printer) {
      throw new Error('Printer not found');
    }

    if (printer.status === 'connected') {
      return; // Already connected
    }

    printer.status = 'connecting';
    this.emit('printerStatusChanged', { id, status: 'connecting' });

    try {
      const connection = this.createConnection(printer.config);
      await connection.connect();
      
      this.connections.set(id, connection);
      printer.status = 'connected';
      printer.lastUsed = new Date();
      
      this.savePrinters();
      this.emit('printerStatusChanged', { id, status: 'connected' });
      
    } catch (error: any) {
      printer.status = 'error';
      this.emit('printerStatusChanged', { id, status: 'error', error: error.message });
      throw error;
    }
  }

  async disconnectPrinter(id: string): Promise<void> {
    const printer = this.printers.get(id);
    const connection = this.connections.get(id);
    
    if (printer && connection) {
      try {
        await connection.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      
      printer.status = 'disconnected';
      this.connections.delete(id);
      
      this.emit('printerStatusChanged', { id, status: 'disconnected' });
    }
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.printers.keys()).map(id => 
      this.disconnectPrinter(id).catch(console.error)
    );
    
    await Promise.all(promises);
  }

  private createConnection(config: PrinterConfig): PrinterConnection {
    switch (config.type) {
      case 'usb':
        return new USBPrinterConnection({
          vendorId: config.vendorId,
          productId: config.productId
        });
        
      case 'network':
        return new NetworkPrinterConnection(
          config.ipAddress!,
          config.port || 9100
        );
        
      case 'bluetooth':
        return new BluetoothPrinterConnection(config.bluetoothId);
        
      case 'api':
        return new APIPrinterConnection(
          config.apiEndpoint!,
          config.apiKey
        );
        
      default:
        throw new Error(`Unsupported printer type: ${config.type}`);
    }
  }

  // Printing
  async print(data: Uint8Array, printerId?: string): Promise<string> {
    const targetId = printerId || this.activePrinterId;
    
    if (!targetId) {
      throw new Error('No printer selected');
    }

    const printer = this.printers.get(targetId);
    const connection = this.connections.get(targetId);
    
    if (!printer || !connection) {
      throw new Error('Printer not found or not connected');
    }

    if (!connection.isConnected()) {
      throw new Error('Printer not connected');
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: PrintJob = {
      id: jobId,
      printerId: targetId,
      data,
      timestamp: new Date(),
      status: 'pending'
    };

    this.printQueue.push(job);
    this.emit('printJobAdded', job);

    try {
      job.status = 'printing';
      this.emit('printJobUpdated', job);
      
      await connection.print(data);
      
      job.status = 'completed';
      printer.lastUsed = new Date();
      
      this.emit('printJobUpdated', job);
      this.savePrinters();
      
      return jobId;
      
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      this.emit('printJobUpdated', job);
      throw error;
    }
  }

  // Print queue management
  getPrintQueue(): PrintJob[] {
    return [...this.printQueue];
  }

  clearPrintQueue(): void {
    this.printQueue = [];
    this.emit('printQueueCleared');
  }

  removePrintJob(jobId: string): boolean {
    const index = this.printQueue.findIndex(job => job.id === jobId);
    if (index === -1) return false;
    
    this.printQueue.splice(index, 1);
    this.emit('printJobRemoved', jobId);
    return true;
  }

  // Discovery methods
  async discoverUSBPrinters(): Promise<any[]> {
    if (!('usb' in navigator)) {
      throw new Error('WebUSB not supported');
    }

    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{}] // Show all USB devices
      });
      
      return [{
        id: `usb_${device.vendorId}_${device.productId}`,
        name: device.productName || `USB Printer ${device.vendorId}:${device.productId}`,
        vendorId: device.vendorId,
        productId: device.productId,
        type: 'usb'
      }];
    } catch (error) {
      console.error('USB discovery failed:', error);
      return [];
    }
  }

  async discoverNetworkPrinters(): Promise<any[]> {
    try {
      const response = await fetch('/api/discover-network-printers');
      if (!response.ok) {
        throw new Error('Network discovery API not available');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Network discovery failed:', error);
      return [];
    }
  }

  async discoverBluetoothPrinters(): Promise<any[]> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth not supported');
    }

    try {
      const bluetoothConnection = new BluetoothPrinterConnection();
      return await bluetoothConnection.scanForPrinters();
    } catch (error) {
      console.error('Bluetooth discovery failed:', error);
      return [];
    }
  }

  // Persistence
  private savePrinters(): void {
    if (typeof window === 'undefined') return; // Skip on server
    
    try {
      const printersData = Array.from(this.printers.values());
      localStorage.setItem('thermalPrinters', JSON.stringify(printersData));
    } catch (error) {
      console.error('Failed to save printers:', error);
    }
  }

  private loadSavedPrinters(): void {
    if (typeof window === 'undefined') return; // Skip on server
    
    try {
      const saved = localStorage.getItem('thermalPrinters');
      if (saved) {
        const printersData: PrinterDevice[] = JSON.parse(saved);
        printersData.forEach(printer => {
          printer.status = 'disconnected'; // Reset connection status
          this.printers.set(printer.id, printer);
        });
      }
    } catch (error) {
      console.error('Failed to load saved printers:', error);
    }
  }

  // Utility methods
  getConnectionStatus(id: string): string {
    const connection = this.connections.get(id);
    return connection ? connection.getStatus() : 'Not connected';
  }

  async testPrinter(id: string): Promise<boolean> {
    try {
      await this.connectPrinter(id);
      const connection = this.connections.get(id);
      return connection ? connection.isConnected() : false;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const printerManager = new PrinterManager();
