import { PrinterConnection } from '../../types/printer';

// Type declarations for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATT;
    addEventListener(type: string, listener: EventListener): void;
  }
  
  interface BluetoothRemoteGATT {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
  }
  
  interface BluetoothRemoteGATTServer {
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }
  
  interface BluetoothRemoteGATTService {
    uuid: string;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }
  
  interface BluetoothRemoteGATTCharacteristic {
    uuid: string;
    properties: {
      write: boolean;
      writeWithoutResponse: boolean;
    };
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }
  
  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    filters?: Array<{
      namePrefix?: string;
    }>;
    optionalServices?: string[];
  }
}

export class BluetoothPrinterConnection implements PrinterConnection {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnectedFlag: boolean = false;
  private currentStatus: string = 'Not connected';

  // Common Bluetooth printer service UUIDs
  private readonly PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
  private readonly PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';
  
  // Alternative UUIDs for different printer brands
  private readonly ALTERNATIVE_SERVICE_UUIDS = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Generic
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some Star printers
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
  ];

  constructor(private bluetoothId?: string) {}

  async connect(): Promise<void> {
    try {
      this.currentStatus = 'Scanning for Bluetooth printers...';

      // Check if Web Bluetooth is supported
      if (!('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth API is not supported in this browser');
      }

      // Request Bluetooth device
      const options: RequestDeviceOptions = {
        acceptAllDevices: false,
        filters: [
          { namePrefix: 'Printer' },
          { namePrefix: 'TSP' }, // Star printers
          { namePrefix: 'TM' },  // Epson printers
          { namePrefix: 'POS' },
          { namePrefix: 'Receipt' },
        ],
        optionalServices: this.ALTERNATIVE_SERVICE_UUIDS
      };

      // If we have a specific device ID, try to connect directly
      if (this.bluetoothId) {
        try {
          this.device = await this.getDeviceById(this.bluetoothId);
        } catch (error) {
          console.log('Could not connect to known device, scanning...');
        }
      }

      if (!this.device) {
        this.device = await (navigator as any).bluetooth.requestDevice(options);
      }

      this.currentStatus = 'Connecting to Bluetooth printer...';

      if (!this.device || !this.device.gatt) {
        throw new Error('GATT server not available');
      }

      // Connect to GATT server
      const server = await this.device.gatt.connect();
      
      // Try to find the printer service
      let service: BluetoothRemoteGATTService | null = null;
      
      for (const serviceUuid of this.ALTERNATIVE_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(serviceUuid);
          break;
        } catch (error) {
          console.log(`Service ${serviceUuid} not found`);
        }
      }

      if (!service) {
        // Try to get all available services
        const services = await server.getPrimaryServices();
        console.log('Available services:', services.map(s => s.uuid));
        
        if (services.length > 0) {
          service = services[0]; // Use first available service
        } else {
          throw new Error('No compatible printer service found');
        }
      }

      // Get characteristics
      const characteristics = await service.getCharacteristics();
      console.log('Available characteristics:', characteristics.map(c => c.uuid));

      // Find write characteristic
      this.characteristic = characteristics.find(c => 
        c.properties.write || c.properties.writeWithoutResponse
      ) || characteristics[0];

      if (!this.characteristic) {
        throw new Error('No writable characteristic found');
      }

      this.isConnectedFlag = true;
      this.currentStatus = 'Connected to Bluetooth printer';

      // Listen for disconnection
      if (this.device) {
        this.device.addEventListener('gattserverdisconnected', () => {
          this.isConnectedFlag = false;
          this.currentStatus = 'Bluetooth printer disconnected';
        });
      }

    } catch (error: any) {
      this.currentStatus = `Bluetooth error: ${error.message}`;
      throw error;
    }
  }

  private async getDeviceById(id: string): Promise<BluetoothDevice> {
    // This would require the device to be previously paired
    // Web Bluetooth doesn't have a direct "get by ID" method
    // This is a placeholder for potential future API enhancements
    throw new Error('Device ID connection not implemented');
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.isConnectedFlag = false;
    this.currentStatus = 'Disconnected';
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Bluetooth printer not connected');
    }

    try {
      // Split data into chunks (Bluetooth has MTU limitations, typically 20-512 bytes)
      const chunkSize = 20; // Conservative chunk size
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else if (this.characteristic.properties.write) {
          await this.characteristic.writeValueWithResponse(chunk);
        } else {
          throw new Error('Characteristic does not support writing');
        }
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
    } catch (error: any) {
      throw new Error(`Bluetooth print failed: ${error.message}`);
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag && this.device?.gatt?.connected === true;
  }

  getStatus(): string {
    return this.currentStatus;
  }

  // Bluetooth-specific methods
  async scanForPrinters(): Promise<BluetoothDevice[]> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API not supported');
    }

    try {
      const devices: BluetoothDevice[] = [];
      
      // This is a simplified scan - actual implementation would need
      // proper device filtering and discovery
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: this.ALTERNATIVE_SERVICE_UUIDS
      });
      
      if (device) {
        devices.push(device);
      }
      
      return devices;
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
      return [];
    }
  }

  getDeviceInfo() {
    if (!this.device) return null;
    
    return {
      id: this.device.id,
      name: this.device.name,
      connected: this.device.gatt?.connected || false
    };
  }
}
