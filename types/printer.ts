/**
 * Printer Types and Interfaces
 */

export type PrinterConnectionType = 'usb' | 'network' | 'bluetooth' | 'api';

export interface PrinterDevice {
  id: string;
  name: string;
  type: PrinterConnectionType;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastUsed?: Date;
  config: PrinterConfig;
}

export interface PrinterConfig {
  // Common config
  name: string;
  type: PrinterConnectionType;
  model?: string;
  paperWidth?: number; // 58mm or 80mm
  
  // USB specific
  vendorId?: number;
  productId?: number;
  
  // Network specific
  ipAddress?: string;
  port?: number;
  
  // Bluetooth specific
  bluetoothId?: string;
  
  // API specific
  apiEndpoint?: string;
  apiKey?: string;
}

export interface PrinterConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  print(data: Uint8Array): Promise<void>;
  isConnected(): boolean;
  getStatus(): string;
}

export interface PrintJob {
  id: string;
  printerId: string;
  data: Uint8Array;
  timestamp: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  retries?: number;
  error?: string;
}

export interface NetworkPrinter {
  name: string;
  ip: string;
  port: number;
  model?: string;
  status: 'online' | 'offline' | 'unknown';
}
