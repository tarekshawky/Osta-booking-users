export type Lang = "en" | "ar";

const dict = {
  common: {
    home: { en: "Home", ar: "الرئيسية" },
    orders: { en: "Orders", ar: "الطلبات" },
    invoices: { en: "Invoices", ar: "الفواتير" },
    profile: { en: "Profile", ar: "حسابي" },
    more: { en: "More", ar: "المزيد" },
    back: { en: "Back", ar: "رجوع" },
    viewAll: { en: "View all", ar: "عرض الكل" },
    view: { en: "View", ar: "عرض" },
    aed: { en: "AED", ar: "د.إ" },
    logOut: { en: "Log Out", ar: "تسجيل الخروج" },
    language: { en: "Language", ar: "اللغة" },
    english: { en: "English", ar: "الإنجليزية" },
    arabic: { en: "Arabic", ar: "العربية" },
  },

  status: {
    Requested: { en: "Requested", ar: "تم الطلب" },
    Assigned: { en: "Assigned", ar: "تم التعيين" },
    "On The Way": { en: "On The Way", ar: "في الطريق" },
    "In Progress": { en: "In Progress", ar: "قيد التنفيذ" },
    Done: { en: "Done", ar: "مكتمل" },
    Completed: { en: "Completed", ar: "مكتمل" },
    Cancelled: { en: "Cancelled", ar: "ملغى" },
    Rescheduled: { en: "Rescheduled", ar: "تمت إعادة الجدولة" },
    Paid: { en: "Paid", ar: "مدفوعة" },
    Unpaid: { en: "Unpaid", ar: "غير مدفوعة" },
    Refunded: { en: "Refunded", ar: "مستردة" },
    Partial: { en: "Partial", ar: "مدفوعة جزئياً" },
  },

  login: {
    welcomeBack: { en: "Welcome back", ar: "مرحباً بعودتك" },
    subtitle: { en: "Log in with the email and password OSTA Services gave you", ar: "سجّل الدخول بالبريد الإلكتروني وكلمة المرور التي زودتك بها OSTA Services" },
    heroTitleLine1: { en: "Your Comfort.", ar: "راحتك." },
    heroTitleLine2: { en: "Our Priority.", ar: "أولويتنا." },
    heroSubtitle: { en: "Professional home services across the UAE. Log in to manage your bookings, track orders, and view invoices in one place.", ar: "خدمات منزلية احترافية في جميع أنحاء الإمارات. سجّل الدخول لإدارة حجوزاتك ومتابعة طلباتك وعرض فواتيرك في مكان واحد." },
    featureTrusted: { en: "Trusted Professionals", ar: "محترفون موثوقون" },
    featureSameDay: { en: "Same Day Service", ar: "خدمة في نفس اليوم" },
    featureWarranty: { en: "14-Day Warranty", ar: "ضمان 14 يوماً" },
    featurePricing: { en: "Transparent Pricing", ar: "أسعار شفافة" },
    email: { en: "Email", ar: "البريد الإلكتروني" },
    emailPlaceholder: { en: "you@example.com", ar: "you@example.com" },
    password: { en: "Password", ar: "كلمة المرور" },
    passwordPlaceholder: { en: "At least 8 characters", ar: "8 أحرف على الأقل" },
    passwordHint: { en: "Starts with a capital letter and includes a number, e.g. Osta1234", ar: "تبدأ بحرف كبير وتحتوي على رقم، مثال: Osta1234" },
    showPassword: { en: "Show password", ar: "إظهار كلمة المرور" },
    hidePassword: { en: "Hide password", ar: "إخفاء كلمة المرور" },
    submit: { en: "Log In", ar: "تسجيل الدخول" },
    submitting: { en: "Logging in…", ar: "جارٍ تسجيل الدخول…" },
    noAccount: { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
    signUpLink: { en: "Sign up", ar: "إنشاء حساب" },
    forgot: { en: "Forgot your password? Contact OSTA Services support.", ar: "نسيت كلمة المرور؟ تواصل مع دعم OSTA Services." },
    terms: { en: "By continuing, you agree to our Terms & Conditions and Privacy Policy", ar: "بالمتابعة، أنت توافق على الشروط والأحكام وسياسة الخصوصية" },
    fillRequired: { en: "Enter your email and password.", ar: "أدخل بريدك الإلكتروني وكلمة المرور." },
    genericError: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },
  },

  signup: {
    title: { en: "Create your account", ar: "إنشاء حساب جديد" },
    subtitle: { en: "Sign up to start booking OSTA services", ar: "أنشئ حساباً لبدء حجز خدمات OSTA" },
    heroSubtitle: { en: "Create an account to book services, track orders, and manage invoices across the UAE.", ar: "أنشئ حساباً لحجز الخدمات ومتابعة الطلبات وإدارة الفواتير في جميع أنحاء الإمارات." },
    fullName: { en: "Full name", ar: "الاسم الكامل" },
    fullNamePlaceholder: { en: "Ahmed Mohamed", ar: "أحمد محمد" },
    mobile: { en: "Mobile number", ar: "رقم الجوال" },
    mobilePlaceholder: { en: "50 123 4567", ar: "50 123 4567" },
    email: { en: "Email", ar: "البريد الإلكتروني" },
    emailPlaceholder: { en: "you@example.com", ar: "you@example.com" },
    emirate: { en: "Emirate", ar: "الإمارة" },
    password: { en: "Password", ar: "كلمة المرور" },
    passwordPlaceholder: { en: "At least 8 characters", ar: "8 أحرف على الأقل" },
    passwordHint: { en: "Starts with a capital letter and includes a number, e.g. Osta1234", ar: "تبدأ بحرف كبير وتحتوي على رقم، مثال: Osta1234" },
    submit: { en: "Sign Up", ar: "إنشاء حساب" },
    submitting: { en: "Creating account…", ar: "جارٍ إنشاء الحساب…" },
    haveAccount: { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
    loginLink: { en: "Log in", ar: "تسجيل الدخول" },
    terms: { en: "By continuing, you agree to our Terms & Conditions and Privacy Policy", ar: "بالمتابعة، أنت توافق على الشروط والأحكام وسياسة الخصوصية" },
    errName: { en: "Enter your full name.", ar: "أدخل اسمك الكامل." },
    errPhone: { en: "Enter a valid mobile number.", ar: "أدخل رقم جوال صحيح." },
    errEmail: { en: "Enter your email.", ar: "أدخل بريدك الإلكتروني." },
    errPassword: { en: "Password must be at least 8 characters, start with a capital letter, and include a number.", ar: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل، وتبدأ بحرف كبير، وتحتوي على رقم." },
    genericError: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },
    emirates: {
      "Abu Dhabi": { en: "Abu Dhabi", ar: "أبوظبي" },
      Dubai: { en: "Dubai", ar: "دبي" },
      Sharjah: { en: "Sharjah", ar: "الشارقة" },
      Ajman: { en: "Ajman", ar: "عجمان" },
      "Al Ain": { en: "Al Ain", ar: "العين" },
      "Umm Al Quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
      "Ras Al Khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
      Fujairah: { en: "Fujairah", ar: "الفجيرة" },
    },
  },

  dashboard: {
    hello: { en: "Hello,", ar: "مرحباً،" },
    welcomeBack: { en: "We're glad to have you back! Manage your services with OSTA Services.", ar: "يسعدنا عودتك! أدر خدماتك مع OSTA Services." },
    myOrders: { en: "My Orders", ar: "طلباتي" },
    myInvoices: { en: "My Invoices", ar: "فواتيري" },
    totalDue: { en: "Total Amount Due", ar: "إجمالي المبلغ المستحق" },
    recentOrders: { en: "Recent Orders", ar: "الطلبات الأخيرة" },
    noOrders: { en: "No orders yet.", ar: "لا توجد طلبات بعد." },
    bookService: { en: "Book a Service", ar: "احجز خدمة" },
    lastService: { en: "Last service:", ar: "آخر خدمة:" },
    on: { en: "on", ar: "بتاريخ" },
    notifications: { en: "Notifications", ar: "الإشعارات" },
    failedToLoad: { en: "Failed to load", ar: "فشل التحميل" },
  },

  orders: {
    title: { en: "My Orders", ar: "طلباتي" },
    bookService: { en: "Book a service", ar: "احجز خدمة" },
    filterAll: { en: "All", ar: "الكل" },
    noOrders: { en: "No orders found.", ar: "لا توجد طلبات." },
    failedToLoad: { en: "Failed to load orders", ar: "فشل تحميل الطلبات" },
  },

  orderDetail: {
    title: { en: "Order Details", ar: "تفاصيل الطلب" },
    service: { en: "Service", ar: "الخدمة" },
    date: { en: "Date", ar: "التاريخ" },
    time: { en: "Time", ar: "الوقت" },
    location: { en: "Location", ar: "الموقع" },
    amount: { en: "Amount", ar: "المبلغ" },
    notYetAgreed: { en: "Not yet agreed", ar: "لم يُحدد بعد" },
    team: { en: "Team", ar: "الفريق" },
    assignedTo: { en: "Assigned To", ar: "مسند إلى" },
    notes: { en: "Notes", ar: "ملاحظات" },
    invoice: { en: "Invoice", ar: "الفاتورة" },
    cancellationReason: { en: "Cancellation reason", ar: "سبب الإلغاء" },
    failedToLoad: { en: "Failed to load order", ar: "فشل تحميل الطلب" },
  },

  newOrder: {
    title: { en: "Book a Service", ar: "احجز خدمة" },
    service: { en: "Service", ar: "الخدمة" },
    dateTime: { en: "Preferred date & time", ar: "التاريخ والوقت المفضلان" },
    location: { en: "Location", ar: "الموقع" },
    locationPlaceholder: { en: "Type an address, or share your location", ar: "اكتب عنواناً، أو شارك موقعك" },
    shareLocation: { en: "Share my current location", ar: "مشاركة موقعي الحالي" },
    gettingLocation: { en: "Getting your location…", ar: "جارٍ تحديد موقعك…" },
    language: { en: "Preferred language", ar: "اللغة المفضلة" },
    notes: { en: "Notes (optional)", ar: "ملاحظات (اختياري)" },
    notesPlaceholder: { en: "Tell us more about what you need…", ar: "أخبرنا المزيد عما تحتاجه…" },
    whatsappNote: { en: "After booking, we'll open WhatsApp with your details pre-filled to send to OSTA support — you confirm and send it yourself.", ar: "بعد الحجز، سنفتح واتساب برسالة معبأة مسبقاً بتفاصيلك لإرسالها إلى دعم OSTA — أنت من يؤكد ويرسل الرسالة." },
    submit: { en: "Confirm Booking", ar: "تأكيد الحجز" },
    submitting: { en: "Booking…", ar: "جارٍ الحجز…" },
    successTitle: { en: "Booking requested!", ar: "تم إرسال طلب الحجز!" },
    successSubtitle: { en: "We'll assign a team shortly. We also opened WhatsApp with your details ready to send.", ar: "سنقوم بتعيين فريق قريباً. كما فتحنا واتساب مع تفاصيلك جاهزة للإرسال." },
    locationUnsupported: { en: "Location sharing isn't supported on this device.", ar: "مشاركة الموقع غير مدعومة على هذا الجهاز." },
    locationFailed: { en: "Couldn't get your location. Please allow location access or type an address.", ar: "تعذر تحديد موقعك. يرجى السماح بالوصول إلى الموقع أو كتابة عنوان." },
    genericError: { en: "Could not book this order. Please try again.", ar: "تعذر حجز هذا الطلب. يرجى المحاولة مرة أخرى." },
    notSpecified: { en: "Not specified", ar: "غير محدد" },
    services: {
      "AC Services": { en: "AC Services", ar: "خدمات التكييف" },
      "Cleaning Services": { en: "Cleaning Services", ar: "خدمات التنظيف" },
      "Electrical Services": { en: "Electrical Services", ar: "خدمات كهربائية" },
      "Plumbing Services": { en: "Plumbing Services", ar: "خدمات السباكة" },
      "Pest Control Services": { en: "Pest Control Services", ar: "مكافحة الحشرات" },
      "Home Maintenance": { en: "Home Maintenance", ar: "صيانة منزلية" },
      "Emergency 24/7": { en: "Emergency 24/7", ar: "طوارئ على مدار الساعة" },
    },
    languages: {
      English: { en: "English", ar: "الإنجليزية" },
      Arabic: { en: "Arabic", ar: "العربية" },
    },
  },

  invoices: {
    title: { en: "My Invoices", ar: "فواتيري" },
    noInvoices: { en: "No invoices yet.", ar: "لا توجد فواتير بعد." },
    failedToLoad: { en: "Failed to load invoices", ar: "فشل تحميل الفواتير" },
  },

  invoiceDetail: {
    title: { en: "Invoice Details", ar: "تفاصيل الفاتورة" },
    services: { en: "Services", ar: "الخدمات" },
    subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
    vat: { en: "VAT", ar: "ضريبة القيمة المضافة" },
    refunded: { en: "Refunded", ar: "مبلغ مسترد" },
    totalDue: { en: "Total Amount Due", ar: "إجمالي المبلغ المستحق" },
    warrantyUntil: { en: "Warranty valid until", ar: "الضمان ساري حتى" },
    payInvoice: { en: "Pay Invoice", ar: "دفع الفاتورة" },
    payNote: { en: "Online payment isn't available yet — please contact OSTA Services support to settle this invoice.", ar: "الدفع عبر الإنترنت غير متاح حالياً — يرجى التواصل مع دعم OSTA Services لتسوية هذه الفاتورة." },
    download: { en: "Download Invoice", ar: "تحميل الفاتورة" },
    failedToLoad: { en: "Failed to load invoice", ar: "فشل تحميل الفاتورة" },
  },

  profile: {
    title: { en: "My Profile", ar: "حسابي" },
    customerId: { en: "Customer ID:", ar: "رقم العميل:" },
    mobileNumber: { en: "Mobile Number", ar: "رقم الجوال" },
    whatsappNumber: { en: "WhatsApp Number", ar: "رقم الواتساب" },
    email: { en: "Email", ar: "البريد الإلكتروني" },
    address: { en: "Address", ar: "العنوان" },
    emirate: { en: "Emirate", ar: "الإمارة" },
    language: { en: "Language", ar: "اللغة" },
    contactSupport: { en: "To update your profile details, please contact OSTA Services support.", ar: "لتحديث بيانات حسابك، يرجى التواصل مع دعم OSTA Services." },
  },

  more: {
    title: { en: "More", ar: "المزيد" },
    bookService: { en: "Book a Service", ar: "احجز خدمة" },
    myOrders: { en: "My Orders", ar: "طلباتي" },
    myInvoices: { en: "My Invoices", ar: "فواتيري" },
    myProfile: { en: "My Profile", ar: "حسابي" },
  },

  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    services: { en: "Services", ar: "الخدمات" },
    pricing: { en: "Pricing", ar: "الأسعار" },
    blog: { en: "Blog", ar: "المدونة" },
    about: { en: "About Us", ar: "من نحن" },
    contact: { en: "Contact", ar: "تواصل معنا" },
    bookNow: { en: "Book Now", ar: "احجز الآن" },
    dashboard: { en: "Dashboard", ar: "حسابي" },
    logIn: { en: "Log In", ar: "تسجيل الدخول" },
  },

  footer: {
    tagline: { en: "Your Comfort. Our Priority.", ar: "راحتك. أولويتنا." },
    quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
    getInTouch: { en: "Get in Touch", ar: "تواصل معنا" },
    areasWeCover: { en: "Areas We Cover", ar: "المناطق التي نغطيها" },
    rightsReserved: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  },

  home: {
    heroEyebrow: { en: "Trusted AC Repair & Home Maintenance", ar: "صيانة مكيفات ومنازل موثوقة" },
    heroTitleLine1: { en: "Your Comfort.", ar: "راحتك." },
    heroTitleLine2: { en: "Our Priority.", ar: "أولويتنا." },
    heroSubtitle: {
      en: "Professional home services across the UAE. Trusted by 10,000+ happy customers.",
      ar: "خدمات منزلية احترافية في جميع أنحاء الإمارات. موثوقون من قبل أكثر من 10,000 عميل سعيد.",
    },
    bookService: { en: "Book a Service", ar: "احجز خدمة" },
    viewServices: { en: "View All Services", ar: "عرض كل الخدمات" },
    trustTrusted: { en: "Trusted Professionals", ar: "محترفون موثوقون" },
    trustSameDay: { en: "Same Day Service", ar: "خدمة في نفس اليوم" },
    trustWarranty: { en: "14-Day Warranty", ar: "ضمان 14 يوماً" },
    trustPricing: { en: "Transparent Pricing", ar: "أسعار شفافة" },
    servicesEyebrow: { en: "Our Services", ar: "خدماتنا" },
    servicesTitle: { en: "Everything your home needs", ar: "كل ما يحتاجه منزلك" },
    servicesSubtitle: {
      en: "A complete range of AC and home maintenance services under one roof.",
      ar: "مجموعة كاملة من خدمات صيانة المكيفات والمنزل تحت سقف واحد.",
    },
    moreLink: { en: "Learn more", ar: "المزيد" },
    statRating: { en: "Google Rating", ar: "تقييم جوجل" },
    statCustomers: { en: "Happy Customers", ar: "عميل سعيد" },
    statReviews: { en: "Positive Reviews", ar: "تقييم إيجابي" },
    statEmirates: { en: "Emirates We Serve", ar: "إمارات نخدمها" },
    ctaTitle: { en: "Book Your Service Today", ar: "احجز خدمتك اليوم" },
    ctaSubtitle: {
      en: "Log in or create an account to book online in minutes.",
      ar: "سجّل الدخول أو أنشئ حساباً لتحجز عبر الإنترنت خلال دقائق.",
    },
    ctaButton: { en: "Book Now", ar: "احجز الآن" },
    blogEyebrow: { en: "From the Blog", ar: "من المدونة" },
    blogTitle: { en: "Maintenance tips & guides", ar: "نصائح وأدلة الصيانة" },
    viewBlog: { en: "View all articles", ar: "عرض كل المقالات" },
  },

  services: {
    pageTitle: { en: "Our Services", ar: "خدماتنا" },
    pageSubtitle: {
      en: "A complete range of AC and home maintenance services across the UAE.",
      ar: "مجموعة كاملة من خدمات صيانة المكيفات والمنزل في جميع أنحاء الإمارات.",
    },
    startingFrom: { en: "Starting from", ar: "ابتداءً من" },
    bookThisService: { en: "Book This Service", ar: "احجز هذه الخدمة" },
    noServices: { en: "No services found.", ar: "لا توجد خدمات." },
    backToServices: { en: "All Services", ar: "كل الخدمات" },
  },

  pricing: {
    pageTitle: { en: "Pricing", ar: "الأسعار" },
    pageSubtitle: {
      en: "Transparent, upfront pricing for every service — no hidden fees.",
      ar: "أسعار شفافة وواضحة لكل خدمة — بدون رسوم خفية.",
    },
    service: { en: "Service", ar: "الخدمة" },
    price: { en: "Price", ar: "السعر" },
    book: { en: "Book", ar: "احجز" },
  },

  blog: {
    pageTitle: { en: "Blog", ar: "المدونة" },
    pageSubtitle: {
      en: "Tips, guides, and news from the OSTA Services team.",
      ar: "نصائح وأدلة وأخبار من فريق OSTA Services.",
    },
    noPosts: { en: "No articles yet — check back soon.", ar: "لا توجد مقالات بعد — تابعنا قريباً." },
    backToBlog: { en: "All Articles", ar: "كل المقالات" },
    readMore: { en: "Read more", ar: "اقرأ المزيد" },
  },

  about: {
    pageTitle: { en: "About OSTA Services", ar: "عن OSTA Services" },
    heroText: {
      en: "OSTA Services was founded with a simple idea — to make home maintenance in the UAE faster, easier, and more reliable for everyone.",
      ar: "تأسست خدمات آسطا بفكرة بسيطة: جعل خدمات الصيانة المنزلية في الإمارات أسرع وأسهل وأكثر موثوقية للجميع.",
    },
    bodyText: {
      en: "We started small, but with trust from our customers, OSTA became one of the growing names in UAE home services. Our certified technicians serve homes, villas, offices, and commercial properties across Dubai, Abu Dhabi, Sharjah, Ajman, Al Ain, Ras Al Khaimah, Umm Al Quwain, and Fujairah — with transparent pricing and a warranty on every eligible service.",
      ar: "بدأنا بشكل بسيط، ولكن بثقة عملائنا أصبحت آسطا من الأسماء الصاعدة في خدمات المنازل داخل الإمارات. يخدم فنيونا المعتمدون المنازل والفلل والمكاتب والمنشآت التجارية في دبي وأبوظبي والشارقة وعجمان والعين ورأس الخيمة وأم القيوين والفجيرة — بأسعار شفافة وضمان على كل خدمة مؤهلة.",
    },
  },

  contact: {
    pageTitle: { en: "Contact Us", ar: "تواصل معنا" },
    pageSubtitle: {
      en: "Have a question or need a service? Reach out any time.",
      ar: "لديك سؤال أو تحتاج خدمة؟ تواصل معنا في أي وقت.",
    },
    whatsapp: { en: "WhatsApp", ar: "واتساب" },
    phone: { en: "Phone", ar: "الهاتف" },
    email: { en: "Email", ar: "البريد الإلكتروني" },
    chatOnWhatsapp: { en: "Chat on WhatsApp", ar: "تحدث عبر واتساب" },
  },
} as const;

type Dict = typeof dict;

type DotKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends { en: string; ar: string }
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? DotKeys<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export type TranslationKey = DotKeys<Dict>;

function resolve(key: string): { en: string; ar: string } | undefined {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict;
  for (const part of parts) {
    node = node?.[part];
    if (node === undefined) return undefined;
  }
  return node;
}

export function translate(key: TranslationKey, lang: Lang): string {
  const entry = resolve(key);
  if (!entry) return key;
  return entry[lang];
}
