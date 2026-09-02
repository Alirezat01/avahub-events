export type SampleEvent = {
  slug: string;
  title: string;
  category: string;
  day: string;
  month: string;
  place: string;
  image: string;
  badge?: "پیش‌فروش" | "به‌زودی" | "ظرفیت محدود";
};

export const EVENT_CATEGORIES = [
  "همه",
  "کنفرانس",
  "همایش",
  "سمینار",
  "کارگاه",
  "برندینگ",
] as const;

export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    slug: "innovation-conference",
    title: "کنفرانس نوآوری و فناوری",
    category: "کنفرانس",
    day: "۱۲",
    month: "شهریور",
    place: "تهران، برج میلاد",
    image: "/images/event-seminar.png",
    badge: "پیش‌فروش",
  },
  {
    slug: "digital-marketing-summit",
    title: "همایش بازاریابی و رشد کسب‌وکار",
    category: "همایش",
    day: "۰۳",
    month: "مهر",
    place: "تهران، مرکز همایش‌های بین‌المللی",
    image: "/images/event-conference.png",
  },
  {
    slug: "business-growth-seminar",
    title: "سمینار رشد کسب‌وکار",
    category: "سمینار",
    day: "۱۴",
    month: "آبان",
    place: "تهران، هتل اسپیناس پالاس",
    image: "/images/event-panel.png",
  },
  {
    slug: "content-workshop",
    title: "کارگاه تولید محتوا",
    category: "کارگاه",
    day: "۰۶",
    month: "آذر",
    place: "اصفهان، هتل عالی‌قاپو",
    image: "/images/event-workshop.png",
  },
  {
    slug: "brand-media-show",
    title: "نمایش برند و رسانه",
    category: "برندینگ",
    day: "۲۱",
    month: "آذر",
    place: "تهران، فضای نمایشی تهران",
    image: "/images/event-showcase.png",
    badge: "به‌زودی",
  },
];
