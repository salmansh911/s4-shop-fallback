export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Price in AED
  unit: string;
  category: string;
  image: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Frozen Chicken Griller (10x1.2kg)',
    description: 'Premium grade frozen chicken griller. Perfect for roasting and grilling. Origin: Brazil.',
    price: 135,
    unit: 'Case',
    category: 'Chicken',
    image: '/images/chicken-griller.jpg',
  },
  {
    id: '2',
    name: 'Frozen Beef Tenderloin (1kg)',
    description: 'High-quality frozen beef tenderloin. Tender and juicy. Origin: Brazil.',
    price: 65,
    unit: 'kg',
    category: 'Beef',
    image: '/images/beef-tenderloin.jpg',
  },
  {
    id: '3',
    name: 'Frozen Shrimps (1kg)',
    description: 'Large frozen shrimps, peeled and deveined. Origin: India.',
    price: 45,
    unit: 'kg',
    category: 'Seafood',
    image: '/images/shrimps.jpg',
  },
  {
    id: '4',
    name: 'Frozen Mixed Vegetables (2.5kg)',
    description: 'A mix of peas, carrots, corn, and green beans. Origin: Belgium.',
    price: 22,
    unit: 'Bag',
    category: 'Vegetables',
    image: '/images/mixed-veg.jpg',
  },
  {
    id: '5',
    name: 'Frozen French Fries (2.5kg)',
    description: 'Crispy shoestring french fries. Origin: Netherlands.',
    price: 18,
    unit: 'Bag',
    category: 'Vegetables',
    image: '/images/fries.jpg',
  },
];
