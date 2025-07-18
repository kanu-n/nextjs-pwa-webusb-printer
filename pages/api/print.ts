import { NextApiRequest, NextApiResponse } from 'next';
import { ESCPOSCommands } from '../../utils/escpos';

interface PrintRequest {
  printerType: 'network' | 'api';
  printerConfig: {
    ip?: string;
    port?: number;
    endpoint?: string;
    apiKey?: string;
  };
  data?: number[]; // Raw ESC/POS data
  template?: string;
  templateData?: any;
  text?: string; // Simple text printing
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const printRequest: PrintRequest = req.body;

    // Validate request
    if (!printRequest.printerType || !printRequest.printerConfig) {
      return res.status(400).json({ error: 'Missing printer configuration' });
    }

    let printData: Uint8Array;

    // Generate print data based on request type
    if (printRequest.data) {
      // Raw ESC/POS data
      printData = new Uint8Array(printRequest.data);
    } else if (printRequest.template && printRequest.templateData) {
      // Template-based printing
      printData = await generateTemplateData(printRequest.template, printRequest.templateData);
    } else if (printRequest.text) {
      // Simple text printing
      printData = generateTextData(printRequest.text);
    } else {
      return res.status(400).json({ error: 'No print data provided' });
    }

    // Send to printer based on type
    let result;
    if (printRequest.printerType === 'network') {
      result = await printToNetwork(printRequest.printerConfig, printData);
    } else if (printRequest.printerType === 'api') {
      result = await printToAPI(printRequest.printerConfig, printData);
    } else {
      return res.status(400).json({ error: 'Unsupported printer type' });
    }

    res.status(200).json({
      success: true,
      jobId: result.jobId || `job_${Date.now()}`,
      message: 'Print job submitted successfully'
    });

  } catch (error: any) {
    console.error('Print API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Print job failed'
    });
  }
}

async function printToNetwork(config: any, data: Uint8Array): Promise<any> {
  const { ip, port = 9100 } = config;
  
  if (!ip) {
    throw new Error('IP address required for network printing');
  }

  // In a real implementation, you'd use Node.js net module to connect to the printer
  // For this example, we'll simulate the network printing
  try {
    // Simulate network printing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`Simulated print to ${ip}:${port}, data length: ${data.length}`);
    
    return {
      jobId: `network_${Date.now()}`,
      status: 'sent'
    };
  } catch (error) {
    throw new Error(`Network print failed: ${error}`);
  }
}

async function printToAPI(config: any, data: Uint8Array): Promise<any> {
  const { endpoint, apiKey } = config;
  
  if (!endpoint) {
    throw new Error('API endpoint required');
  }

  try {
    const response = await fetch(`${endpoint}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        data: Array.from(data),
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`API print failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`API print failed: ${error}`);
  }
}

function generateTextData(text: string): Uint8Array {
  const commands = new ESCPOSCommands();
  
  commands
    .init()
    .align('left')
    .addText(text)
    .feed(3)
    .cut();
    
  return commands.getBuffer();
}

async function generateTemplateData(template: string, data: any): Promise<Uint8Array> {
  const commands = new ESCPOSCommands();
  
  switch (template) {
    case 'receipt':
      return generateReceiptTemplate(data);
    case 'label':
      return generateLabelTemplate(data);
    case 'ticket':
      return generateTicketTemplate(data);
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

function generateReceiptTemplate(data: any): Uint8Array {
  const commands = new ESCPOSCommands();
  
  commands
    .init()
    .align('center')
    .setTextSize(2, 2)
    .bold(true)
    .addText(`${data.storeName || 'STORE'}\n`)
    .bold(false)
    .setTextSize(1, 1)
    .addText(`${data.address || ''}\n`)
    .addText('------------------------\n')
    .align('left')
    .addText(`Date: ${new Date().toLocaleString()}\n`)
    .addText(`Receipt #: ${data.receiptNumber || Math.random().toString(36).substr(2, 9)}\n`)
    .addText('------------------------\n');

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any) => {
      const name = item.name.padEnd(16, ' ');
      const price = `$${item.price.toFixed(2)}`;
      commands.addText(`${name}${price}\n`);
    });
  }

  const total = data.total || 0;
  commands
    .addText('------------------------\n')
    .bold(true)
    .addText(`TOTAL: $${total.toFixed(2)}\n`)
    .bold(false)
    .feed(2)
    .align('center')
    .addText('Thank you!\n')
    .feed(3)
    .cut();

  return commands.getBuffer();
}

function generateLabelTemplate(data: any): Uint8Array {
  const commands = new ESCPOSCommands();
  
  commands
    .init()
    .align('center')
    .bold(true)
    .addText(`${data.productName || 'PRODUCT'}\n`)
    .bold(false);

  if (data.barcode) {
    commands.barcode(data.barcode);
  }

  commands
    .setTextSize(2, 2)
    .addText(`$${data.price || '0.00'}\n`)
    .setTextSize(1, 1)
    .feed(2)
    .cut();

  return commands.getBuffer();
}

function generateTicketTemplate(data: any): Uint8Array {
  const commands = new ESCPOSCommands();
  
  commands
    .init()
    .align('center')
    .setTextSize(2, 2)
    .bold(true)
    .addText(`ORDER #${data.orderNumber || '001'}\n`)
    .bold(false)
    .setTextSize(1, 1)
    .addText(`${new Date().toLocaleTimeString()}\n`)
    .addText('========================\n')
    .align('left');

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: string, index: number) => {
      commands.addText(`${index + 1}. ${item}\n`);
    });
  }

  if (data.notes) {
    commands
      .feed(1)
      .addText('Notes:\n')
      .underline(true)
      .addText(`${data.notes}\n`)
      .underline(false);
  }

  commands
    .feed(2)
    .align('center')
    .addText('--- KITCHEN COPY ---\n')
    .feed(3)
    .cut();

  return commands.getBuffer();
}
