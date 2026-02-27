const PRODUCT_IMAGE_BY_NAME: Record<string, string> = {
  "Frozen Chicken Samosa": "/product-images/frozen-chicken-samosa.png",
  "Frozen Vegetable Samosa": "/product-images/frozen-vegetable-samosa.png",
  "Frozen Beef Kibbeh": "/product-images/frozen-beef-kibbeh.png",
  "Frozen Spring Roll (Chicken)": "/product-images/frozen-spring-roll-chicken.png",
  "Samosa Sheets": "/product-images/samosa-sheets.png",
  "Puff Pastry Sheets": "/product-images/puff-pastry-sheets.png",
  "Kunafa Dough (Kataifi)": "/product-images/kunafa-dough-kataifi.png",
  "Mozzarella Cheese Shredded": "/product-images/mozzarella-cheese-shredded.png",
  "Fresh Cream": "/product-images/fresh-cream.png",
  "Chicken Breast Boneless": "/product-images/chicken-breast-boneless.png",
  "Minced Beef": "/product-images/minced-beef.png",
  "Vimto Concentrate": "/product-images/vimto-concentrate.png",
  "Rooh Afza Concentrate": "/product-images/rooh-afza-concentrate.png",
  "Mixed Berry Squash": "/product-images/mixed-berry-squash.png",
  "Maida Flour": "/product-images/maida-flour.png",
  "Instant Dry Yeast": "/product-images/instant-dry-yeast.png",
  "Baking Powder": "/product-images/baking-powder.png",
  "Pure Ghee": "/product-images/pure-ghee.png",
  "Basmati Rice Premium": "/product-images/basmati-rice-premium.png",
  "Saffron Strings": "/product-images/saffron-strings.png",
  "Fresh Eggs": "/product-images/fresh-eggs.png",
  "Frozen Mixed Kebabs": "/product-images/frozen-mixed-kebabs.png",
  "Premium Dates (Medjool)": "/product-images/premium-dates-medjool.png",
  "Cooking Oil (Canola/Sunflower/Corn)": "/product-images/cooking-oil-blend.png",
  "Sunflower Oil": "/product-images/cooking-oil-blend.png",
  "Extra Virgin Olive Oil": "/product-images/extra-virgin-olive-oil.png",
};

export function resolveProductImageUrl(name: string, imageUrl?: string | null) {
  const mapped = PRODUCT_IMAGE_BY_NAME[name];
  if (mapped) return mapped;
  if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
  return "/product-images/frozen-chicken-samosa.png";
}
