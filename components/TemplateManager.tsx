import { useState, useEffect } from 'react';
import { printerManager } from '../utils/PrinterManager';
import { ESCPOSCommands } from '../utils/escpos';

interface Template {
  id: string;
  name: string;
  description: string;
  fields: string[];
  example: any;
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateData, setTemplateData] = useState<any>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [printHistory, setPrintHistory] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
    loadPrintHistory();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadPrintHistory = async () => {
    try {
      const response = await fetch('/api/print-history?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setPrintHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load print history:', error);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateData(template.example);
    setIsPreviewMode(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setTemplateData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePreview = () => {
    if (!selectedTemplate) return '';

    let preview = '';
    
    switch (selectedTemplate.id) {
      case 'receipt':
        preview = `
===============================
${templateData.storeName || 'STORE NAME'}
${templateData.address || 'Store Address'}
===============================

Receipt #: ${templateData.receiptNumber || 'R001'}
Date: ${new Date().toLocaleString()}

-------------------------------
ITEMS
-------------------------------`;

        if (templateData.items && Array.isArray(templateData.items)) {
          templateData.items.forEach((item: any) => {
            const name = (item.name || 'Item').padEnd(20, ' ');
            const price = `$${(item.price || 0).toFixed(2)}`;
            preview += `\n${name}${price}`;
          });
        }

        preview += `
-------------------------------
TOTAL: $${(templateData.total || 0).toFixed(2)}
-------------------------------

Thank you for your purchase!
`;
        break;

      case 'label':
        preview = `
${templateData.productName || 'PRODUCT NAME'}

Barcode: ${templateData.barcode || '1234567890'}

Price: $${(templateData.price || 0).toFixed(2)}
`;
        break;

      case 'ticket':
        preview = `
===============================
ORDER #${templateData.orderNumber || '001'}
${new Date().toLocaleTimeString()}
===============================

`;
        if (templateData.items && Array.isArray(templateData.items)) {
          templateData.items.forEach((item: string, index: number) => {
            preview += `${index + 1}. ${item}\n`;
          });
        }

        if (templateData.notes) {
          preview += `\nNotes: ${templateData.notes}`;
        }

        preview += `

--- KITCHEN COPY ---
`;
        break;

      default:
        preview = `Template: ${selectedTemplate.name}\nData: ${JSON.stringify(templateData, null, 2)}`;
    }

    return preview;
  };

  const handlePrint = async () => {
    if (!selectedTemplate) {
      setStatus('No template selected');
      return;
    }

    const activePrinter = printerManager.getActivePrinter();
    if (!activePrinter) {
      setStatus('No active printer selected');
      return;
    }

    try {
      setStatus('Printing...');

      // Send via API print endpoint with template
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          printerType: activePrinter.type,
          printerConfig: activePrinter.config,
          template: selectedTemplate.id,
          templateData: templateData
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus(`Print completed - Job ID: ${result.jobId}`);
        
        // Add to history
        await fetch('/api/print-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobId: result.jobId,
            printerId: activePrinter.id,
            printerName: activePrinter.name,
            template: selectedTemplate.id,
            status: 'completed'
          })
        });

        loadPrintHistory();
      } else {
        setStatus(`Print failed: ${result.error}`);
      }

    } catch (error: any) {
      setStatus(`Print error: ${error.message}`);
    }
  };

  const renderFieldInput = (field: string, value: any) => {
    if (field === 'items' && Array.isArray(value)) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items:
          </label>
          {value.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item.name || ''}
                onChange={(e) => {
                  const newItems = [...value];
                  newItems[index] = { ...item, name: e.target.value };
                  handleFieldChange('items', newItems);
                }}
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="Item name"
              />
              <input
                type="number"
                step="0.01"
                value={item.price || ''}
                onChange={(e) => {
                  const newItems = [...value];
                  newItems[index] = { ...item, price: parseFloat(e.target.value) || 0 };
                  handleFieldChange('items', newItems);
                }}
                className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="Price"
              />
              <button
                onClick={() => {
                  const newItems = value.filter((_, i) => i !== index);
                  handleFieldChange('items', newItems);
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newItems = [...value, { name: '', price: 0 }];
              handleFieldChange('items', newItems);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Add Item
          </button>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field}:
          </label>
          {value.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newArray = [...value];
                  newArray[index] = e.target.value;
                  handleFieldChange(field, newArray);
                }}
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => {
                  const newArray = value.filter((_, i) => i !== index);
                  handleFieldChange(field, newArray);
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newArray = [...value, ''];
              handleFieldChange(field, newArray);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Add Item
          </button>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field}:
        </label>
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          step={typeof value === 'number' ? '0.01' : undefined}
          value={value || ''}
          onChange={(e) => {
            const newValue = typeof value === 'number' ? 
              parseFloat(e.target.value) || 0 : 
              e.target.value;
            handleFieldChange(field, newValue);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Template Manager</h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p className="text-lg text-gray-600">{status}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Templates</h3>
          <div className="space-y-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-600">{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Template Configuration */}
        <div>
          {selectedTemplate ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Configure {selectedTemplate.name}
              </h3>
              
              <div className="space-y-4">
                {selectedTemplate.fields.map(field => (
                  <div key={field}>
                    {renderFieldInput(field, templateData[field])}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
                </button>
                
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Print Template
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a template to configure</p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          {isPreviewMode && selectedTemplate ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-auto max-h-80">
                {generatePreview()}
              </pre>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Print Jobs</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {printHistory.map(job => (
                  <div key={job.id} className="p-3 border border-gray-200 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{job.template}</div>
                        <div className="text-xs text-gray-600">{job.printerName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(job.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
