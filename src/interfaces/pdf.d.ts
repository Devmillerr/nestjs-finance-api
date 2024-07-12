export interface InvoiceData {
  logoUrl: string
  seller: {
    name: string
    address: string
    phone: string
    email: string
  }
  client: {
    name: string
    address: string
    phone: string
    email: string
  }
  invoiceDetails: {
    paymentFormatNumber: string
    issuedDate: string
    dueDate: string
    paymentMethod: string
  }
  items: {
    description: string
    price: number
  }[]
  totals: {
    subtotal: number
    additionalCharges?: { description: string; amount: number }[] // Cargos adicionales opcionales
    discounts?: { description: string; amount: number }[] // Descuentos opcionales
    tax?: number // IVA opcional
    total: number
  }
  notes?: string
  footer: string
}

export interface quotationData {
  seller: {
    name: string
    code: string
  }
  client: {
    name: string
    code: string
  }
  invoiceDetails: {
    paymentFormatNumber: string
    issuedDate: string
  }
  items: {
    description: string
    price: number
  }[]
  totals: {
    subtotal: number
    additionalCharges?: { description: string; amount: number }[] // Cargos adicionales opcionales
    discounts?: { description: string; amount: number }[] // Descuentos opcionales
    tax?: number // IVA opcional
    total: number
  }
  notes?: string
  footer: string
  details: string
}

export interface PaymentReceipt {
  employeeName: string
  employeeId: string
  paymentDate: string
  amount: string
  paymentMethod: string
  additionalNotes?: string
}
