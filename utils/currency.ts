export type CountryCurrency = {
  country: string;
  currencyName: string;
  code: string;
  symbol: string;
};

export const COUNTRY_CURRENCY_LIST: CountryCurrency[] = [
  { country: "Afganistán", currencyName: "Afgani", code: "AFN", symbol: "؋" },
  { country: "Albania", currencyName: "Lek", code: "ALL", symbol: "L" },
  { country: "Alemania", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Andorra", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Angola", currencyName: "Kwanza", code: "AOA", symbol: "Kz" },
  { country: "Antigua y Barbuda", currencyName: "Dólar del Caribe Oriental", code: "XCD", symbol: "$" },
  { country: "Arabia Saudí", currencyName: "Riyal saudí", code: "SAR", symbol: "﷼" },
  { country: "Argelia", currencyName: "Dinar argelino", code: "DZD", symbol: "دج" },
  { country: "Argentina", currencyName: "Peso argentino", code: "ARS", symbol: "$" },
  { country: "Armenia", currencyName: "Dram armenio", code: "AMD", symbol: "֏" },
  { country: "Australia", currencyName: "Dólar australiano", code: "AUD", symbol: "$" },
  { country: "Austria", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Azerbaiyán", currencyName: "Manat azerí", code: "AZN", symbol: "₼" },
  { country: "Bahamas", currencyName: "Dólar bahameño", code: "BSD", symbol: "$" },
  { country: "Bangladés", currencyName: "Taka", code: "BDT", symbol: "৳" },
  { country: "Barbados", currencyName: "Dólar barbadense", code: "BBD", symbol: "$" },
  { country: "Bélgica", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Belice", currencyName: "Dólar beliceño", code: "BZD", symbol: "BZ$" },
  { country: "Benín", currencyName: "Franco CFA BCEAO", code: "XOF", symbol: "Fr" },
  { country: "Bermudas", currencyName: "Dólar bermudeño", code: "BMD", symbol: "$" },
  { country: "Bolivia", currencyName: "Boliviano", code: "BOB", symbol: "Bs." },
  { country: "Bosnia y Herzegovina", currencyName: "Marco convertible", code: "BAM", symbol: "KM" },
  { country: "Botsuana", currencyName: "Pula", code: "BWP", symbol: "P" },
  { country: "Brasil", currencyName: "Real", code: "BRL", symbol: "R$" },
  { country: "Brunéi", currencyName: "Dólar de Brunéi", code: "BND", symbol: "$" },
  { country: "Bulgaria", currencyName: "Lev", code: "BGN", symbol: "лв" },
  { country: "Burkina Faso", currencyName: "Franco CFA BCEAO", code: "XOF", symbol: "Fr" },
  { country: "Burundi", currencyName: "Franco burundés", code: "BIF", symbol: "Fr" },
  { country: "Bután", currencyName: "Ngultrum", code: "BTN", symbol: "Nu." },
  { country: "Bután", currencyName: "Rupia india", code: "INR", symbol: "₹" },
  { country: "Cabo Verde", currencyName: "Escudo caboverdiano", code: "CVE", symbol: "$" },
  { country: "Camboya", currencyName: "Riel", code: "KHR", symbol: "៛" },
  { country: "Camerún", currencyName: "Franco CFA BEAC", code: "XAF", symbol: "Fr" },
  { country: "Canadá", currencyName: "Dólar canadiense", code: "CAD", symbol: "$" },
  { country: "Chile", currencyName: "Peso chileno", code: "CLP", symbol: "$" },
  { country: "China", currencyName: "Yuan renminbi", code: "CNY", symbol: "¥" },
  { country: "Chipre", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Colombia", currencyName: "Peso colombiano", code: "COP", symbol: "$" },
  { country: "Corea del Sur", currencyName: "Won", code: "KRW", symbol: "₩" },
  { country: "Corea del Norte", currencyName: "Won norcoreano", code: "KPW", symbol: "₩" },
  { country: "Costa Rica", currencyName: "Colón costarricense", code: "CRC", symbol: "₡" },
  { country: "Croacia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Cuba", currencyName: "Peso cubano", code: "CUP", symbol: "$MN" },
  { country: "Dinamarca", currencyName: "Corona danesa", code: "DKK", symbol: "kr" },
  { country: "Dominica", currencyName: "Dólar del Caribe Oriental", code: "XCD", symbol: "$" },
  { country: "Ecuador", currencyName: "Dólar estadounidense", code: "USD", symbol: "$" },
  { country: "Egipto", currencyName: "Libra egipcia", code: "EGP", symbol: "£" },
  { country: "El Salvador", currencyName: "Colón salvadoreño", code: "SVC", symbol: "₡" },
  { country: "El Salvador", currencyName: "Dólar estadounidense", code: "USD", symbol: "$" },
  { country: "Emiratos Árabes Unidos", currencyName: "Dirham", code: "AED", symbol: "د.إ" },
  { country: "Eslovaquia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Eslovenia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "España", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Estados Unidos", currencyName: "Dólar estadounidense", code: "USD", symbol: "$" },
  { country: "Estonia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Etiopía", currencyName: "Birr", code: "ETB", symbol: "Br" },
  { country: "Filipinas", currencyName: "Peso filipino", code: "PHP", symbol: "₱" },
  { country: "Finlandia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Francia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Gabón", currencyName: "Franco CFA BEAC", code: "XAF", symbol: "Fr" },
  { country: "Gambia", currencyName: "Dalasi", code: "GMD", symbol: "D" },
  { country: "Georgia", currencyName: "Lari", code: "GEL", symbol: "₾" },
  { country: "Ghana", currencyName: "Cedi", code: "GHS", symbol: "₵" },
  { country: "Grecia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Granada", currencyName: "Dólar del Caribe Oriental", code: "XCD", symbol: "$" },
  { country: "Guatemala", currencyName: "Quetzal", code: "GTQ", symbol: "Q" },
  { country: "Guinea", currencyName: "Franco guineano", code: "GNF", symbol: "Fr" },
  { country: "Guinea-Bisáu", currencyName: "Franco CFA BCEAO", code: "XOF", symbol: "Fr" },
  { country: "Guyana", currencyName: "Dólar guyanés", code: "GYD", symbol: "$" },
  { country: "Haití", currencyName: "Gourde", code: "HTG", symbol: "G" },
  { country: "Haití", currencyName: "Dólar estadounidense", code: "USD", symbol: "$" },
  { country: "Honduras", currencyName: "Lempira", code: "HNL", symbol: "L" },
  { country: "Hungría", currencyName: "Forinto", code: "HUF", symbol: "Ft" },
  { country: "India", currencyName: "Rupia india", code: "INR", symbol: "₹" },
  { country: "Indonesia", currencyName: "Rupia indonesia", code: "IDR", symbol: "Rp" },
  { country: "Irak", currencyName: "Dinar iraquí", code: "IQD", symbol: "ع.د" },
  { country: "Irán", currencyName: "Rial iraní", code: "IRR", symbol: "﷼" },
  { country: "Irlanda", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Islandia", currencyName: "Corona islandesa", code: "ISK", symbol: "kr" },
  { country: "Israel", currencyName: "Nuevo séquel", code: "ILS", symbol: "₪" },
  { country: "Italia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Jamaica", currencyName: "Dólar jamaiquino", code: "JMD", symbol: "$" },
  { country: "Japón", currencyName: "Yen", code: "JPY", symbol: "¥" },
  { country: "Jordania", currencyName: "Dinar jordano", code: "JOD", symbol: "د.ا" },
  { country: "Kazajistán", currencyName: "Tenge", code: "KZT", symbol: "₸" },
  { country: "Kenia", currencyName: "Chelín keniano", code: "KES", symbol: "KSh" },
  { country: "Kirguistán", currencyName: "Som", code: "KGS", symbol: "с" },
  { country: "Kuwait", currencyName: "Dinar kuwaití", code: "KWD", symbol: "د.ك" },
  { country: "Laos", currencyName: "Kip", code: "LAK", symbol: "₭" },
  { country: "Lesoto", currencyName: "Loti", code: "LSL", symbol: "L" },
  { country: "Lesoto", currencyName: "Rand", code: "ZAR", symbol: "R" },
  { country: "Letonia", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Líbano", currencyName: "Libra libanesa", code: "LBP", symbol: "ل.ل" },
  { country: "Liberia", currencyName: "Dólar liberiano", code: "LRD", symbol: "$" },
  { country: "Libia", currencyName: "Dinar libio", code: "LYD", symbol: "ل.د" },
  { country: "Lituania", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Luxemburgo", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Macedonia del Norte", currencyName: "Denar", code: "MKD", symbol: "ден" },
  { country: "Madagascar", currencyName: "Ariary", code: "MGA", symbol: "Ar" },
  { country: "Malasia", currencyName: "Ringgit", code: "MYR", symbol: "RM" },
  { country: "Malaui", currencyName: "Kwacha", code: "MWK", symbol: "MK" },
  { country: "Maldivas", currencyName: "Rufiyaa", code: "MVR", symbol: "Rf" },
  { country: "Malí", currencyName: "Franco CFA BCEAO", code: "XOF", symbol: "Fr" },
  { country: "Malta", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Marruecos", currencyName: "Dirham marroquí", code: "MAD", symbol: "د.م." },
  { country: "Mauricio", currencyName: "Rupia mauriciana", code: "MUR", symbol: "₨" },
  { country: "Mauritania", currencyName: "Ouguiya", code: "MRU", symbol: "UM" },
  { country: "México", currencyName: "Peso mexicano", code: "MXN", symbol: "$" },
  { country: "Moldavia", currencyName: "Leu moldavo", code: "MDL", symbol: "L" },
  { country: "Mónaco", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Mongolia", currencyName: "Tugrik", code: "MNT", symbol: "₮" },
  { country: "Montenegro", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Mozambique", currencyName: "Metical", code: "MZN", symbol: "MT" },
  { country: "Myanmar", currencyName: "Kyat", code: "MMK", symbol: "K" },
  { country: "Namibia", currencyName: "Dólar namibio", code: "NAD", symbol: "$" },
  { country: "Nepal", currencyName: "Rupia nepalesa", code: "NPR", symbol: "₨" },
  { country: "Nicaragua", currencyName: "Córdoba", code: "NIO", symbol: "C$" },
  { country: "Níger", currencyName: "Franco CFA BCEAO", code: "XOF", symbol: "Fr" },
  { country: "Nigeria", currencyName: "Naira", code: "NGN", symbol: "₦" },
  { country: "Noruega", currencyName: "Corona noruega", code: "NOK", symbol: "kr" },
  { country: "Nueva Zelanda", currencyName: "Dólar neozelandés", code: "NZD", symbol: "$" },
  { country: "Omán", currencyName: "Rial omaní", code: "OMR", symbol: "﷼" },
  { country: "Países Bajos", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Pakistán", currencyName: "Rupia pakistaní", code: "PKR", symbol: "₨" },
  { country: "Panamá", currencyName: "Balboa", code: "PAB", symbol: "B/." },
  { country: "Panamá", currencyName: "Dólar estadounidense", code: "USD", symbol: "$" },
  { country: "Paraguay", currencyName: "Guaraní", code: "PYG", symbol: "₲" },
  { country: "Perú", currencyName: "Sol", code: "PEN", symbol: "S/" },
  { country: "Polonia", currencyName: "Złoty", code: "PLN", symbol: "zł" },
  { country: "Portugal", currencyName: "Euro", code: "EUR", symbol: "€" },
  { country: "Qatar", currencyName: "Riyal catarí", code: "QAR", symbol: "﷼" },
  { country: "Reino Unido", currencyName: "Libra esterlina", code: "GBP", symbol: "£" },
  { country: "República Checa", currencyName: "Corona checa", code: "CZK", symbol: "Kč" },
  { country: "República Dominicana", currencyName: "Peso dominicano", code: "DOP", symbol: "RD$" },
  { country: "Rumanía", currencyName: "Leu rumano", code: "RON", symbol: "lei" },
  { country: "Rusia", currencyName: "Rublo", code: "RUB", symbol: "₽" },
  { country: "Ruanda", currencyName: "Franco ruandés", code: "RWF", symbol: "Fr" },
  { country: "Senegal", currencyName: "Franco CFA BCEAO", code: "XOF", symbol: "Fr" },
  { country: "Serbia", currencyName: "Dinar serbio", code: "RSD", symbol: "дин." },
  { country: "Singapur", currencyName: "Dólar singapurense", code: "SGD", symbol: "$" },
  { country: "Siria", currencyName: "Libra siria", code: "SYP", symbol: "£" },
  { country: "Sri Lanka", currencyName: "Rupia de Sri Lanka", code: "LKR", symbol: "₨" },
  { country: "Sudáfrica", currencyName: "Rand", code: "ZAR", symbol: "R" },
  { country: "Suecia", currencyName: "Corona sueca", code: "SEK", symbol: "kr" },
  { country: "Suiza", currencyName: "Franco suizo", code: "CHF", symbol: "Fr" },
  { country: "Tailandia", currencyName: "Baht", code: "THB", symbol: "฿" },
  { country: "Tanzania", currencyName: "Chelín tanzano", code: "TZS", symbol: "Sh" },
  { country: "Túnez", currencyName: "Dinar tunecino", code: "TND", symbol: "د.ت" },
  { country: "Turquía", currencyName: "Lira turca", code: "TRY", symbol: "₺" },
  { country: "Ucrania", currencyName: "Grivna", code: "UAH", symbol: "₴" },
  { country: "Uganda", currencyName: "Chelín ugandés", code: "UGX", symbol: "USh" },
  { country: "Uruguay", currencyName: "Peso uruguayo", code: "UYU", symbol: "$" },
  { country: "Uzbekistán", currencyName: "Som uzbeko", code: "UZS", symbol: "so'm" },
  { country: "Venezuela", currencyName: "Bolívar digital", code: "VES", symbol: "Bs." },
  { country: "Vietnam", currencyName: "Dong", code: "VND", symbol: "₫" },
  { country: "Yemen", currencyName: "Rial yemení", code: "YER", symbol: "﷼" },
  { country: "Zambia", currencyName: "Kwacha zambiano", code: "ZMW", symbol: "ZK" },
  { country: "Zimbabue", currencyName: "Dólar zimbabuense", code: "ZWL", symbol: "$" },
];

const VALID_CODES = new Set(COUNTRY_CURRENCY_LIST.map((entry) => entry.code));
const VALID_COUNTRIES = new Set(COUNTRY_CURRENCY_LIST.map((entry) => entry.country));

export const DEFAULT_COUNTRY = "España";
export const DEFAULT_CURRENCY_CODE = "EUR";

let currentCurrencyCode = DEFAULT_CURRENCY_CODE;

export function getCountryCurrencyOptions() {
  const seen = new Set<string>();
  return COUNTRY_CURRENCY_LIST.map((entry) => ({
    id: `${entry.country}-${entry.code}-${entry.currencyName}`,
    country: entry.country,
    currencyName: entry.currencyName,
    code: entry.code,
    symbol: entry.symbol,
  })).filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

export function isSupportedCurrencyCode(code: unknown): code is string {
  return typeof code === "string" && VALID_CODES.has(code);
}

export function isSupportedCountry(country: unknown): country is string {
  return typeof country === "string" && VALID_COUNTRIES.has(country);
}

export function resolveCurrencyCodeFromCountry(country?: string, fallbackCode: string = DEFAULT_CURRENCY_CODE): string {
  if (!country) return fallbackCode;
  const match = COUNTRY_CURRENCY_LIST.find((entry) => entry.country === country);
  return match?.code ?? fallbackCode;
}

export function getCurrentCurrencyCode(): string {
  return currentCurrencyCode;
}

export function setCurrentCurrencyCode(code: string) {
  currentCurrencyCode = isSupportedCurrencyCode(code) ? code : DEFAULT_CURRENCY_CODE;
}

export function getCurrencySymbol(code: string): string {
  const match = COUNTRY_CURRENCY_LIST.find((entry) => entry.code === code);
  if (match?.symbol) return match.symbol;
  return (0)
    .toLocaleString("es-ES", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/[0\s.,\u00A0]/g, "");
}
