/**
 * WebUSB Type Definitions
 * 
 * These types help with TypeScript support for WebUSB API
 */

export interface USBDevice {
  vendorId: number
  productId: number
  deviceName?: string
  manufacturerName?: string
  productName?: string
  serialNumber?: string
  deviceVersionMajor: number
  deviceVersionMinor: number
  deviceVersionSubminor: number
  configuration?: USBConfiguration
  configurations: USBConfiguration[]
  opened: boolean
  
  open(): Promise<void>
  close(): Promise<void>
  selectConfiguration(configurationValue: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  releaseInterface(interfaceNumber: number): Promise<void>
  selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>
  controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>
  controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
  clearHalt(direction: USBDirection, endpointNumber: number): Promise<void>
  reset(): Promise<void>
  isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousInTransferResult>
  isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousOutTransferResult>
}

export interface USBConfiguration {
  configurationValue: number
  configurationName?: string
  interfaces: USBInterface[]
}

export interface USBInterface {
  interfaceNumber: number
  alternate: USBAlternateInterface
  alternates: USBAlternateInterface[]
  claimed: boolean
}

export interface USBAlternateInterface {
  alternateSetting: number
  interfaceClass: number
  interfaceSubclass: number
  interfaceProtocol: number
  interfaceName?: string
  endpoints: USBEndpoint[]
}

export interface USBEndpoint {
  endpointNumber: number
  direction: USBDirection
  type: USBEndpointType
  packetSize: number
}

export type USBDirection = 'in' | 'out'
export type USBEndpointType = 'bulk' | 'interrupt' | 'isochronous'

export interface USBControlTransferParameters {
  requestType: USBRequestType
  recipient: USBRecipient
  request: number
  value: number
  index: number
}

export type USBRequestType = 'standard' | 'class' | 'vendor'
export type USBRecipient = 'device' | 'interface' | 'endpoint' | 'other'

export interface USBInTransferResult {
  data?: DataView
  status: USBTransferStatus
}

export interface USBOutTransferResult {
  bytesWritten: number
  status: USBTransferStatus
}

export interface USBIsochronousInTransferResult {
  data?: DataView
  packets: USBIsochronousInTransferPacket[]
}

export interface USBIsochronousOutTransferResult {
  packets: USBIsochronousOutTransferPacket[]
}

export interface USBIsochronousInTransferPacket {
  data?: DataView
  status: USBTransferStatus
}

export interface USBIsochronousOutTransferPacket {
  bytesWritten: number
  status: USBTransferStatus
}

export type USBTransferStatus = 'ok' | 'stall' | 'babble'

// Extend Window interface
declare global {
  interface Window {
    deferredPrompt?: any
  }
  
  interface Navigator {
    usb: USB
  }
}

export interface USB {
  getDevices(): Promise<USBDevice[]>
  requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>
  addEventListener(type: 'connect' | 'disconnect', listener: (event: USBConnectionEvent) => void): void
  removeEventListener(type: 'connect' | 'disconnect', listener: (event: USBConnectionEvent) => void): void
}

export interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[]
}

export interface USBDeviceFilter {
  vendorId?: number
  productId?: number
  classCode?: number
  subclassCode?: number
  protocolCode?: number
  serialNumber?: string
}

export interface USBConnectionEvent extends Event {
  device: USBDevice
}
