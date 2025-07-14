import { useState, useRef } from "react";
import { ESCPOSCommands } from "../utils/escpos";
import { USBOutTransferResult } from "@/types/webusb";

interface USBDevice {
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(
    endpointNumber: number,
    data: BufferSource
  ): Promise<USBOutTransferResult>;
  close(): Promise<void>;
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  configuration: {
    configurationValue: number;
    interfaces: Array<{
      interfaceNumber: number;
      claimed: boolean;
      alternates: Array<{
        interfaceClass: number;
        interfaceSubclass: number;
        interfaceProtocol: number;
        endpoints: Array<{
          endpointNumber: number;
          direction: string;
          type: string;
          packetSize: number;
        }>;
      }>;
      alternate: {
        interfaceClass: number;
        interfaceSubclass: number;
        interfaceProtocol: number;
        endpoints: Array<{
          endpointNumber: number;
          direction: string;
          type: string;
          packetSize: number;
        }>;
      };
    }>;
  } | null;
  releaseInterface?(interfaceNumber: number): Promise<void>;
  reset?(): Promise<void>;
}

export default function PrinterController() {
  const [device, setDevice] = useState<USBDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>("Not connected");
  const [isWebUSBSupported, setIsWebUSBSupported] = useState(true);
  const [printText, setPrintText] = useState("Hello from WebUSB!");

  // Check WebUSB support on mount
  useState(() => {
    if (typeof navigator !== "undefined" && !("usb" in navigator)) {
      setIsWebUSBSupported(false);
      setStatus("WebUSB not supported in this browser");
    }
  });

  const connectPrinter = async () => {
    try {
      setStatus("Requesting USB device...");

      // Request access to USB thermal printer
      // Common vendor IDs: 0x0416 (Epson), 0x04b8 (Epson), 0x0519 (Star)
      const device = await (navigator as any).usb.requestDevice({
        // filters: [
        //   { vendorId: 0x0416 },
        //   { vendorId: 0x04b8 },
        //   { vendorId: 0x0519 },
        //   { vendorId: 0x0dd4 }, // Custom printers
        // ]
        filters: [{}],
      });

      await device.open();
      setStatus("Device opened, inspecting configuration...");

      // Log device info for debugging
      console.log("Device info:", {
        vendorId: device.vendorId.toString(16),
        productId: device.productId.toString(16),
        productName: device.productName,
        configurations: device.configurations.length,
      });

      // Select configuration (try 1 first, fallback to others)
      if (device.configuration === null) {
        let configSelected = false;
        for (
          let configValue = 1;
          configValue <= device.configurations.length;
          configValue++
        ) {
          try {
            await device.selectConfiguration(configValue);
            setStatus(`Configuration ${configValue} selected`);
            configSelected = true;
            break;
          } catch (configError) {
            console.log(
              `Failed to select configuration ${configValue}:`,
              configError
            );
          }
        }
        if (!configSelected) {
          throw new Error("Could not select any configuration");
        }
      }

      // Find and claim the correct interface
      let interfaceClaimed = false;
      const config = device.configuration;

      if (config && config.interfaces) {
        console.log(
          "Available interfaces:",
          config.interfaces.map((iface: any) => ({
            interfaceNumber: iface.interfaceNumber,
            claimed: iface.claimed,
            alternate: iface.alternate,
          }))
        );

        // Try each interface until one works
        for (const iface of config.interfaces) {
          if (!iface.claimed) {
            try {
              await device.claimInterface(iface.interfaceNumber);
              setStatus(
                `Interface ${iface.interfaceNumber} claimed successfully`
              );
              interfaceClaimed = true;
              console.log(
                `Successfully claimed interface ${iface.interfaceNumber}`
              );
              break;
            } catch (claimError) {
              console.log(
                `Failed to claim interface ${iface.interfaceNumber}:`,
                claimError
              );
            }
          }
        }
      }

      // Fallback: try common interface numbers
      if (!interfaceClaimed) {
        const commonInterfaces = [0, 1, 2];
        for (const interfaceNum of commonInterfaces) {
          try {
            await device.claimInterface(interfaceNum);
            setStatus(`Interface ${interfaceNum} claimed (fallback method)`);
            interfaceClaimed = true;
            console.log(
              `Successfully claimed interface ${interfaceNum} via fallback`
            );
            break;
          } catch (claimError) {
            console.log(
              `Fallback: Failed to claim interface ${interfaceNum}:`,
              claimError
            );
          }
        }
      }

      if (!interfaceClaimed) {
        // Try to force release interfaces first
        setStatus("Attempting to force release interfaces...");
        try {
          for (let i = 0; i < 4; i++) {
            try {
              await device.releaseInterface(i);
              console.log(`Released interface ${i}`);
            } catch (e) {
              // Interface wasn't claimed, ignore
            }
          }

          // Try claiming again after release
          for (const interfaceNum of [0, 1, 2]) {
            try {
              await device.claimInterface(interfaceNum);
              setStatus(
                `Interface ${interfaceNum} claimed after force release`
              );
              interfaceClaimed = true;
              break;
            } catch (claimError) {
              console.log(
                `Still failed to claim interface ${interfaceNum}:`,
                claimError
              );
            }
          }
        } catch (releaseError) {
          console.log("Force release failed:", releaseError);
        }
      }

      if (!interfaceClaimed) {
         alert("Printer is busy or claimed by OS.\n\nTo fix on Linux:\nRun `sudo rmmod usblp` in terminal.\nThen refresh this page.");
        throw new Error(`Could not claim any interface. 

        SOLUTIONS:
        1. Close all printer software (Star utilities, POS apps)
        2. Disconnect USB cable, wait 10 seconds, reconnect
        3. Disable printer in Device Manager temporarily
        4. Try a different USB port
        5. Restart browser after closing printer software

        The device appears to be in use by another application or driver.`);
      }

      setDevice(device);
      setIsConnected(true);
      setStatus("Connected to printer successfully!");
    } catch (error: any) {
      console.error("Connection error:", error);
      setStatus(`Error: ${error.message}`);

      // Additional help for common issues
      if (error.message.includes("claimInterface")) {
        setStatus(
          `Error: ${error.message}\n\nTip: Close any printer software or disconnect/reconnect the USB cable`
        );
      }
    }
  };

  const inspectDevice = async () => {
    if (!device) {
      setStatus("No device connected to inspect");
      return;
    }

    try {
      console.log("=== DEVICE INSPECTION ===");
      console.log("Vendor ID:", "0x" + device?.vendorId.toString(16));
      console.log("Product ID:", "0x" + device?.productId.toString(16));
      console.log("Product Name:", device?.productName);
      console.log("Manufacturer:", device?.manufacturerName);
      console.log("Serial Number:", device?.serialNumber);

      const config = device.configuration;
      if (config) {
        console.log("Current Configuration:", config.configurationValue);
        console.log("Interfaces available:", config.interfaces.length);

        config.interfaces.forEach((iface, index) => {
          console.log(`Interface ${index}:`, {
            number: iface.interfaceNumber,
            claimed: iface.claimed,
            alternates: iface.alternates.length,
            class: iface.alternate.interfaceClass,
            subclass: iface.alternate.interfaceSubclass,
            protocol: iface.alternate.interfaceProtocol,
            endpoints: iface.alternate.endpoints.map((ep) => ({
              number: ep.endpointNumber,
              direction: ep.direction,
              type: ep.type,
              packetSize: ep.packetSize,
            })),
          });
        });
      }

      setStatus("Device inspection complete - check console for details");
    } catch (error: any) {
      console.error("Inspection error:", error);
      setStatus(`Inspection error: ${error.message}`);
    }
  };

  const resetConnection = async () => {
    try {
      setStatus("Resetting connection...");

      if (device) {
        // Try to release all interfaces
        for (let i = 0; i < 4; i++) {
          try {
            if (typeof device.releaseInterface === "function") {
              await device.releaseInterface(i);
            }
          } catch (e) {
            // Ignore errors
          }
        }

        // Try to reset the device
        try {
          if (typeof device.reset === "function") {
            await device.reset();
            setStatus("Device reset successful");
          }
        } catch (resetError) {
          console.log("Device reset failed:", resetError);
        }

        // Close the device
        await device.close();
      }

      setDevice(null);
      setIsConnected(false);
      setStatus("Connection reset. Please try connecting again.");
    } catch (error: any) {
      console.error("Reset error:", error);
      setStatus("Reset attempted. Please disconnect USB cable and try again.");
    }
  };

  const disconnectPrinter = async () => {
    if (device) {
      try {
        await device.close();
        setDevice(null);
        setIsConnected(false);
        setStatus("Disconnected");
      } catch (error: any) {
        console.error("Disconnect error:", error);
        setStatus(`Error: ${error.message}`);
      }
    }
  };

  const printTest = async () => {
    if (!device) {
      setStatus("No printer connected");
      return;
    }

    try {
      setStatus("Printing...");

      // Build ESC/POS command sequence
      const commands = new ESCPOSCommands();

      // Initialize printer
      commands.init();

      // Center alignment
      commands.align("center");

      // Double size text
      commands.setTextSize(2, 2);
      commands.addText("THERMAL PRINTER TEST\n");

      // Normal size
      commands.setTextSize(1, 1);
      commands.addText("------------------------\n\n");

      // Left alignment
      commands.align("left");
      commands.addText(`Date: ${new Date().toLocaleString()}\n`);
      commands.addText(`Message: ${printText}\n\n`);

      // Add some styling
      commands.bold(true);
      commands.addText("Features:\n");
      commands.bold(false);
      commands.addText("✓ WebUSB Connection\n");
      commands.addText("✓ ESC/POS Commands\n");
      commands.addText("✓ PWA Support\n\n");

      // Feed and cut
      commands.feed(3);
      commands.cut();

      // Send to printer - try different endpoints
      const data = commands.getBuffer();
      let printSuccess = false;
      const commonEndpoints = [1, 2, 3]; // Most common output endpoints

      for (const endpoint of commonEndpoints) {
        try {
          setStatus(`Trying endpoint ${endpoint}...`);
          await device.transferOut(endpoint, data);
          setStatus("Print completed successfully!");
          printSuccess = true;
          console.log(`Print successful using endpoint ${endpoint}`);
          break;
        } catch (endpointError: any) {
          console.log(
            `Failed to print on endpoint ${endpoint}:`,
            endpointError
          );
        }
      }

      if (!printSuccess) {
        throw new Error(
          "Could not find working endpoint for printing. Check printer compatibility."
        );
      }
    } catch (error: any) {
      console.error("Print error:", error);
      setStatus(`Print error: ${error.message}`);
    }
  };

  const fallbackPrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Test</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              h1 { text-align: center; }
              .divider { border-top: 2px dashed #000; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>THERMAL PRINTER TEST</h1>
            <div class="divider"></div>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Message: ${printText}</p>
            <div class="divider"></div>
            <p><strong>Features:</strong></p>
            <ul>
              <li>✓ WebUSB Connection</li>
              <li>✓ ESC/POS Commands</li>
              <li>✓ PWA Support</li>
            </ul>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Printer Control</h2>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p className="text-sm font-semibold text-gray-700">Status:</p>
        <p
          className={`text-lg ${
            isConnected ? "text-green-600" : "text-gray-600"
          }`}
        >
          {status}
        </p>
      </div>

      {/* Text Input */}
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

      {/* Control Buttons */}
      <div className="space-y-3">
        {isWebUSBSupported ? (
          <>
            {!isConnected ? (
              <>
                <button
                  onClick={connectPrinter}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition mb-3"
                >
                  Connect Printer
                </button>
                <button
                  onClick={resetConnection}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition text-sm"
                >
                  Reset Connection (if device busy)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={printTest}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                >
                  Print Test Page
                </button>
                <button
                  onClick={inspectDevice}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                >
                  Debug Device Info
                </button>
                <button
                  onClick={disconnectPrinter}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                >
                  Disconnect
                </button>
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-amber-600 mb-4">
              WebUSB is not supported in this browser.
            </p>
            <button
              onClick={fallbackPrint}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Use Browser Print (Fallback)
            </button>
          </div>
        )}
      </div>

      {/* Troubleshooting for Device Busy Error */}
      {status.includes("Could not claim any interface") && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-3">
            🚨 Device Busy - Quick Fixes:
          </h3>
          <ol className="text-sm text-red-700 space-y-2 list-decimal list-inside">
            <li>
              <strong>Close printer software:</strong> Star utilities, POS apps,
              printer drivers
            </li>
            <li>
              <strong>Disconnect USB:</strong> Unplug for 10 seconds, then
              reconnect
            </li>
            <li>
              <strong>Try Reset Connection</strong> button above
            </li>
            <li>
              <strong>Different USB port:</strong> Try another USB port
            </li>
            <li>
              <strong>Disable in Device Manager:</strong> Temporarily disable
              printer driver
            </li>
            <li>
              <strong>Restart browser:</strong> Close and reopen Chrome/Edge
            </li>
          </ol>
          <p className="mt-3 text-xs text-red-600">
            💡 This happens when Windows/macOS drivers claim the device first
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-sm text-gray-600">
        <p className="font-semibold mb-2">Supported Printers:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Most ESC/POS compatible thermal printers</li>
          <li>Epson TM series</li>
          <li>Star TSP series</li>
          <li>Generic 58mm/80mm thermal printers</li>
        </ul>
      </div>
    </div>
  );
}
