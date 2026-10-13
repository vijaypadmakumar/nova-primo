import type { DocumentType, TripStatus } from "@/db/schema";

/*
 * Words on the driver's trip page and in the WhatsApp message, in the driver's
 * own language. Kept apart from the agent's screens because drivers read many
 * more languages than the agent app offers.
 */

type DriverText = {
  greeting: (name: string) => string;
  yourTrip: string;
  truck: string;
  pickup: string;
  drop: string;
  callAgent: string;
  callParty: string;
  tapWhen: string;
  status: Record<TripStatus, string>;
  photos: string;
  doc: Record<DocumentType, string>;
  sent: string;
  send: string;
  done: string;
  message: (p: { name: string; from: string; to: string; date: string; vehicle: string; link: string }) => string;
};

const en: DriverText = {
  greeting: (n) => `Namaste ${n}`,
  yourTrip: "Your trip",
  truck: "Truck",
  pickup: "Pick up from",
  drop: "Deliver to",
  callAgent: "Call agent",
  callParty: "Call party",
  tapWhen: "Tap each step when it happens",
  status: {
    reached_pickup: "Reached loading point",
    loaded: "Loading done",
    departed: "Started the journey",
    reached_drop: "Reached unloading point",
    unloaded: "Unloading done",
  },
  photos: "Send photos of the papers",
  doc: { lr: "LR (bilty)", eway_bill: "E-way bill", pod: "Signed POD" },
  sent: "Sent",
  send: "Take photo",
  done: "Trip complete. Thank you!",
  message: (p) =>
    `Namaste ${p.name}. New trip: ${p.from} to ${p.to}, loading on ${p.date}. Truck ${p.vehicle}. Open your trip here: ${p.link}`,
};

const hi: DriverText = {
  greeting: (n) => `नमस्ते ${n}`,
  yourTrip: "आपकी ट्रिप",
  truck: "ट्रक",
  pickup: "माल उठाना है",
  drop: "माल पहुंचाना है",
  callAgent: "एजेंट को फ़ोन करें",
  callParty: "पार्टी को फ़ोन करें",
  tapWhen: "हर काम होने पर बटन दबाएं",
  status: {
    reached_pickup: "लोडिंग की जगह पहुंच गए",
    loaded: "लोडिंग हो गई",
    departed: "सफ़र शुरू किया",
    reached_drop: "अनलोडिंग की जगह पहुंच गए",
    unloaded: "अनलोडिंग हो गई",
  },
  photos: "कागज़ों की फ़ोटो भेजें",
  doc: { lr: "LR (बिल्टी)", eway_bill: "ई-वे बिल", pod: "साइन किया हुआ POD" },
  sent: "भेज दिया",
  send: "फ़ोटो लें",
  done: "ट्रिप पूरी हुई। धन्यवाद!",
  message: (p) =>
    `नमस्ते ${p.name}। नई ट्रिप: ${p.from} से ${p.to}, लोडिंग ${p.date} को। ट्रक ${p.vehicle}। अपनी ट्रिप यहां खोलें: ${p.link}`,
};

const kn: DriverText = {
  greeting: (n) => `ನಮಸ್ಕಾರ ${n}`,
  yourTrip: "ನಿಮ್ಮ ಟ್ರಿಪ್",
  truck: "ಲಾರಿ",
  pickup: "ಲೋಡ್ ಎತ್ತುವ ಸ್ಥಳ",
  drop: "ತಲುಪಿಸುವ ಸ್ಥಳ",
  callAgent: "ಏಜೆಂಟ್‌ಗೆ ಕರೆ ಮಾಡಿ",
  callParty: "ಪಾರ್ಟಿಗೆ ಕರೆ ಮಾಡಿ",
  tapWhen: "ಪ್ರತಿ ಹಂತ ಆದಾಗ ಬಟನ್ ಒತ್ತಿ",
  status: {
    reached_pickup: "ಲೋಡಿಂಗ್ ಸ್ಥಳ ತಲುಪಿದೆ",
    loaded: "ಲೋಡಿಂಗ್ ಮುಗಿದಿದೆ",
    departed: "ಪ್ರಯಾಣ ಶುರುವಾಗಿದೆ",
    reached_drop: "ಅನ್‌ಲೋಡಿಂಗ್ ಸ್ಥಳ ತಲುಪಿದೆ",
    unloaded: "ಅನ್‌ಲೋಡಿಂಗ್ ಮುಗಿದಿದೆ",
  },
  photos: "ದಾಖಲೆಗಳ ಫೋಟೋ ಕಳುಹಿಸಿ",
  doc: { lr: "LR (ಬಿಲ್ಟಿ)", eway_bill: "ಇ-ವೇ ಬಿಲ್", pod: "ಸಹಿ ಮಾಡಿದ POD" },
  sent: "ಕಳುಹಿಸಲಾಗಿದೆ",
  send: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
  done: "ಟ್ರಿಪ್ ಮುಗಿದಿದೆ. ಧನ್ಯವಾದಗಳು!",
  message: (p) =>
    `ನಮಸ್ಕಾರ ${p.name}. ಹೊಸ ಟ್ರಿಪ್: ${p.from} ಇಂದ ${p.to}, ಲೋಡಿಂಗ್ ${p.date}. ಲಾರಿ ${p.vehicle}. ನಿಮ್ಮ ಟ್ರಿಪ್ ಇಲ್ಲಿ ತೆರೆಯಿರಿ: ${p.link}`,
};

const ta: DriverText = {
  greeting: (n) => `வணக்கம் ${n}`,
  yourTrip: "உங்கள் பயணம்",
  truck: "லாரி",
  pickup: "சரக்கு ஏற்றும் இடம்",
  drop: "சரக்கு இறக்கும் இடம்",
  callAgent: "ஏஜென்டை அழைக்கவும்",
  callParty: "பார்ட்டியை அழைக்கவும்",
  tapWhen: "ஒவ்வொரு படியும் முடிந்ததும் அழுத்தவும்",
  status: {
    reached_pickup: "ஏற்றும் இடத்தை அடைந்தேன்",
    loaded: "ஏற்றுதல் முடிந்தது",
    departed: "பயணம் தொடங்கியது",
    reached_drop: "இறக்கும் இடத்தை அடைந்தேன்",
    unloaded: "இறக்குதல் முடிந்தது",
  },
  photos: "ஆவணங்களின் புகைப்படம் அனுப்பவும்",
  doc: { lr: "LR (பில்டி)", eway_bill: "இ-வே பில்", pod: "கையொப்பமிட்ட POD" },
  sent: "அனுப்பப்பட்டது",
  send: "புகைப்படம் எடு",
  done: "பயணம் முடிந்தது. நன்றி!",
  message: (p) =>
    `வணக்கம் ${p.name}. புதிய பயணம்: ${p.from} முதல் ${p.to} வரை, ஏற்றுதல் ${p.date}. லாரி ${p.vehicle}. உங்கள் பயணத்தை இங்கே திறக்கவும்: ${p.link}`,
};

const pa: DriverText = {
  greeting: (n) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${n}`,
  yourTrip: "ਤੁਹਾਡੀ ਟ੍ਰਿਪ",
  truck: "ਟਰੱਕ",
  pickup: "ਮਾਲ ਚੁੱਕਣਾ ਹੈ",
  drop: "ਮਾਲ ਪਹੁੰਚਾਉਣਾ ਹੈ",
  callAgent: "ਏਜੰਟ ਨੂੰ ਫ਼ੋਨ ਕਰੋ",
  callParty: "ਪਾਰਟੀ ਨੂੰ ਫ਼ੋਨ ਕਰੋ",
  tapWhen: "ਹਰ ਕੰਮ ਹੋਣ 'ਤੇ ਬਟਨ ਦਬਾਓ",
  status: {
    reached_pickup: "ਲੋਡਿੰਗ ਵਾਲੀ ਥਾਂ ਪਹੁੰਚ ਗਏ",
    loaded: "ਲੋਡਿੰਗ ਹੋ ਗਈ",
    departed: "ਸਫ਼ਰ ਸ਼ੁਰੂ ਕੀਤਾ",
    reached_drop: "ਅਨਲੋਡਿੰਗ ਵਾਲੀ ਥਾਂ ਪਹੁੰਚ ਗਏ",
    unloaded: "ਅਨਲੋਡਿੰਗ ਹੋ ਗਈ",
  },
  photos: "ਕਾਗਜ਼ਾਂ ਦੀ ਫ਼ੋਟੋ ਭੇਜੋ",
  doc: { lr: "LR (ਬਿਲਟੀ)", eway_bill: "ਈ-ਵੇ ਬਿੱਲ", pod: "ਦਸਤਖ਼ਤ ਵਾਲਾ POD" },
  sent: "ਭੇਜ ਦਿੱਤਾ",
  send: "ਫ਼ੋਟੋ ਲਓ",
  done: "ਟ੍ਰਿਪ ਪੂਰੀ ਹੋਈ। ਧੰਨਵਾਦ!",
  message: (p) =>
    `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${p.name}। ਨਵੀਂ ਟ੍ਰਿਪ: ${p.from} ਤੋਂ ${p.to}, ਲੋਡਿੰਗ ${p.date} ਨੂੰ। ਟਰੱਕ ${p.vehicle}। ਆਪਣੀ ਟ੍ਰਿਪ ਇੱਥੇ ਖੋਲ੍ਹੋ: ${p.link}`,
};

const TEXTS: Partial<Record<string, DriverText>> = { en, hi, kn, ta, pa };

/** The driver's language when we have it, otherwise Hindi. */
export function driverText(language: string): DriverText {
  return TEXTS[language] ?? hi;
}

export function hasDriverText(language: string): boolean {
  return language in TEXTS;
}
