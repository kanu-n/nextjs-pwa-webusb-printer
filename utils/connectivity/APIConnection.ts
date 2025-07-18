import { PrinterConnection } from '../../types/printer';

export class APIPrinterConnection implements PrinterConnection {
  private isConnectedFlag: boolean = false;
  private currentStatus: string = 'Not connected';

  constructor(
    private apiEndpoint: string,
    private apiKey?: string
  ) {}

  async connect(): Promise<void> {
    try {
      this.currentStatus = 'Testing API connection...';

      // Test the API endpoint
      const response = await fetch(`${this.apiEndpoint}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`API connection failed: ${response.status} ${response.statusText}`);
      }

      const status = await response.json();
      this.isConnectedFlag = true;
      this.currentStatus = `Connected to API printer: ${status.name || 'Remote Printer'}`;

    } catch (error: any) {
      this.currentStatus = `API error: ${error.message}`;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    this.currentStatus = 'Disconnected';
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.isConnectedFlag) {
      throw new Error('API printer not connected');
    }

    try {
      // Convert Uint8Array to base64 for JSON transmission
      const base64Data = btoa(String.fromCharCode(...Array.from(data)));

      const response = await fetch(`${this.apiEndpoint}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          data: base64Data,
          format: 'base64',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Print failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Print job submitted:', result.jobId);

    } catch (error: any) {
      throw new Error(`API print failed: ${error.message}`);
    }
  }

  async printWithTemplate(templateName: string, data: any): Promise<void> {
    if (!this.isConnectedFlag) {
      throw new Error('API printer not connected');
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/print-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          template: templateName,
          data: data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Template print failed: ${response.status}`);
      }

    } catch (error: any) {
      throw new Error(`Template print failed: ${error.message}`);
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  getStatus(): string {
    return this.currentStatus;
  }

  // API-specific methods
  async getApiStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`Status request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get API status: ${error}`);
    }
  }

  async getAvailableTemplates(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/templates`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`Templates request failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  async getPrintHistory(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/history?limit=${limit}`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`History request failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Failed to get print history:', error);
      return [];
    }
  }
}
