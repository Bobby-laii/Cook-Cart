export interface CountryCuisine {
  id: string;
  name: string;
  nameZh: string;
  flag: string;
  description: string;
  descriptionZh: string;
  popularDishes: string[];
  spoonacularCuisine?: string; // Query keyword for recipe APIs
}

export interface ContinentCategory {
  id: string;
  name: string;
  nameZh: string;
  emoji: string;
  description: string;
  descriptionZh: string;
  countries: CountryCuisine[];
}

export const CONTINENT_CUISINES: ContinentCategory[] = [
  {
    id: "asia",
    name: "Asia",
    nameZh: "亞洲",
    emoji: "🌏",
    description: "Diverse culinary traditions rich in wok mastery, aromatic spices, and delicate noodle arts.",
    descriptionZh: "多元且悠久的美食傳統，匯聚鑊氣快炒、香濃香料與精緻麵食工藝。",
    countries: [
      {
        id: "china",
        name: "China (Cantonese & Regional)",
        nameZh: "中國（粵菜及各大菜系）",
        flag: "🇨🇳",
        description: "From Hong Kong Dim Sum and wok hei stir-fries to spicy Sichuan and savory Shanghainese braises.",
        descriptionZh: "由香港點心、大牌檔鑊氣小炒，到香辣川菜與濃油赤醬上海本幫菜。",
        popularDishes: ["Dim Sum", "Cantonese Steamed Fish", "Char Siu Pork", "Mapo Tofu", "Wonton Noodle Soup"],
        spoonacularCuisine: "Chinese",
      },
      {
        id: "japan",
        name: "Japan",
        nameZh: "日本",
        flag: "🇯🇵",
        description: "Emphasizes seasonal ingredients, refined umami broths, crisp tempura, and artisanal ramen.",
        descriptionZh: "講究旬之時令、濃郁鮮甜高湯、酥脆天婦羅與職人拉麵。",
        popularDishes: ["Tonkotsu Ramen", "Chicken Teriyaki", "Sushi & Sashimi", "Tempura", "Miso Soup"],
        spoonacularCuisine: "Japanese",
      },
      {
        id: "korea",
        name: "Korea",
        nameZh: "韓國",
        flag: "🇰🇷",
        description: "Bold fermented flavors, gochujang heat, sizzling tabletop BBQ, and comforting stew pots.",
        descriptionZh: "鮮明濃郁的發酵風味、韓式辣醬、滋滋作響的烤肉與暖胃泡菜鍋。",
        popularDishes: ["Kimchi Jjigae", "Bulgogi Beef", "Bibimbap", "Korean Fried Chicken", "Tteokbokki"],
        spoonacularCuisine: "Korean",
      },
      {
        id: "thailand",
        name: "Thailand",
        nameZh: "泰國",
        flag: "🇹🇭",
        description: "Harmonious balance of sweet, sour, salty, spicy, and fragrant herbs like lemongrass and basil.",
        descriptionZh: "完美平衡甜、酸、鹹、辣，融入香茅、檸檬葉與南薑等芳香草本。",
        popularDishes: ["Tom Yum Goong", "Pad Thai", "Green Coconut Curry", "Som Tum Papaya Salad", "Mango Sticky Rice"],
        spoonacularCuisine: "Thai",
      },
      {
        id: "vietnam",
        name: "Vietnam",
        nameZh: "越南",
        flag: "🇻🇳",
        description: "Light, clean, herb-packed broths, fresh rice paper rolls, and crisp French-fusion baguettes.",
        descriptionZh: "清新淡雅的鮮香牛骨清湯、晶瑩米紙生春捲與越式法包。",
        popularDishes: ["Pho Bo", "Banh Mi", "Fresh Spring Rolls (Goi Cuon)", "Bun Cha", "Caramelized Pork Belly"],
        spoonacularCuisine: "Vietnamese",
      },
      {
        id: "india",
        name: "India",
        nameZh: "印度",
        flag: "🇮🇳",
        description: "A symphony of ground spices, slow-simmered curries, tandoori grills, and fluffy naans.",
        descriptionZh: "馥郁芬芳的天然香料交響曲，慢火燉煮咖哩、天多利烤爐與香軟烤餅。",
        popularDishes: ["Butter Chicken", "Biryani", "Palak Paneer", "Tikka Masala", "Chana Masala"],
        spoonacularCuisine: "Indian",
      },
    ],
  },
  {
    id: "europe",
    name: "Europe",
    nameZh: "歐洲",
    emoji: "🌍",
    description: "Centuries of artisan culinary culture, world-famous cheeses, slow braises, and Mediterranean simplicity.",
    descriptionZh: "歷經數百年的匠人烹調文化，享譽全球的名酪、經典燉煮與地中海純粹風味。",
    countries: [
      {
        id: "italy",
        name: "Italy",
        nameZh: "意大利",
        flag: "🇮🇹",
        description: "Celebrates high-quality olive oil, hand-crafted pastas, wood-fired pizzas, and fresh basil.",
        descriptionZh: "以初榨橄欖油、手工意粉、柴火薄餅與新鮮羅勒展現頂級食材原味。",
        popularDishes: ["Spaghetti Carbonara", "Margherita Pizza", "Creamy Risotto", "Lasagna Bolognese", "Tiramisu"],
        spoonacularCuisine: "Italian",
      },
      {
        id: "france",
        name: "France",
        nameZh: "法國",
        flag: "🇫🇷",
        description: "The cradle of haute cuisine, renowned for rich butter sauces, delicate pastries, and comforting braises.",
        descriptionZh: "精緻高級料理的搖籃，以濃郁牛油醬汁、酥皮甜點與經典紅酒燉煮聞名於世。",
        popularDishes: ["Boeuf Bourguignon", "French Onion Soup", "Coq au Vin", "Ratatouille", "Quiche Lorraine"],
        spoonacularCuisine: "French",
      },
      {
        id: "spain",
        name: "Spain",
        nameZh: "西班牙",
        flag: "🇪🇸",
        description: "Saffron-scented seafood paella, lively tapas culture, savory chorizo, and cold refreshing gazpacho.",
        descriptionZh: "番紅花海鮮燉飯、熱鬧的 Tapas 小吃文化、風乾火腿與冰涼番茄凍湯。",
        popularDishes: ["Seafood Paella", "Gambas al Ajillo (Garlic Prawns)", "Tortilla Española", "Gazpacho", "Churros"],
        spoonacularCuisine: "Spanish",
      },
      {
        id: "greece",
        name: "Greece (Mediterranean)",
        nameZh: "希臘（地中海）",
        flag: "🇬🇷",
        description: "Sun-drenched Mediterranean flavors of kalamata olives, tangy feta cheese, and grilled meats.",
        descriptionZh: "陽光明媚的地中海風情，融合黑橄欖、菲達芝士、檸檬牛至與烤肉串。",
        popularDishes: ["Moussaka", "Greek Salad with Feta", "Souvlaki Skewers", "Tzatziki Dip", "Spanakopita"],
        spoonacularCuisine: "Mediterranean",
      },
      {
        id: "uk",
        name: "United Kingdom",
        nameZh: "英國",
        flag: "🇬🇧",
        description: "Hearty comfort food: golden beer-battered fish and chips, savory shepherd's pie, and Sunday roasts.",
        descriptionZh: "暖心厚實的經典美食：香脆炸魚薯條、肉汁農夫派與周日烤肉大餐。",
        popularDishes: ["Fish and Chips", "Shepherd's Pie", "Beef Wellington", "Full English Breakfast", "Scones & Jam"],
        spoonacularCuisine: "British",
      },
    ],
  },
  {
    id: "north-america",
    name: "North America",
    nameZh: "北美洲",
    emoji: "🌎",
    description: "Vibrant melting pot of low-and-slow barbecue, hearty diner classics, and fiery Mexican street food.",
    descriptionZh: "熱情多元的飲食大熔爐，涵蓋慢烤煙燻肉、經典美式輕食與熱辣墨西哥街頭美食。",
    countries: [
      {
        id: "mexico",
        name: "Mexico",
        nameZh: "墨西哥",
        flag: "🇲🇽",
        description: "Bursting with fire-roasted chilies, fresh lime, creamy avocados, and handmade corn tortillas.",
        descriptionZh: "充滿炙烤辣椒的香氣、鮮榨青檸、牛油果與手工玉米餅。",
        popularDishes: ["Tacos al Pastor", "Guacamole & Tortilla Chips", "Enchiladas", "Chiles Rellenos", "Quesadillas"],
        spoonacularCuisine: "Mexican",
      },
      {
        id: "usa",
        name: "United States",
        nameZh: "美國",
        flag: "🇺🇸",
        description: "Smoky Texas barbecue ribs, New England clam chowders, soul food mac-and-cheese, and smash burgers.",
        descriptionZh: "德州煙燻烤肋排、新英格蘭周打蜆湯、濃郁芝士通心粉與雙層牛肉漢堡。",
        popularDishes: ["BBQ Pulled Pork", "Classic Smash Cheeseburger", "Clam Chowder", "Buffalo Wings", "Pecan Pie"],
        spoonacularCuisine: "American",
      },
    ],
  },
  {
    id: "south-america",
    name: "South America",
    nameZh: "南美洲",
    emoji: "🌎",
    description: "Vibrant high-altitude and coastal gastronomy, citrus-cured seafood, and open-flame gaucho grilling.",
    descriptionZh: "熱烈的高山與海岸美味，酸汁醃漬海鮮與大草原炭火直烤。",
    countries: [
      {
        id: "peru",
        name: "Peru",
        nameZh: "秘魯",
        flag: "🇵🇪",
        description: "World-renowned culinary fusion of indigenous Andean ingredients, zesty lime ceviches, and wok stir-fries.",
        descriptionZh: "享譽國際的安第斯高山食材與酸爽檸檬醃魚生（Ceviche），結合鑊氣快炒牛柳。",
        popularDishes: ["Ceviche Clásico", "Lomo Saltado", "Aji de Gallina", "Causa Rellena", "Papa a la Huancaína"],
        spoonacularCuisine: "Latin American",
      },
      {
        id: "brazil",
        name: "Brazil",
        nameZh: "巴西",
        flag: "🇧🇷",
        description: "Rich black bean feijoada, churrasco skewered meats, and cheesy tapioca pão de queijo.",
        descriptionZh: "濃郁黑豆燉肉鍋、熱情奔放的巴西炭烤肉串，與香軟拉絲芝士木薯包。",
        popularDishes: ["Feijoada", "Pão de Queijo", "Moqueca Seafood Stew", "Churrasco Picanha", "Brigadeiros"],
        spoonacularCuisine: "Latin American",
      },
    ],
  },
  {
    id: "africa",
    name: "Africa",
    nameZh: "非洲",
    emoji: "🌍",
    description: "Rich tagines, slow-simmered jollof rices, aromatic berbere blends, and communal culinary warmth.",
    descriptionZh: "陶土塔吉鍋慢燉、香濃佐洛夫飯、馥郁柏柏爾綜合香料與溫馨共享的美食文化。",
    countries: [
      {
        id: "morocco",
        name: "Morocco (North Africa)",
        nameZh: "摩洛哥（北非）",
        flag: "🇲🇦",
        description: "Aromatic slow-cooked lamb and chicken tagines seasoned with preserved lemons, saffron, and sweet spices.",
        descriptionZh: "慢燉羊肉與雞肉塔吉鍋，點綴醃檸檬、番紅花、肉桂與香草蒸北非小米。",
        popularDishes: ["Lamb Tagine with Prunes", "Couscous Royale", "Harira Soup", "Chicken Pastilla", "Zaalouk"],
        spoonacularCuisine: "African",
      },
      {
        id: "nigeria",
        name: "West Africa (Nigeria & Ghana)",
        nameZh: "西非（尼日利亞及加納）",
        flag: "🇳🇬",
        description: "Smoky Jollof rice, savory peanut suya skewers, and rich plantain stews packed with vibrant spices.",
        descriptionZh: "鑊氣煙燻佐洛夫飯、香辣花生牛肉串與熱帶炸大蕉燉料理。",
        popularDishes: ["Jollof Rice", "Beef Suya Skewers", "Fried Sweet Plantains (Dodo)", "Egusi Soup", "Pounded Yam"],
        spoonacularCuisine: "African",
      },
    ],
  },
  {
    id: "oceania",
    name: "Oceania",
    nameZh: "大洋洲",
    emoji: "🌏",
    description: "Fresh coastal seafood, farm-to-table café culture, flat whites, and crisp pavlova meringues.",
    descriptionZh: "天然純淨的澳洲海岸海產、精緻悠閒的早午餐咖啡文化與輕盈酥脆蛋白霜蛋糕。",
    countries: [
      {
        id: "australia",
        name: "Australia & New Zealand",
        nameZh: "澳洲及新西蘭",
        flag: "🇦🇺",
        description: "Pioneering modern café brunches, grilled Moreton Bay bugs, savory meat pies, and pavlova.",
        descriptionZh: "引領全球的現代早午餐風格、炭烤海鮮、濃郁熱肉批與香甜水果帕芙洛娃。",
        popularDishes: ["Aussie Meat Pie", "Barramundi with Herb Butter", "Avocado Toast with Poached Egg", "Pavlova with Passionfruit", "Lamingtons"],
        spoonacularCuisine: "Australian",
      },
    ],
  },
];

