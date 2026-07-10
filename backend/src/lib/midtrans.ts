import crypto from 'crypto'

// ─── Configuration ───────────────────────────────────────────────────────────

function getServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) throw new Error('Missing MIDTRANS_SERVER_KEY environment variable.')
  return key
}

function getBaseUrl(): string {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  return isProduction
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com'
}

function getAuthHeader(): string {
  const serverKey = getServerKey()
  return 'Basic ' + Buffer.from(serverKey + ':').toString('base64')
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MidtransChargeItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface MidtransChargeResponse {
  status_code: string
  status_message: string
  transaction_id: string
  order_id: string
  merchant_id: string
  gross_amount: string
  currency: string
  payment_type: string
  transaction_time: string
  transaction_status: string
  fraud_status?: string
  actions?: { name: string; method: string; url: string }[]
  qr_string?: string
  acquirer?: string
  expiry_time?: string
}

export interface MidtransStatusResponse {
  status_code: string
  status_message: string
  transaction_id: string
  order_id: string
  gross_amount: string
  payment_type: string
  transaction_status: string
  fraud_status?: string
  transaction_time: string
  settlement_time?: string
  expiry_time?: string
  signature_key?: string
}

export interface MidtransNotificationBody {
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  settlement_time?: string
  payment_type: string
  order_id: string
  merchant_id: string
  gross_amount: string
  fraud_status?: string
  currency: string
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Create a QRIS charge via Midtrans Core API.
 * Returns the full charge response including QR code URL/string.
 */
export async function createQrisCharge(
  orderId: string,
  grossAmount: number,
  items?: MidtransChargeItem[]
): Promise<MidtransChargeResponse> {
  const baseUrl = getBaseUrl()
  const authHeader = getAuthHeader()

  const payload: Record<string, unknown> = {
    payment_type: 'qris',
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
  }

  if (items && items.length > 0) {
    payload.item_details = items
  }

  const response = await fetch(`${baseUrl}/v2/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  })

  const data: MidtransChargeResponse = await response.json()

  if (!response.ok) {
    throw new Error(
      `Midtrans charge failed: ${data.status_code} - ${data.status_message}`
    )
  }

  return data
}

/**
 * Get the transaction status from Midtrans.
 */
export async function getTransactionStatus(
  orderId: string
): Promise<MidtransStatusResponse> {
  const baseUrl = getBaseUrl()
  const authHeader = getAuthHeader()

  const response = await fetch(`${baseUrl}/v2/${orderId}/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: authHeader,
    },
  })

  const data: MidtransStatusResponse = await response.json()

  if (!response.ok) {
    throw new Error(
      `Midtrans status check failed: ${data.status_code} - ${data.status_message}`
    )
  }

  return data
}

/**
 * Verify the Midtrans notification signature (SHA-512).
 *
 * Midtrans signs notifications with:
 *   SHA512(order_id + status_code + gross_amount + server_key)
 *
 * Returns true if the provided signatureKey matches the expected hash.
 */
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const serverKey = getServerKey()
  const payload = orderId + statusCode + grossAmount + serverKey
  const expectedSignature = crypto
    .createHash('sha512')
    .update(payload)
    .digest('hex')

  return expectedSignature === signatureKey
}
