/**
 * A short guide for each menu cuisine, keyed by the exact TheMealDB area string.
 * intro says what everyday home cooking in that cuisine is built on; picks are up to
 * three TheMealDB meal ids that make good first dishes (no oven where possible, fewer
 * steps and ingredients, and a mix of dish types). Written by hand, 2026-11-04.
 */
export const CUISINE_GUIDE: Record<string, { intro: string; picks: string[] }> = {
    "Chinese": {
        intro: "Chinese home cooking leans on soy, ginger, garlic and spring onion, with quick stir-fries, steaming and gentle soups served with rice.",
        // Silken Tofu with Sesame Soy Sauce, Sichuan Style Stir-Fried Chinese Long Beans, Egg Drop Soup
        picks: ["53369", "53371", "52955"],
    },
    "Thai": {
        intro: "Thai home cooking balances sweet, sour, salty and hot, usually in one quick pan or pot.",
        // Thai beef stir-fry, Thai prawn curry, Tom yum (hot & sour) soup with prawns
        picks: ["53199", "53205", "53196"],
    },
    "Vietnamese": {
        intro: "Vietnamese home cooking is fresh and bright, built on fish sauce, lime, herbs and rice, with plenty of soups and salads.",
        // Tangy carrot, cabbage & onion salad, Tofu, greens & cashew stir-fry, Salmon noodle soup
        picks: ["53246", "53240", "53234"],
    },
    "Japanese": {
        intro: "Japanese home cooking centres on rice, soy, mirin and dashi, with simple grilled, simmered or fried dishes and clean flavours.",
        // Honey Teriyaki Salmon, Yaki Udon, Japanese gohan rice
        picks: ["52773", "52871", "53033"],
    },
    "Malaysian": {
        intro: "Malaysian home cooking blends Malay, Chinese and Indian kitchens, using coconut milk, chilli paste, lemongrass and rice or noodles.",
        // Roti john, Laksa King Prawn Noodles, Beef Rendang
        picks: ["53052", "52821", "53053"],
    },
    "Filipino": {
        intro: "Filipino home cooking favours savoury, tangy dishes built on vinegar, soy, garlic and onion, slowly simmered and eaten with rice.",
        // Tortang Talong, Bistek, Beef Mechado
        picks: ["53075", "53069", "53068"],
    },
    "India": {
        intro: "Indian home cooking layers whole and ground spices fried in oil or ghee, with lentils, vegetables and rice or flatbread.",
        // Nutty Chicken Curry, Kidney Bean Curry, Matar Paneer
        picks: ["52851", "52868", "52865"],
    },
    "Italian": {
        intro: "Italian home cooking keeps things simple, letting olive oil, tomatoes, garlic, herbs and cheese carry pasta, rice and vegetables.",
        // Spicy Arrabiata Penne, Salmon Prawn Risotto, Fettuccine Alfredo
        picks: ["52771", "52823", "53064"],
    },
    "Spanish": {
        intro: "Spanish home cooking relies on olive oil, garlic, paprika and ripe tomatoes, with plenty of small plates, rice dishes and stews.",
        // Quick gazpacho, Garlicky prawns with sherry, Chorizo, potato & cheese omelette
        picks: ["53173", "53180", "53159"],
    },
    "France": {
        intro: "French home cooking builds flavour slowly with butter, wine, herbs and stock, from gentle braises to simple egg dishes.",
        // Chicken Marengo, French Lentils With Garlic and Thyme, French Omelette
        picks: ["52920", "52815", "52915"],
    },
    "Greek": {
        intro: "Greek home cooking is built on olive oil, lemon, oregano and garlic, with grilled meat, vegetables, beans and yogurt.",
        // Garides Saganaki, Lamb and Lemon Souvlaki, Chicken Quinoa Greek Salad
        picks: ["52764", "53009", "53011"],
    },
    "British": {
        intro: "British home cooking is hearty and comforting, with roasts, pies, stews and puddings built on potatoes, root vegetables and gravy.",
        // Bean & Sausage Hotpot, Corned Beef Hash, Broccoli & Stilton soup
        picks: ["52848", "53096", "52842"],
    },
    "Mexican": {
        intro: "Mexican home cooking pairs corn and beans with chillies, lime, onion and coriander, often wrapped in warm tortillas.",
        // Cajun spiced fish tacos, Chicken Enchilada Casserole, Chickpea Fajitas
        picks: ["52819", "52765", "52870"],
    },
    "United States": {
        intro: "American home cooking is wide-ranging and generous, from skillet dinners and sandwiches to pancakes, pies and baked treats.",
        // Chicken Fajita Mac and Cheese, Stovetop Eggplant With Harissa, Chickpeas, and Cumin Yogurt, Banana Pancakes
        picks: ["52818", "52817", "52855"],
    },
    "Turkish": {
        intro: "Turkish home cooking uses yogurt, peppers, red pepper paste and warm spices, with grilled meats, rice pilafs and vegetable dishes.",
        // Hummus, Turkish lamb pilau, Griddled aubergines with sesame dressing
        picks: ["53269", "53263", "53274"],
    },
    "Jamaican": {
        intro: "Jamaican home cooking is bold and warming, seasoned with thyme, allspice, Scotch bonnet and spring onion, often with rice and peas.",
        // Jamaican Rice and Peas, Jamaican Curry Shrimp Recipe, Jamaican Steamed Cabbage
        picks: ["53357", "53362", "53364"],
    },
    "Polish": {
        intro: "Polish home cooking is hearty and warming, with cabbage, beetroot, potatoes, dill and sour cream in soups, dumplings and stews.",
        // Cucumber & fennel salad, Polish patties (kotlety), Pork & sauerkraut goulash
        picks: ["53309", "53299", "53301"],
    },
    "Canadian": {
        intro: "Canadian home cooking is hearty and practical, with potatoes, pork, beans and maple syrup in comforting stews, pies and sweets.",
        // Hodge Podge, Breakfast Potatoes, Split Pea Soup
        picks: ["53340", "52965", "52925"],
    },
    "Netherlands": {
        intro: "Dutch home cooking is plain and filling, built on potatoes mashed with vegetables, thick soups, sausages and buttery bakes.",
        // Stamppot, Snert (Dutch Split Pea Soup), Dutch poffertjes (mini pancakes)
        picks: ["52980", "52981", "53379"],
    },
    "Norway": {
        intro: "Norwegian home cooking is simple and warming, with fish, lamb, potatoes and cabbage, plus plenty of cardamom-scented baking.",
        // Karbonader (Lean Beef Patties) with Caramelized Onions, Fårikål (Norwegian National Dish), Fiskesuppe (Creamy Norwegian Fish Soup)
        picks: ["53125", "53123", "53122"],
    },
    "Australian": {
        intro: "Australian home cooking is relaxed and outdoorsy, mixing barbecued meat and seafood with fresh salads and simple baking.",
        // Aussie Burgers, Quick salt & pepper squid, Sticky Chicken
        picks: ["53099", "53108", "53110"],
    },
    "Algerian": {
        intro: "Algerian home cooking uses cumin, paprika, cinnamon and garlic, with slow tomato stews, semolina breads and plenty of vegetables.",
        // Algerian Kefta (Meatballs), Chtitha Batata (Algerian Potato Stew), Algerian Carrots
        picks: ["53281", "53283", "53282"],
    },
    "Saudi Arabian": {
        intro: "Saudi home cooking centres on spiced rice with chicken or meat, flatbreads, eggs with tomato, and sweets made with dates.",
        // Shakshouka, Shawarma bread, Chicken Shawarma with homemade garlic herb yoghurt sauce
        picks: ["53215", "53226", "53218"],
    },
    "Argentina": {
        intro: "Argentine home cooking is centred on beef, from grilled cuts to breaded cutlets, with hearty stews and dulce de leche sweets.",
        // Milanesa, Choripán, Carbonada Criolla
        picks: ["53135", "53136", "53141"],
    },
    "Venezuela": {
        intro: "Venezuelan home cooking revolves around corn arepas, shredded beef, black beans and plantains, with slow-simmered soups and stews.",
        // Oatmeal pancakes, Venezuelan Coconut Chicken, Arepa Pabellón
        picks: ["53331", "53327", "53334"],
    },
    "Uruguayan": {
        intro: "Uruguayan home cooking is built on beef, bread and cheese, with hearty sandwiches, empanadas and sweets filled with dulce de leche.",
        // Chivito uruguayo, Torta de fiambre, Flan
        picks: ["53063", "53318", "53322"],
    },
    "Croatian": {
        intro: "Croatian home cooking mixes Mediterranean fish, olive oil and garlic with hearty inland stews, sausages and paprika.",
        // Fresh sardines, Croatian Bean Stew, Mushroom soup with buckwheat
        picks: ["53061", "53058", "53059"],
    },
    "Egyptian": {
        intro: "Egyptian home cooking is built on beans, lentils, rice and bread, seasoned with cumin, garlic and lemon, and often meat-free.",
        // Shakshuka, Koshari, Mulukhiyah
        picks: ["52963", "53027", "53029"],
    },
    "Irish": {
        intro: "Irish home cooking is simple and comforting, built on potatoes, cabbage, butter, pork and lamb in stews and mashes.",
        // Mustard champ, Corned Beef and Cabbage, Coddled pork with cider
        picks: ["53038", "52998", "53037"],
    },
    "Portuguese": {
        intro: "Portuguese home cooking loves olive oil, garlic, paprika and seafood, from charred sardines to generous fish stews and custard tarts.",
        // Grilled Portuguese sardines, Portuguese prego with green piri-piri, Portuguese fish stew (Caldeirada de peixe)
        picks: ["53041", "53042", "53045"],
    },
    "Tunisian": {
        intro: "Tunisian home cooking is warm and spicy, built on harissa, cumin, olive oil and chickpeas, with eggs, soups and stews.",
        // Chakchouka, Leblebi Soup, Keleya Zaara
        picks: ["52969", "52973", "52974"],
    },
    "Russian": {
        intro: "Russian home cooking is warming and practical, with soups, potatoes, cabbage, dill and sour cream on almost every table.",
        // Beef stroganoff, Potato Salad (Olivier Salad), Fish Soup (Ukha)
        picks: ["52834", "53081", "53079"],
    },
    "Ukrainian": {
        intro: "Ukrainian home cooking leans on beetroot, cabbage, potatoes and dill, with hearty soups, dumplings and plenty of sour cream.",
        // Beetroot Soup (Borscht), Tangy cabbage slaw, Rosemary braised red cabbage with kabanos
        picks: ["53078", "53312", "53315"],
    },
    "Moroccan": {
        intro: "Moroccan home cooking layers cumin, ginger, cinnamon and saffron, slowly simmering meat and vegetables with dried fruit and couscous.",
        // Chicken Couscous, Tahini Lentils, Spicy North African Potato Salad
        picks: ["52850", "52869", "52797"],
    },
    "Syrian": {
        intro: "Syrian home cooking uses olive oil, garlic, allspice and cinnamon, with rice, beans, flatbread and smoky vegetable dips.",
        // Syrian Rice with Meat, Fasoliyyeh Bi Z-Zayt (Syrian Green Beans with Olive Oil), Baba Ghanoush
        picks: ["53095", "53092", "53094"],
    },
    "Kenyan": {
        intro: "Kenyan home cooking is simple and filling, pairing cornmeal ugali with greens, stews and curries seasoned with onion and tomato.",
        // Sukuma Wiki, Ugali – Kenyan cornmeal, Kenyan Beef Curry
        picks: ["53113", "53114", "53112"],
    },
    "Slovakia": {
        intro: "Slovak home cooking is hearty and rustic, built on potatoes, flour, cabbage, pork and soft cheese in dumplings and pancakes.",
        // Bryndzové Halušky, Zemiakové Placky, Fašírky
        picks: ["53190", "53189", "53188"],
    },
};
