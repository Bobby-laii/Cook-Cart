import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COOKCART_SYSTEM_PROMPT } from "../src/config/systemPrompt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting CookCart Seed Script...");

  // 1. Clear existing records to ensure clean idempotent seed
  await prisma.orderNotification.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.savedRecipe.deleteMany({});
  await prisma.recipe.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.chatConversation.deleteMany({});
  await prisma.aIUsageLog.deleteMany({});
  await prisma.appSetting.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 2. Create Users
  console.log("Creating default users with role-based access...");
  const customerUser = await prisma.user.create({
    data: {
      email: "customer@cookcart.hk",
      passwordHash: defaultPasswordHash,
      name: "Alice Chan (Customer)",
      role: "CUSTOMER",
      dietaryRestrictions: "None",
      allergies: "None",
      preferredLanguage: "en",
    },
  });

  const storePartnerUser = await prisma.user.create({
    data: {
      email: "store@cookcart.hk",
      passwordHash: defaultPasswordHash,
      name: "David Wong (ParkGrocer Manager)",
      role: "STORE_PARTNER",
      preferredLanguage: "en",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@cookcart.hk",
      passwordHash: defaultPasswordHash,
      name: "CookCart Admin",
      role: "ADMIN",
      preferredLanguage: "en",
    },
  });

  console.log("Users created:");
  console.log(`- Customer: ${customerUser.email}`);
  console.log(`- Store Partner: ${storePartnerUser.email}`);
  console.log(`- Admin: ${adminUser.email}`);

  // 3. Create 4 Mock Stores in Hong Kong
  console.log("Creating 4 mock Hong Kong supermarket & grocer partners...");
  const parkGrocer = await prisma.store.create({
    data: {
      name: "ParkGrocer HK",
      nameZh: "百家超級市場 (模擬)",
      slug: "parkgrocer-hk",
      description: "Hong Kong's trusted neighborhood supermarket with wide everyday variety.",
      descriptionZh: "香港大型連鎖超市，提供豐富齊全的日用百貨與生鮮食材。",
      address: "Shop 102, G/F, Fortress Tower, North Point, Hong Kong",
      addressZh: "香港北角英皇道富利商業大廈地下 102 號舖",
      logoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&q=80",
      deliveryFee: 30.0,
      freeDeliveryThreshold: 350.0,
      minOrderAmount: 80.0,
      deliveryTimeEstimate: "45-60 mins",
      pickupAvailable: true,
      deliveryAvailable: true,
      partnerUserId: storePartnerUser.id,
    },
  });

  const wellMart = await prisma.store.create({
    data: {
      name: "WellMart HK",
      nameZh: "惠購良品 (模擬)",
      slug: "wellmart-hk",
      description: "Value-focused grocery champion with low everyday prices and bulk savings.",
      descriptionZh: "主打超值抵買的平價生活超市，適合家庭常備與批量選購。",
      address: "B1, Hopewell Centre, Wan Chai, Hong Kong",
      addressZh: "香港灣仔皇后大道東合和中心地庫 B1",
      logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80",
      deliveryFee: 25.0,
      freeDeliveryThreshold: 300.0,
      minOrderAmount: 70.0,
      deliveryTimeEstimate: "50-70 mins",
      pickupAvailable: true,
      deliveryAvailable: true,
    },
  });

  const citySupermarket = await prisma.store.create({
    data: {
      name: "CitySupermarket HK",
      nameZh: "城品鮮選 (模擬)",
      slug: "citysupermarket-hk",
      description: "High-end international gourmet grocery, premium meats, and imported Asian essentials.",
      descriptionZh: "精緻高端精品超市，進口和牛、空運生鮮及各國特選調味料專門店。",
      address: "Level 3, ifc mall, Central, Hong Kong",
      addressZh: "香港中環國際金融中心商場 3 樓",
      logoUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&q=80",
      deliveryFee: 45.0,
      freeDeliveryThreshold: 500.0,
      minOrderAmount: 150.0,
      deliveryTimeEstimate: "30-45 mins",
      pickupAvailable: true,
      deliveryAvailable: true,
    },
  });

  const freshPantry = await prisma.store.create({
    data: {
      name: "FreshPantry HK",
      nameZh: "街市鮮檔 (模擬)",
      slug: "freshpantry-hk",
      description: "Farm-to-door local wet market produce, day-boat fish, and fresh chilled butchery.",
      descriptionZh: "主打本地農場直送鮮菜、當日漁獲及每日新鮮溫體肉品，鮮味第一。",
      address: "G/F, Bowrington Road Market, Causeway Bay, Hong Kong",
      addressZh: "香港銅鑼灣寶靈頓道街市地下 12 號舖",
      logoUrl: "https://images.unsplash.com/photo-1516594709413-e7395fad44dc?w=200&q=80",
      deliveryFee: 20.0,
      freeDeliveryThreshold: 250.0,
      minOrderAmount: 60.0,
      deliveryTimeEstimate: "40-55 mins",
      pickupAvailable: true,
      deliveryAvailable: true,
    },
  });

  // 4. Products Catalog Template (Base catalog with realistic HK prices)
  console.log("Generating 150+ realistic products across all stores with price variations...");

  interface ProductTemplate {
    name: string;
    nameZh: string;
    category: string;
    categoryZh: string;
    unit: string;
    basePrice: number;
    description: string;
    descriptionZh: string;
    imageUrl: string;
  }

  const catalogTemplates: ProductTemplate[] = [
    // Fresh Vegetables
    {
      name: "Hong Kong Bok Choy (Pak Choi)",
      nameZh: "白菜仔 / 奶白菜",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "400g pack",
      basePrice: 14.5,
      description: "Fresh, tender white-stemmed bok choy, ideal for quick stir-fry with garlic.",
      descriptionZh: "清甜嫩脆白菜仔，快炒生滾皆宜。",
      imageUrl: "https://images.unsplash.com/photo-1515471204630-e60b7d01c824?w=400&q=80",
    },
    {
      name: "Fresh Chinese Gai Lan (Chinese Broccoli)",
      nameZh: "鮮嫩芥蘭",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "450g pack",
      basePrice: 16.0,
      description: "Crisp and succulent Hong Kong Gai Lan, classic with oyster sauce or sliced beef.",
      descriptionZh: "翠綠脆甜芥蘭，經典伴蠔油或炒牛肉必備。",
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
    },
    {
      name: "Fresh Choy Sum",
      nameZh: "優質菜心苗",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "400g pack",
      basePrice: 15.5,
      description: "Sweet and crisp flowering Chinese greens, staple of Hong Kong home cooking.",
      descriptionZh: "鮮甜爽脆菜心苗，香港家常餐桌不可或缺。",
      imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
    },
    {
      name: "Fresh Broccoli",
      nameZh: "西蘭花",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "1 head (approx 400g)",
      basePrice: 18.0,
      description: "Dense, fresh green broccoli florets packed with fiber and vitamins.",
      descriptionZh: "緊實鮮綠西蘭花，營養豐富。",
      imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80",
    },
    {
      name: "Organic Carrots",
      nameZh: "有機紅蘿蔔",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "500g bag",
      basePrice: 12.0,
      description: "Sweet and crunchy organic carrots, great for soups and braises.",
      descriptionZh: "清甜爽脆有機紅蘿蔔，煲湯燉煮佳品。",
      imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80",
    },
    {
      name: "Old Ginger Root",
      nameZh: "老薑",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "250g pack",
      basePrice: 9.5,
      description: "Aromatic old ginger root, essential for deodorizing meat and seasoning.",
      descriptionZh: "辛香濃郁老薑，去腥提鮮家常必備。",
      imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80",
    },
    {
      name: "Whole Garlic Bulbs",
      nameZh: "原粒大蒜 / 蒜頭",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "3 bulbs mesh bag",
      basePrice: 11.0,
      description: "Plump, pungent whole garlic bulbs for everyday aromatic stir-fries.",
      descriptionZh: "粒粒飽滿蒜頭，炒菜爆香靈魂。",
      imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80",
    },
    {
      name: "Fresh Spring Onions (Scallions)",
      nameZh: "新鮮青蔥 / 香蔥",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "150g bunch",
      basePrice: 7.5,
      description: "Crisp green spring onions, perfect for steaming sauces and garnishes.",
      descriptionZh: "青翠鮮香蔥一把，蒸魚點綴皆相宜。",
      imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
    },
    {
      name: "Yellow Onions",
      nameZh: "黃洋蔥",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "1kg bag",
      basePrice: 16.0,
      description: "Sweet cooking onions, caramelizes beautifully in stir-fries and stews.",
      descriptionZh: "百搭甜洋蔥，爆炒燉煮均佳。",
      imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80",
    },
    {
      name: "Vine Tomatoes",
      nameZh: "串紅蕃茄 / 西紅柿",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "500g pack (4-5 pcs)",
      basePrice: 17.5,
      description: "Juicy, ripe tomatoes with balanced sweetness and acidity for tomato egg dishes.",
      descriptionZh: "鮮甜多汁熟蕃茄，炒滑蛋絕配。",
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
    },
    {
      name: "Fresh Shiitake Mushrooms",
      nameZh: "鮮冬菇 / 香菇",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "200g pack",
      basePrice: 19.5,
      description: "Plump fresh shiitake mushrooms, rich in savory umami for steaming chicken.",
      descriptionZh: "厚肉鮮香菇，蒸雞燉湯極之鮮美。",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    },
    {
      name: "Fresh Bird's Eye Red Chilies",
      nameZh: "新鮮指天椒",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "100g pack",
      basePrice: 8.0,
      description: "Fiery fresh red chilies to bring authentic heat to stir-fries and dipping sauces.",
      descriptionZh: "辛辣開胃指天椒，提味添色。",
      imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80",
    },
    {
      name: "Fresh Russet Potatoes",
      nameZh: "美國薯仔 / 馬鈴薯",
      category: "Vegetables",
      categoryZh: "新鮮蔬菜",
      unit: "1kg bag",
      basePrice: 19.0,
      description: "Versatile, starchy russet potatoes for braised pork or curries.",
      descriptionZh: "粉糯優質薯仔，燜肉咖哩皆可。",
      imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
    },

    // Fresh Meats & Seafood
    {
      name: "Fresh Chilled Chicken Thigh Fillets (Boneless)",
      nameZh: "冰鮮無骨雞扒 (去骨雞腿肉)",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "450g pack",
      basePrice: 38.0,
      description: "Juicy, tender boneless skinless chicken thighs, perfect for stir-fries and grilling.",
      descriptionZh: "嫩滑無骨雞腿肉，煎炒煮炸皆鮮嫩多汁。",
      imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80",
    },
    {
      name: "Fresh Chilled Pork Belly Slice",
      nameZh: "新鮮五花腩片",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "400g pack",
      basePrice: 42.0,
      description: "Evenly layered pork belly slices, ideal for twice-cooked pork or braising.",
      descriptionZh: "肥瘦相間精選五花腩片，回鍋肉或家常紅燒首選。",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    },
    {
      name: "Premium Lean Minced Pork",
      nameZh: "特選免治豬肉 (瘦肉碎)",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "350g pack",
      basePrice: 34.0,
      description: "Finely ground lean pork for mapo tofu, dumplings, or steamed patties.",
      descriptionZh: "低脂免治豬肉，肉餅、麻婆豆腐必備。",
      imageUrl: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80",
    },
    {
      name: "US Chuck Beef Slices (Hot Pot / Stir Fry)",
      nameZh: "特級牛肩肉片",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "300g pack",
      basePrice: 58.0,
      description: "Tender, thinly sliced chuck beef, melts in fast stir-fries with vegetables.",
      descriptionZh: "薄切嫩滑牛肩肉片，快炒芥蘭洋蔥極之相宜。",
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80",
    },
    {
      name: "Fresh Atlantic Salmon Fillet",
      nameZh: "新鮮大西洋三文魚柳",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "300g piece",
      basePrice: 65.0,
      description: "Omega-3 rich sashimi-grade Atlantic salmon fillet, great pan-seared.",
      descriptionZh: "富含Omega-3深海三文魚柳，香煎外脆內嫩。",
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
    },
    {
      name: "Peeled Deveined Tiger Prawns",
      nameZh: "特大去殼無頭蝦仁 / 虎蝦",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "300g pack",
      basePrice: 48.0,
      description: "Plump, bouncy peeled tiger prawns, ready for quick wok stir-fries.",
      descriptionZh: "爽口彈牙大虎蝦仁，即煮即炒超方便。",
      imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80",
    },
    {
      name: "Organic Firm Tofu (Non-GMO)",
      nameZh: "有機硬豆腐 (老豆腐)",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "400g block",
      basePrice: 11.5,
      description: "Hearty firm non-GMO tofu block that holds its shape in braises and pan-frying.",
      descriptionZh: "非基因改造硬豆腐，煎炒燜煮不易散。",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    },
    {
      name: "Fresh Hong Kong Silken Tofu",
      nameZh: "本地鮮嫩滑豆腐",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "350g block",
      basePrice: 9.5,
      description: "Silky, delicate chilled tofu, excellent for soups and steamed dishes.",
      descriptionZh: "豆香濃郁嫩滑豆腐，滾湯清蒸一絕。",
      imageUrl: "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=400&q=80",
    },
    {
      name: "Japanese Pasteurized Fresh Eggs",
      nameZh: "日本產地直送鮮雞蛋",
      category: "Meat & Seafood",
      categoryZh: "肉類及海鮮",
      unit: "10-egg carton",
      basePrice: 28.0,
      description: "High quality Japanese eggs with vibrant orange yolks, safe and creamy.",
      descriptionZh: "日本直送濃醇蛋黃雞蛋，生食炒蛋皆安心鮮美。",
      imageUrl: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80",
    },

    // Sauces & Condiments
    {
      name: "Lee Kum Kee Premium Light Soy Sauce",
      nameZh: "李錦記特級生抽",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "500ml bottle",
      basePrice: 18.5,
      description: "Naturally brewed light soy sauce for savory seasoning and marinades.",
      descriptionZh: "天然釀造特級生抽，鹹鮮甘醇，廚房必備。",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
    },
    {
      name: "Lee Kum Kee Premium Dark Soy Sauce",
      nameZh: "李錦記精選老抽",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "500ml bottle",
      basePrice: 19.0,
      description: "Rich dark soy sauce for appetizing deep golden color in stir-fries.",
      descriptionZh: "醇厚老抽，上色紅亮，紅燒炒粉必備。",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
    },
    {
      name: "Lee Kum Kee Premium Oyster Sauce",
      nameZh: "李錦記舊庄特級蠔油",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "510g glass bottle",
      basePrice: 32.5,
      description: "Authentic oyster extract sauce, thick with sweet umami flavor.",
      descriptionZh: "百年秘方真蠔精華，濃郁鮮甜，粵菜點睛。",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
    },
    {
      name: "Shaoxing Cooking Rice Wine (Pagoda Brand)",
      nameZh: "正宗紹興花雕廚酒",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "640ml bottle",
      basePrice: 22.0,
      description: "Traditional Shaoxing wine for deglazing woks and tenderizing meats.",
      descriptionZh: "酒香醇厚，去肉羶解魚腥，炒菜添香必選。",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
    },
    {
      name: "Pure Toasted Sesame Oil",
      nameZh: "純真頂級黑芝麻油 / 麻油",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "207ml bottle",
      basePrice: 24.5,
      description: "100% pure fragrant toasted sesame oil for finishing aromatic dishes.",
      descriptionZh: "濃香純正芝麻油，出鍋淋上一滴香氣撲鼻。",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    },
    {
      name: "Chiu Chow Style Chili Oil",
      nameZh: "潮式特辣辣椒油",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "205g jar",
      basePrice: 26.0,
      description: "Savory chili oil infused with garlic bits and salted chili flakes.",
      descriptionZh: "香蒜與乾辣椒粒調製，香辣過癮蘸醬良伴。",
      imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80",
    },
    {
      name: "Sichuan Pixian Broad Bean Paste (Doubanjiang)",
      nameZh: "正宗郫縣豆瓣醬",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "380g jar",
      basePrice: 21.0,
      description: "Fermented broad bean and chili paste, the essential soul of Mapo Tofu.",
      descriptionZh: "川菜之魂，濃香紅油豆瓣，烹製麻婆豆腐必備。",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
    },
    {
      name: "Pure Thai Fish Sauce (Megachef)",
      nameZh: "特級純天然魚露",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "200ml bottle",
      basePrice: 17.0,
      description: "Gluten-free premium anchovy fish sauce for authentic Southeast Asian cooking.",
      descriptionZh: "天然鯷魚釀造，東南亞風味調味提鮮必用。",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
    },
    {
      name: "Extra Virgin Olive Oil",
      nameZh: "特級初榨冷壓橄欖油",
      category: "Sauces & Condiments",
      categoryZh: "醬料及調味品",
      unit: "500ml bottle",
      basePrice: 52.0,
      description: "Cold-pressed extra virgin Mediterranean olive oil.",
      descriptionZh: "地中海冷壓特級初榨橄欖油，沙律意粉絕配。",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    },

    // Grains, Staples & Noodles
    {
      name: "Thai Hom Mali Jasmine Rice (Golden Phoenix)",
      nameZh: "金鳳泰國特級頂級香米",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "5kg bag",
      basePrice: 88.0,
      description: "Fragrant, soft, and naturally aromatic whole grain Thai jasmine rice.",
      descriptionZh: "泰國原裝進口香米，煮飯軟滑甘香。",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    },
    {
      name: "Hong Kong Fresh Wonton Egg Noodles",
      nameZh: "本地鮮造全蛋幼麵 / 雲吞麵",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "450g pack (4 bundles)",
      basePrice: 22.0,
      description: "Bouncy, springy whole-egg noodles made fresh in Hong Kong.",
      descriptionZh: "爽滑彈牙全蛋麵，港式撈麵湯麵首選。",
      imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80",
    },
    {
      name: "Barilla Italian Spaghetti No. 5",
      nameZh: "百味來意大利傳統長通粉 / 意粉",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "500g box",
      basePrice: 19.5,
      description: "100% durum wheat semolina Italian spaghetti, cooks al dente.",
      descriptionZh: "意大利進口優質杜蘭小麥意粉，口感彈牙耐煮。",
      imageUrl: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80",
    },
    {
      name: "Pure Cornstarch (Thickener)",
      nameZh: "廚用特級純粟粉 (生粉)",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "454g box",
      basePrice: 11.0,
      description: "Fine cornstarch for marinades, velvety meat texture, and thickening sauces.",
      descriptionZh: "醃肉鎖水滑嫩、調製芡汁必備優質粟粉。",
      imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80",
    },
    {
      name: "Natural Fine Sea Salt",
      nameZh: "天然純淨細海鹽",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "500g container",
      basePrice: 8.5,
      description: "Clean culinary fine sea salt for seasoning and everyday baking.",
      descriptionZh: "純淨無添加細海鹽，家常調味基本之選。",
      imageUrl: "https://images.unsplash.com/photo-1518110903495-cd99c129c540?w=400&q=80",
    },
    {
      name: "Whole Black Peppercorn Grinder",
      nameZh: "研磨式原粒黑胡椒粒",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "100g grinder jar",
      basePrice: 28.0,
      description: "Aromatic black peppercorns in an easy built-in adjustable grinder.",
      descriptionZh: "自帶研磨器原粒黑胡椒，現磨辛香開胃。",
      imageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400&q=80",
    },
    {
      name: "Pure Cane Granulated Sugar",
      nameZh: "純蔗幼白砂糖",
      category: "Grains & Noodles",
      categoryZh: "米麵雜糧",
      unit: "1kg bag",
      basePrice: 15.0,
      description: "Refined pure cane sugar to balance acidity and enhance marinades.",
      descriptionZh: "天然甘蔗幼白糖，烹飪提味去酸好幫手。",
      imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&q=80",
    },

    // Dairy & International Pantry
    {
      name: "Meiji Fresh Pasteurized Milk",
      nameZh: "明治頂級鮮牛奶",
      category: "Dairy & International",
      categoryZh: "乳製品及進口食材",
      unit: "946ml carton",
      basePrice: 29.5,
      description: "Rich and creamy 100% fresh pasteurized cow's milk.",
      descriptionZh: "日本技術香濃純鮮奶，香醇順口。",
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
    },
    {
      name: "Anchor New Zealand Salted Butter",
      nameZh: "安佳紐西蘭純天然有鹽牛油",
      category: "Dairy & International",
      categoryZh: "乳製品及進口食材",
      unit: "227g block",
      basePrice: 31.0,
      description: "Grass-fed New Zealand cream butter with delicious richness.",
      descriptionZh: "草飼天然有鹽牛油，煎肉烘焙香味濃郁。",
      imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80",
    },
    {
      name: "S&B Golden Curry Sauce Mix (Medium Hot)",
      nameZh: "S&B 金牌日式咖喱磚 (中辛)",
      category: "Dairy & International",
      categoryZh: "乳製品及進口食材",
      unit: "198g box",
      basePrice: 25.0,
      description: "Classic Japanese aromatic curry roux block with rich spice depth.",
      descriptionZh: "日本銷量第一咖喱磚，醇厚溫和老少咸宜。",
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80",
    },
    {
      name: "Aroy-D Pure Coconut Milk",
      nameZh: "原裝泰國高純度椰漿",
      category: "Dairy & International",
      categoryZh: "乳製品及進口食材",
      unit: "400ml can",
      basePrice: 15.5,
      description: "Rich unsweetened coconut milk for curries, laksa, and Thai soups.",
      descriptionZh: "無糖純椰漿，煮泰式綠咖喱、叻沙必不可少。",
      imageUrl: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80",
    },
    {
      name: "San Marzano Style Canned Peeled Tomatoes",
      nameZh: "意大利去皮長條番茄罐頭",
      category: "Dairy & International",
      categoryZh: "乳製品及進口食材",
      unit: "400g tin",
      basePrice: 16.5,
      description: "Plum tomatoes packed in rich tomato juice, perfect for pasta sauces.",
      descriptionZh: "意大利進口去皮原粒番茄，熬煮意粉醬靈魂所在。",
      imageUrl: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&q=80",
    },
  ];

  // Helper multipliers to model realistic differences between stores:
  // - WellMart: Budget (-8%)
  // - ParkGrocer: Standard benchmark (1.0x)
  // - CitySupermarket: Premium / Gourmet (+22%)
  // - FreshPantry: Wet-market style fresh produce (-5% on veggies/meats, standard on dry)
  const stores = [
    { record: parkGrocer, mult: 1.0, stockOffset: 120 },
    { record: wellMart, mult: 0.92, stockOffset: 150 },
    { record: citySupermarket, mult: 1.22, stockOffset: 80 },
    { record: freshPantry, mult: 0.95, stockOffset: 90 },
  ];

  let totalProductsCreated = 0;

  for (const store of stores) {
    for (const item of catalogTemplates) {
      // Calculate realistic price for each store
      let storePrice = Math.round(item.basePrice * store.mult * 10) / 10;
      // In CitySupermarket, some fresh produce is extra premium
      if (store.record.slug === "citysupermarket-hk" && item.category === "Vegetables") {
        storePrice = Math.round(storePrice * 1.15 * 10) / 10;
      }
      // In FreshPantry, dry goods might have slightly fewer varieties, but fresh items are cheaper
      if (store.record.slug === "freshpantry-hk" && item.category === "Vegetables") {
        storePrice = Math.round(item.basePrice * 0.88 * 10) / 10;
      }

      await prisma.product.create({
        data: {
          storeId: store.record.id,
          name: item.name,
          nameZh: item.nameZh,
          category: item.category,
          categoryZh: item.categoryZh,
          description: item.description,
          descriptionZh: item.descriptionZh,
          price: storePrice,
          unit: item.unit,
          stock: store.stockOffset + Math.floor(Math.random() * 40),
          imageUrl: item.imageUrl,
          isMock: true,
        },
      });
      totalProductsCreated++;
    }
  }

  console.log(`✅ Created ${totalProductsCreated} mock products across 4 stores!`);

  // 5. Seed Core Sample Recipes
  console.log("Seeding core Hong Kong & global recipes...");
  await prisma.recipe.create({
    data: {
      title: "Cantonese Steamed Chicken with Shiitake & Shaoxing Wine",
      titleZh: "粵式古法香菇蒸滑雞",
      cuisine: "Cantonese",
      cookTimeMinutes: 25,
      difficulty: "Easy",
      servings: 2,
      description: "A beloved Cantonese comfort food classic featuring velvety tender chicken infused with dried shiitake mushrooms, ginger, and Shaoxing wine.",
      descriptionZh: "香港經典家常名菜，雞肉嫩滑多汁，香菇鮮香四溢，薑絲酒香撲鼻。",
      ingredients: JSON.stringify([
        { name: "Fresh Chilled Chicken Thigh Fillets", nameZh: "去骨雞腿肉", amount: 400, unit: "g" },
        { name: "Fresh Shiitake Mushrooms", nameZh: "鮮冬菇", amount: 4, unit: "pcs" },
        { name: "Old Ginger Root", nameZh: "老薑", amount: 15, unit: "g (sliced)" },
        { name: "Fresh Spring Onions", nameZh: "青蔥", amount: 2, unit: "stalks" },
      ]),
      extraIngredients: JSON.stringify([
        { name: "Shaoxing Cooking Rice Wine", nameZh: "紹興花雕廚酒", amount: 1, unit: "tbsp" },
        { name: "Lee Kum Kee Premium Light Soy Sauce", nameZh: "生抽", amount: 1.5, unit: "tbsp" },
        { name: "Pure Toasted Sesame Oil", nameZh: "芝麻油", amount: 1, unit: "tsp" },
        { name: "Pure Cornstarch", nameZh: "生粉", amount: 1, unit: "tbsp" },
        { name: "Pure Cane Granulated Sugar", nameZh: "白糖", amount: 0.5, unit: "tsp" },
      ]),
      instructions: JSON.stringify([
        {
          step: 1,
          title: "Prep & Marinate Chicken",
          titleZh: "切塊與醃製",
          text: "Cut chicken thighs into bite-sized 3cm pieces. Slice shiitake mushrooms and julienne the ginger. In a bowl, toss chicken with soy sauce, Shaoxing wine, sugar, sesame oil, and cornstarch. Let rest for 10 minutes.",
          textZh: "雞腿肉切成約3厘米適口塊狀。鮮冬菇去蒂切厚片，生薑切細絲。加入生抽、花雕酒、糖、麻油及生粉抓勻醃製10分鐘。",
          timerSeconds: 600,
        },
        {
          step: 2,
          title: "Arrange on Steaming Plate",
          titleZh: "擺盤",
          text: "Spread the marinated chicken and mushrooms in a single even layer onto a heatproof ceramic steaming dish. Scatter the ginger slivers over the top.",
          textZh: "將醃好的雞肉與香菇平鋪在耐熱蒸碟上，保持單層受熱均勻，表面均勻撒上薑絲。",
        },
        {
          step: 3,
          title: "Steam over High Heat",
          titleZh: "大火隔水清蒸",
          text: "Bring water in a wok or steamer to a vigorous rolling boil. Place the steaming dish inside, cover tightly with the lid, and steam on high heat for 12 to 14 minutes until cooked through.",
          textZh: "鍋中注入足量清水，大火燒至水大滾起白煙。放入蒸碟，蓋緊鍋蓋，大火隔水蒸12至14分鐘直至全熟。",
          timerSeconds: 780,
        },
        {
          step: 4,
          title: "Garnish & Serve",
          titleZh: "撒蔥出鍋",
          text: "Carefully remove the dish using heatproof tongs. Scatter freshly chopped spring onions on top. Serve immediately alongside hot jasmine rice.",
          textZh: "小心端出蒸碟，撒上翠綠蔥花。熱氣騰騰伴隨金黃米飯享用！",
        },
      ]),
      tips: "For the silkiest texture, always mix the liquid seasonings first before folding in the cornstarch.",
      safetyNotes: "Ensure chicken reaches an internal core temperature of 75°C (165°F). Juices should run completely clear.",
      isAIRecommended: true,
    },
  });

  await prisma.recipe.create({
    data: {
      title: "Hong Kong Stir-Fried Beef with Gai Lan (Chinese Broccoli)",
      titleZh: "港式芥蘭炒滑牛肉",
      cuisine: "Cantonese",
      cookTimeMinutes: 18,
      difficulty: "Easy",
      servings: 2,
      description: "A staple dai pai dong favorite: tender marinated beef slices flash-seared in a hot wok with crunchy, sweet Chinese broccoli and oyster sauce.",
      descriptionZh: "香港大牌檔鑊氣代表作：滑嫩醃牛肉大火快炒清甜爽脆芥蘭，伴濃郁蠔油汁。",
      ingredients: JSON.stringify([
        { name: "US Chuck Beef Slices", nameZh: "牛肩肉片", amount: 250, unit: "g" },
        { name: "Fresh Chinese Gai Lan", nameZh: "鮮嫩芥蘭", amount: 350, unit: "g" },
        { name: "Whole Garlic Bulbs", nameZh: "大蒜", amount: 3, unit: "cloves (minced)" },
        { name: "Old Ginger Root", nameZh: "老薑", amount: 10, unit: "g (sliced)" },
      ]),
      extraIngredients: JSON.stringify([
        { name: "Lee Kum Kee Premium Oyster Sauce", nameZh: "蠔油", amount: 1.5, unit: "tbsp" },
        { name: "Lee Kum Kee Premium Light Soy Sauce", nameZh: "生抽", amount: 1, unit: "tbsp" },
        { name: "Shaoxing Cooking Rice Wine", nameZh: "紹興花雕廚酒", amount: 1, unit: "tbsp" },
        { name: "Pure Cornstarch", nameZh: "生粉", amount: 1, unit: "tsp" },
        { name: "Pure Cane Granulated Sugar", nameZh: "白糖", amount: 0.5, unit: "tsp" },
      ]),
      instructions: JSON.stringify([
        {
          step: 1,
          title: "Marinate Beef Slices",
          titleZh: "醃製嫩牛肉",
          text: "In a mixing bowl, combine sliced beef with light soy sauce, sugar, a dash of water, and cornstarch. Toss well and marinate for 10 minutes.",
          textZh: "牛肉片放入碗中，加入生抽、少許糖、清水及生粉抓勻醃製10分鐘上漿。",
          timerSeconds: 600,
        },
        {
          step: 2,
          title: "Blanch Gai Lan",
          titleZh: "芥蘭汆水",
          text: "Trim tough stem ends from Gai Lan. In a pot of boiling water with 1 tsp oil and a pinch of salt, blanch Gai Lan for 60 seconds until bright green. Drain well.",
          textZh: "芥蘭修去老根。沸水中加入少許油及鹽，下芥蘭汆水約60秒至翠綠，撈出瀝乾備用。",
          timerSeconds: 60,
        },
        {
          step: 3,
          title: "Sear Beef in Wok",
          titleZh: "大火滑炒牛肉",
          text: "Heat 1 tbsp oil in a wok over high heat until lightly smoking. Add beef and sear without stirring for 30 seconds, then toss vigorously for 1 minute until 80% browned. Transfer to a plate.",
          textZh: "鑊中大火燒熱油至微冒煙，下牛肉攤平煎香30秒，隨後快速翻炒1分鐘至八成熟，盛出備用。",
          timerSeconds: 90,
        },
        {
          step: 4,
          title: "Combine with Greens & Oyster Sauce",
          titleZh: "合炒翻勻出鑊",
          text: "Add minced garlic and ginger to the hot wok. Add the blanched Gai Lan, seared beef, oyster sauce, and splash Shaoxing wine around the wok perimeter. Toss vigorously for 45 seconds and serve.",
          textZh: "鑊中爆香蒜蓉薑片，回鍋芥蘭與牛肉，淋上蠔油並沿鑊邊激入花雕酒，大火翻炒45秒香氣四溢即可裝盤。",
          timerSeconds: 45,
        },
      ]),
      tips: "Wok temperature is key! High heat creates authentic 'wok hei' (breath of the wok) without overcooking the beef.",
      safetyNotes: "Sear beef hot and fast; cook until thoroughly heated throughout.",
      isAIRecommended: true,
    },
  });

  await prisma.recipe.create({
    data: {
      title: "Classic Hong Kong Silky Tomato Egg Stir-Fry",
      titleZh: "經典港式蕃茄炒滑蛋",
      cuisine: "Cantonese",
      cookTimeMinutes: 12,
      difficulty: "Easy",
      servings: 2,
      description: "The quintessential Chinese comfort dish: fluffy scrambled eggs swimming in a sweet, savory, and tangy fresh tomato reduction sauce.",
      descriptionZh: "萬能國民下飯菜：金黃鬆軟滑蛋融合酸甜多汁鮮蕃茄濃汁，拌飯一絕。",
      ingredients: JSON.stringify([
        { name: "Japanese Pasteurized Fresh Eggs", nameZh: "鮮雞蛋", amount: 4, unit: "eggs" },
        { name: "Vine Tomatoes", nameZh: "鮮紅蕃茄", amount: 3, unit: "pcs" },
        { name: "Fresh Spring Onions", nameZh: "青蔥", amount: 2, unit: "stalks" },
      ]),
      extraIngredients: JSON.stringify([
        { name: "Pure Cane Granulated Sugar", nameZh: "白糖", amount: 1.5, unit: "tsp" },
        { name: "Natural Fine Sea Salt", nameZh: "海鹽", amount: 0.5, unit: "tsp" },
        { name: "Pure Cornstarch", nameZh: "生粉水", amount: 1, unit: "tbsp" },
      ]),
      instructions: JSON.stringify([
        {
          step: 1,
          title: "Prep Eggs and Tomatoes",
          titleZh: "打蛋與切蕃茄",
          text: "Beat 4 eggs with a pinch of salt until thoroughly blended. Cut tomatoes into bite-sized wedges.",
          textZh: "4隻雞蛋加少許鹽充分打散。蕃茄洗淨切成滾刀塊。",
        },
        {
          step: 2,
          title: "Soft Scramble the Eggs",
          titleZh: "滑炒嫩蛋",
          text: "Heat 1 tbsp oil in a non-stick pan over medium heat. Pour in beaten eggs. As edges set, gently push eggs inward with a spatula until soft curds form (80% set). Slide onto a plate.",
          textZh: "平底鍋中火燒熱油，倒入蛋液。待邊緣稍凝固用鑊鏟輕輕向中央推動，炒至八成熟呈鬆軟嫩凝狀，立即盛出。",
          timerSeconds: 60,
        },
        {
          step: 3,
          title: "Simmer Tomatoes into Sauce",
          titleZh: "翻炒煮出蕃茄濃汁",
          text: "In the same pan, add chopped tomatoes, sugar, and 2 tbsp water. Simmer on medium-low for 3 to 4 minutes, crushing lightly with a spatula until a rich saucy texture forms.",
          textZh: "原鍋倒入蕃茄塊、白糖及2湯匙水，中慢火煮約3-4分鐘，用鏟輕壓蕃茄逼出果汁成濃郁醬汁。",
          timerSeconds: 240,
        },
        {
          step: 4,
          title: "Fold Together",
          titleZh: "合炒撒蔥",
          text: "Stir in cornstarch slurry to thicken. Return the eggs to the pan, fold gently with the tomato sauce for 30 seconds. Garnish with chopped scallions.",
          textZh: "淋入少許生粉水勾薄芡。倒回滑蛋輕柔翻勻30秒讓蛋塊裹滿茄汁，撒上蔥花出鍋！",
          timerSeconds: 30,
        },
      ]),
      tips: "Never overcook the eggs in step 2; they will finish cooking when folded into the hot tomato reduction.",
      safetyNotes: "Pasteurized eggs guarantee safety even when keeping eggs silky soft.",
      isAIRecommended: true,
    },
  });

  // 6. Create Default App Settings
  console.log("Configuring initial app settings...");
  const settings = [
    { key: "transaction_fee_percent", value: "5.0", description: "Platform transaction commission fee percentage" },
    { key: "default_delivery_fee", value: "30.0", description: "Standard flat delivery fee in HKD" },
    { key: "free_delivery_threshold", value: "350.0", description: "Order subtotal threshold for free delivery in HKD" },
    { key: "ai_model_name", value: "gemini-1.5-flash", description: "Configured LLM engine model name" },
    { key: "ai_monthly_spending_cap", value: "100.0", description: "Monthly budget ceiling for AI API calls in HKD" },
    { key: "system_prompt", value: COOKCART_SYSTEM_PROMPT, description: "Active culinary system prompt" },
  ];

  for (const s of settings) {
    await prisma.appSetting.create({ data: s });
  }

  console.log("✅ Seed completed successfully! CookCart database is ready.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
