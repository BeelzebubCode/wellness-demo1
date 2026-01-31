// prisma/seed-data/departments.ts

import { universitiesData } from "./universities"; 

export type UniversityCode = (typeof universitiesData)[number]["code"];

export type DepartmentSeed = {
  university_code: UniversityCode;
  faculty_code: string;
  department_code: string;
  department_name_th: string;
  department_name_en?: string; // แนะนำให้ optional
};


export const departmentsData: DepartmentSeed[] = [
  // =========================================================
  // CU 
  // =========================================================
  { university_code: "CU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "สาขาวิชาพืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "CU", faculty_code: "AGR", department_code: "AGR_ANSC", department_name_th: "สาขาวิชาสัตวศาสตร์", department_name_en: "Animal Science" },
  { university_code: "CU", faculty_code: "AGR", department_code: "AGR_FISH", department_name_th: "สาขาวิชาประมง", department_name_en: "Fisheries" },
  { university_code: "CU", faculty_code: "AGR", department_code: "AGR_FOOD", department_name_th: "สาขาวิชาเทคโนโลยีอาหาร", department_name_en: "Food Technology" },
  { university_code: "CU", faculty_code: "AGR", department_code: "AGR_NRES", department_name_th: "สาขาวิชาทรัพยากรธรรมชาติและสิ่งแวดล้อม", department_name_en: "Natural Resources & Environment" },
  { university_code: "CU", faculty_code: "ART", department_code: "ART_ENG", department_name_th: "ภาควิชาภาษาอังกฤษ", department_name_en: "English" },
  { university_code: "CU", faculty_code: "ART", department_code: "ART_FRE", department_name_th: "ภาควิชาภาษาฝรั่งเศส", department_name_en: "French" },
  { university_code: "CU", faculty_code: "ART", department_code: "ART_HIS", department_name_th: "ภาควิชาประวัติศาสตร์", department_name_en: "History" },
  { university_code: "CU", faculty_code: "ART", department_code: "ART_LING", department_name_th: "ภาควิชาภาษาศาสตร์", department_name_en: "Linguistics" },
  { university_code: "CU", faculty_code: "ART", department_code: "ART_PHIL", department_name_th: "ภาควิชาปรัชญา", department_name_en: "Philosophy" },
  { university_code: "CU", faculty_code: "ART", department_code: "ART_THAI", department_name_th: "ภาควิชาภาษาไทย", department_name_en: "Thai" },
  { university_code: "CU", faculty_code: "BBA", department_code: "BBA_ACC", department_name_th: "ภาควิชาการบัญชี", department_name_en: "Accounting" },
  { university_code: "CU", faculty_code: "BBA", department_code: "BBA_ECON", department_name_th: "ภาควิชาเศรษฐศาสตร์ธุรกิจ", department_name_en: "Business Economics" },
  { university_code: "CU", faculty_code: "BBA", department_code: "BBA_FIN", department_name_th: "ภาควิชาการเงิน", department_name_en: "Finance" },
  { university_code: "CU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "ภาควิชาการจัดการ", department_name_en: "Management" },
  { university_code: "CU", faculty_code: "BBA", department_code: "BBA_MIS", department_name_th: "ภาควิชาระบบสารสนเทศทางธุรกิจ", department_name_en: "Business Information Systems" },
  { university_code: "CU", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "ภาควิชาการตลาด", department_name_en: "Marketing" },
  { university_code: "CU", faculty_code: "COM", department_code: "COM_ADV", department_name_th: "ภาควิชาโฆษณา", department_name_en: "Advertising" },
  { university_code: "CU", faculty_code: "COM", department_code: "COM_DGM", department_name_th: "ภาควิชาสื่อดิจิทัล", department_name_en: "Digital Media" },
  { university_code: "CU", faculty_code: "COM", department_code: "COM_FILM", department_name_th: "ภาควิชาภาพยนตร์และภาพนิ่ง", department_name_en: "Film & Photography" },
  { university_code: "CU", faculty_code: "COM", department_code: "COM_JOUR", department_name_th: "ภาควิชาวารสารสนเทศ", department_name_en: "Journalism" },
  { university_code: "CU", faculty_code: "COM", department_code: "COM_PR", department_name_th: "ภาควิชาประชาสัมพันธ์", department_name_en: "Public Relations" },
  { university_code: "CU", faculty_code: "CS", department_code: "CS_AI", department_name_th: "ภาควิชาปัญญาประดิษฐ์", department_name_en: "Artificial Intelligence" },
  { university_code: "CU", faculty_code: "CS", department_code: "CS_CS", department_name_th: "ภาควิชาวิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "CU", faculty_code: "CS", department_code: "CS_CYB", department_name_th: "ภาควิชาความมั่นคงปลอดภัยไซเบอร์", department_name_en: "Cybersecurity" },
  { university_code: "CU", faculty_code: "CS", department_code: "CS_DS", department_name_th: "ภาควิชาวิทยาการข้อมูล", department_name_en: "Data Science" },
  { university_code: "CU", faculty_code: "CS", department_code: "CS_SE", department_name_th: "ภาควิชาวิศวกรรมซอฟต์แวร์", department_name_en: "Software Engineering" },
  { university_code: "CU", faculty_code: "DEN", department_code: "DEN_DEN", department_name_th: "ภาควิชาทันตแพทยศาสตร์", department_name_en: "Dentistry" },
  { university_code: "CU", faculty_code: "DEN", department_code: "DEN_ORAL", department_name_th: "ภาควิชาทันตกรรมประดิษฐ์และบูรณะ", department_name_en: "Prosthodontics & Restorative" },
  { university_code: "CU", faculty_code: "DEN", department_code: "DEN_PEDS", department_name_th: "ภาควิชาทันตกรรมเด็ก", department_name_en: "Pediatric Dentistry" },
  { university_code: "CU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "ภาควิชาหลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "CU", faculty_code: "EDU", department_code: "EDU_EDPS", department_name_th: "ภาควิชาจิตวิทยาการศึกษา", department_name_en: "Educational Psychology" },
  { university_code: "CU", faculty_code: "EDU", department_code: "EDU_EDTC", department_name_th: "ภาควิชาเทคโนโลยีการศึกษา", department_name_en: "Educational Technology" },
  { university_code: "CU", faculty_code: "EDU", department_code: "EDU_MEAS", department_name_th: "ภาควิชาวัดผลและวิจัยการศึกษา", department_name_en: "Educational Measurement & Research" },
  { university_code: "CU", faculty_code: "EDU", department_code: "EDU_PED", department_name_th: "ภาควิชาพลศึกษาและสุขศึกษา", department_name_en: "Physical & Health Education" },
  { university_code: "CU", faculty_code: "ENG", department_code: "ENG_CHE", department_name_th: "ภาควิชาวิศวกรรมเคมี", department_name_en: "Chemical Engineering" },
  { university_code: "CU", faculty_code: "ENG", department_code: "ENG_CIV", department_name_th: "ภาควิชาวิศวกรรมโยธา", department_name_en: "Civil Engineering" },
  { university_code: "CU", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "ภาควิชาวิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "CU", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "ภาควิชาวิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "CU", faculty_code: "ENG", department_code: "ENG_IND", department_name_th: "ภาควิชาวิศวกรรมอุตสาหการ", department_name_en: "Industrial Engineering" },
  { university_code: "CU", faculty_code: "ENG", department_code: "ENG_MEC", department_name_th: "ภาควิชาวิศวกรรมเครื่องกล", department_name_en: "Mechanical Engineering" },
  { university_code: "CU", faculty_code: "LAW", department_code: "LAW_INT", department_name_th: "ภาควิชากฎหมายระหว่างประเทศ", department_name_en: "International Law" },
  { university_code: "CU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "ภาควิชากฎหมาย", department_name_en: "Law" },
  { university_code: "CU", faculty_code: "LAW", department_code: "LAW_PRI", department_name_th: "ภาควิชากฎหมายเอกชน", department_name_en: "Private Law" },
  { university_code: "CU", faculty_code: "LAW", department_code: "LAW_PUB", department_name_th: "ภาควิชากฎหมายมหาชน", department_name_en: "Public Law" },
  { university_code: "CU", faculty_code: "MED", department_code: "MED_BMSC", department_name_th: "ภาควิชาวิทยาศาสตร์การแพทย์พื้นฐาน", department_name_en: "Basic Medical Sciences" },
  { university_code: "CU", faculty_code: "MED", department_code: "MED_CLIN", department_name_th: "ภาควิชาเวชศาสตร์คลินิก", department_name_en: "Clinical Medicine" },
  { university_code: "CU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "ภาควิชาแพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "CU", faculty_code: "NUR", department_code: "NUR_COMN", department_name_th: "ภาควิชาพยาบาลชุมชน", department_name_en: "Community Nursing" },
  { university_code: "CU", faculty_code: "NUR", department_code: "NUR_MHN", department_name_th: "ภาควิชาพยาบาลจิตเวช", department_name_en: "Psychiatric Nursing" },
  { university_code: "CU", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "ภาควิชาพยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "CU", faculty_code: "PHA", department_code: "PHA_PHAR", department_name_th: "ภาควิชาเภสัชศาสตร์", department_name_en: "Pharmacy" },
  { university_code: "CU", faculty_code: "PHA", department_code: "PHA_PHCH", department_name_th: "ภาควิชาเคมีเภสัชกรรม", department_name_en: "Pharmaceutical Chemistry" },
  { university_code: "CU", faculty_code: "PHA", department_code: "PHA_PHCL", department_name_th: "ภาควิชาเภสัชวิทยาและพิษวิทยา", department_name_en: "Pharmacology & Toxicology" },
  { university_code: "CU", faculty_code: "POL", department_code: "POL_IR", department_name_th: "ภาควิชาความสัมพันธ์ระหว่างประเทศ", department_name_en: "International Relations" },
  { university_code: "CU", faculty_code: "POL", department_code: "POL_PA", department_name_th: "ภาควิชารัฐประศาสนศาสตร์", department_name_en: "Public Administration" },
  { university_code: "CU", faculty_code: "POL", department_code: "POL_POLS", department_name_th: "ภาควิชาการเมืองการปกครอง", department_name_en: "Politics and Government" },
  { university_code: "CU", faculty_code: "POL", department_code: "POL_PP", department_name_th: "ภาควิชานโยบายสาธารณะ", department_name_en: "Public Policy" },
  { university_code: "CU", faculty_code: "SCI", department_code: "SCI_BIOL", department_name_th: "ภาควิชาชีววิทยา", department_name_en: "Biology" },
  { university_code: "CU", faculty_code: "SCI", department_code: "SCI_CHEM", department_name_th: "ภาควิชาเคมี", department_name_en: "Chemistry" },
  { university_code: "CU", faculty_code: "SCI", department_code: "SCI_ENV", department_name_th: "ภาควิชาวิทยาศาสตร์สิ่งแวดล้อม", department_name_en: "Environmental Science" },
  { university_code: "CU", faculty_code: "SCI", department_code: "SCI_MATH", department_name_th: "ภาควิชาคณิตศาสตร์", department_name_en: "Mathematics" },
  { university_code: "CU", faculty_code: "SCI", department_code: "SCI_PHYS", department_name_th: "ภาควิชาฟิสิกส์", department_name_en: "Physics" },
  { university_code: "CU", faculty_code: "SCI", department_code: "SCI_STAT", department_name_th: "ภาควิชาสถิติ", department_name_en: "Statistics" },
  { university_code: "CU", faculty_code: "SPH", department_code: "SPH_ENVH", department_name_th: "ภาควิชาอนามัยสิ่งแวดล้อม", department_name_en: "Environmental Health" },
  { university_code: "CU", faculty_code: "SPH", department_code: "SPH_EPI", department_name_th: "ภาควิชาระบาดวิทยา", department_name_en: "Epidemiology" },
  { university_code: "CU", faculty_code: "SPH", department_code: "SPH_HPM", department_name_th: "ภาควิชาส่งเสริมสุขภาพ", department_name_en: "Health Promotion" },
  { university_code: "CU", faculty_code: "SPH", department_code: "SPH_PH", department_name_th: "ภาควิชาสาธารณสุขศาสตร์", department_name_en: "Public Health" },
  { university_code: "CU", faculty_code: "SRV", department_code: "SRV_HOSP", department_name_th: "สาขาวิชาการโรงแรม", department_name_en: "Hospitality" },
  { university_code: "CU", faculty_code: "SRV", department_code: "SRV_MICE", department_name_th: "สาขาวิชาการจัดการอีเวนต์และไมซ์", department_name_en: "Event & MICE Management" },
  { university_code: "CU", faculty_code: "SRV", department_code: "SRV_SERV", department_name_th: "สาขาวิชาการจัดการบริการ", department_name_en: "Service Management" },
  { university_code: "CU", faculty_code: "SRV", department_code: "SRV_TOUR", department_name_th: "สาขาวิชาการท่องเที่ยว", department_name_en: "Tourism" },

  // =========================================================
  //  KKU 
  // =========================================================
  { university_code: "KKU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "สาขาวิชาพืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "KKU", faculty_code: "AGR", department_code: "AGR_ANSC", department_name_th: "สาขาวิชาสัตวศาสตร์", department_name_en: "Animal Science" },
  { university_code: "KKU", faculty_code: "AGR", department_code: "AGR_FISH", department_name_th: "สาขาวิชาประมง", department_name_en: "Fisheries" },
  { university_code: "KKU", faculty_code: "AGR", department_code: "AGR_FOOD", department_name_th: "สาขาวิชาเทคโนโลยีอาหาร", department_name_en: "Food Technology" },
  { university_code: "KKU", faculty_code: "AGR", department_code: "AGR_NRES", department_name_th: "สาขาวิชาทรัพยากรธรรมชาติและสิ่งแวดล้อม", department_name_en: "Natural Resources & Environment" },
  { university_code: "KKU", faculty_code: "BBA", department_code: "BBA_ACC", department_name_th: "ภาควิชาการบัญชี", department_name_en: "Accounting" },
  { university_code: "KKU", faculty_code: "BBA", department_code: "BBA_ECON", department_name_th: "ภาควิชาเศรษฐศาสตร์ธุรกิจ", department_name_en: "Business Economics" },
  { university_code: "KKU", faculty_code: "BBA", department_code: "BBA_FIN", department_name_th: "ภาควิชาการเงิน", department_name_en: "Finance" },
  { university_code: "KKU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "ภาควิชาการจัดการ", department_name_en: "Management" },
  { university_code: "KKU", faculty_code: "BBA", department_code: "BBA_MIS", department_name_th: "ภาควิชาระบบสารสนเทศทางธุรกิจ", department_name_en: "Business Information Systems" },
  { university_code: "KKU", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "ภาควิชาการตลาด", department_name_en: "Marketing" },
  { university_code: "KKU", faculty_code: "CS", department_code: "CS_AI", department_name_th: "ภาควิชาปัญญาประดิษฐ์", department_name_en: "Artificial Intelligence" },
  { university_code: "KKU", faculty_code: "CS", department_code: "CS_CS", department_name_th: "ภาควิชาวิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "KKU", faculty_code: "CS", department_code: "CS_CYB", department_name_th: "ภาควิชาความมั่นคงปลอดภัยไซเบอร์", department_name_en: "Cybersecurity" },
  { university_code: "KKU", faculty_code: "CS", department_code: "CS_DS", department_name_th: "ภาควิชาวิทยาการข้อมูล", department_name_en: "Data Science" },
  { university_code: "KKU", faculty_code: "CS", department_code: "CS_SE", department_name_th: "ภาควิชาวิศวกรรมซอฟต์แวร์", department_name_en: "Software Engineering" },
  { university_code: "KKU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "ภาควิชาหลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "KKU", faculty_code: "EDU", department_code: "EDU_EDPS", department_name_th: "ภาควิชาจิตวิทยาการศึกษา", department_name_en: "Educational Psychology" },
  { university_code: "KKU", faculty_code: "EDU", department_code: "EDU_EDTC", department_name_th: "ภาควิชาเทคโนโลยีการศึกษา", department_name_en: "Educational Technology" },
  { university_code: "KKU", faculty_code: "EDU", department_code: "EDU_MEAS", department_name_th: "ภาควิชาวัดผลและวิจัยการศึกษา", department_name_en: "Educational Measurement & Research" },
  { university_code: "KKU", faculty_code: "EDU", department_code: "EDU_PED", department_name_th: "ภาควิชาพลศึกษาและสุขศึกษา", department_name_en: "Physical & Health Education" },
  { university_code: "KKU", faculty_code: "ENG", department_code: "ENG_CHE", department_name_th: "ภาควิชาวิศวกรรมเคมี", department_name_en: "Chemical Engineering" },
  { university_code: "KKU", faculty_code: "ENG", department_code: "ENG_CIV", department_name_th: "ภาควิชาวิศวกรรมโยธา", department_name_en: "Civil Engineering" },
  { university_code: "KKU", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "ภาควิชาวิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "KKU", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "ภาควิชาวิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "KKU", faculty_code: "ENG", department_code: "ENG_IND", department_name_th: "ภาควิชาวิศวกรรมอุตสาหการ", department_name_en: "Industrial Engineering" },
  { university_code: "KKU", faculty_code: "ENG", department_code: "ENG_MEC", department_name_th: "ภาควิชาวิศวกรรมเครื่องกล", department_name_en: "Mechanical Engineering" },
  { university_code: "KKU", faculty_code: "HUS", department_code: "HUS_COM", department_name_th: "สาขาวิชานิเทศศาสตร์", department_name_en: "Communication" },
  { university_code: "KKU", faculty_code: "HUS", department_code: "HUS_ENG", department_name_th: "สาขาวิชาภาษาอังกฤษ", department_name_en: "English" },
  { university_code: "KKU", faculty_code: "HUS", department_code: "HUS_HIS", department_name_th: "สาขาวิชาประวัติศาสตร์", department_name_en: "History" },
  { university_code: "KKU", faculty_code: "HUS", department_code: "HUS_PSY", department_name_th: "สาขาวิชาจิตวิทยา", department_name_en: "Psychology" },
  { university_code: "KKU", faculty_code: "HUS", department_code: "HUS_SOC", department_name_th: "สาขาวิชาสังคมวิทยาและมานุษยวิทยา", department_name_en: "Sociology & Anthropology" },
  { university_code: "KKU", faculty_code: "HUS", department_code: "HUS_THAI", department_name_th: "สาขาวิชาภาษาไทย", department_name_en: "Thai" },
  { university_code: "KKU", faculty_code: "LAW", department_code: "LAW_INT", department_name_th: "ภาควิชากฎหมายระหว่างประเทศ", department_name_en: "International Law" },
  { university_code: "KKU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "ภาควิชากฎหมาย", department_name_en: "Law" },
  { university_code: "KKU", faculty_code: "LAW", department_code: "LAW_PRI", department_name_th: "ภาควิชากฎหมายเอกชน", department_name_en: "Private Law" },
  { university_code: "KKU", faculty_code: "LAW", department_code: "LAW_PUB", department_name_th: "ภาควิชากฎหมายมหาชน", department_name_en: "Public Law" },
  { university_code: "KKU", faculty_code: "MED", department_code: "MED_BMSC", department_name_th: "ภาควิชาวิทยาศาสตร์การแพทย์พื้นฐาน", department_name_en: "Basic Medical Sciences" },
  { university_code: "KKU", faculty_code: "MED", department_code: "MED_CLIN", department_name_th: "ภาควิชาเวชศาสตร์คลินิก", department_name_en: "Clinical Medicine" },
  { university_code: "KKU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "ภาควิชาแพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "KKU", faculty_code: "NUR", department_code: "NUR_COMN", department_name_th: "ภาควิชาพยาบาลชุมชน", department_name_en: "Community Nursing" },
  { university_code: "KKU", faculty_code: "NUR", department_code: "NUR_MHN", department_name_th: "ภาควิชาพยาบาลจิตเวช", department_name_en: "Psychiatric Nursing" },
  { university_code: "KKU", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "ภาควิชาพยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "KKU", faculty_code: "PHA", department_code: "PHA_PHAR", department_name_th: "ภาควิชาเภสัชศาสตร์", department_name_en: "Pharmacy" },
  { university_code: "KKU", faculty_code: "PHA", department_code: "PHA_PHCH", department_name_th: "ภาควิชาเคมีเภสัชกรรม", department_name_en: "Pharmaceutical Chemistry" },
  { university_code: "KKU", faculty_code: "PHA", department_code: "PHA_PHCL", department_name_th: "ภาควิชาเภสัชวิทยาและพิษวิทยา", department_name_en: "Pharmacology & Toxicology" },
  { university_code: "KKU", faculty_code: "SCI", department_code: "SCI_BIOL", department_name_th: "ภาควิชาชีววิทยา", department_name_en: "Biology" },
  { university_code: "KKU", faculty_code: "SCI", department_code: "SCI_CHEM", department_name_th: "ภาควิชาเคมี", department_name_en: "Chemistry" },
  { university_code: "KKU", faculty_code: "SCI", department_code: "SCI_ENV", department_name_th: "ภาควิชาวิทยาศาสตร์สิ่งแวดล้อม", department_name_en: "Environmental Science" },
  { university_code: "KKU", faculty_code: "SCI", department_code: "SCI_MATH", department_name_th: "ภาควิชาคณิตศาสตร์", department_name_en: "Mathematics" },
  { university_code: "KKU", faculty_code: "SCI", department_code: "SCI_PHYS", department_name_th: "ภาควิชาฟิสิกส์", department_name_en: "Physics" },
  { university_code: "KKU", faculty_code: "SCI", department_code: "SCI_STAT", department_name_th: "ภาควิชาสถิติ", department_name_en: "Statistics" },
  { university_code: "KKU", faculty_code: "SOC", department_code: "SOC_ANTH", department_name_th: "สาขาวิชามานุษยวิทยา", department_name_en: "Anthropology" },
  { university_code: "KKU", faculty_code: "SOC", department_code: "SOC_DEV", department_name_th: "สาขาวิชาพัฒนาสังคม", department_name_en: "Social Development" },
  { university_code: "KKU", faculty_code: "SOC", department_code: "SOC_PA", department_name_th: "สาขาวิชารัฐประศาสนศาสตร์", department_name_en: "Public Administration" },
  { university_code: "KKU", faculty_code: "SOC", department_code: "SOC_PSY", department_name_th: "สาขาวิชาจิตวิทยา", department_name_en: "Psychology" },
  { university_code: "KKU", faculty_code: "SOC", department_code: "SOC_SOC", department_name_th: "สาขาวิชาสังคมวิทยา", department_name_en: "Sociology" },
  { university_code: "KKU", faculty_code: "SPH", department_code: "SPH_ENVH", department_name_th: "ภาควิชาอนามัยสิ่งแวดล้อม", department_name_en: "Environmental Health" },
  { university_code: "KKU", faculty_code: "SPH", department_code: "SPH_EPI", department_name_th: "ภาควิชาระบาดวิทยา", department_name_en: "Epidemiology" },
  { university_code: "KKU", faculty_code: "SPH", department_code: "SPH_HPM", department_name_th: "ภาควิชาส่งเสริมสุขภาพ", department_name_en: "Health Promotion" },
  { university_code: "KKU", faculty_code: "SPH", department_code: "SPH_PH", department_name_th: "ภาควิชาสาธารณสุขศาสตร์", department_name_en: "Public Health" },
  { university_code: "KKU", faculty_code: "SRV", department_code: "SRV_HOSP", department_name_th: "สาขาวิชาการโรงแรม", department_name_en: "Hospitality" },
  { university_code: "KKU", faculty_code: "SRV", department_code: "SRV_MICE", department_name_th: "สาขาวิชาการจัดการอีเวนต์และไมซ์", department_name_en: "Event & MICE Management" },
  { university_code: "KKU", faculty_code: "SRV", department_code: "SRV_SERV", department_name_th: "สาขาวิชาการจัดการบริการ", department_name_en: "Service Management" },
  { university_code: "KKU", faculty_code: "SRV", department_code: "SRV_TOUR", department_name_th: "สาขาวิชาการท่องเที่ยว", department_name_en: "Tourism" },

  // =========================================================
  //  NU
  // =========================================================
  { university_code: "NU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "สาขาวิชาพืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "NU", faculty_code: "AGR", department_code: "AGR_ANSC", department_name_th: "สาขาวิชาสัตวศาสตร์", department_name_en: "Animal Science" },
  { university_code: "NU", faculty_code: "AGR", department_code: "AGR_FISH", department_name_th: "สาขาวิชาประมง", department_name_en: "Fisheries" },
  { university_code: "NU", faculty_code: "AGR", department_code: "AGR_FOOD", department_name_th: "สาขาวิชาเทคโนโลยีอาหาร", department_name_en: "Food Technology" },
  { university_code: "NU", faculty_code: "AGR", department_code: "AGR_NRES", department_name_th: "สาขาวิชาทรัพยากรธรรมชาติและสิ่งแวดล้อม", department_name_en: "Natural Resources & Environment" },
  { university_code: "NU", faculty_code: "BIZ", department_code: "BIZ_ACC", department_name_th: "สาขาวิชาการบัญชี", department_name_en: "Accounting" },
  { university_code: "NU", faculty_code: "BIZ", department_code: "BIZ_ECON", department_name_th: "สาขาวิชาเศรษฐศาสตร์", department_name_en: "Economics" },
  { university_code: "NU", faculty_code: "BIZ", department_code: "BIZ_FIN", department_name_th: "สาขาวิชาการเงิน", department_name_en: "Finance" },
  { university_code: "NU", faculty_code: "BIZ", department_code: "BIZ_MGT", department_name_th: "สาขาวิชาการจัดการ", department_name_en: "Management" },
  { university_code: "NU", faculty_code: "BIZ", department_code: "BIZ_MIS", department_name_th: "สาขาวิชาระบบสารสนเทศเพื่อการจัดการ", department_name_en: "Management Information Systems" },
  { university_code: "NU", faculty_code: "BIZ", department_code: "BIZ_MKT", department_name_th: "สาขาวิชาการตลาด", department_name_en: "Marketing" },
  { university_code: "NU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "ภาควิชาหลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "NU", faculty_code: "EDU", department_code: "EDU_EDPS", department_name_th: "ภาควิชาจิตวิทยาการศึกษา", department_name_en: "Educational Psychology" },
  { university_code: "NU", faculty_code: "EDU", department_code: "EDU_EDTC", department_name_th: "ภาควิชาเทคโนโลยีการศึกษา", department_name_en: "Educational Technology" },
  { university_code: "NU", faculty_code: "EDU", department_code: "EDU_MEAS", department_name_th: "ภาควิชาวัดผลและวิจัยการศึกษา", department_name_en: "Educational Measurement & Research" },
  { university_code: "NU", faculty_code: "EDU", department_code: "EDU_PED", department_name_th: "ภาควิชาพลศึกษาและสุขศึกษา", department_name_en: "Physical & Health Education" },
  { university_code: "NU", faculty_code: "ENG", department_code: "ENG_CHE", department_name_th: "ภาควิชาวิศวกรรมเคมี", department_name_en: "Chemical Engineering" },
  { university_code: "NU", faculty_code: "ENG", department_code: "ENG_CIV", department_name_th: "ภาควิชาวิศวกรรมโยธา", department_name_en: "Civil Engineering" },
  { university_code: "NU", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "ภาควิชาวิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "NU", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "ภาควิชาวิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "NU", faculty_code: "ENG", department_code: "ENG_IND", department_name_th: "ภาควิชาวิศวกรรมอุตสาหการ", department_name_en: "Industrial Engineering" },
  { university_code: "NU", faculty_code: "ENG", department_code: "ENG_MEC", department_name_th: "ภาควิชาวิศวกรรมเครื่องกล", department_name_en: "Mechanical Engineering" },
  { university_code: "NU", faculty_code: "HUM", department_code: "HUM_ENG", department_name_th: "สาขาวิชาภาษาอังกฤษ", department_name_en: "English" },
  { university_code: "NU", faculty_code: "HUM", department_code: "HUM_HIS", department_name_th: "สาขาวิชาประวัติศาสตร์", department_name_en: "History" },
  { university_code: "NU", faculty_code: "HUM", department_code: "HUM_JPN", department_name_th: "สาขาวิชาภาษาญี่ปุ่น", department_name_en: "Japanese" },
  { university_code: "NU", faculty_code: "HUM", department_code: "HUM_LING", department_name_th: "สาขาวิชาภาษาศาสตร์", department_name_en: "Linguistics" },
  { university_code: "NU", faculty_code: "HUM", department_code: "HUM_PHIL", department_name_th: "สาขาวิชาปรัชญา", department_name_en: "Philosophy" },
  { university_code: "NU", faculty_code: "HUM", department_code: "HUM_THAI", department_name_th: "สาขาวิชาภาษาไทย", department_name_en: "Thai" },
  { university_code: "NU", faculty_code: "ICT", department_code: "ICT_CS", department_name_th: "สาขาวิชาวิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "NU", faculty_code: "ICT", department_code: "ICT_CYB", department_name_th: "สาขาวิชาความมั่นคงปลอดภัยไซเบอร์", department_name_en: "Cybersecurity" },
  { university_code: "NU", faculty_code: "ICT", department_code: "ICT_DS", department_name_th: "สาขาวิชาวิทยาการข้อมูล", department_name_en: "Data Science" },
  { university_code: "NU", faculty_code: "ICT", department_code: "ICT_IS", department_name_th: "สาขาวิชาระบบสารสนเทศ", department_name_en: "Information Systems" },
  { university_code: "NU", faculty_code: "ICT", department_code: "ICT_SE", department_name_th: "สาขาวิชาวิศวกรรมซอฟต์แวร์", department_name_en: "Software Engineering" },
  { university_code: "NU", faculty_code: "LAW", department_code: "LAW_INT", department_name_th: "ภาควิชากฎหมายระหว่างประเทศ", department_name_en: "International Law" },
  { university_code: "NU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "ภาควิชากฎหมาย", department_name_en: "Law" },
  { university_code: "NU", faculty_code: "LAW", department_code: "LAW_PRI", department_name_th: "ภาควิชากฎหมายเอกชน", department_name_en: "Private Law" },
  { university_code: "NU", faculty_code: "LAW", department_code: "LAW_PUB", department_name_th: "ภาควิชากฎหมายมหาชน", department_name_en: "Public Law" },
  { university_code: "NU", faculty_code: "MED", department_code: "MED_BMSC", department_name_th: "ภาควิชาวิทยาศาสตร์การแพทย์พื้นฐาน", department_name_en: "Basic Medical Sciences" },
  { university_code: "NU", faculty_code: "MED", department_code: "MED_CLIN", department_name_th: "ภาควิชาเวชศาสตร์คลินิก", department_name_en: "Clinical Medicine" },
  { university_code: "NU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "ภาควิชาแพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "NU", faculty_code: "NUR", department_code: "NUR_COMN", department_name_th: "ภาควิชาพยาบาลชุมชน", department_name_en: "Community Nursing" },
  { university_code: "NU", faculty_code: "NUR", department_code: "NUR_MHN", department_name_th: "ภาควิชาพยาบาลจิตเวช", department_name_en: "Psychiatric Nursing" },
  { university_code: "NU", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "ภาควิชาพยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "NU", faculty_code: "PHT", department_code: "PHT_EPI", department_name_th: "ภาควิชาระบาดวิทยา", department_name_en: "Epidemiology" },
  { university_code: "NU", faculty_code: "PHT", department_code: "PHT_HPM", department_name_th: "ภาควิชาส่งเสริมสุขภาพ", department_name_en: "Health Promotion" },
  { university_code: "NU", faculty_code: "PHT", department_code: "PHT_PH", department_name_th: "ภาควิชาสาธารณสุขศาสตร์", department_name_en: "Public Health" },
  { university_code: "NU", faculty_code: "SCI", department_code: "SCI_BIOL", department_name_th: "ภาควิชาชีววิทยา", department_name_en: "Biology" },
  { university_code: "NU", faculty_code: "SCI", department_code: "SCI_CHEM", department_name_th: "ภาควิชาเคมี", department_name_en: "Chemistry" },
  { university_code: "NU", faculty_code: "SCI", department_code: "SCI_ENV", department_name_th: "ภาควิชาวิทยาศาสตร์สิ่งแวดล้อม", department_name_en: "Environmental Science" },
  { university_code: "NU", faculty_code: "SCI", department_code: "SCI_MATH", department_name_th: "ภาควิชาคณิตศาสตร์", department_name_en: "Mathematics" },
  { university_code: "NU", faculty_code: "SCI", department_code: "SCI_PHYS", department_name_th: "ภาควิชาฟิสิกส์", department_name_en: "Physics" },
  { university_code: "NU", faculty_code: "SCI", department_code: "SCI_STAT", department_name_th: "ภาควิชาสถิติ", department_name_en: "Statistics" },
  { university_code: "NU", faculty_code: "SOC", department_code: "SOC_ANTH", department_name_th: "สาขาวิชามานุษยวิทยา", department_name_en: "Anthropology" },
  { university_code: "NU", faculty_code: "SOC", department_code: "SOC_DEV", department_name_th: "สาขาวิชาพัฒนาสังคม", department_name_en: "Social Development" },
  { university_code: "NU", faculty_code: "SOC", department_code: "SOC_PA", department_name_th: "สาขาวิชารัฐประศาสนศาสตร์", department_name_en: "Public Administration" },
  { university_code: "NU", faculty_code: "SOC", department_code: "SOC_PSY", department_name_th: "สาขาวิชาจิตวิทยา", department_name_en: "Psychology" },
  { university_code: "NU", faculty_code: "SOC", department_code: "SOC_SOC", department_name_th: "สาขาวิชาสังคมวิทยา", department_name_en: "Sociology" },
  { university_code: "NU", faculty_code: "SRV", department_code: "SRV_HOSP", department_name_th: "สาขาวิชาการโรงแรม", department_name_en: "Hospitality" },
  { university_code: "NU", faculty_code: "SRV", department_code: "SRV_MICE", department_name_th: "สาขาวิชาการจัดการอีเวนต์และไมซ์", department_name_en: "Event & MICE Management" },
  { university_code: "NU", faculty_code: "SRV", department_code: "SRV_SERV", department_name_th: "สาขาวิชาการจัดการบริการ", department_name_en: "Service Management" },
  { university_code: "NU", faculty_code: "SRV", department_code: "SRV_TOUR", department_name_th: "สาขาวิชาการท่องเที่ยว", department_name_en: "Tourism" },

  // =========================================================
  // TU — Thammasat University
  // =========================================================
  { university_code: "TU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "นิติศาสตร์", department_name_en: "Law" },
  { university_code: "TU", faculty_code: "POL", department_code: "POL_POLS", department_name_th: "รัฐศาสตร์", department_name_en: "Political Science" },
  { university_code: "TU", faculty_code: "ECO", department_code: "ECO_ECON", department_name_th: "เศรษฐศาสตร์", department_name_en: "Economics" },
  { university_code: "TU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "TU", faculty_code: "JOU", department_code: "JOU_JOUR", department_name_th: "วารสารศาสตร์", department_name_en: "Journalism" },
  { university_code: "TU", faculty_code: "SOC", department_code: "SOC_SOC", department_name_th: "สังคมวิทยา", department_name_en: "Sociology" },
  { university_code: "TU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "TU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },

  // =========================================================
  // MU — Mahidol University
  // =========================================================
  { university_code: "MU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "MU", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "พยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "MU", faculty_code: "PHA", department_code: "PHA_PHAR", department_name_th: "เภสัชศาสตร์", department_name_en: "Pharmacy" },
  { university_code: "MU", faculty_code: "SCI", department_code: "SCI_BIOL", department_name_th: "ชีววิทยา", department_name_en: "Biology" },
  { university_code: "MU", faculty_code: "SCI", department_code: "SCI_CHEM", department_name_th: "เคมี", department_name_en: "Chemistry" },
  { university_code: "MU", faculty_code: "ICT", department_code: "ICT_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "MU", faculty_code: "PHT", department_code: "PHT_PH", department_name_th: "สาธารณสุขศาสตร์", department_name_en: "Public Health" },
  { university_code: "MU", faculty_code: "PSY", department_code: "PSY_PSY", department_name_th: "จิตวิทยา", department_name_en: "Psychology" },

  // =========================================================
  // KU — Kasetsart University
  // =========================================================
  { university_code: "KU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "พืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "KU", faculty_code: "AGR", department_code: "AGR_ANSC", department_name_th: "สัตวศาสตร์", department_name_en: "Animal Science" },
  { university_code: "KU", faculty_code: "AGR", department_code: "AGR_FISH", department_name_th: "ประมง", department_name_en: "Fisheries" },
  { university_code: "KU", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "วิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "KU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "KU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  // SU — Silpakorn University
  // =========================================================
  { university_code: "SU", faculty_code: "ART", department_code: "ART_FINE", department_name_th: "ศิลปกรรม", department_name_en: "Fine Arts" },
  { university_code: "SU", faculty_code: "ART", department_code: "ART_DES", department_name_th: "ออกแบบ", department_name_en: "Design" },
  { university_code: "SU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "SU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  // SWU — Srinakharinwirot University
  // =========================================================
  { university_code: "SWU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "SWU", faculty_code: "SOC", department_code: "SOC_PSY", department_name_th: "จิตวิทยา", department_name_en: "Psychology" },
  { university_code: "SWU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "SWU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },

  // =========================================================
  // RU — Ramkhamhaeng University
  // =========================================================
  { university_code: "RU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "นิติศาสตร์", department_name_en: "Law" },
  { university_code: "RU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "RU", faculty_code: "HUM", department_code: "HUM_THAI", department_name_th: "ภาษาไทย", department_name_en: "Thai" },
  { university_code: "RU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },

  // =========================================================
  // NIDA — National Institute of Development Administration
  // =========================================================
  { university_code: "NIDA", faculty_code: "PAD", department_code: "PAD_PA", department_name_th: "รัฐประศาสนศาสตร์", department_name_en: "Public Administration" },
  { university_code: "NIDA", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "NIDA", faculty_code: "ECO", department_code: "ECO_ECON", department_name_th: "เศรษฐศาสตร์", department_name_en: "Economics" },
  { university_code: "NIDA", faculty_code: "ICT", department_code: "ICT_IS", department_name_th: "ระบบสารสนเทศ", department_name_en: "Information Systems" },

  // =========================================================
  // KMUTT — King Mongkut's University of Technology Thonburi
  // =========================================================
  { university_code: "KMUTT", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "วิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "KMUTT", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "วิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "KMUTT", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "KMUTT", faculty_code: "IT", department_code: "IT_SE", department_name_th: "วิศวกรรมซอฟต์แวร์", department_name_en: "Software Engineering" },

  // =========================================================
  // KMITL — King Mongkut's Institute of Technology Ladkrabang
  // =================================================================
  { university_code: "KMITL", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "วิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "KMITL", faculty_code: "ENG", department_code: "ENG_TEL", department_name_th: "วิศวกรรมโทรคมนาคม", department_name_en: "Telecommunications Engineering" },
  { university_code: "KMITL", faculty_code: "SCI", department_code: "SCI_DS", department_name_th: "วิทยาการข้อมูล", department_name_en: "Data Science" },
  { university_code: "KMITL", faculty_code: "IT", department_code: "IT_CS", department_name_th: "เทคโนโลยีสารสนเทศ", department_name_en: "Information Technology" },

  // =========================================================
  // KMUTNB — King Mongkut's University of Technology North Bangkok
  // =========================================================
  { university_code: "KMUTNB", faculty_code: "ENG", department_code: "ENG_MEC", department_name_th: "วิศวกรรมเครื่องกล", department_name_en: "Mechanical Engineering" },
  { university_code: "KMUTNB", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "วิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "KMUTNB", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "วิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "KMUTNB", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },

  // =========================================================
  // CMU — Chiang Mai University
  // =========================================================
  { university_code: "CMU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "CMU", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "วิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "CMU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "CMU", faculty_code: "HUM", department_code: "HUM_ENG", department_name_th: "ภาษาอังกฤษ", department_name_en: "English" },

  // =========================================================
  // MFU — Mae Fah Luang University
  // =========================================================
  { university_code: "MFU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "MFU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "นิติศาสตร์", department_name_en: "Law" },
  { university_code: "MFU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "MFU", faculty_code: "PHT", department_code: "PHT_PH", department_name_th: "สาธารณสุขศาสตร์", department_name_en: "Public Health" },

  // =========================================================
  // MJU — Maejo University
  // =========================================================
  { university_code: "MJU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "พืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "MJU", faculty_code: "AGR", department_code: "AGR_ANSC", department_name_th: "สัตวศาสตร์", department_name_en: "Animal Science" },
  { university_code: "MJU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "MJU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },

  // =========================================================
  // UP — University of Phayao
  // =========================================================
  { university_code: "UP", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "UP", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "พยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "UP", faculty_code: "ICT", department_code: "ICT_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "UP", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  // BUU — Burapha University
  // =========================================================
  { university_code: "BUU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "BUU", faculty_code: "ENG", department_code: "ENG_CIV", department_name_th: "วิศวกรรมโยธา", department_name_en: "Civil Engineering" },
  { university_code: "BUU", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "การตลาด", department_name_en: "Marketing" },
  { university_code: "BUU", faculty_code: "COM", department_code: "COM_COMM", department_name_th: "นิเทศศาสตร์", department_name_en: "Communication" },

  // =========================================================
  // PSU — Prince of Songkla University
  // =========================================================
  { university_code: "PSU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "PSU", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "วิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "PSU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "PSU", faculty_code: "PHT", department_code: "PHT_PH", department_name_th: "สาธารณสุขศาสตร์", department_name_en: "Public Health" },

  // =========================================================
  // WU — Walailak University
  // =========================================================
  { university_code: "WU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "WU", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "พยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "WU", faculty_code: "ICT", department_code: "ICT_SE", department_name_th: "วิศวกรรมซอฟต์แวร์", department_name_en: "Software Engineering" },
  { university_code: "WU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  // TSU — Thaksin University
  // =========================================================
  { university_code: "TSU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "TSU", faculty_code: "HUM", department_code: "HUM_THAI", department_name_th: "ภาษาไทย", department_name_en: "Thai" },
  { university_code: "TSU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "TSU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  // Rajabhat — SRRU, BRU, CRRU, CMRU, KPRU (ชุดแกนกลาง)
  // =========================================================
  // SRRU
  { university_code: "SRRU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "SRRU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "SRRU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "SRRU", faculty_code: "HUM", department_code: "HUM_ENG", department_name_th: "ภาษาอังกฤษ", department_name_en: "English" },

  // BRU
  { university_code: "BRU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "BRU", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "การตลาด", department_name_en: "Marketing" },
  { university_code: "BRU", faculty_code: "SCI", department_code: "SCI_IT", department_name_th: "เทคโนโลยีสารสนเทศ", department_name_en: "Information Technology" },
  { university_code: "BRU", faculty_code: "HUM", department_code: "HUM_THAI", department_name_th: "ภาษาไทย", department_name_en: "Thai" },

  // CRRU
  { university_code: "CRRU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "CRRU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "CRRU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "CRRU", faculty_code: "HUM", department_code: "HUM_ENG", department_name_th: "ภาษาอังกฤษ", department_name_en: "English" },

  // CMRU
  { university_code: "CMRU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "CMRU", faculty_code: "BBA", department_code: "BBA_ACC", department_name_th: "การบัญชี", department_name_en: "Accounting" },
  { university_code: "CMRU", faculty_code: "SCI", department_code: "SCI_IT", department_name_th: "เทคโนโลยีสารสนเทศ", department_name_en: "Information Technology" },
  { university_code: "CMRU", faculty_code: "HUM", department_code: "HUM_TOUR", department_name_th: "การท่องเที่ยว", department_name_en: "Tourism" },

  // KPRU
  { university_code: "KPRU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "KPRU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "KPRU", faculty_code: "SCI", department_code: "SCI_IT", department_name_th: "เทคโนโลยีสารสนเทศ", department_name_en: "Information Technology" },
  { university_code: "KPRU", faculty_code: "HUM", department_code: "HUM_ENG", department_name_th: "ภาษาอังกฤษ", department_name_en: "English" },

  // =========================================================
  // Private — BU, SPU, UTCC, RSU, ABAC (ชุดแกนกลาง)
  // =========================================================
  // BU — Bangkok University
  { university_code: "BU", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "การตลาด", department_name_en: "Marketing" },
  { university_code: "BU", faculty_code: "COM", department_code: "COM_COMM", department_name_th: "นิเทศศาสตร์", department_name_en: "Communication" },
  { university_code: "BU", faculty_code: "IT", department_code: "IT_SE", department_name_th: "วิศวกรรมซอฟต์แวร์", department_name_en: "Software Engineering" },
  { university_code: "BU", faculty_code: "HOS", department_code: "HOS_HOSP", department_name_th: "การโรงแรม", department_name_en: "Hospitality" },

  // SPU — Sripatum University
  { university_code: "SPU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "SPU", faculty_code: "IT", department_code: "IT_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "SPU", faculty_code: "LAW", department_code: "LAW_LAW", department_name_th: "นิติศาสตร์", department_name_en: "Law" },
  { university_code: "SPU", faculty_code: "COM", department_code: "COM_DGM", department_name_th: "สื่อดิจิทัล", department_name_en: "Digital Media" },

  // UTCC — University of the Thai Chamber of Commerce
  { university_code: "UTCC", faculty_code: "BBA", department_code: "BBA_ACC", department_name_th: "การบัญชี", department_name_en: "Accounting" },
  { university_code: "UTCC", faculty_code: "BBA", department_code: "BBA_FIN", department_name_th: "การเงิน", department_name_en: "Finance" },
  { university_code: "UTCC", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "การตลาด", department_name_en: "Marketing" },
  { university_code: "UTCC", faculty_code: "IT", department_code: "IT_BI", department_name_th: "ธุรกิจดิจิทัล/ข้อมูลธุรกิจ", department_name_en: "Business Intelligence" },

  // RSU — Rangsit University
  { university_code: "RSU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "RSU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "RSU", faculty_code: "IT", department_code: "IT_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "RSU", faculty_code: "COM", department_code: "COM_COMM", department_name_th: "นิเทศศาสตร์", department_name_en: "Communication" },

  // ABAC — Assumption University
  { university_code: "ABAC", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },
  { university_code: "ABAC", faculty_code: "BBA", department_code: "BBA_FIN", department_name_th: "การเงิน", department_name_en: "Finance" },
  { university_code: "ABAC", faculty_code: "IT", department_code: "IT_IS", department_name_th: "ระบบสารสนเทศ", department_name_en: "Information Systems" },
  { university_code: "ABAC", faculty_code: "COM", department_code: "COM_BA", department_name_th: "การสื่อสารธุรกิจ", department_name_en: "Business Communication" },

    // =========================================================
  //  MSU — Mahasarakham University
  // =========================================================
  { university_code: "MSU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "MSU", faculty_code: "HUS", department_code: "HUS_ENG", department_name_th: "ภาษาอังกฤษ", department_name_en: "English" },
  { university_code: "MSU", faculty_code: "HUS", department_code: "HUS_PSY", department_name_th: "จิตวิทยา", department_name_en: "Psychology" },
  { university_code: "MSU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "MSU", faculty_code: "SCI", department_code: "SCI_STAT", department_name_th: "สถิติ", department_name_en: "Statistics" },
  { university_code: "MSU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  //  SURO — Suranaree University of Technology
  // =========================================================
  { university_code: "SURO", faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "วิศวกรรมคอมพิวเตอร์", department_name_en: "Computer Engineering" },
  { university_code: "SURO", faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "วิศวกรรมไฟฟ้า", department_name_en: "Electrical Engineering" },
  { university_code: "SURO", faculty_code: "ENG", department_code: "ENG_MEC", department_name_th: "วิศวกรรมเครื่องกล", department_name_en: "Mechanical Engineering" },
  { university_code: "SURO", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "SURO", faculty_code: "SCI", department_code: "SCI_DS", department_name_th: "วิทยาการข้อมูล", department_name_en: "Data Science" },
  { university_code: "SURO", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "การจัดการเทคโนโลยี/บริหารธุรกิจ", department_name_en: "Technology Management / Business" },

  // =========================================================
  //  UBU — Ubon Ratchathani University
  // =========================================================
  { university_code: "UBU", faculty_code: "MED", department_code: "MED_MD", department_name_th: "แพทยศาสตร์", department_name_en: "Medicine" },
  { university_code: "UBU", faculty_code: "NUR", department_code: "NUR_NUR", department_name_th: "พยาบาลศาสตร์", department_name_en: "Nursing" },
  { university_code: "UBU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "UBU", faculty_code: "SCI", department_code: "SCI_BIOL", department_name_th: "ชีววิทยา", department_name_en: "Biology" },
  { university_code: "UBU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "พืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "UBU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  //  NPU — Nakhon Phanom University
  // =========================================================
  { university_code: "NPU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "NPU", faculty_code: "HUS", department_code: "HUS_ENG", department_name_th: "ภาษาอังกฤษ", department_name_en: "English" },
  { university_code: "NPU", faculty_code: "SCI", department_code: "SCI_IT", department_name_th: "เทคโนโลยีสารสนเทศ", department_name_en: "Information Technology" },
  { university_code: "NPU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "NPU", faculty_code: "PHT", department_code: "PHT_PH", department_name_th: "สาธารณสุขศาสตร์", department_name_en: "Public Health" },
  { university_code: "NPU", faculty_code: "BBA", department_code: "BBA_MGT", department_name_th: "บริหารธุรกิจ", department_name_en: "Business Administration" },

  // =========================================================
  //  KSU — Kalasin University
  // =========================================================
  { university_code: "KSU", faculty_code: "EDU", department_code: "EDU_CURI", department_name_th: "หลักสูตรและการสอน", department_name_en: "Curriculum and Instruction" },
  { university_code: "KSU", faculty_code: "HUS", department_code: "HUS_THAI", department_name_th: "ภาษาไทย", department_name_en: "Thai" },
  { university_code: "KSU", faculty_code: "SCI", department_code: "SCI_IT", department_name_th: "เทคโนโลยีสารสนเทศ", department_name_en: "Information Technology" },
  { university_code: "KSU", faculty_code: "SCI", department_code: "SCI_CS", department_name_th: "วิทยาการคอมพิวเตอร์", department_name_en: "Computer Science" },
  { university_code: "KSU", faculty_code: "AGR", department_code: "AGR_AGRO", department_name_th: "พืชศาสตร์", department_name_en: "Agronomy" },
  { university_code: "KSU", faculty_code: "BBA", department_code: "BBA_MKT", department_name_th: "การตลาด", department_name_en: "Marketing" },
];