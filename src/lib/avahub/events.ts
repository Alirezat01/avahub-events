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
  "کنسرت",
  "همایش",
  "فستیوال",
  "کارگاه",
  "برندینگ",
] as const;

export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    slug: "concert-irani",
    title: "کنسرت بزرگ موسیقی ایرانی",
    category: "کنسرت",
    day: "۱۲",
    month: "شهریور",
    place: "تهران، برج میلاد",
    image: "/images/event-concert.png",
    badge: "پیش‌فروش",
  },
  {
    slug: "digital-marketing-summit",
    title: "همایش دیجیتال مارکتینگ",
    category: "همایش",
    day: "۰۳",
    month: "مهر",
    place: "تهران، مرکز همایش‌های بین‌المللی",
    image: "/images/event-conference.png",
  },
  {
    slug: "free-music-festival",
    title: "فستیوال موسیقی آزاد",
    category: "فستیوال",
    day: "۱۴",
    month: "آبان",
    place: "تهران، پارک ملت",
    image: "/images/event-festival.png",
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
