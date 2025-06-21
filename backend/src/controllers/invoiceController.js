const PDFDocument = require('pdfkit');
const Order = require('../models/Order');

exports.generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // First check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Now populate the related fields
    const populatedOrder = await Order.findById(orderId)
      .populate('medicalStore')
      .populate('pharmaCompany')
      .populate('items.product');

    if (!populatedOrder) {
      return res.status(500).json({ message: 'Error loading order details' });
    }

    // Create a PDF document
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      font: 'Helvetica' // Use Helvetica to avoid font rendering issues
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${populatedOrder.orderNumber}.pdf`);

    // Handle errors in PDF generation
    doc.on('error', (err) => {
      console.error('Error generating PDF:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generating PDF' });
      }
    });

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company name centered at the top
    doc.font('Helvetica-Bold').fontSize(24).text('PharmaSync', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown(2);

    // Add invoice details in a table format
    const invoiceDetails = {
      'Invoice Number': populatedOrder.orderNumber,
      'Date': new Date(populatedOrder.createdAt).toLocaleDateString(),
      'From': populatedOrder.pharmaCompany.companyName,
      'To': populatedOrder.medicalStore.companyName,
      'Address': `${populatedOrder.medicalStore.address.street}, ${populatedOrder.medicalStore.address.city}, ${populatedOrder.medicalStore.address.state} - ${populatedOrder.medicalStore.address.pincode}`
    };

    // Draw invoice details table
    let y = 150;
    doc.font('Helvetica');
    Object.entries(invoiceDetails).forEach(([key, value]) => {
      doc.fontSize(10);
      doc.text(key + ':', 50, y);
      doc.text(value, 200, y);
      y += 20;
    });

    doc.moveDown(2);

    // Add items table header with borders
    const tableTop = y + 20;
    const tableLeft = 50;
    const tableWidth = 500;
    const columnWidth = tableWidth / 4; // Changed to 4 columns

    // Draw table header
    doc.font('Helvetica-Bold').fontSize(10);
    doc.rect(tableLeft, tableTop, tableWidth, 20).stroke();
    
    // Draw vertical lines for columns
    for (let i = 1; i < 4; i++) { // Changed to 4 columns
      doc.moveTo(tableLeft + (i * columnWidth), tableTop)
         .lineTo(tableLeft + (i * columnWidth), tableTop + 20)
         .stroke();
    }

    // Add header text
    doc.text('Item', tableLeft + 10, tableTop + 5);
    doc.text('Quantity', tableLeft + columnWidth + 10, tableTop + 5);
    doc.text('Price per Quantity', tableLeft + (columnWidth * 2) + 10, tableTop + 5);
    doc.text('Status', tableLeft + (columnWidth * 3) + 10, tableTop + 5);

    // Add items with borders
    let currentY = tableTop + 20;
    doc.font('Helvetica');
    populatedOrder.items.forEach((item) => {
      // Draw row border
      doc.rect(tableLeft, currentY, tableWidth, 20).stroke();
      
      // Draw vertical lines
      for (let i = 1; i < 4; i++) { // Changed to 4 columns
        doc.moveTo(tableLeft + (i * columnWidth), currentY)
           .lineTo(tableLeft + (i * columnWidth), currentY + 20)
           .stroke();
      }

      // Add item details
      doc.text(item.product.name, tableLeft + 10, currentY + 5);
      doc.text(item.quantity.toString(), tableLeft + columnWidth + 10, currentY + 5);
      doc.text(`Rs.${item.price}`, tableLeft + (columnWidth * 2) + 10, currentY + 5);
      doc.text(item.isPaid ? 'Paid' : 'Unpaid', tableLeft + (columnWidth * 3) + 10, currentY + 5);

      currentY += 20;
    });

    // Add total amount section
    currentY += 20;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Total Amount:', tableLeft + (columnWidth * 2), currentY);
    doc.text(`Rs.${populatedOrder.totalAmount}`, tableLeft + (columnWidth * 3), currentY);

    // Add payment terms
    currentY += 40;
    doc.font('Helvetica').fontSize(10);
    doc.text('Payment Terms:', tableLeft, currentY);
    doc.text('Payment is due within 30 days', tableLeft, currentY + 20);
    doc.text('Thank you for your business!', tableLeft, currentY + 40);

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating invoice' });
    }
  }
}; 