import { PrinterConnection } from '../../types/printer';

export class USBPrinterConnection implements PrinterConnection {
  private device: any = null;
  private isConnectedFlag: boolean = false;
  private currentStatus: string = 'Not connected';

  constructor(private config: any) {}

  async connect(): Promise<void> {
    try {
      this.currentStatus = 'Connecting...';
      
      // Request USB device
      const device = await (navigator as any).usb.requestDevice({
        filters: this.config.vendorId ? 
          [{ vendorId: this.config.vendorId }] : 
          [{}]
      });

      await device.open();
      
      // Select configuration
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Claim interface
      let interfaceClaimed = false;
      const config = device.configuration;

      if (config && config.interfaces) {
        for (const iface of config.interfaces) {
          if (!iface.claimed) {
            try {
              await device.claimInterface(iface.interfaceNumber);
              interfaceClaimed = true;
              break;
            } catch (error) {
              console.log(`Failed to claim interface ${iface.interfaceNumber}`);
            }
          }
        }
      }

      if (!interfaceClaimed) {
        // Try common interfaces
        for (const interfaceNum of [0, 1, 2]) {
          try {
            await device.claimInterface(interfaceNum);
            interfaceClaimed = true;
            break;
          } catch (error) {
            // Continue trying
          }
        }
      }

      if (!interfaceClaimed) {
        throw new Error('Could not claim any interface');
      }

      this.device = device;
      this.isConnectedFlag = true;
      this.currentStatus = 'Connected';
    } catch (error: any) {
      this.currentStatus = `Error: ${error.message}`;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.close();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      this.device = null;
    }
    this.isConnectedFlag = false;
    this.currentStatus = 'Disconnected';
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.device) {
      throw new Error('No USB device connected');
    }

    // Try different endpoints
    const endpoints = [1, 2, 3];
    for (const endpoint of endpoints) {
      try {
        await this.device.transferOut(endpoint, data);
        return;
      } catch (error) {
        console.log(`Failed on endpoint ${endpoint}`);
      }
    }
    
    throw new Error('Could not find working endpoint');
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  getStatus(): string {
    return this.currentStatus;
  }

  getDeviceInfo() {
    if (!this.device) return null;
    
    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      productName: this.device.productName,
      manufacturerName: this.device.manufacturerName
    };
  }
}
