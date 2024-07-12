import { Response, Request, NextFunction } from 'express'
import { PrinterServices } from '../services/pdf'
import type { InvoiceData, quotationData } from '../interfaces/pdf.d'

const printer = new PrinterServices()

export class ReportsController {
  createInvoice(req: Request, res: Response, next: NextFunction) {
    const invoiceData: InvoiceData = {
      logoUrl: 'https://yourdomain.com/logo.png',
      seller: {
        name: 'Neenbyss',
        address: 'billing@neenbyss.com',
        phone: '',
        email: '',
      },
      client: {
        name: '',
        address: '',
        phone: '',
        email: '',
      },
      invoiceDetails: {
        paymentFormatNumber: '0016',
        issuedDate: '28/06/2024',
        dueDate: '30/06/2024',
        paymentMethod: 'Tarjeta de Crédito',
      },
      items: [
        {
          description: 'Producto Digital 1',
          price: 50,
        },
        {
          description: 'Producto Digital 2',
          price: 150,
        },
        {
          description: 'Producto Digital 3',
          price: 90,
        },
      ],
      totals: {
        subtotal: 290,
        additionalCharges: [
          {
            description: 'Cargo por servicio',
            amount: 20,
          },
          {
            description: 'Cargo por envío',
            amount: 10,
          },
        ],
        discounts: [
          {
            description: 'Descuento promocional',
            amount: 15,
          },
        ],
        tax: 46.4,
        total: 351.4,
      },
      notes: 'Esta es una nota adicional sobre la factura.',
      footer: '¡Gracias por su compra!',
    }

    try {
      const invoice = printer.generateInvoicePDF(invoiceData as any)
      const pdf = printer.createPDF(invoice)

      pdf.pipe(res)
      pdf.end()
    } catch (error) {
      if (error instanceof Error) {
        res.json({
          error: error.message,
        })
      }
    }
  }

  createQuotation(req: Request, res: Response, next: NextFunction) {
    const invoiceData: quotationData = {
      seller: {
        name: 'Raidon Ryus',
        code: '672199057657298965',
      },
      client: {
        name: 'Peje',
        code: 'n/a',
      },
      details: 'Desarrollo de software personalizado - Sistema de cotizacion',
      invoiceDetails: {
        paymentFormatNumber: '0016',
        issuedDate: '28/06/2024',
      },
      items: [
        { description: 'Desarrollo MVP', price: 220 },
        { description: 'Blog', price: 90 },
      ],
      totals: {
        subtotal: 310,
        // additionalCharges: [
        //   { description: 'Cargo por servicio', amount: 20 },
        //   { description: 'Cargo por envío', amount: 10 },
        // ],
        // discounts: [{ description: 'Descuento promocional', amount: 15 }],
        // tax: 46.4,
        total: 310,
      },
      notes:
        'Se aclara que se trabajará en un MVP, lo cual implica desarrollar el conjunto mínimo de funcionalidades necesarias para poner en funcionamiento inicial el sistema.\n\nCualquier adición de funcionalidad adicional implicará un costo adicional.\n No se incluyo el precio de la integración de la API de facturacion\n*El costo se ajustara dependiendo de la complejidad y el tiempo\n\nEl costo del blog incluye una tarifa semifija para actualizar un sitio web con una nueva funcionalidad y convertirlo a otro framework.',
      footer: 'Gracias por su interés en nuestros servicios!',
    }

    try {
      const invoice = printer.generateQuotationPDF(invoiceData as any)
      const pdf = printer.createPDF(invoice)

      pdf.pipe(res)
      pdf.end()
    } catch (error) {
      if (error instanceof Error) {
        res.json({
          error: error.message,
        })
      }
    }
  }

  createPayment(req: Request, res: Response, next: NextFunction) {
    const payment = {
      employeeName: 'Juan Pérez',
      employeeId: '12345',
      paymentDate: '2024-07-15',
      amount: '$1500',
      paymentMethod: 'Transferencia Bancaria',
      additionalNotes: 'Pago correspondiente al mes de junio de 2024.',
    }

    try {
      const invoice = printer.generatePaymentReceipt(payment as any)
      const pdf = printer.createPDF(invoice)

      pdf.pipe(res)
      pdf.end()
    } catch (error) {
      if (error instanceof Error) {
        res.json({
          error: error.message,
        })
      }
    }
  }
}
