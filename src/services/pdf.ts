import PdfPrinter from 'pdfmake'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import type {
  InvoiceData,
  PaymentReceipt,
  quotationData,
} from '../interfaces/pdf.d'

const fonts = {
  Roboto: {
    normal: 'fonts/Roboto-Regular.ttf',
    bold: 'fonts/Roboto-Medium.ttf',
    italics: 'fonts/Roboto-Italic.ttf',
    bolditalics: 'fonts/Roboto-MediumItalic.ttf',
  },
}

const assets = {
  logo: {
    src: 'src/assets/logo_black.png',
    width: 120,
  },
}

export class PrinterServices {
  private printer = new PdfPrinter(fonts)

  createPDF(docDefinicio: TDocumentDefinitions) {
    return this.printer.createPdfKitDocument(docDefinicio)
  }

  generateInvoicePDF(data: InvoiceData) {
    const dd: TDocumentDefinitions = {
      content: [
        {
          columns: [
            {
              image: assets.logo.src, // Logo de la empresa
              width: assets.logo.width,
            },
            {
              width: '*',
              text: 'FACTURA',
              style: 'header',
              alignment: 'right',
            },
          ],
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                // { text: 'Vendedor:', style: 'subheader' },
                {
                  text: `${data.seller.name}\n${data.seller.address}\n${data.seller.phone}\n${data.seller.email}`,
                },
              ],
            },
            {
              width: '50%',
              stack: [
                // { text: 'Cliente:', style: 'subheader' },
                {
                  text: `${data.client.name}\n${data.client.address}\n${data.client.phone}\n${data.client.email}`,
                },
              ],
            },
          ],
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Detalles de la Factura:', style: 'subheader' },
                {
                  text: `№ de formato de pago: ${data.invoiceDetails.paymentFormatNumber}\nEmitido: ${data.invoiceDetails.issuedDate}\nVencimiento: ${data.invoiceDetails.dueDate}\nMétodo de pago: ${data.invoiceDetails.paymentMethod}`,
                },
              ],
            },
          ],
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Precio', style: 'tableHeader' },
              ],
              ...data.items.map((item) => [
                item.description,
                `$${item.price.toFixed(2)}`,
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          columns: [
            {
              width: '*',
              text: ' ',
            },
            {
              width: 'auto',
              table: {
                body: [
                  ['Subtotal', `$${data.totals.subtotal.toFixed(2)}`],
                  ...(data.totals.additionalCharges !== undefined
                    ? data.totals.additionalCharges.map((charge) => [
                        charge.description,
                        `$${charge.amount.toFixed(2)}`,
                      ])
                    : []),
                  ...(data.totals.discounts !== undefined
                    ? data.totals.discounts.map((discount) => [
                        discount.description,
                        `-$${discount.amount.toFixed(2)}`,
                      ])
                    : []),
                  ...(data.totals.tax !== undefined
                    ? [['IVA (16%)', `$${data.totals.tax.toFixed(2)}`]]
                    : []),
                  [
                    { text: 'Total', bold: true },
                    { text: `$${data.totals.total.toFixed(2)}`, bold: true },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
        data.notes
          ? {
              text: ' ',
              margin: [0, 10],
            }
          : { text: ' ' },
        data.notes
          ? {
              text: 'Notas:',
              style: 'subheader',
            }
          : { text: ' ' },
        data.notes
          ? {
              text: data.notes,
              margin: [0, 5],
            }
          : { text: ' ' },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          text: data.footer,
          style: 'thankYou',
        },
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 5],
        },
        tableHeader: {
          bold: true,
          fillColor: '#eeeeee',
        },
        thankYou: {
          fontSize: 16,
          italics: true,
          alignment: 'center',
        },
      },
      defaultStyle: {
        columnGap: 20,
      },
    }

    return dd
  }

  generateQuotationPDF(data: quotationData) {
    const dd: TDocumentDefinitions = {
      content: [
        {
          columns: [
            {
              image: assets.logo.src,
              width: assets.logo.width,
            },
            {
              width: '*',
              text: 'COTIZACIÓN',
              style: 'header',
              alignment: 'right',
            },
          ],
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: `${data.seller.name}` },
                {
                  text: `№ Rep. ${data.seller.code}`,
                },
              ],
            },
            {
              width: '50%',
              stack: [
                { text: `${data.client.name}` },
                {
                  text: `№ Cli: ${data.client.code}`,
                },
              ],
            },
          ],
        },
        {
          columns: [
            {
              width: '100%',
              stack: [
                {
                  text: `№ cotización: ${data.invoiceDetails.paymentFormatNumber}${new Date().getDay()}${new Date().getMonth() + 1}${new Date().getFullYear()}`,
                },
                {
                  text: `Emitido: ${data.invoiceDetails.issuedDate}`,
                },
                {
                  text: `Descricion: ${data.details}`,
                },
              ],
            },
          ],
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Precio', style: 'tableHeader' },
              ],
              ...data.items.map((item) => [
                item.description,
                `$${item.price.toFixed(2)}`,
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          columns: [
            {
              width: '*',
              text: ' ',
            },
            {
              width: 'auto',
              table: {
                body: [
                  ['Subtotal', `$${data.totals.subtotal.toFixed(2)}`],
                  ...(data.totals.additionalCharges !== undefined
                    ? data.totals.additionalCharges.map((charge) => [
                        charge.description,
                        `$${charge.amount.toFixed(2)}`,
                      ])
                    : []),
                  ...(data.totals.discounts !== undefined
                    ? data.totals.discounts.map((discount) => [
                        discount.description,
                        `-$${discount.amount.toFixed(2)}`,
                      ])
                    : []),
                  ...(data.totals.tax !== undefined
                    ? [['IVA (16%)', `$${data.totals.tax.toFixed(2)}`]]
                    : []),
                  [
                    { text: 'Total', bold: true },
                    { text: `$${data.totals.total.toFixed(2)}`, bold: true },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
        data.notes
          ? {
              text: ' ',
              margin: [0, 10],
            }
          : { text: ' ' },
        data.notes
          ? {
              text: 'Notas:',
              style: 'subheader',
            }
          : { text: ' ' },
        data.notes
          ? {
              text: data.notes,
              margin: [0, 5],
            }
          : { text: ' ' },
        {
          text: ' ',
          margin: [0, 10],
        },
        {
          text: data.footer,
          style: 'thankYou',
        },
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 5],
        },
        tableHeader: {
          bold: true,
          fillColor: '#eeeeee',
        },
        thankYou: {
          fontSize: 16,
          italics: true,
          alignment: 'center',
        },
      },
      defaultStyle: {
        columnGap: 20,
      },
    }

    return dd
  }

  generatePaymentReceipt({
    employeeName,
    employeeId,
    paymentDate,
    amount,
    paymentMethod,
    additionalNotes,
  }: PaymentReceipt) {
    const dd: TDocumentDefinitions = {
      content: [
        {
          columns: [
            {
              image: assets.logo.src, // Logo de la empresa
              width: assets.logo.width,
            },
            {
              width: '*',
              text: 'Recibo de Pago',
              style: 'header',
              alignment: 'right',
            },
          ],
        },
        { text: `Fecha: ${paymentDate}`, alignment: 'right' },
        { text: '\n' },
        { text: `Nombre del Trabajador: ${employeeName}`, style: 'subheader' },
        { text: `ID del Trabajador: ${employeeId}`, style: 'subheader' },
        { text: '\n' },
        {
          style: 'tableExample',
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Detalle', style: 'tableHeader' },
                { text: 'Valor', style: 'tableHeader' },
              ],
              ['Monto Pagado', amount],
              ['Método de Pago', paymentMethod],
              ['ID Movimiento', paymentMethod],
              ['N° Cuenta', paymentMethod],
            ],
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return rowIndex % 2 === 0 ? '#CCCCCC' : null
            },
          },
        },
        { text: '\n' },
        { text: 'Notas Adicionales:', style: 'subheader' },
        { text: additionalNotes ? additionalNotes : 'N/A' },
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          margin: [0, 10, 0, 10],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: 'black',
        },
      },
    }
    return dd
  }
}
