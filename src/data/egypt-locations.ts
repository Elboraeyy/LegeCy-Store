export interface City {
  en: string;
  ar: string;
}

export interface Governorate {
  en: string;
  ar: string;
  cities: City[];
}

export const EGYPT_LOCATIONS: Governorate[] = [
  {
    en: "Cairo",
    ar: "القاهرة",
    cities: [
      { en: "Hadayek Al Zaiton", ar: "حدائق الزيتون" },
      { en: "El Shorouk", ar: "الشروق" },
      { en: "El Marg", ar: "المرج" },
      { en: "Maadi Degla", ar: "المعادي دجلة" },
      { en: "Abaseya", ar: "العباسية" },
      { en: "New Nozha", ar: "النزهة الجديدة" },
      { en: "Dar Al Salam", ar: "دار السلام" },
      { en: "Al Kalaa", ar: "القلعة" },
      { en: "Basateen", ar: "البساتين" },
      { en: "Abdo Basha", ar: "عبده باشا" },
      { en: "Nasr City", ar: "مدينة ناصر" },
      { en: "15th Of May City", ar: "مدينة 15 مايو" },
      { en: "5th Settlement", ar: "التجمع الخامس" },
      { en: "Heliopolis", ar: "مصر الجديدة" },
      { en: "3rd Settlement", ar: "التجمع الثالث" },
      { en: "Ezbet El Nakhl", ar: "عزبة النخل" },
      { en: "Katamiah", ar: "قطامية" },
      { en: "El Herafieen", ar: "الحرفيين" },
      { en: "Down Town", ar: "وسط البلد" },
      { en: "New Maadi", ar: "المعادى الجديدة" },
      { en: "Zamalek", ar: "الزمالك" },
      { en: "1st Settlement", ar: "التجمع الاول" },
      { en: "Helwan", ar: "حلوان" },
      { en: "Al Zeitoun", ar: "الزيتون" },
      { en: "Masaken Sheraton", ar: "مساكن شيراتون" },
      { en: "Hadayek Helwan", ar: "حدائق حلوان" },
      { en: "Ghamrah", ar: "غمره" },
      { en: "Rod El Farag", ar: "روض الفرج" },
      { en: "Al Matareya", ar: "المطرية" },
      { en: "Al Kasr Al Einy", ar: "القصر العيني" },
      { en: "New Cairo", ar: "القاهرة الجديدة" },
      { en: "Ain Shams", ar: "عين شمس" },
      { en: "Garden City", ar: "جاردن سيتي" },
      { en: "Mirage City", ar: "ميراج سيتى" },
      { en: "Amiria", ar: "العامرية" },
      { en: "Al Azhar", ar: "الأزهر" },
      { en: "Sayeda Zeinab", ar: "السيدة زينب" },
      { en: "Almaza", ar: "الماظة" },
      { en: "Fustat", ar: "الفسطاط" },
      { en: "Hadayek Maadi", ar: "حدائق المعادي" },
      { en: "Al Rehab", ar: "الرحاب" },
      { en: "Al Moski", ar: "الموسكي" },
      { en: "Manial Al Rodah", ar: "منيل الروضة" },
      { en: "Maadi", ar: "المعادى" },
      { en: "El Tahrir", ar: "التحرير" },
      { en: "Gesr Al Suez", ar: "جسر السويس" },
      { en: "Abdeen", ar: "عابدين" },
      { en: "Mokattam", ar: "المقطم" },
      { en: "Al Salam City", ar: "مدينة السلام" },
      { en: "Misr El Kadima", ar: "مصر القديمة" },
      { en: "Helmiet Elzaitoun", ar: "حلمية الزيتون" },
      { en: "Al Daher", ar: "الضاهر" },
      { en: "Hadayek Al Qobah", ar: "حدائق القبة" },
      { en: "Shubra", ar: "شبرا" },
      { en: "Cornish Al Nile", ar: "كورنيش النيل" },
      { en: "Badr City", ar: "مدينة بدر" },
      { en: "Ramsis", ar: "رمسيس" },
      { en: "Madinty", ar: "مدينتي" },
      { en: "Helmeya", ar: "الحلمية" }
    ]
  },
  {
    en: "Giza",
    ar: "الجيزة",
    cities: [
      { en: "6th of October", ar: "السادس من اكتوبر" },
      { en: "Mansoureya", ar: "المنصورية" },
      { en: "Hawamdya", ar: "الحوامدية" },
      { en: "Tirsa", ar: "تيرسا" },
      { en: "Abou Rawash", ar: "ابو رواش" },
      { en: "Omraneya", ar: "العمرانية" },
      { en: "Smart Village", ar: "القرية الذكية" },
      { en: "Kerdasa", ar: "كرداسة" },
      { en: "Saft El Laban", ar: "صفط اللبن" },
      { en: "Dokki", ar: "الدقي" },
      { en: "Al Saf", ar: "الصف" },
      { en: "Sheikh Zayed", ar: "الشيخ زايد" },
      { en: "Sakiat Mekki", ar: "ساقية مكي" },
      { en: "Mohandessin", ar: "المهندسين" },
      { en: "Al Kom Al Ahmer", ar: "الكوم الأحمر" },
      { en: "Imbaba", ar: "إمبابة" },
      { en: "Bolak Al Dakrour", ar: "بولاق الدكرور" },
      { en: "Al Monib", ar: "المنيب" },
      { en: "Berak Alkiaam", ar: "برك الكيام" },
      { en: "Al Moatamadia", ar: "المعتمدية" },
      { en: "Shabramant", ar: "شبرامانت" },
      { en: "Warraq", ar: "الوراق" },
      { en: "Manial", ar: "المنيل" },
      { en: "Haram", ar: "الهرم" },
      { en: "Agouza", ar: "العجوزة" },
      { en: "Faisal", ar: "فيصل" },
      { en: "Al Wahat", ar: "الواحات" },
      { en: "Hadayeq El Ahram", ar: "حدائق الاهرام" },
      { en: "Aossim", ar: "أوسيم" },
      { en: "Al Nobariah", ar: "النوبارية" },
      { en: "Badrashin", ar: "بدراشين" },
      { en: "Kit Kat", ar: "كت كات" },
      { en: "Al Barageel", ar: "البراجيل" },
      { en: "Al Manashi", ar: "المناشي" }
    ]
  },
  {
    en: "Alexandria",
    ar: "الإسكندرية",
    cities: [
      { en: "Miami", ar: "ميامي" },
      { en: "Smouha", ar: "سموحة" },
      { en: "Abees", ar: "أبيس" },
      { en: "Sedi Gaber", ar: "سيدي جابر" },
      { en: "El Borg El Kadem", ar: "البرج القديم" },
      { en: "Sedi Bisher", ar: "سيدي بشر" },
      { en: "Al Bitash", ar: "البيطاش" },
      { en: "Stanly", ar: "ستانلي" },
      { en: "El-Agamy", ar: "العجمي" },
      { en: "San Stefano", ar: "سان ستيفانو" },
      { en: "Mahtet El-Raml", ar: "محطة الرمل" },
      { en: "Al A'mriah", ar: "العامرية" },
      { en: "Bangar EL Sokar", ar: "بنجر السكر" },
      { en: "Manshia", ar: "المنشية" },
      { en: "Sedi Kreir", ar: "سيدي كرير" },
      { en: "Kafer Abdou", ar: "كفر عبده" },
      { en: "Borg El Arab", ar: "برج العرب" },
      { en: "Roshdy", ar: "رشدي" },
      { en: "Abu Keer", ar: "ابو قير" },
      { en: "Glem", ar: "جليم" },
      { en: "Al Nahda Al Amria", ar: "النهضة العامرية" },
      { en: "Awaied-Ras Souda", ar: "عويد راس سودا" },
      { en: "Mandara", ar: "المندرة" },
      { en: "City Center", ar: "وسط المدينة" },
      { en: "Azarita", ar: "أزاريتا" },
      { en: "Maamora", ar: "المعمورة" },
      { en: "Al Soyof", ar: "السيوف" },
      { en: "Sporting", ar: "سبورتنج" },
      { en: "Khorshid", ar: "خورشيد" },
      { en: "Luran", ar: "لوران" },
      { en: "Asafra", ar: "العصافرة" },
      { en: "Zezenya", ar: "زيزينيا" },
      { en: "Muntazah", ar: "المنتزه" }
    ]
  },
  {
    en: "Al Beheira",
    ar: "البحيرة",
    cities: [
      { en: "Hosh Issa", ar: "حوش عيسى" },
      { en: "Rashid", ar: "رشيد" },
      { en: "Shubrakhit", ar: "شبراخيت" },
      { en: "Edko", ar: "إدكو" },
      { en: "Damanhour", ar: "دمنهور" },
      { en: "Etay Al Barud", ar: "ايتاي البارود" },
      { en: "Abu Hummus", ar: "ابو حمص" },
      { en: "Kom Hamadah", ar: "كوم حمادة" },
      { en: "Abou Al Matamer", ar: "ابو المطامير" },
      { en: "Al Delengat", ar: "الدلنجات" },
      { en: "El Nubariyah", ar: "النوبارية" },
      { en: "Kafr El Dawwar", ar: "كفر الدوار" },
      { en: "Edfina", ar: "إدفينا" },
      { en: "Wadi Al Natroun", ar: "وادي النطرون" },
      { en: "Al Mahmoudiyah", ar: "المحمودية" },
      { en: "Al Rahmaniyah", ar: "الرحمانية" }
    ]
  },
  {
    en: "Al Daqahliya",
    ar: "الدقهلية",
    cities: [
      { en: "Meet Ghamr", ar: "ميت غمر" },
      { en: "Belqas", ar: "بلقاس" },
      { en: "Nabroo", ar: "نابرو" },
      { en: "Manzala", ar: "المنزلة" },
      { en: "Shrbeen", ar: "شربين" },
      { en: "El Sinblaween", ar: "السنبلاوين" },
      { en: "Menit El Nasr", ar: "منية النصر" },
      { en: "Dekernes", ar: "دكرنس" },
      { en: "Aga", ar: "آجا" },
      { en: "Talkha", ar: "طلخا" },
      { en: "Al Mansoura", ar: "المنصورة" }
    ]
  },
  {
    en: "Al Fayoum",
    ar: "الفيوم",
    cities: [
      { en: "Sonores", ar: "سنورس" },
      { en: "Ebshoy", ar: "إبشواي" },
      { en: "Kofooer Elniel", ar: "كفور النيل" },
      { en: "New Fayoum", ar: "الفيوم الجديدة" },
      { en: "Atsa", ar: "اطسا" },
      { en: "Sanhoor", ar: "سنهور" },
      { en: "Tameaa", ar: "طامية" },
      { en: "Al Fayoum", ar: "الفيوم" },
      { en: "Sersenaa", ar: "سيرسينا" },
      { en: "El Aagamen", ar: "العجمين" },
      { en: "Manshaa Abdalla", ar: "منشاء عبد الله" },
      { en: "Youssef Sadek", ar: "يوسف صادق" },
      { en: "Manshaa Elgamal", ar: "منشأة الجمال" }
    ]
  },
  {
    en: "Al Gharbia",
    ar: "الغربية",
    cities: [
      { en: "Alsanta", ar: "السنطة" },
      { en: "Al Mahala Al Kobra", ar: "المحلة الكبرى" },
      { en: "Samanood", ar: "سمنود" },
      { en: "Tanta", ar: "طنطا" },
      { en: "Qotoor", ar: "قطور" },
      { en: "Zefta", ar: "زفتى" },
      { en: "Basyoon", ar: "بسيون" },
      { en: "Kafr Alziat", ar: "كفر الزيات" }
    ]
  },
  {
    en: "Al Meniya",
    ar: "المنيا",
    cities: [
      { en: "Minya", ar: "المنيا" },
      { en: "Samaloot", ar: "سمالوط" },
      { en: "Eladwa", ar: "العدوة" },
      { en: "Mghagha", ar: "مغاغة" },
      { en: "Matai", ar: "مطاى" },
      { en: "Malawi", ar: "ملاوي" },
      { en: "Bani Mazar", ar: "بني مزار" },
      { en: "Dermwas", ar: "ديرماس" },
      { en: "Abo Korkas", ar: "ابو قرقاص" }
    ]
  },
  {
    en: "Al Monufia",
    ar: "المنوفية",
    cities: [
      { en: "Shohada", ar: "الشهداء" },
      { en: "Menoof", ar: "منوف" },
      { en: "Tala", ar: "تلا" },
      { en: "Shebin El Koom", ar: "شبين الكوم" },
      { en: "Sadat City", ar: "مدينة السادات" },
      { en: "Quesna", ar: "قويسنا" },
      { en: "Berket Al Sabei", ar: "بركة السبع" },
      { en: "Ashmoon", ar: "أشمون" }
    ]
  },
  {
    en: "Al Sharqia",
    ar: "الشرقية",
    cities: [
      { en: "Al Salhiya Al Gedida", ar: "الصالحية الجديدة" },
      { en: "Abu Hammad", ar: "ابو حماد" },
      { en: "Abu Kbeer", ar: "ابو كبير" },
      { en: "Hehya", ar: "ههيا" },
      { en: "Awlad Saqr", ar: "اولاد صقر" },
      { en: "Al Hasiniya", ar: "الحسينية" },
      { en: "Faqous", ar: "فاقوس" },
      { en: "Darb Negm", ar: "درب نجم" },
      { en: "Al Ibrahimiya", ar: "الابراهيمية" },
      { en: "Zakazik", ar: "الزقازيق" },
      { en: "Kafr Saqr", ar: "كفر صقر" },
      { en: "Mashtool Al Sooq", ar: "مشتول السوق" },
      { en: "Belbes", ar: "بيلبيس" },
      { en: "Meniya Alqamh", ar: "منيا القمه" },
      { en: "10th of Ramdan City", ar: "العاشر من رمضان" }
    ]
  },
  {
    en: "Aswan",
    ar: "أسوان",
    cities: [
      { en: "Draw", ar: "دراو" },
      { en: "El Klabsha", ar: "كلابشة" },
      { en: "Al Sad Al Aali", ar: "السد العالي" },
      { en: "Abu Simbel", ar: "أبو سمبل" },
      { en: "Nasr Elnoba", ar: "نصر النوبة" },
      { en: "Edfo", ar: "إدفو" },
      { en: "Markaz Naser", ar: "مركز ناصر" },
      { en: "Kom Ombo", ar: "كوم امبو" }
    ]
  },
  {
    en: "Asyut",
    ar: "أسيوط",
    cities: [
      { en: "Dayrout", ar: "ديروط" },
      { en: "Asyut", ar: "أسيوط" },
      { en: "El Qusya", ar: "القوصية" },
      { en: "Assuit Elgdeda", ar: "اسيوط الجديدة" },
      { en: "Elfath", ar: "الفتح" },
      { en: "El Ghnayem", ar: "الغنايم" },
      { en: "Sahel Selim", ar: "ساحل سليم" },
      { en: "Abnoub", ar: "أبنوب" },
      { en: "El Badari", ar: "البدارى" },
      { en: "Abou Teag", ar: "ابو تيج" },
      { en: "Serfa", ar: "سيرفا" },
      { en: "Manflout", ar: "منفلوط" }
    ]
  },
  {
    en: "Bani Souaif",
    ar: "بني سويف",
    cities: [
      { en: "Bani Souaif", ar: "بني سويف" },
      { en: "El Wastaa", ar: "الواسطى" },
      { en: "El Korimat", ar: "الكريمات" },
      { en: "El Fashn", ar: "الفشن" },
      { en: "Naser", ar: "ناصر" },
      { en: "Ahnaseaa", ar: "إهناسيا" },
      { en: "New Bani Souaif", ar: "بني سويف الجديدة" },
      { en: "Bebaa", ar: "ببا" },
      { en: "Smostaa", ar: "سمسطا" }
    ]
  },
  {
    en: "Damietta",
    ar: "دمياط",
    cities: [
      { en: "Kafr Saad", ar: "كفر سعد" },
      { en: "Ras El Bar", ar: "رأس البر" },
      { en: "Fareskor", ar: "فارسكور" },
      { en: "Al Zarkah", ar: "الزرقا" },
      { en: "Damietta", ar: "دمياط" },
      { en: "New Damietta", ar: "دمياط الجديدة" }
    ]
  },
  {
    en: "Ismailia",
    ar: "الإسماعيلية",
    cities: [
      { en: "Elsalhia Elgdida", ar: "الصالحية الجديدة" },
      { en: "Al Kasaseen", ar: "القصاصين" },
      { en: "Abo Sultan", ar: "ابو سلطان" },
      { en: "El Tal El Kebir", ar: "التل الكبير" },
      { en: "Abu Swer", ar: "ابو صوير" },
      { en: "Qantera Gharb", ar: "قنطرة غرب" },
      { en: "Qantera Sharq", ar: "القنطرة شرق" },
      { en: "Nfeesha", ar: "نفيشة" },
      { en: "Ismailia", ar: "الإسماعيلية" },
      { en: "Srabioom", ar: "سرابيوم" },
      { en: "Fayed", ar: "فايد" }
    ]
  },
  {
    en: "Kafr El Sheikh",
    ar: "كفر الشيخ",
    cities: [
      { en: "Hamool", ar: "الحامول" },
      { en: "Kafr El Sheikh", ar: "كفر الشيخ" },
      { en: "Al Riadh", ar: "الرياض" },
      { en: "Qeleen", ar: "قلين" },
      { en: "Desouq", ar: "دسوق" },
      { en: "Seedy Salem", ar: "سيدى سالم" },
      { en: "Bela", ar: "بيلا" },
      { en: "Fooh", ar: "فوه" },
      { en: "Metobas", ar: "مطوبس" },
      { en: "Borollos", ar: "برج البرلس" },
      { en: "Balteem", ar: "بلطيم" }
    ]
  },
  {
    en: "Luxor",
    ar: "الأقصر",
    cities: [
      { en: "El Karnak", ar: "الكرنك" },
      { en: "El Korna", ar: "القرنة" },
      { en: "Armant Sharq", ar: "ارمنت شرق" },
      { en: "Esnaa", ar: "اسنا" },
      { en: "Luxor", ar: "الأقصر" },
      { en: "Armant Gharb", ar: "ارمنت غرب" }
    ]
  },
  {
    en: "Matrooh",
    ar: "مطروح",
    cities: [
      { en: "Matrooh", ar: "مطروح" },
      { en: "El Alamein", ar: "العلمين" },
      { en: "Sidi Abdel Rahman", ar: "سيدي عبد الرحمن" },
      { en: "El Dabaa", ar: "الضبعة" },
      { en: "Marsa Matrooh", ar: "مرسى مطروح" }
    ]
  },
  {
    en: "New Valley",
    ar: "الوادي الجديد",
    cities: [
      { en: "El Kharga", ar: "الخارجة" },
      { en: "New Valley", ar: "الوادي الجديد" }
    ]
  },
  {
    en: "Port Said",
    ar: "بورسعيد",
    cities: [
      { en: "Port Fouad", ar: "بور فؤاد" },
      { en: "Port Said", ar: "بورسعيد" },
      { en: "Zohoor District", ar: "حي الزهور" }
    ]
  },
  {
    en: "Qalyubia",
    ar: "القليوبية",
    cities: [
      { en: "Abu Zaabal", ar: "ابو زعبل" },
      { en: "Qaha", ar: "قها" },
      { en: "Tookh", ar: "طوخ" },
      { en: "El Oboor", ar: "العبور" },
      { en: "Meet Nama", ar: "ميت نما" },
      { en: "Al Shareaa Al Gadid", ar: "الشريعة الجديد" },
      { en: "Banha", ar: "بنها" },
      { en: "El Kanater EL Khayrya", ar: "القناطر الخيرية" },
      { en: "Sheben Alkanater", ar: "شبين القناطر" },
      { en: "El Qalag", ar: "القلج" },
      { en: "Bahteem", ar: "بهتيم" },
      { en: "Orabi", ar: "عرابي" },
      { en: "Qalyoob", ar: "قليوب" },
      { en: "Al Khanka", ar: "الخانكة" },
      { en: "El Khsos", ar: "الخصوص" },
      { en: "Kafr Shokr", ar: "كفر شكر" },
      { en: "Om Bayoumi", ar: "أم بيومي" },
      { en: "Shoubra Alkhema", ar: "شبرا الخيمة" },
      { en: "Mostorod", ar: "مسطرد" }
    ]
  },
  {
    en: "Qena",
    ar: "قنا",
    cities: [
      { en: "Deshna", ar: "دشنا" },
      { en: "Abu Tesht", ar: "ابوتشت" },
      { en: "Farshoot", ar: "فرشوط" },
      { en: "Qena", ar: "قنا" },
      { en: "Qoos", ar: "قوص" },
      { en: "Naqada", ar: "نقادة" },
      { en: "Naga Hamadi", ar: "نجع حمادي" }
    ]
  },
  {
    en: "Red Sea",
    ar: "البحر الاحمر",
    cities: [
      { en: "Safaga", ar: "سفاجا" },
      { en: "Hurghada", ar: "الغردقة" },
      { en: "Qouseir", ar: "القصير" },
      { en: "Marsa Alam", ar: "مرسى علم" },
      { en: "Gouna", ar: "الجونة" },
      { en: "Ras Ghareb", ar: "رأس غارب" }
    ]
  },
  {
    en: "Sohag",
    ar: "سوهاج",
    cities: [
      { en: "Tema", ar: "طما" },
      { en: "Saqatlah", ar: "ساقلته" },
      { en: "Dar Elsalam", ar: "دار السلام" },
      { en: "Gerga", ar: "جرجا" },
      { en: "Elbalyna", ar: "البالينا" },
      { en: "Maragha", ar: "مراغة" },
      { en: "El Monshah", ar: "المنشاه" },
      { en: "Ghena", ar: "جهينة" },
      { en: "Akhmem", ar: "أخميم" },
      { en: "Tahta", ar: "طهطا" }
    ]
  },
  {
    en: "Suez",
    ar: "السويس",
    cities: [
      { en: "Ataka District", ar: "حي عتاقة" },
      { en: "Suez", ar: "السويس" },
      { en: "Elganaien District", ar: "حي الجناين" },
      { en: "Al Suez", ar: "السويس" },
      { en: "Al Adabya", ar: "الأدبية" },
      { en: "Ain Al Sukhna", ar: "العين السخنة" },
      { en: "El Arbeen District", ar: "حى الاربعين" }
    ]
  },
  {
    en: "North Sinai",
    ar: "شمال سيناء",
    cities: [
      { en: "Al Arish", ar: "العريش" }
    ]
  },
  {
    en: "South Sinai",
    ar: "جنوب سيناء",
    cities: [
      { en: "Neweibaa", ar: "نويبع" },
      { en: "Dahab", ar: "دهب" },
      { en: "Saint Catherine", ar: "سانت كاترين" },
      { en: "Sharm Al Sheikh", ar: "شرم الشيخ" },
      { en: "Toor Sinai", ar: "طور سيناء" },
      { en: "Taba", ar: "طابا" }
    ]
  }
];
