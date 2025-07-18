import { NextApiRequest, NextApiResponse } from 'next';

const templates = {
  receipt: {
    name: 'Receipt Template',
    description: 'Standard store receipt with items and total',
    fields: ['storeName', 'address', 'items', 'total', 'receiptNumber'],
    example: {
      storeName: 'Awesome Store',
      address: '123 Main Street, City, State 12345',
      items: [
        { name: 'Product 1', price: 10.99 },
        { name: 'Product 2', price: 5.50 }
      ],
      total: 16.49,
      receiptNumber: 'R001'
    }
  },
  label: {
    name: 'Product Label',
    description: 'Product label with barcode and price',
    fields: ['productName', 'barcode', 'price'],
    example: {
      productName: 'Sample Product',
      barcode: '1234567890',
      price: 29.99
    }
  },
  ticket: {
    name: 'Kitchen Order Ticket',
    description: 'Kitchen order with items and notes',
    fields: ['orderNumber', 'items', 'notes'],
    example: {
      orderNumber: '001',
      items: ['Burger', 'Fries', 'Drink'],
      notes: 'No onions'
    }
  },
  shipping: {
    name: 'Shipping Label',
    description: 'Shipping label with addresses and tracking',
    fields: ['fromAddress', 'toAddress', 'trackingNumber', 'weight'],
    example: {
      fromAddress: 'Store Name\n123 Main St\nCity, State 12345',
      toAddress: 'Customer Name\n456 Oak Ave\nTown, State 67890',
      trackingNumber: 'TRK123456789',
      weight: '2.5 lbs'
    }
  },
  badge: {
    name: 'Name Badge',
    description: 'Conference or event name badge',
    fields: ['name', 'company', 'title', 'event'],
    example: {
      name: 'John Doe',
      company: 'Tech Corp',
      title: 'Software Engineer',
      event: 'Tech Conference 2024'
    }
  },
  qr_menu: {
    name: 'QR Menu Item',
    description: 'Restaurant menu item with QR code',
    fields: ['itemName', 'description', 'price', 'qrCode'],
    example: {
      itemName: 'Deluxe Burger',
      description: 'Fresh beef with lettuce, tomato, and special sauce',
      price: 12.99,
      qrCode: 'https://restaurant.com/menu/burger-deluxe'
    }
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all templates
    res.status(200).json({
      success: true,
      templates: Object.keys(templates).map(key => ({
        id: key,
        ...templates[key as keyof typeof templates]
      }))
    });
  } else if (req.method === 'POST') {
    // Get specific template details
    const { templateId } = req.body;
    
    if (!templateId || !templates[templateId as keyof typeof templates]) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const template = templates[templateId as keyof typeof templates];
    res.status(200).json({
      success: true,
      template: {
        id: templateId,
        ...template
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
