import { useState, useEffect } from 'react';
import { PrinterDevice, PrinterConfig, PrintJob } from '../types/printer';
import { printerManager } from '../utils/PrinterManager';
import { ESCPOSCommands } from '../utils/escpos';
import AddPrinterModal from './AddPrinterModal';

export default function MultiPrinterController() {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [status, setStatus] = useState<string>('Ready');
  const [printText, setPrintText] = useState('Hello from Multi-Printer!');

  useEffect(() => {
    // Load printers and set up event listeners
    loadPrinters();
    setupEventListeners();

    return () => {
      // Cleanup
      printerManager.disconnectAll();
    };
  }, []);

  const loadPrinters = () => {
    const allPrinters = printerManager.getPrinters();
    setPrinters(allPrinters);
    
    const active = printerManager.getActivePrinter();
    setActivePrinterId(active?.id || null);
  };

  const setupEventListeners = () => {
    printerManager.addEventListener('printerAdded', loadPrinters);
    printerManager.addEventListener('printerRemoved', loadPrinters);
    printerManager.addEventListener('printerStatusChanged', loadPrinters);
    printerManager.addEventListener('activePrinterChanged', (id: string) => {
      setActivePrinterId(id);
    });
    printerManager.addEventListener('printJobAdded', (job: PrintJob) => {
      setPrintQueue(prev => [...prev, job]);
    });
    printerManager.addEventListener('printJobUpdated', (job: PrintJob) => {
      setPrintQueue(prev => prev.map(j => j.id === job.id ? job : j));
    });
  };

  const handleAddPrinter = async (config: PrinterConfig) => {
    try {
      setStatus('Adding printer...');
      const id = await printerManager.addPrinter(config);
      setStatus(`Printer "${config.name}" added successfully`);
      setShowAddPrinter(false);
      
      // Auto-select if first printer
      if (printers.length === 0) {
        printerManager.setActivePrinter(id);
      }
    } catch (error: any) {
      setStatus(`Error adding printer: ${error.message}`);
    }
  };

  const handleConnect = async (printerId: string) => {
    try {
      setStatus('Connecting...');
      await printerManager.connectPrinter(printerId);
      setStatus('Connected successfully');
    } catch (error: any) {
      setStatus(`Connection failed: ${error.message}`);
    }
  };

  const handleDisconnect = async (printerId: string) => {
    try {
      await printerManager.disconnectPrinter(printerId);
      setStatus('Disconnected');
    } catch (error: any) {
      setStatus(`Disconnect error: ${error.message}`);
    }
  };

  const handlePrint = async () => {
    if (!activePrinterId) {
      setStatus('No printer selected');
      return;
    }

    try {
      setStatus('Printing...');
      
      const commands = new ESCPOSCommands();
      commands
        .init()
        .align('center')
        .setTextSize(2, 2)
        .bold(true)
        .addText('MULTI-PRINTER TEST\n')
        .bold(false)
        .setTextSize(1, 1)
        .addText('------------------------\n')
        .align('left')
        .addText(`Date: ${new Date().toLocaleString()}\n`)
        .addText(`Message: ${printText}\n`)
        .addText(`Printer: ${printers.find(p => p.id === activePrinterId)?.name}\n\n`)
        .addText('Multi-connection features:\n')
        .addText('✓ USB Support\n')
        .addText('✓ Network Printing\n')
        .addText('✓ Bluetooth Printing\n')
        .addText('✓ API Integration\n')
        .feed(3)
        .cut();

      const jobId = await printerManager.print(commands.getBuffer());
      setStatus(`Print job ${jobId} completed`);
      
    } catch (error: any) {
      setStatus(`Print failed: ${error.message}`);
    }
  };

  const handleRemovePrinter = async (printerId: string) => {
    if (confirm('Are you sure you want to remove this printer?')) {
      printerManager.removePrinter(printerId);
      setStatus('Printer removed');
    }
  };

  const renderPrinterCard = (printer: PrinterDevice) => (
    <div 
      key={printer.id}
      className={`border rounded-lg p-4 mb-4 ${
        activePrinterId === printer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{printer.name}</h3>
          <p className="text-sm text-gray-600">
            Type: {printer.type.toUpperCase()} | 
            Status: <span className={`font-medium ${
              printer.status === 'connected' ? 'text-green-600' :
              printer.status === 'connecting' ? 'text-yellow-600' :
              printer.status === 'error' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {printer.status}
            </span>
          </p>
          {printer.lastUsed && (
            <p className="text-xs text-gray-500">
              Last used: {printer.lastUsed.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => printerManager.setActivePrinter(printer.id)}
            className={`px-3 py-1 text-sm rounded ${
              activePrinterId === printer.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {activePrinterId === printer.id ? 'Active' : 'Select'}
          </button>
          
          <button
            onClick={() => handleRemovePrinter(printer.id)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {printer.status === 'connected' ? (
          <button
            onClick={() => handleDisconnect(printer.id)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => handleConnect(printer.id)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={printer.status === 'connecting'}
          >
            {printer.status === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        )}
        
        <button
          onClick={() => printerManager.testPrinter(printer.id)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test
        </button>
      </div>

      {/* Printer-specific details */}
      <div className="mt-3 text-xs text-gray-600">
        {printer.type === 'network' && printer.config.ipAddress && (
          <p>IP: {printer.config.ipAddress}:{printer.config.port || 9100}</p>
        )}
        {printer.type === 'usb' && printer.config.vendorId && (
          <p>VID: 0x{printer.config.vendorId.toString(16)} PID: 0x{printer.config.productId?.toString(16) || '????'}</p>
        )}
        {printer.type === 'api' && printer.config.apiEndpoint && (
          <p>Endpoint: {printer.config.apiEndpoint}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Multi-Printer Control</h2>
        <button
          onClick={() => setShowAddPrinter(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Printer
        </button>
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p className="text-sm font-semibold text-gray-700">Status:</p>
        <p className="text-lg text-gray-600">{status}</p>
      </div>

      {/* Print Text Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Print Text:
        </label>
        <input
          type="text"
          value={printText}
          onChange={(e) => setPrintText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter text to print..."
        />
      </div>

      {/* Quick Print Button */}
      {activePrinterId && (
        <div className="mb-6">
          <button
            onClick={handlePrint}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-lg font-semibold"
            disabled={!printers.find(p => p.id === activePrinterId && p.status === 'connected')}
          >
            Print to Active Printer
          </button>
        </div>
      )}

      {/* Printers List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">
          Configured Printers ({printers.length})
        </h3>
        
        {printers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No printers configured</p>
            <button
              onClick={() => setShowAddPrinter(true)}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Add your first printer
            </button>
          </div>
        ) : (
          <div>
            {printers.map(renderPrinterCard)}
          </div>
        )}
      </div>

      {/* Print Queue */}
      {printQueue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Print Queue</h3>
          <div className="max-h-40 overflow-y-auto">
            {printQueue.slice(-5).map(job => (
              <div key={job.id} className="flex justify-between items-center p-2 border-b">
                <span className="text-sm">
                  {job.timestamp.toLocaleTimeString()} - {printers.find(p => p.id === job.printerId)?.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                  job.status === 'failed' ? 'bg-red-100 text-red-800' :
                  job.status === 'printing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Printer Modal */}
      {showAddPrinter && (
        <AddPrinterModal
          onAdd={handleAddPrinter}
          onClose={() => setShowAddPrinter(false)}
        />
      )}
    </div>
  );
}
