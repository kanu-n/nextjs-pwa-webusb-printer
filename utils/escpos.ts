/**
 * ESC/POS Commands for thermal printers
 */
export class ESCPOSCommands {
  private buffer: number[] = []

  // Command codes
  private ESC = 0x1b
  private GS = 0x1d
  private LF = 0x0a
  private FF = 0x0c

  constructor() {
    this.buffer = []
  }

  // Initialize printer
  init(): this {
    this.buffer.push(this.ESC, 0x40) // ESC @
    return this
  }

  // Add text
  addText(text: string): this {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(text)
    this.buffer.push(...Array.from(encoded))
    return this
  }

  // Line feed
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(this.LF)
    }
    return this
  }

  // Text alignment
  align(alignment: 'left' | 'center' | 'right'): this {
    const alignMap = {
      'left': 0x00,
      'center': 0x01,
      'right': 0x02
    }
    this.buffer.push(this.ESC, 0x61, alignMap[alignment])
    return this
  }

  // Bold text
  bold(enabled: boolean): this {
    this.buffer.push(this.ESC, 0x45, enabled ? 0x01 : 0x00)
    return this
  }

  // Underline
  underline(enabled: boolean): this {
    this.buffer.push(this.ESC, 0x2d, enabled ? 0x01 : 0x00)
    return this
  }

  // Text size
  setTextSize(width: number, height: number): this {
    // Width and height should be 1-8
    width = Math.max(1, Math.min(8, width))
    height = Math.max(1, Math.min(8, height))
    
    const size = ((width - 1) << 4) | (height - 1)
    this.buffer.push(this.GS, 0x21, size)
    return this
  }

  // Cut paper
  cut(partial: boolean = false): this {
    this.buffer.push(this.GS, 0x56, partial ? 0x01 : 0x00)
    return this
  }

  // Print barcode
  barcode(data: string, type: number = 0x04): this {
    // Type 0x04 = CODE39
    this.buffer.push(this.GS, 0x6b, type)
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    this.buffer.push(...Array.from(encoded), 0x00)
    return this
  }

  // QR Code (simplified version)
  qrCode(data: string): this {
    // This is a simplified QR code command
    // Actual implementation would need more complex encoding
    this.buffer.push(this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x03) // Size
    this.buffer.push(this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31) // Error correction
    
    // Store data
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    const len = encoded.length + 3
    this.buffer.push(this.GS, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, 0x30)
    this.buffer.push(...Array.from(encoded))
    
    // Print
    this.buffer.push(this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30)
    return this
  }

  // Get the command buffer
  getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer)
  }

  // Clear buffer
  clear(): this {
    this.buffer = []
    return this
  }

  // Print image (simplified - would need proper implementation)
  image(width: number, height: number, data: Uint8Array): this {
    // ESC * m nL nH d1...dk
    // This is a simplified version - actual implementation would need
    // proper bit-image conversion and formatting
    const bytesPerLine = Math.ceil(width / 8)
    this.buffer.push(this.ESC, 0x2a, 0x21, bytesPerLine & 0xff, (bytesPerLine >> 8) & 0xff)
    this.buffer.push(...Array.from(data))
    return this
  }
}
