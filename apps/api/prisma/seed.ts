import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// مطارات السعودية الرئيسية
const airports = [
  { code: "RUH", nameAr: "مطار الملك خالد الدولي", nameEn: "King Khalid International Airport", cityAr: "الرياض", cityEn: "Riyadh", lat: 24.9576, lng: 46.6988 },
  { code: "JED", nameAr: "مطار الملك عبدالعزيز الدولي", nameEn: "King Abdulaziz International Airport", cityAr: "جدة", cityEn: "Jeddah", lat: 21.6796, lng: 39.1565 },
  { code: "DMM", nameAr: "مطار الملك فهد الدولي", nameEn: "King Fahd International Airport", cityAr: "الدمام", cityEn: "Dammam", lat: 26.4712, lng: 49.7979 },
  { code: "MED", nameAr: "مطار الأمير محمد بن عبدالعزيز الدولي", nameEn: "Prince Mohammad bin Abdulaziz International Airport", cityAr: "المدينة المنورة", cityEn: "Madinah", lat: 24.5534, lng: 39.7051 },
  { code: "AHB", nameAr: "مطار أبها الدولي", nameEn: "Abha International Airport", cityAr: "أبها", cityEn: "Abha", lat: 18.2404, lng: 42.6566 },
  { code: "TIF", nameAr: "مطار الطائف الدولي", nameEn: "Taif International Airport", cityAr: "الطائف", cityEn: "Taif", lat: 21.4834, lng: 40.5443 },
  { code: "TUU", nameAr: "مطار الأمير سلطان بن عبدالعزيز", nameEn: "Prince Sultan bin Abdulaziz Airport", cityAr: "تبوك", cityEn: "Tabuk", lat: 28.3654, lng: 36.6189 },
  { code: "ELQ", nameAr: "مطار الأمير نايف بن عبدالعزيز الدولي", nameEn: "Prince Naif bin Abdulaziz International Airport", cityAr: "القصيم", cityEn: "Qassim", lat: 26.3028, lng: 43.7744 },
  { code: "GIZ", nameAr: "مطار الملك عبدالله بن عبدالعزيز", nameEn: "King Abdullah bin Abdulaziz Airport", cityAr: "جازان", cityEn: "Jazan", lat: 16.9011, lng: 42.5858 },
  { code: "HAS", nameAr: "مطار حائل الدولي", nameEn: "Hail International Airport", cityAr: "حائل", cityEn: "Hail", lat: 27.4379, lng: 41.6863 },
  { code: "AJF", nameAr: "مطار الجوف", nameEn: "Al Jouf Airport", cityAr: "الجوف", cityEn: "Al Jouf", lat: 29.7851, lng: 40.1000 },
  { code: "ULH", nameAr: "مطار العلا الدولي", nameEn: "AlUla International Airport", cityAr: "العلا", cityEn: "AlUla", lat: 26.4834, lng: 38.1169 },
  { code: "YNB", nameAr: "مطار الأمير عبدالمحسن بن عبدالعزيز", nameEn: "Prince Abdulmohsin bin Abdulaziz Airport", cityAr: "ينبع", cityEn: "Yanbu", lat: 24.1442, lng: 38.0634 },
  { code: "EAM", nameAr: "مطار نجران", nameEn: "Najran Airport", cityAr: "نجران", cityEn: "Najran", lat: 17.6114, lng: 44.4192 },
];

// فئات السيارات — الأسعار بالريال
const vehicleClasses = [
  { code: "ECONOMY", nameAr: "اقتصادي", nameEn: "Economy", seats: 4, bags: 2, baseFare: 25, perKm: 1.6, minFare: 50, sortOrder: 1 },
  { code: "FAMILY", nameAr: "عائلي", nameEn: "Family", seats: 7, bags: 4, baseFare: 35, perKm: 2.1, minFare: 70, sortOrder: 2 },
  { code: "LUXURY", nameAr: "فاخر", nameEn: "Luxury", seats: 4, bags: 3, baseFare: 60, perKm: 3.2, minFare: 120, sortOrder: 3 },
  { code: "VAN", nameAr: "فان", nameEn: "Van", seats: 12, bags: 10, baseFare: 70, perKm: 3.0, minFare: 140, sortOrder: 4 },
];

async function main() {
  for (const a of airports) {
    await prisma.airport.upsert({ where: { code: a.code }, update: a, create: a });
  }
  for (const v of vehicleClasses) {
    await prisma.vehicleClass.upsert({ where: { code: v.code }, update: v, create: v });
  }
  console.log(`Seeded ${airports.length} airports and ${vehicleClasses.length} vehicle classes`);
}

main().finally(() => prisma.$disconnect());
