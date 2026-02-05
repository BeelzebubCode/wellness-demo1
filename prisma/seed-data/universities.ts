// prisma/seed-data/universities.ts

export const universitiesData = [
  // ==========================================
  // 🟦 กลุ่มที่ 1: มหาวิทยาลัยในกำกับของรัฐ
  // ==========================================
  { code: "MCU", th: "มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย", en: "Mahachulalongkornrajavidyalaya University", province_code: "BKK", is_active: true },
  { code: "MBU", th: "มหาวิทยาลัยมหามกุฏราชวิทยาลัย", en: "Mahamakut Buddhist University", province_code: "NPT", is_active: true },
  { code: "SDU", th: "มหาวิทยาลัยสวนดุสิต", en: "Suan Dusit University", province_code: "BKK", is_active: true },
  { code: "PGVIM", th: "สถาบันดนตรีกัลยาณิวัฒนา", en: "Princess Galyani Vadhana Institute of Music", province_code: "BKK", is_active: true },
  { code: "SNC", th: "สถาบันการพยาบาลศรีสวรินทิรา สภากาชาดไทย", en: "Srisavarindhira Thai Red Cross Institute of Nursing", province_code: "BKK", is_active: true },
  { code: "CDTI", th: "สถาบันเทคโนโลยีจิตรลดา", en: "Chitralada Technology Institute", province_code: "BKK", is_active: true },

  // ==========================================
  // 🟨 กลุ่มที่ 2: มหาวิทยาลัยของรัฐ
  // ==========================================
  { code: "KSU", th: "มหาวิทยาลัยกาฬสินธุ์", en: "Kalasin University", province_code: "KSN", is_active: true },
  { code: "NARU", th: "มหาวิทยาลัยนราธิวาสราชนครินทร์", en: "Princess of Naradhiwas University", province_code: "NWT", is_active: true },
  { code: "STOU", th: "มหาวิทยาลัยสุโขทัยธรรมาธิราช", en: "Sukhothai Thammathirat Open University", province_code: "NBI", is_active: true },
  { code: "PTIT", th: "สถาบันเทคโนโลยีปทุมวัน", en: "Pathumwan Institute of Technology", province_code: "BKK", is_active: true },
  { code: "IICC", th: "สถาบันวิทยาลัยชุมชน", en: "Institute of Community Colleges", province_code: "BKK", is_active: true },

  // --- ราชภัฏ ---
  { code: "KRU", th: "มหาวิทยาลัยราชภัฏกาญจนบุรี", en: "Kanchanaburi Rajabhat University", province_code: "KCB", is_active: true }, // KRI -> KCB
  { code: "KPRU", th: "มหาวิทยาลัยราชภัฏกำแพงเพชร", en: "Kamphaeng Phet Rajabhat University", province_code: "KPT", is_active: true },
  { code: "CRU", th: "มหาวิทยาลัยราชภัฏจันทรเกษม", en: "Chandrakasem Rajabhat University", province_code: "BKK", is_active: true },
  { code: "CPRU", th: "มหาวิทยาลัยราชภัฏชัยภูมิ", en: "Chaiyaphum Rajabhat University", province_code: "CYP", is_active: true }, // CPM -> CYP
  { code: "CRRU", th: "มหาวิทยาลัยราชภัฏเชียงราย", en: "Chiang Rai Rajabhat University", province_code: "CRI", is_active: true },
  { code: "CMRU", th: "มหาวิทยาลัยราชภัฏเชียงใหม่", en: "Chiang Mai Rajabhat University", province_code: "CNX", is_active: true },
  { code: "TSRU", th: "มหาวิทยาลัยราชภัฏเทพสตรี", en: "Thepsatri Rajabhat University", province_code: "LBY", is_active: true }, // LRI -> LBY
  { code: "DRU", th: "มหาวิทยาลัยราชภัฏธนบุรี", en: "Dhonburi Rajabhat University", province_code: "BKK", is_active: true },
  { code: "NPRU", th: "มหาวิทยาลัยราชภัฏนครปฐม", en: "Nakhon Pathom Rajabhat University", province_code: "NPT", is_active: true },
  { code: "NRRU", th: "มหาวิทยาลัยราชภัฏนครราชสีมา", en: "Nakhon Ratchasima Rajabhat University", province_code: "NRM", is_active: true }, // NMA -> NRM
  { code: "NSTRU", th: "มหาวิทยาลัยราชภัฏนครศรีธรรมราช", en: "Nakhon Si Thammarat Rajabhat University", province_code: "NST", is_active: true },
  { code: "NSRU", th: "มหาวิทยาลัยราชภัฏนครสวรรค์", en: "Nakhon Sawan Rajabhat University", province_code: "NSN", is_active: true },
  { code: "BSRU", th: "มหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา", en: "Bansomdejchaopraya Rajabhat University", province_code: "BKK", is_active: true },
  { code: "BRU", th: "มหาวิทยาลัยราชภัฏบุรีรัมย์", en: "Buriram Rajabhat University", province_code: "BRM", is_active: true },
  { code: "PNRU", th: "มหาวิทยาลัยราชภัฏพระนคร", en: "Phranakhon Rajabhat University", province_code: "BKK", is_active: true },
  { code: "PRU", th: "มหาวิทยาลัยราชภัฏพระนครศรีอยุธยา", en: "Phranakhon Si Ayutthaya Rajabhat University", province_code: "AYA", is_active: true }, // AYT -> AYA
  { code: "PSRU", th: "มหาวิทยาลัยราชภัฏพิบูลสงคราม", en: "Pibulsongkram Rajabhat University", province_code: "PHS", is_active: true }, // PLK -> PHS
  { code: "PBRU", th: "มหาวิทยาลัยราชภัฏเพชรบุรี", en: "Phetchaburi Rajabhat University", province_code: "PBI", is_active: true },
  { code: "PBRU-PH", th: "มหาวิทยาลัยราชภัฏเพชรบูรณ์", en: "Phetchabun Rajabhat University", province_code: "PCB", is_active: true }, // PNB -> PCB
  { code: "PKRU", th: "มหาวิทยาลัยราชภัฏภูเก็ต", en: "Phuket Rajabhat University", province_code: "PSN", is_active: true }, // PKT -> PSN
  { code: "MSRU", th: "มหาวิทยาลัยราชภัฏมหาสารคาม", en: "Rajabhat Maha Sarakham University", province_code: "MKM", is_active: true },
  { code: "YRU", th: "มหาวิทยาลัยราชภัฏยะลา", en: "Yala Rajabhat University", province_code: "YLA", is_active: true },
  { code: "RERU", th: "มหาวิทยาลัยราชภัฏร้อยเอ็ด", en: "Roi Et Rajabhat University", province_code: "RET", is_active: true },
  { code: "RRU", th: "มหาวิทยาลัยราชภัฏราชนครินทร์", en: "Rajabhat Rajanagarindra University", province_code: "CCO", is_active: true },
  { code: "RBRU", th: "มหาวิทยาลัยราชภัฏรำไพพรรณี", en: "Rambhai Barni Rajabhat University", province_code: "CTI", is_active: true },
  { code: "LPRU", th: "มหาวิทยาลัยราชภัฏลำปาง", en: "Lampang Rajabhat University", province_code: "LPG", is_active: true },
  { code: "LPRU-LY", th: "มหาวิทยาลัยราชภัฏเลย", en: "Loei Rajabhat University", province_code: "LEI", is_active: true },
  { code: "VRU", th: "มหาวิทยาลัยราชภัฏวไลยอลงกรณ์ ในพระบรมราชูปถัมภ์", en: "Valaya Alongkorn Rajabhat University", province_code: "PTE", is_active: true },
  { code: "SSRU", th: "มหาวิทยาลัยราชภัฏศรีสะเกษ", en: "Sisaket Rajabhat University", province_code: "SSK", is_active: true },
  { code: "SNKRU", th: "มหาวิทยาลัยราชภัฏสกลนคร", en: "Sakon Nakhon Rajabhat University", province_code: "SNK", is_active: true },
  { code: "SKRU", th: "มหาวิทยาลัยราชภัฏสงขลา", en: "Songkhla Rajabhat University", province_code: "SKA", is_active: true },
  { code: "SSRU-SUAN", th: "มหาวิทยาลัยราชภัฏสวนสุนันทา", en: "Suan Sunandha Rajabhat University", province_code: "BKK", is_active: true },
  { code: "SRU", th: "มหาวิทยาลัยราชภัฏสุราษฎร์ธานี", en: "Suratthani Rajabhat University", province_code: "SRT", is_active: true }, // SNI -> SRT
  { code: "SRRU", th: "มหาวิทยาลัยราชภัฏสุรินทร์", en: "Surindra Rajabhat University", province_code: "SRN", is_active: true },
  { code: "MCRU", th: "มหาวิทยาลัยราชภัฏหมู่บ้านจอมบึง", en: "Muban Chombueng Rajabhat University", province_code: "RBR", is_active: true },
  { code: "UDRU", th: "มหาวิทยาลัยราชภัฏอุดรธานี", en: "Udon Thani Rajabhat University", province_code: "UDN", is_active: true },
  { code: "URU", th: "มหาวิทยาลัยราชภัฏอุตรดิตถ์", en: "Uttaradit Rajabhat University", province_code: "UTT", is_active: true }, // UTD -> UTT
  { code: "UBRU", th: "มหาวิทยาลัยราชภัฏอุบลราชธานี", en: "Ubon Ratchathani Rajabhat University", province_code: "UBN", is_active: true },

  // --- ราชมงคล ---
  { code: "RMUTK", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ", en: "Rajamangala University of Technology Krungthep", province_code: "BKK", is_active: true },
  { code: "RMUTTO", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก", en: "Rajamangala University of Technology Tawan-ok", province_code: "CBI", is_active: true },
  { code: "RMUTT", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี", en: "Rajamangala University of Technology Thanyaburi", province_code: "PTE", is_active: true },
  { code: "RMUTP", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร", en: "Rajamangala University of Technology Phra Nakhon", province_code: "BKK", is_active: true },
  { code: "RMUTR", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์", en: "Rajamangala University of Technology Rattanakosin", province_code: "NPT", is_active: true },
  { code: "RMUTL", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา", en: "Rajamangala University of Technology Lanna", province_code: "CNX", is_active: true },
  { code: "RMUTSV", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย", en: "Rajamangala University of Technology Srivijaya", province_code: "SKA", is_active: true },
  { code: "RMUTSB", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลสุวรรณภูมิ", en: "Rajamangala University of Technology Suvarnabhumi", province_code: "AYA", is_active: true }, // AYT -> AYA
  { code: "RMUTI", th: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน", en: "Rajamangala University of Technology Isan", province_code: "NRM", is_active: true }, // NMA -> NRM

  // ==========================================
  // 🟪 กลุ่มที่ 3: มหาวิทยาลัยเอกชน / สถาบัน / วิทยาลัย
  // ==========================================
  { code: "BUI", th: "มหาวิทยาลัยกรุงเทพธนบุรี", en: "Bangkok Thonburi University", province_code: "BKK", is_active: true },
  { code: "BUS", th: "มหาวิทยาลัยกรุงเทพสุวรรณภูมิ", en: "Bangkok Suvarnabhumi University", province_code: "BKK", is_active: true },
  { code: "EUMT", th: "มหาวิทยาลัยการจัดการและเทคโนโลยีอีสเทิร์น", en: "The Eastern University of Management and Technology", province_code: "UBN", is_active: true },
  { code: "KRIRK", th: "มหาวิทยาลัยเกริก", en: "Krirk University", province_code: "BKK", is_active: true },
  { code: "KBU", th: "มหาวิทยาลัยเกษมบัณฑิต", en: "Kasem Bundit University", province_code: "BKK", is_active: true },
  { code: "CUT", th: "มหาวิทยาลัยคริสเตียน", en: "Christian University of Thailand", province_code: "NPT", is_active: true },
  { code: "CPU", th: "มหาวิทยาลัยเจ้าพระยา", en: "Chaopraya University", province_code: "NSN", is_active: true },
  { code: "CUK", th: "มหาวิทยาลัยเฉลิมกาญจนา", en: "Chalermkarnchana University", province_code: "SSK", is_active: true },
  { code: "SIU", th: "มหาวิทยาลัยชินวัตร", en: "Shinawatra University", province_code: "PTE", is_active: true },
  { code: "SJU", th: "มหาวิทยาลัยเซนต์จอห์น", en: "Saint John's University", province_code: "BKK", is_active: true },
  { code: "TAPU", th: "มหาวิทยาลัยตาปี", en: "Tapee University", province_code: "SRT", is_active: true }, // SNI -> SRT
  { code: "MUT", th: "มหาวิทยาลัยเทคโนโลยีมหานคร", en: "Mahanakorn University of Technology", province_code: "BKK", is_active: true },
  { code: "TBAC", th: "มหาวิทยาลัยธนบุรี", en: "Thonburi University", province_code: "BKK", is_active: true },
  { code: "DPU", th: "มหาวิทยาลัยธุรกิจบัณฑิตย์", en: "Dhurakij Pundit University", province_code: "BKK", is_active: true },
  { code: "NBU", th: "มหาวิทยาลัยนอร์ทกรุงเทพ", en: "North Bangkok University", province_code: "BKK", is_active: true },
  { code: "NCU", th: "มหาวิทยาลัยนอร์ท-เชียงใหม่", en: "North-Chiang Mai University", province_code: "CNX", is_active: true },
  { code: "STIU", th: "มหาวิทยาลัยนานาชาติแสตมฟอร์ด", en: "Stamford International University", province_code: "BKK", is_active: true },
  { code: "AIU", th: "มหาวิทยาลัยนานาชาติเอเชีย-แปซิฟิก", en: "Asia-Pacific International University", province_code: "SRB", is_active: true }, // SRI -> SRB
  { code: "NATIONU", th: "มหาวิทยาลัยเนชั่น", en: "Nation University", province_code: "LPG", is_active: true },
  { code: "PTU", th: "มหาวิทยาลัยปทุมธานี", en: "Pathumthani University", province_code: "PTE", is_active: true },
  { code: "PYU", th: "มหาวิทยาลัยพายัพ", en: "Payap University", province_code: "CNX", is_active: true },
  { code: "PLU", th: "มหาวิทยาลัยพิษณุโลก", en: "Phitsanulok University", province_code: "PHS", is_active: true }, // PLK -> PHS
  { code: "FTU", th: "มหาวิทยาลัยฟาฏอนี", en: "Fatoni University", province_code: "PTN", is_active: true },
  { code: "FEU", th: "มหาวิทยาลัยฟาร์อีสเทอร์น", en: "The Far Eastern University", province_code: "CNX", is_active: true },
  { code: "CUI", th: "มหาวิทยาลัยภาคกลาง", en: "Central University", province_code: "NSN", is_active: true },
  { code: "NEU", th: "มหาวิทยาลัยภาคตะวันออกเฉียงเหนือ", en: "North Eastern University", province_code: "KKN", is_active: true },
  { code: "RBU", th: "มหาวิทยาลัยรัตนบัณฑิต", en: "Rattana Bundit University", province_code: "BKK", is_active: true },
  { code: "RTU", th: "มหาวิทยาลัยราชธานี", en: "Ratchathani University", province_code: "UBN", is_active: true },
  { code: "RPU", th: "มหาวิทยาลัยราชพฤกษ์", en: "Ratchaphruek University", province_code: "NBI", is_active: true },
  { code: "WUVC", th: "มหาวิทยาลัยวงษ์ชวลิตกุล", en: "Vongchavalitkul University", province_code: "NRM", is_active: true }, // NMA -> NRM
  { code: "WUT", th: "มหาวิทยาลัยเว็บสเตอร์ (ประเทศไทย)", en: "Webster University Thailand", province_code: "PBI", is_active: true },
  { code: "WUWEST", th: "มหาวิทยาลัยเวสเทิร์น", en: "Western University", province_code: "KCB", is_active: true }, // KRI -> KCB
  { code: "SIAMU", th: "มหาวิทยาลัยสยาม", en: "Siam University", province_code: "BKK", is_active: true },
  { code: "HCU", th: "มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ", en: "Huachiew Chalermprakiet University", province_code: "SPK", is_active: true },
  { code: "HATYAIU", th: "มหาวิทยาลัยหาดใหญ่", en: "Hatyai University", province_code: "SKA", is_active: true },
  { code: "EAU", th: "มหาวิทยาลัยอีสเทิร์นเอเชีย", en: "Eastern Asia University", province_code: "PTE", is_active: true },
  { code: "SAU", th: "มหาวิทยาลัยเอเชียอาคเนย์", en: "Southeast Asia University", province_code: "BKK", is_active: true },
  { code: "KANTANA", th: "สถาบันกันตนา", en: "Kantana Institute", province_code: "NPT", is_active: true },
  { code: "PIM", th: "สถาบันการจัดการปัญญาภิวัฒน์", en: "Panyapiwat Institute of Management", province_code: "NBI", is_active: true },
  { code: "PULINET", th: "สถาบันการเรียนรู้เพื่อปวงชน", en: "Learning Institute for Everyone", province_code: "RBR", is_active: true },
  { code: "TNI", th: "สถาบันเทคโนโลยีไทย-ญี่ปุ่น", en: "Thai-Nichi Institute of Technology", province_code: "BKK", is_active: true },
  { code: "MATI", th: "สถาบันเทคโนโลยียานยนต์มหาชัย", en: "Mahachai Automotive Technology Institute", province_code: "SMK", is_active: true }, // SKN -> SMK
  { code: "IST", th: "สถาบันเทคโนโลยีแห่งสุวรรณภูมิ", en: "Suvarnabhumi Institute of Technology", province_code: "SPK", is_active: true },
  { code: "AIE", th: "สถาบันวิทยาการประกอบการแห่งอโยธยา", en: "Ayothaya Institute", province_code: "AYA", is_active: true }, // AYT -> AYA
  { code: "RBAC", th: "สถาบันรัชต์ภาคย์", en: "Rajapark Institute", province_code: "BKK", is_active: true },
  { code: "VISTEC", th: "สถาบันวิทยสิริเมธี", en: "Vidyasirimedhi Institute of Science and Technology", province_code: "RYG", is_active: true },
  { code: "ARSOM", th: "สถาบันอาศรมศิลป์", en: "Arsom Silp Institute of the Arts", province_code: "BKK", is_active: true },
  { code: "CKRY", th: "วิทยาลัยเฉลิมกาญจนาระยอง", en: "Chalermkarnchana Rayong College", province_code: "RYG", is_active: true },
  { code: "CRC", th: "วิทยาลัยเชียงราย", en: "Chiang Rai College", province_code: "CRI", is_active: true },
  { code: "SLC", th: "วิทยาลัยเซนต์หลุยส์", en: "Saint Louis College", province_code: "BKK", is_active: true },
  { code: "SEBU", th: "วิทยาลัยเซาธ์อีสท์บางกอก", en: "Southeast Bangkok College", province_code: "BKK", is_active: true },
  { code: "DTC", th: "วิทยาลัยดุสิตธานี", en: "Dusit Thani College", province_code: "BKK", is_active: true },
  { code: "TSK", th: "วิทยาลัยทองสุข", en: "Thongsook College", province_code: "BKK", is_active: true },
  { code: "PWT", th: "วิทยาลัยเทคโนโลยีพนมวันท์", en: "Phanomwan College of Technology", province_code: "NRM", is_active: true }, // NMA -> NRM
  { code: "STC", th: "วิทยาลัยเทคโนโลยีภาคใต้", en: "Southern College of Technology", province_code: "NST", is_active: true },
  { code: "SIT", th: "วิทยาลัยเทคโนโลยีสยาม", en: "Siam Technology College", province_code: "BKK", is_active: true },
  { code: "NMC", th: "วิทยาลัยนครราชสีมา", en: "Nakhonratchasima College", province_code: "NRM", is_active: true }, // NMA -> NRM
  { code: "RIC", th: "วิทยาลัยนานาชาติราฟเฟิลส์", en: "Raffles International College", province_code: "BKK", is_active: true },
  { code: "STIC", th: "วิทยาลัยนานาชาติเซนต์เทเรซา", en: "St. Theresa International College", province_code: "NPT", is_active: true },
  { code: "BAC", th: "วิทยาลัยบัณฑิตเอเซีย", en: "College of Asian Scholars", province_code: "KKN", is_active: true },
  { code: "PBC", th: "วิทยาลัยพิชญบัณฑิต", en: "Pitchayabundit College", province_code: "NBL", is_active: true }, // NBP -> NBL
  { code: "IBSC", th: "วิทยาลัยพุทธศาสนานานาชาติ", en: "International Buddhist Studies College", province_code: "AYA", is_active: true }, // AYT -> AYA
  { code: "NC", th: "วิทยาลัยนอร์ทเทิร์น", en: "Northern College", province_code: "TAK", is_active: true },
  { code: "SANTAPOL", th: "วิทยาลัยสันตพล", en: "Santapol College", province_code: "UDN", is_active: true },
  { code: "SDC", th: "วิทยาลัยแสงธรรม", en: "Saengtham College", province_code: "NPT", is_active: true },
  { code: "INTERTECH", th: "วิทยาลัยอินเตอร์เทคลำปาง", en: "Intertech Lampang College", province_code: "LPG", is_active: true },

  // ==========================================
  // 🏢 เพิ่มเติม (ตัวหลักเดิมที่ไม่ซ้ำกับข้างบน)
  // ==========================================
  { code: "CU", th: "จุฬาลงกรณ์มหาวิทยาลัย", en: "Chulalongkorn University", province_code: "BKK", is_active: true },
  { code: "TU", th: "มหาวิทยาลัยธรรมศาสตร์", en: "Thammasat University", province_code: "BKK", is_active: true },
  { code: "MU", th: "มหาวิทยาลัยมหิดล", en: "Mahidol University", province_code: "NPT", is_active: true },
  { code: "KU", th: "มหาวิทยาลัยเกษตรศาสตร์", en: "Kasetsart University", province_code: "BKK", is_active: true },
  { code: "SU", th: "มหาวิทยาลัยศิลปากร", en: "Silpakorn University", province_code: "NPT", is_active: true },
  { code: "SWU", th: "มหาวิทยาลัยศรีนครินทรวิโรฒ", en: "Srinakharinwirot University", province_code: "BKK", is_active: true },
  { code: "RU", th: "มหาวิทยาลัยรามคำแหง", en: "Ramkhamhaeng University", province_code: "BKK", is_active: true },
  { code: "NIDA", th: "สถาบันบัณฑิตพัฒนบริหารศาสตร์", en: "National Institute of Development Administration", province_code: "BKK", is_active: true },
  { code: "KMUTT", th: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", en: "King Mongkut's University of Technology Thonburi", province_code: "BKK", is_active: true },
  { code: "KMITL", th: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง", en: "King Mongkut's Institute of Technology Ladkrabang", province_code: "BKK", is_active: true },
  { code: "KMUTNB", th: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ", en: "King Mongkut's University of Technology North Bangkok", province_code: "BKK", is_active: true },
  { code: "CMU", th: "มหาวิทยาลัยเชียงใหม่", en: "Chiang Mai University", province_code: "CNX", is_active: true },
  { code: "MFU", th: "มหาวิทยาลัยแม่ฟ้าหลวง", en: "Mae Fah Luang University", province_code: "CRI", is_active: true },
  { code: "MJU", th: "มหาวิทยาลัยแม่โจ้", en: "Maejo University", province_code: "CNX", is_active: true },
  { code: "UP", th: "มหาวิทยาลัยพะเยา", en: "University of Phayao", province_code: "PYO", is_active: true },
  { code: "NU", th: "มหาวิทยาลัยนเรศวร", en: "Naresuan University", province_code: "PHS", is_active: true },
  { code: "KKU", th: "มหาวิทยาลัยขอนแก่น", en: "Khon Kaen University", province_code: "KKN", is_active: true },
  { code: "MSU", th: "มหาวิทยาลัยมหาสารคาม", en: "Mahasarakham University", province_code: "MKM", is_active: true },
  { code: "SUT", th: "มหาวิทยาลัยเทคโนโลยีสุรนารี", en: "Suranaree University of Technology", province_code: "NRM", is_active: true }, // NMA -> NRM
  { code: "UBU", th: "มหาวิทยาลัยอุบลราชธานี", en: "Ubon Ratchathani University", province_code: "UBN", is_active: true },
  { code: "NPU", th: "มหาวิทยาลัยนครพนม", en: "Nakhon Phanom University", province_code: "NPM", is_active: true },
  { code: "BUU", th: "มหาวิทยาลัยบูรพา", en: "Burapha University", province_code: "CBI", is_active: true },
  { code: "PSU", th: "มหาวิทยาลัยสงขลานครินทร์", en: "Prince of Songkla University", province_code: "SKA", is_active: true },
  { code: "WU", th: "มหาวิทยาลัยวลัยลักษณ์", en: "Walailak University", province_code: "NST", is_active: true },
  { code: "TSU", th: "มหาวิทยาลัยทักษิณ", en: "Thaksin University", province_code: "SKA", is_active: true },
  { code: "BU", th: "มหาวิทยาลัยกรุงเทพ", en: "Bangkok University", province_code: "BKK", is_active: true },
  { code: "SPU", th: "มหาวิทยาลัยศรีปทุม", en: "Sripatum University", province_code: "BKK", is_active: true },
  { code: "UTCC", th: "มหาวิทยาลัยหอการค้าไทย", en: "University of the Thai Chamber of Commerce", province_code: "BKK", is_active: true },
  { code: "RSU", th: "มหาวิทยาลัยรังสิต", en: "Rangsit University", province_code: "NBI", is_active: true },
  { code: "ABAC", th: "มหาวิทยาลัยอัสสัมชัญ", en: "Assumption University", province_code: "BKK", is_active: true },
] as const;

export type UniversitySeedItem = (typeof universitiesData)[number];
export type UniversityCode = (typeof universitiesData)[number]["code"];
