import { useState, useEffect } from 'react'
import PrinterController from '../components/PrinterController'

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if PWA is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt event fired')
      // Prevent default browser install prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // Listen for PWA install completion
    const handleAppInstalled = () => {
      console.log('PWA installed successfully')
      setIsPWAInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert('PWA install prompt not available. Try using the browser\'s install option in the address bar.')
      return
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install')
      } else {
        console.log('User dismissed PWA install')
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Thermal Printer PWA
          </h1>
          <p className="text-gray-600">
            Control your thermal printer using WebUSB API
          </p>
        </header>

        {/* PWA Install Banner */}
        {isClient && !isPWAInstalled && showInstallPrompt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">📱 Install App</h3>
                <p className="text-sm text-blue-700">
                  Install this app for offline access and better performance
                </p>
              </div>
              <button
                onClick={handleInstallPWA}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Install
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {isClient && <PrinterController />}

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-2">🔌 WebUSB Support</h3>
            <p className="text-gray-600">
              Direct connection to USB thermal printers without drivers
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-2">📱 PWA Ready</h3>
            <p className="text-gray-600">
              Install as an app on your device for offline use
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-2">🖨️ ESC/POS Commands</h3>
            <p className="text-gray-600">
              Full support for ESC/POS thermal printer commands
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
