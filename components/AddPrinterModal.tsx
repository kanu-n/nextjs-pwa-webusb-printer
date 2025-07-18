import { useState } from 'react';
import { PrinterConfig, PrinterConnectionType } from '../types/printer';
import { printerManager } from '../utils/PrinterManager';

interface AddPrinterModalProps {
  onAdd: (config: PrinterConfig) => void;
  onClose: () => void;
}

export default function AddPrinterModal({ onAdd, onClose }: AddPrinterModalProps) {
  const [step, setStep] = useState<'type' | 'config' | 'test'>('type');
  const [printerType, setPrinterType] = useState<PrinterConnectionType>('usb');
  const [config, setConfig] = useState<Partial<PrinterConfig>>({
    name: '',
    paperWidth: 80
  });
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [testStatus, setTestStatus] = useState<string>('');

  const handleTypeSelect = (type: PrinterConnectionType) => {
    setPrinterType(type);
    setConfig(prev => ({ ...prev, type }));
    setStep('config');
  };

  const handleConfigSubmit = () => {
    if (!config.name?.trim()) {
      alert('Please enter a printer name');
      return;
    }
    setStep('test');
  };

  const handleDiscoverDevices = async () => {
    setIsDiscovering(true);
    setDiscoveredDevices([]);
    
    try {
      let devices: any[] = [];
      
      switch (printerType) {
        case 'usb':
          devices = await printerManager.discoverUSBPrinters();
          break;
        case 'network':
          devices = await printerManager.discoverNetworkPrinters();
          break;
        case 'bluetooth':
          devices = await printerManager.discoverBluetoothPrinters();
          break;
      }
      
      setDiscoveredDevices(devices);
    } catch (error: any) {
      alert(`Discovery failed: ${error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleDeviceSelect = (device: any) => {
    const updatedConfig = { ...config };
    
    switch (printerType) {
      case 'usb':
        updatedConfig.vendorId = device.vendorId;
        updatedConfig.productId = device.productId;
        updatedConfig.name = device.name || `USB Printer ${device.vendorId}:${device.productId}`;
        break;
      case 'network':
        updatedConfig.ipAddress = device.ip;
        updatedConfig.port = device.port || 9100;
        updatedConfig.name = device.name || `Network Printer (${device.ip})`;
        break;
      case 'bluetooth':
        updatedConfig.bluetoothId = device.id;
        updatedConfig.name = device.name || 'Bluetooth Printer';
        break;
    }
    
    setConfig(updatedConfig);
  };

  const handleTestConnection = async () => {
    setTestStatus('Testing connection...');
    
    try {
      const tempConfig = { ...config, type: printerType } as PrinterConfig;
      
      // Create a temporary printer for testing
      const tempId = await printerManager.addPrinter(tempConfig);
      const success = await printerManager.testPrinter(tempId);
      
      // Remove temporary printer
      printerManager.removePrinter(tempId);
      
      if (success) {
        setTestStatus('✅ Connection successful!');
      } else {
        setTestStatus('❌ Connection failed');
      }
    } catch (error: any) {
      setTestStatus(`❌ Test failed: ${error.message}`);
    }
  };

  const handleFinalAdd = () => {
    const finalConfig = { ...config, type: printerType } as PrinterConfig;
    onAdd(finalConfig);
  };

  const renderTypeSelection = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Printer Type</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleTypeSelect('usb')}
          className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 text-left"
        >
          <div className="text-lg font-semibold mb-2">🔌 USB</div>
          <div className="text-sm text-gray-600">
            Direct USB connection via WebUSB API
          </div>
        </button>
        
        <button
          onClick={() => handleTypeSelect('network')}
          className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 text-left"
        >
          <div className="text-lg font-semibold mb-2">🌐 Network</div>
          <div className="text-sm text-gray-600">
            TCP/IP network printer (IP address)
          </div>
        </button>
        
        <button
          onClick={() => handleTypeSelect('bluetooth')}
          className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 text-left"
        >
          <div className="text-lg font-semibold mb-2">📶 Bluetooth</div>
          <div className="text-sm text-gray-600">
            Bluetooth-enabled thermal printer
          </div>
        </button>
        
        <button
          onClick={() => handleTypeSelect('api')}
          className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 text-left"
        >
          <div className="text-lg font-semibold mb-2">🔗 API</div>
          <div className="text-sm text-gray-600">
            Remote printer via API endpoint
          </div>
        </button>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Configure {printerType.toUpperCase()} Printer
      </h3>
      
      {/* Common fields */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Printer Name
        </label>
        <input
          type="text"
          value={config.name || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My Thermal Printer"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paper Width
        </label>
        <select
          value={config.paperWidth || 80}
          onChange={(e) => setConfig(prev => ({ ...prev, paperWidth: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={58}>58mm</option>
          <option value={80}>80mm</option>
        </select>
      </div>

      {/* Type-specific fields */}
      {printerType === 'network' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IP Address
            </label>
            <input
              type="text"
              value={config.ipAddress || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, ipAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="192.168.1.100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Port
            </label>
            <input
              type="number"
              value={config.port || 9100}
              onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="9100"
            />
          </div>
        </>
      )}

      {printerType === 'api' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint
            </label>
            <input
              type="url"
              value={config.apiEndpoint || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.printer.com/v1"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key (Optional)
            </label>
            <input
              type="password"
              value={config.apiKey || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional authentication key"
            />
          </div>
        </>
      )}

      {printerType === 'usb' && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            USB printers will be configured during connection.
          </p>
          <button
            onClick={handleDiscoverDevices}
            disabled={isDiscovering}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isDiscovering ? 'Discovering...' : 'Discover USB Printers'}
          </button>
        </div>
      )}

      {/* Discovery results */}
      {discoveredDevices.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Discovered Devices:</h4>
          <div className="space-y-2">
            {discoveredDevices.map((device, index) => (
              <button
                key={index}
                onClick={() => handleDeviceSelect(device)}
                className="w-full p-3 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                <div className="font-medium">{device.name}</div>
                {device.ip && <div className="text-sm text-gray-600">IP: {device.ip}</div>}
                {device.vendorId && (
                  <div className="text-sm text-gray-600">
                    VID: 0x{device.vendorId.toString(16)} PID: 0x{device.productId?.toString(16)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setStep('type')}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Back
        </button>
        <button
          onClick={handleConfigSubmit}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderTest = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Test Connection</h3>
      
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Configuration Summary:</h4>
        <p><strong>Name:</strong> {config.name}</p>
        <p><strong>Type:</strong> {printerType.toUpperCase()}</p>
        {config.ipAddress && <p><strong>IP:</strong> {config.ipAddress}:{config.port}</p>}
        {config.apiEndpoint && <p><strong>API:</strong> {config.apiEndpoint}</p>}
      </div>

      {testStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p>{testStatus}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setStep('config')}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Back
        </button>
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Test Connection
        </button>
        <button
          onClick={handleFinalAdd}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Printer
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add New Printer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {step === 'type' && renderTypeSelection()}
        {step === 'config' && renderConfiguration()}
        {step === 'test' && renderTest()}
      </div>
    </div>
  );
}
