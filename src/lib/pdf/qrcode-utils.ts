import QRCode from 'qrcode'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eloculturas.com.br'

/** Generate QR code as base64 data URL for use in @react-pdf/renderer Image */
export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 120,
    margin: 1,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

/** Build the public verification URL for a signature hash */
export function buildVerificationUrl(hash: string): string {
  return `https://${ROOT_DOMAIN}/verificar-assinatura?hash=${hash}`
}

/** Build a public URL for a specific document */
export function buildDocumentUrl(path: string): string {
  return `https://${ROOT_DOMAIN}${path}`
}
