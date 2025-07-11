/**
 * Advanced ESC/POS Examples
 * 
 * This file demonstrates advanced usage of ESC/POS commands
 * for developers who want to extend the printer functionality.
 */

import { ESCPOSCommands } from '../utils/escpos'

// Example 1: Receipt with logo and formatting
export function printReceipt(device: any, items: Array<{name: string, price: number}>) {
  const commands = new ESCPOSCommands()
  
  // Initialize and center
  commands.init().align('center')
  
  // Store name in double size
  commands.setTextSize(2, 2)
  commands.bold(true)
  commands.addText('AWESOME STORE\n')
  commands.bold(false)
  
  // Address in normal size
  commands.setTextSize(1, 1)
  commands.addText('123 Main Street\n')
  commands.addText('City, State 12345\n')
  commands.addText('Tel: (555) 123-4567\n')
  commands.addText('------------------------\n\n')
  
  // Date and time
  commands.align('left')
  const date = new Date()
  commands.addText(`Date: ${date.toLocaleDateString()}\n`)
  commands.addText(`Time: ${date.toLocaleTimeString()}\n`)
  commands.addText('------------------------\n\n')
  
  // Items
  commands.bold(true)
  commands.addText('ITEM                PRICE\n')
  commands.bold(false)
  commands.addText('------------------------\n')
  
  let total = 0
  items.forEach(item => {
    const name = item.name.padEnd(18, ' ')
    const price = `$${item.price.toFixed(2)}`
    commands.addText(`${name}${price}\n`)
    total += item.price
  })
  
  commands.addText('------------------------\n')
  
  // Total
  commands.bold(true)
  commands.setTextSize(1, 2)
  const totalText = 'TOTAL:'.padEnd(18, ' ')
  commands.addText(`${totalText}$${total.toFixed(2)}\n`)
  commands.setTextSize(1, 1)
  commands.bold(false)
  
  // Footer
  commands.feed(2)
  commands.align('center')
  commands.addText('Thank you for your purchase!\n')
  commands.addText('Please come again\n')
  
  // QR code with store URL
  commands.feed(2)
  commands.qrCode('https://example.com/store')
  
  // Cut
  commands.feed(3)
  commands.cut()
  
  // Send to printer
  return device.transferOut(1, commands.getBuffer())
}

// Example 2: Barcode label printing
export function printLabel(device: any, productCode: string, productName: string, price: number) {
  const commands = new ESCPOSCommands()
  
  commands.init()
  commands.align('center')
  
  // Product name
  commands.bold(true)
  commands.addText(`${productName}\n`)
  commands.bold(false)
  
  // Barcode
  commands.feed(1)
  commands.barcode(productCode)
  commands.feed(1)
  
  // Price
  commands.setTextSize(2, 2)
  commands.addText(`$${price.toFixed(2)}\n`)
  commands.setTextSize(1, 1)
  
  // Cut
  commands.feed(2)
  commands.cut()
  
  return device.transferOut(1, commands.getBuffer())
}

// Example 3: Kitchen order ticket
export function printKitchenOrder(device: any, orderNumber: string, items: string[], notes?: string) {
  const commands = new ESCPOSCommands()
  
  commands.init()
  
  // Header
  commands.align('center')
  commands.setTextSize(2, 2)
  commands.bold(true)
  commands.addText(`ORDER #${orderNumber}\n`)
  commands.bold(false)
  commands.setTextSize(1, 1)
  
  // Time
  commands.addText(`${new Date().toLocaleTimeString()}\n`)
  commands.addText('========================\n\n')
  
  // Items
  commands.align('left')
  commands.setTextSize(1, 2)
  items.forEach((item, index) => {
    commands.addText(`${index + 1}. ${item}\n`)
  })
  commands.setTextSize(1, 1)
  
  // Notes
  if (notes) {
    commands.feed(1)
    commands.addText('Notes:\n')
    commands.underline(true)
    commands.addText(`${notes}\n`)
    commands.underline(false)
  }
  
  // Footer
  commands.feed(2)
  commands.align('center')
  commands.addText('--- KITCHEN COPY ---\n')
  
  // Cut
  commands.feed(3)
  commands.cut()
  
  return device.transferOut(1, commands.getBuffer())
}
