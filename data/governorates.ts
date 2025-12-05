import { LocalizedString } from '../types';

interface Governorate {
    name: LocalizedString;
}

export const governorates: Governorate[] = [
    { name: { en: "Alexandria", ar: "الإسكندرية" } },
    { name: { en: "Aswan", ar: "أسوان" } },
    { name: { en: "Asyut", ar: "أسيوط" } },
    { name: { en: "Beheira", ar: "البحيرة" } },
    { name: { en: "Beni Suef", ar: "بني سويف" } },
    { name: { en: "Cairo", ar: "القاهرة" } },
    { name: { en: "Dakahlia", ar: "الدقهلية" } },
    { name: { en: "Damietta", ar: "دمياط" } },
    { name: { en: "Faiyum", ar: "الفيوم" } },
    { name: { en: "Gharbia", ar: "الغربية" } },
    { name: { en: "Giza", ar: "الجيزة" } },
    { name: { en: "Ismailia", ar: "الإسماعيلية" } },
    { name: { en: "Kafr El Sheikh", ar: "كفر الشيخ" } },
    { name: { en: "Luxor", ar: "الأقصر" } },
    { name: { en: "Matrouh", ar: "مطروح" } },
    { name: { en: "Minya", ar: "المنيا" } },
    { name: { en: "Monufia", ar: "المنوفية" } },
    { name: { en: "New Valley", ar: "الوادي الجديد" } },
    { name: { en: "North Sinai", ar: "شمال سيناء" } },
    { name: { en: "Port Said", ar: "بورسعيد" } },
    { name: { en: "Qalyubia", ar: "القليوبية" } },
    { name: { en: "Qena", ar: "قنا" } },
    { name: { en: "Red Sea", ar: "البحر الأحمر" } },
    { name: { en: "Sharqia", ar: "الشرقية" } },
    { name: { en: "Sohag", ar: "سوهاج" } },
    { name: { en: "South Sinai", ar: "جنوب سيناء" } },
    { name: { en: "Suez", ar: "السويس" } },
];
