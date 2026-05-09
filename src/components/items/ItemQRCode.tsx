'use client'
import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Download, Copy, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface ItemQRCodeProps {
  itemId: string
  itemName: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export function ItemQRCode({ itemId, itemName }: ItemQRCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const scanUrl = `${APP_URL}/scan/${itemId}`

  function downloadQR() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `lend-qr-${itemName.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function copyLink() {
    navigator.clipboard.writeText(scanUrl)
    toast.success('Scan link copied')
  }

  function printLabel() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank', 'width=400,height=500')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Label — ${itemName}</title>
      <style>
        body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, sans-serif; background: #fff; }
        img { width: 200px; height: 200px; }
        .name { font-size: 18px; font-weight: 700; margin-top: 12px; text-align: center; }
        .sub { font-size: 12px; color: #888; margin-top: 4px; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>
        <img src="${dataUrl}" />
        <div class="name">${itemName}</div>
        <div class="sub">Scan to borrow</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={canvasRef} className="bg-white p-3 rounded-xl flex flex-col items-center gap-2">
        <QRCodeCanvas
          value={scanUrl}
          size={160}
          level="M"
          includeMargin={false}
        />
        <p className="text-[11px] font-semibold text-black text-center leading-tight px-1">{itemName}</p>
      </div>
      <p className="text-xs text-muted-foreground text-center">Scan to borrow this item</p>
      <div className="flex gap-2 w-full">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={downloadQR}>
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={printLabel}>
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 px-3" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
