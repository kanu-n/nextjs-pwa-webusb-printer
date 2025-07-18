/**
 * Multi-Printer Integration Examples
 * 
 * This file demonstrates how to use the new multi-printer features
 * programmatically in your own applications.
 */

import { printerManager } from '../utils/PrinterManager';
import { ESCPOSCommands } from '../utils/escpos';

// Example 1: Setting up multiple printers
export async function setupMultiplePrinters() {
  console.log('Setting up multiple printers...');

  // Add USB printer
  const usbPrinterId = await printerManager.addPrinter({
    name: 'Reception USB Printer',
    type: 'usb',
    paperWidth: 80
  });

  // Add network printer
  const networkPrinterId = await printerManager.addPrinter({
    name: 'Kitchen Network Printer',
    type: 'network',
    ipAddress: '192.168.1.100',
    port: 9100,
    paperWidth: 80
  });

  // Add API printer
  const apiPrinterId = await printerManager.addPrinter({
    name: 'Cloud Print Service',
    type: 'api',
    apiEndpoint: 'https://api.printservice.com/v1',
    apiKey: 'your-api-key'
  });

  // Connect all printers
  await printerManager.connectPrinter(usbPrinterId);
  await printerManager.connectPrinter(networkPrinterId);
  await printerManager.connectPrinter(apiPrinterId);

  console.log('All printers connected!');
  
  return { usbPrinterId, networkPrinterId, apiPrinterId };
}

// Example 2: Print to specific printer
export async function printToSpecificPrinter(printerId: string, orderData: any) {
  const commands = new ESCPOSCommands();
  
  commands
    .init()
    .align('center')
    .setTextSize(2, 2)
    .bold(true)
    .addText(`ORDER #${orderData.orderNumber}\n`)
    .bold(false)
    .setTextSize(1, 1)
    .addText(`${new Date().toLocaleTimeString()}\n`)
    .addText('========================\n')
    .align('left');

  orderData.items.forEach((item: string, index: number) => {
    commands.addText(`${index + 1}. ${item}\n`);
  });

  if (orderData.notes) {
    commands
      .feed(1)
      .addText('Notes:\n')
      .underline(true)
      .addText(`${orderData.notes}\n`)
      .underline(false);
  }

  commands
    .feed(2)
    .align('center')
    .addText('--- KITCHEN COPY ---\n')
    .feed(3)
    .cut();

  // Print to specific printer
  const jobId = await printerManager.print(commands.getBuffer(), printerId);
  console.log(`Print job ${jobId} sent to printer ${printerId}`);
  
  return jobId;
}

// Example 3: Batch printing to multiple printers
export async function batchPrint(receiptData: any, orderData: any) {
  const printers = printerManager.getPrinters();
  const jobs = [];

  for (const printer of printers) {
    if (printer.status === 'connected') {
      try {
        let jobId;
        
        if (printer.name.includes('Reception')) {
          // Print receipt to reception printer
          jobId = await printReceipt(receiptData, printer.id);
        } else if (printer.name.includes('Kitchen')) {
          // Print order to kitchen printer
          jobId = await printToSpecificPrinter(printer.id, orderData);
        }
        
        if (jobId) {
          jobs.push({ printerId: printer.id, jobId });
        }
      } catch (error) {
        console.error(`Failed to print to ${printer.name}:`, error);
      }
    }
  }

  return jobs;
}

// Example 4: Template-based printing via API
export async function printWithTemplate(templateId: string, data: any, printerType = 'network') {
  const response = await fetch('/api/print', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      printerType,
      printerConfig: {
        ip: '192.168.1.100',
        port: 9100
      },
      template: templateId,
      templateData: data
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log(`Template print job ${result.jobId} completed`);
    return result.jobId;
  } else {
    throw new Error(result.error);
  }
}

// Example 5: Receipt printing helper
export async function printReceipt(receiptData: any, printerId?: string) {
  return await printWithTemplate('receipt', {
    storeName: receiptData.storeName || 'My Store',
    address: receiptData.address || '123 Main Street',
    items: receiptData.items || [],
    total: receiptData.total || 0,
    receiptNumber: receiptData.receiptNumber || `R${Date.now()}`
  });
}

// Example 6: Network printer discovery
export async function discoverAndSetupNetworkPrinters() {
  console.log('Discovering network printers...');
  
  const networkPrinters = await printerManager.discoverNetworkPrinters();
  
  for (const printer of networkPrinters) {
    const printerId = await printerManager.addPrinter({
      name: printer.name,
      type: 'network',
      ipAddress: printer.ip,
      port: printer.port || 9100
    });
    
    try {
      await printerManager.connectPrinter(printerId);
      console.log(`Connected to ${printer.name} at ${printer.ip}`);
    } catch (error) {
      console.error(`Failed to connect to ${printer.name}:`, error);
    }
  }
}

// Example 7: Event handling
export function setupPrinterEventHandlers() {
  printerManager.addEventListener('printerAdded', (printer: any) => {
    console.log(`New printer added: ${printer.name}`);
    
    // Auto-connect to new printers
    printerManager.connectPrinter(printer.id).catch(console.error);
  });

  printerManager.addEventListener('printerStatusChanged', ({ id, status, error }: any) => {
    const printer = printerManager.getPrinter(id);
    console.log(`Printer ${printer?.name} status: ${status}`);
    
    if (error) {
      console.error(`Printer error: ${error}`);
    }
  });

  printerManager.addEventListener('printJobUpdated', (job: any) => {
    console.log(`Print job ${job.id} status: ${job.status}`);
    
    if (job.status === 'failed') {
      console.error(`Print job failed: ${job.error}`);
    }
  });
}

// Example 8: Print queue management
export function managePrintQueue() {
  const queue = printerManager.getPrintQueue();
  
  console.log(`Current print queue has ${queue.length} jobs`);
  
  // Process failed jobs
  const failedJobs = queue.filter(job => job.status === 'failed');
  console.log(`Found ${failedJobs.length} failed jobs`);
  
  // Clear completed jobs
  const completedJobs = queue.filter(job => job.status === 'completed');
  completedJobs.forEach(job => {
    printerManager.removePrintJob(job.id);
  });
}

// Example usage in a React component:
/*
import { useEffect, useState } from 'react';
import { 
  setupMultiplePrinters, 
  printReceipt, 
  setupPrinterEventHandlers 
} from '../examples/multi-printer-integration';

export function MyComponent() {
  const [printers, setPrinters] = useState([]);

  useEffect(() => {
    // Setup printers on component mount
    setupMultiplePrinters();
    setupPrinterEventHandlers();
    
    // Load printer list
    setPrinters(printerManager.getPrinters());
  }, []);

  const handlePrintReceipt = async () => {
    try {
      const jobId = await printReceipt({
        storeName: 'My Store',
        items: [
          { name: 'Coffee', price: 4.50 },
          { name: 'Pastry', price: 3.25 }
        ],
        total: 7.75
      });
      
      console.log(`Receipt printed with job ID: ${jobId}`);
    } catch (error) {
      console.error('Failed to print receipt:', error);
    }
  };

  return (
    <div>
      <h2>Multi-Printer Example</h2>
      <button onClick={handlePrintReceipt}>
        Print Receipt
      </button>
    </div>
  );
}
*/
