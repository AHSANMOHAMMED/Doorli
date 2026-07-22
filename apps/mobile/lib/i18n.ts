import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'si' | 'ta';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'onboarding.welcome.title': 'Welcome to Doorli',
    'onboarding.welcome.body': 'Your neighbourhood super-app — shops, food, rides, bookings, and more on one phone.',
    'onboarding.home.title': 'Home hub',
    'onboarding.home.body': 'Browse grocery, food, hotels, beauty & services. Search nearby shops and add to cart in a tap.',
    'onboarding.nav.title': 'Bottom navigation',
    'onboarding.nav.body': 'Home · Search · Orders · Ride · Profile — always one thumb away, built for phones.',
    'onboarding.vendor.title': 'Selling on Doorli?',
    'onboarding.vendor.body': 'Vendors get Cashier barcode scan, live stock, and supplier invoice import — no typing every purchase.',
    'onboarding.skip': 'Skip',
    'onboarding.next': 'Next',
    'onboarding.start': 'Get started',
    'onboarding.language.title': 'Choose your language',
    'onboarding.language.body': 'You can change this later in settings.',

    'auth.tagline': 'Everything Local. Delivered.',
    'auth.tab.password': 'Password',
    'auth.tab.otp': 'Phone OTP',
    'auth.signin_as': 'Sign in as',
    'auth.role.customer': 'Customer',
    'auth.role.vendor': 'Vendor',
    'auth.role.driver': 'Driver',
    'auth.input.email': 'Email or username',
    'auth.input.business': 'Business name (e.g. Corner Grocery)',
    'auth.input.password': 'Password',
    'auth.btn.signin': 'Sign in',
    'auth.tab.signin': 'Sign In',
    'auth.tab.signup': 'Sign Up',
    'auth.input.fullname': 'Full Name',
    'auth.input.phone': 'Phone Number (e.g. +9477...)',
    'auth.i_am_a': 'I am a...',
    'auth.btn.send_otp': 'Send OTP',
    'auth.instruction.otp': 'Enter the OTP sent to',
    'auth.input.otp': 'OTP Code',
    'auth.btn.verify': 'Verify & Login',
    'auth.btn.change_phone': 'Change Phone Number',
    'auth.demo_hint': 'Demo customer: customer@doorli.test / Doorli123!\\nDemo vendor: vendor@doorli.test + business Corner Grocery',

    'tabs.home': 'Home',
    'tabs.search': 'Search',
    'tabs.orders': 'Orders',
    'tabs.ride': 'Ride',
    'tabs.profile': 'Profile',
  },
  si: {
    'onboarding.welcome.title': 'Doorli වෙත සාදරයෙන් පිළිගනිමු',
    'onboarding.welcome.body': 'ඔබේ අසල්වැසි සුපිරි යෙදුම - කඩ, ආහාර, ගමන්, වෙන් කිරීම් සහ තවත් බොහෝ දේ එකම දුරකථනයකින්.',
    'onboarding.home.title': 'ප්‍රධාන මධ්‍යස්ථානය',
    'onboarding.home.body': 'සිල්ලර බඩු, ආහාර, හෝටල්, රූපලාවන්‍ය සහ සේවා පිරික්සන්න. අසල ඇති කඩ සොයන්න.',
    'onboarding.nav.title': 'පහසු සංචාලනය',
    'onboarding.nav.body': 'මුල් පිටුව · සෙවීම · ඇණවුම් · ගමන් · පැතිකඩ — සෑම විටම පහසුවෙන් භාවිතා කළ හැකිය.',
    'onboarding.vendor.title': 'Doorli හි විකුණනවාද?',
    'onboarding.vendor.body': 'වෙළෙන්දන්ට තීරු කේත ස්කෑන් කිරීම, සජීවී තොග සහ සැපයුම්කරුවන්ගේ ඉන්වොයිසි ආනයනය ලබා ගත හැකිය.',
    'onboarding.skip': 'මඟ හරින්න',
    'onboarding.next': 'ඊළඟ',
    'onboarding.start': 'ආරම්භ කරන්න',
    'onboarding.language.title': 'ඔබේ භාෂාව තෝරන්න',
    'onboarding.language.body': 'ඔබට පසුව සැකසීම් වලින් මෙය වෙනස් කළ හැක.',

    'auth.tagline': 'ඔබේ අසල්වැසි සියලුම දෑ. ඔබ වෙතටම.',
    'auth.tab.password': 'මුරපදය',
    'auth.tab.otp': 'දුරකථන OTP',
    'auth.signin_as': 'ප්‍රවේශ වන්නේ',
    'auth.role.customer': 'පාරිභෝගික',
    'auth.role.vendor': 'වෙළෙන්දා',
    'auth.role.driver': 'රියදුරු',
    'auth.input.email': 'විද්‍යුත් තැපෑල හෝ පරිශීලක නාමය',
    'auth.input.business': 'ව්‍යාපාරයේ නම',
    'auth.input.password': 'මුරපදය',
    'auth.btn.signin': 'ප්‍රවේශ වන්න',
    'auth.tab.signin': 'පුරනය වන්න',
    'auth.tab.signup': 'ලියාපදිංචි වන්න',
    'auth.input.fullname': 'සම්පූර්ණ නම',
    'auth.input.phone': 'දුරකථන අංකය (+9477...)',
    'auth.i_am_a': 'මම...',
    'auth.btn.send_otp': 'OTP යවන්න',
    'auth.instruction.otp': 'යවන ලද OTP එක ඇතුලත් කරන්න',
    'auth.input.otp': 'OTP කේතය',
    'auth.btn.verify': 'තහවුරු කර ප්‍රවේශ වන්න',
    'auth.btn.change_phone': 'දුරකථන අංකය වෙනස් කරන්න',
    'auth.demo_hint': 'ආදර්ශනය: customer@doorli.test / Doorli123!\\nවෙළෙන්දා: vendor@doorli.test + ව්‍යාපාරය Corner Grocery',

    'tabs.home': 'මුල් පිටුව',
    'tabs.search': 'සෙවීම',
    'tabs.orders': 'ඇණවුම්',
    'tabs.ride': 'ගමන්',
    'tabs.profile': 'පැතිකඩ',
  },
  ta: {
    'onboarding.welcome.title': 'Doorli க்கு வரவேற்கிறோம்',
    'onboarding.welcome.body': 'உங்கள் அண்டை சூப்பர் ஆப் - கடைகள், உணவு, சவாரிகள், முன்பதிவுகள் மற்றும் பல ஒரே போனில்.',
    'onboarding.home.title': 'முகப்பு',
    'onboarding.home.body': 'மளிகை, உணவு, விடுதிகள், அழகு மற்றும் சேவைகளை உலாவுக. அருகிலுள்ள கடைகளைத் தேடுங்கள்.',
    'onboarding.nav.title': 'எளிதான வழிசெலுத்தல்',
    'onboarding.nav.body': 'முகப்பு · தேடல் · ஆர்டர்கள் · சவாரி · சுயவிவரம் — எப்போதும் ஒரு விரல் தூரத்தில்.',
    'onboarding.vendor.title': 'Doorli இல் விற்கிறீர்களா?',
    'onboarding.vendor.body': 'விற்பனையாளர்கள் பார்கோடு ஸ்கேன், நேரடி இருப்பு மற்றும் சப்ளையர் இன்வாய்ஸ் இறக்குமதி ஆகியவற்றைப் பெறலாம்.',
    'onboarding.skip': 'தவிர்',
    'onboarding.next': 'அடுத்தது',
    'onboarding.start': 'தொடங்கு',
    'onboarding.language.title': 'உங்கள் மொழியைத் தேர்வுசெய்க',
    'onboarding.language.body': 'பின்னர் இதை அமைப்புகளில் மாற்றலாம்.',

    'auth.tagline': 'அனைத்து உள்ளூர் பொருட்களும். வழங்கப்படுகிறது.',
    'auth.tab.password': 'கடவுச்சொல்',
    'auth.tab.otp': 'போன் OTP',
    'auth.signin_as': 'உள்நுழைக',
    'auth.role.customer': 'வாடிக்கையாளர்',
    'auth.role.vendor': 'விற்பனையாளர்',
    'auth.role.driver': 'ஓட்டுநர்',
    'auth.input.email': 'மின்னஞ்சல் அல்லது பயனர்பெயர்',
    'auth.input.business': 'வணிக பெயர்',
    'auth.input.password': 'கடவுச்சொல்',
    'auth.btn.signin': 'உள்நுழைய',
    'auth.tab.signin': 'உள்நுழைய',
    'auth.tab.signup': 'பதிவு செய்ய',
    'auth.input.fullname': 'முழு பெயர்',
    'auth.input.phone': 'தொலைபேசி எண் (+9477...)',
    'auth.i_am_a': 'நான் ஒரு...',
    'auth.btn.send_otp': 'OTP அனுப்பு',
    'auth.instruction.otp': 'அனுப்பப்பட்ட OTP ஐ உள்ளிடவும்',
    'auth.input.otp': 'OTP குறியீடு',
    'auth.btn.verify': 'சரிபார்த்து உள்நுழைய',
    'auth.btn.change_phone': 'தொலைபேசி எண்ணை மாற்று',
    'auth.demo_hint': 'டெமோ: customer@doorli.test / Doorli123!\\nவிற்பனையாளர்: vendor@doorli.test + Corner Grocery',

    'tabs.home': 'முகப்பு',
    'tabs.search': 'தேடல்',
    'tabs.orders': 'ஆர்டர்கள்',
    'tabs.ride': 'சவாரி',
    'tabs.profile': 'சுயவிவரம்',
  }
};

export const LANGUAGE_KEY = 'DOORLI_LANGUAGE';

export const useI18nStore = create<I18nState>((set, get) => ({
  language: 'en',
  setLanguage: async (lang: Language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    set({ language: lang });
  },
  t: (key: string) => {
    const lang = get().language;
    return translations[lang][key] || translations['en'][key] || key;
  },
}));

export const loadLanguage = async () => {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved && (saved === 'en' || saved === 'si' || saved === 'ta')) {
    useI18nStore.setState({ language: saved as Language });
  }
};
