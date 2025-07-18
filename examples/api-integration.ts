/**
 * API Integration Examples
 * 
 * Examples for integrating with external print services and APIs
 */

import { printerManager } from '../utils/PrinterManager';
import { ESCPOSCommands } from '../utils/escpos';

// Example 1: Custom API Client
export class PrintServiceAPI {
  constructor(
    private baseUrl: string,
    private apiKey?: string
  ) {}

  async createPrintJob(data: any, template?: string) {
    const response = await fetch(`${this.baseUrl}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      body: JSON.stringify({
        data,
        template,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }

  async getJobStatus(jobId: string) {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });

    return await response.json();
  }

  async getTemplates() {
    const response = await fetch(`${this.baseUrl}/templates`, {
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });

    return await response.json();
  }
}

// Example 2: Cloud Print Service Integration
export class CloudPrintService {
  private api: PrintServiceAPI;

  constructor(config: { endpoint: string; apiKey: string }) {
    this.api = new PrintServiceAPI(config.endpoint, config.apiKey);
  }

  async printReceipt(receiptData: any) {
    try {
      const job = await this.api.createPrintJob(receiptData, 'receipt');
      
      // Poll for completion
      return await this.waitForCompletion(job.jobId);
    } catch (error) {
      console.error('Cloud print failed:', error);
      throw error;
    }
  }

  async printLabel(labelData: any) {
    return await this.api.createPrintJob(labelData, 'label');
  }

  async batchPrint(items: any[]) {
    const jobs = await Promise.allSettled(
      items.map(item => this.api.createPrintJob(item.data, item.template))
    );

    return jobs.map((result, index) => ({
      item: items[index],
      success: result.status === 'fulfilled',
      jobId: result.status === 'fulfilled' ? result.value.jobId : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  private async waitForCompletion(jobId: string, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.api.getJobStatus(jobId);
      
      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Print job failed: ${status.error}`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Print job timed out');
  }
}

// Example 3: Local Network Print Server
export class NetworkPrintServer {
  constructor(private proxyUrl = 'http://localhost:8080') {}

  async discoverPrinters() {
    const response = await fetch(`${this.proxyUrl}/discover`);
    const data = await response.json();
    return data.printers || [];
  }

  async testPrinter(ip: string, port = 9100) {
    const response = await fetch(`${this.proxyUrl}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port })
    });

    const result = await response.json();
    return result.online;
  }

  async printDirect(ip: string, data: number[], port = 9100) {
    const response = await fetch(`${this.proxyUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port, data })
    });

    return await response.json();
  }

  async setupAutoDiscovery() {
    const printers = await this.discoverPrinters();
    
    for (const printer of printers) {
      const isOnline = await this.testPrinter(printer.ip, printer.port);
      
      if (isOnline) {
        console.log(`Found printer: ${printer.name} at ${printer.ip}`);
        
        // Add to printer manager
        await printerManager.addPrinter({
          name: printer.name,
          type: 'network',
          ipAddress: printer.ip,
          port: printer.port
        });
      }
    }
  }
}

// Example 4: Webhook Integration
export class WebhookPrintService {
  constructor(private webhookUrl: string) {}

  async sendPrintWebhook(printerConfig: any, printData: any) {
    const webhook = {
      event: 'print_request',
      timestamp: new Date().toISOString(),
      printer: printerConfig,
      data: printData,
      source: 'thermal-printer-pwa'
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhook)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return await response.json();
  }

  async notifyPrintComplete(jobId: string, status: 'success' | 'failed', error?: string) {
    const webhook = {
      event: 'print_complete',
      timestamp: new Date().toISOString(),
      jobId,
      status,
      error
    };

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhook)
    });
  }
}

// Example 5: Integration with POS Systems
export class POSIntegration {
  private cloudPrint: CloudPrintService;
  private networkPrint: NetworkPrintServer;

  constructor(config: any) {
    this.cloudPrint = new CloudPrintService(config.cloud);
    this.networkPrint = new NetworkPrintServer(config.proxyUrl);
  }

  async processSale(saleData: any) {
    // Process receipt printing
    await this.printReceipt(saleData);
    
    // Process kitchen tickets if restaurant
    if (saleData.kitchenItems?.length > 0) {
      await this.printKitchenTicket(saleData);
    }
    
    // Process labels if needed
    if (saleData.labels?.length > 0) {
      await this.printLabels(saleData.labels);
    }
  }

  private async printLabels(labels: any[]) {
    for (const label of labels) {
      await this.cloudPrint.printLabel(label);
    }
  }

  private async printReceipt(saleData: any) {
    const receiptData = {
      storeName: saleData.storeName,
      address: saleData.storeAddress,
      items: saleData.items,
      total: saleData.total,
      receiptNumber: saleData.receiptNumber,
      date: new Date().toISOString()
    };

    // Try network printer first, fallback to cloud
    try {
      const networkPrinters = printerManager.getPrinters()
        .filter((p: any) => p.type === 'network' && p.status === 'connected');
        
      if (networkPrinters.length > 0) {
        await printerManager.print(
          this.generateReceiptData(receiptData),
          networkPrinters[0].id
        );
      } else {
        await this.cloudPrint.printReceipt(receiptData);
      }
    } catch (error) {
      console.error('Receipt printing failed:', error);
      throw error;
    }
  }

  private async printKitchenTicket(saleData: any) {
    const ticketData = {
      orderNumber: saleData.orderNumber,
      items: saleData.kitchenItems,
      notes: saleData.notes,
      timestamp: new Date()
    };

    // Find kitchen printer
    const kitchenPrinter = printerManager.getPrinters()
      .find((p: any) => p.name.toLowerCase().includes('kitchen') && p.status === 'connected');

    if (kitchenPrinter) {
      await printerManager.print(
        this.generateTicketData(ticketData),
        kitchenPrinter.id
      );
    }
  }

  private generateReceiptData(data: any): Uint8Array {
    // Implementation would use ESCPOSCommands
    // This is a simplified example
    const commands = new ESCPOSCommands();
    // ... generate receipt commands
    return commands.getBuffer();
  }

  private generateTicketData(data: any): Uint8Array {
    // Implementation would use ESCPOSCommands
    // This is a simplified example
    const commands = new ESCPOSCommands();
    // ... generate ticket commands
    return commands.getBuffer();
  }
}

// Example 6: Print Server Status Monitor
export class PrintServerMonitor {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startMonitoring(printers: any[], intervalMs = 30000) {
    printers.forEach(printer => {
      if (printer.type === 'network') {
        this.monitorNetworkPrinter(printer, intervalMs);
      } else if (printer.type === 'api') {
        this.monitorAPIPrinter(printer, intervalMs);
      }
    });
  }

  stopMonitoring(printerId?: string) {
    if (printerId) {
      const interval = this.intervals.get(printerId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(printerId);
      }
    } else {
      // Stop all monitoring
      this.intervals.forEach(interval => clearInterval(interval));
      this.intervals.clear();
    }
  }

  private monitorNetworkPrinter(printer: any, intervalMs: number) {
    const interval = setInterval(async () => {
      try {
        const networkPrint = new NetworkPrintServer();
        const isOnline = await networkPrint.testPrinter(
          printer.config.ipAddress,
          printer.config.port
        );

        const currentStatus = printer.status;
        const newStatus = isOnline ? 'connected' : 'disconnected';

        if (currentStatus !== newStatus) {
          console.log(`Printer ${printer.name} status changed: ${currentStatus} → ${newStatus}`);
          
          // Update printer status
          // This would integrate with your state management
        }
      } catch (error) {
        console.error(`Failed to monitor printer ${printer.name}:`, error);
      }
    }, intervalMs);

    this.intervals.set(printer.id, interval);
  }

  private monitorAPIPrinter(printer: any, intervalMs: number) {
    const interval = setInterval(async () => {
      try {
        const api = new PrintServiceAPI(
          printer.config.apiEndpoint,
          printer.config.apiKey
        );

        const response = await fetch(`${printer.config.apiEndpoint}/status`);
        const status = await response.json();

        console.log(`API Printer ${printer.name} status:`, status);
      } catch (error) {
        console.error(`Failed to check API printer ${printer.name}:`, error);
      }
    }, intervalMs);

    this.intervals.set(printer.id, interval);
  }
}

// Usage Examples:

// Cloud printing
const cloudService = new CloudPrintService({
  endpoint: 'https://print-api.example.com',
  apiKey: 'your-api-key'
});

// Network printing
const networkService = new NetworkPrintServer();

// POS integration
const posIntegration = new POSIntegration({
  cloud: {
    endpoint: 'https://print-api.example.com',
    apiKey: 'your-api-key'
  },
  proxyUrl: 'http://localhost:8080'
});

// Start monitoring
const monitor = new PrintServerMonitor();
monitor.startMonitoring(printerManager.getPrinters());
