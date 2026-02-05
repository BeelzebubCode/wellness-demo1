// prisma/seed-data/faculties.ts

import { universitiesData } from "./universities"; // ปรับ path ให้ตรง

export type UniversityCode = (typeof universitiesData)[number]["code"];

export type FacultySeed = {
  university_code: UniversityCode;   // ✅ รองรับทุกมหาลัย
  faculty_code: string;
  faculty_name_th: string;
  faculty_name_en?: string;
  /** Link to EducationFieldGroup via ISCED broad field code (e.g. "07" = Engineering) */
  isced_broad_field_code?: string;
};

export const facultiesData: FacultySeed[] = [
  // ================= NU =================
  { university_code: "NU", faculty_code: "EDU", faculty_name_th: "คณะศึกษาศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "NU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์", faculty_name_en: "Faculty of Humanities", isced_broad_field_code: "02" },
  { university_code: "NU", faculty_code: "SOC", faculty_name_th: "คณะสังคมศาสตร์", faculty_name_en: "Faculty of Social Sciences", isced_broad_field_code: "03" },
  { university_code: "NU", faculty_code: "BIZ", faculty_name_th: "คณะบริหารธุรกิจ เศรษฐศาสตร์และการสื่อสาร", faculty_name_en: "Faculty of Business, Economics and Communications", isced_broad_field_code: "04" },
  { university_code: "NU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "NU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "NU", faculty_code: "ICT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", faculty_name_en: "Faculty of Information and Communication Technology", isced_broad_field_code: "06" },
  { university_code: "NU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "NU", faculty_code: "AGR", faculty_name_th: "คณะเกษตรศาสตร์ ทรัพยากรธรรมชาติและสิ่งแวดล้อม", faculty_name_en: "Faculty of Agriculture, Natural Resources and Environment", isced_broad_field_code: "08" },
  { university_code: "NU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "NU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "NU", faculty_code: "PHT", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "Faculty of Public Health", isced_broad_field_code: "09" },
  { university_code: "NU", faculty_code: "SRV", faculty_name_th: "วิทยาลัยการจัดการการท่องเที่ยวและบริการ", faculty_name_en: "College of Tourism and Service Management", isced_broad_field_code: "10" },

  // ================= CU =================
  { university_code: "CU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "CU", faculty_code: "ART", faculty_name_th: "คณะอักษรศาสตร์", faculty_name_en: "Faculty of Arts", isced_broad_field_code: "02" },
  { university_code: "CU", faculty_code: "POL", faculty_name_th: "คณะรัฐศาสตร์", faculty_name_en: "Faculty of Political Science", isced_broad_field_code: "03" },
  { university_code: "CU", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },
  { university_code: "CU", faculty_code: "BBA", faculty_name_th: "คณะพาณิชยศาสตร์และการบัญชี", faculty_name_en: "Faculty of Commerce and Accountancy", isced_broad_field_code: "04" },
  { university_code: "CU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "CU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "CU", faculty_code: "CS", faculty_name_th: "คณะวิทยาศาสตร์ (วิทยาการคอมพิวเตอร์)", faculty_name_en: "Faculty of Science (Computer Science)", isced_broad_field_code: "06" },
  { university_code: "CU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "CU", faculty_code: "AGR", faculty_name_th: "คณะสัตวแพทยศาสตร์", faculty_name_en: "Faculty of Veterinary Science", isced_broad_field_code: "08" },
  { university_code: "CU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "CU", faculty_code: "DEN", faculty_name_th: "คณะทันตแพทยศาสตร์", faculty_name_en: "Faculty of Dentistry", isced_broad_field_code: "09" },
  { university_code: "CU", faculty_code: "PHA", faculty_name_th: "คณะเภสัชศาสตร์", faculty_name_en: "Faculty of Pharmacy", isced_broad_field_code: "09" },
  { university_code: "CU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "CU", faculty_code: "SPH", faculty_name_th: "วิทยาลัยวิทยาศาสตร์สาธารณสุข", faculty_name_en: "College of Public Health Sciences", isced_broad_field_code: "09" },
  { university_code: "CU", faculty_code: "SRV", faculty_name_th: "สถาบันบัณฑิตบริหารธุรกิจศศินทร์ฯ (บริการ)", faculty_name_en: "Sasin Graduate Institute (Services)", isced_broad_field_code: "10" },

  // ================= KKU =================
  { university_code: "KKU", faculty_code: "EDU", faculty_name_th: "คณะศึกษาศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "KKU", faculty_code: "HUS", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },
  { university_code: "KKU", faculty_code: "SOC", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์ (สังคมศาสตร์)", faculty_name_en: "Faculty of Humanities and Social Sciences (Social Sciences)", isced_broad_field_code: "03" },
  { university_code: "KKU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจและการบัญชี", faculty_name_en: "Faculty of Business Administration and Accountancy", isced_broad_field_code: "04" },
  { university_code: "KKU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "KKU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "KKU", faculty_code: "CS", faculty_name_th: "คณะวิทยาศาสตร์ (วิทยาการคอมพิวเตอร์)", faculty_name_en: "Faculty of Science (Computer Science)", isced_broad_field_code: "06" },
  { university_code: "KKU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "KKU", faculty_code: "AGR", faculty_name_th: "คณะเกษตรศาสตร์", faculty_name_en: "Faculty of Agriculture", isced_broad_field_code: "08" },
  { university_code: "KKU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "KKU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "KKU", faculty_code: "SPH", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "Faculty of Public Health", isced_broad_field_code: "09" },
  { university_code: "KKU", faculty_code: "PHA", faculty_name_th: "คณะเภสัชศาสตร์", faculty_name_en: "Faculty of Pharmacy", isced_broad_field_code: "09" },
  { university_code: "KKU", faculty_code: "SRV", faculty_name_th: "คณะการท่องเที่ยวและการโรงแรม", faculty_name_en: "Faculty of Tourism and Hospitality", isced_broad_field_code: "10" },

  // ================= TU =================
  { university_code: "TU", faculty_code: "EDU", faculty_name_th: "คณะศึกษาศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "TU", faculty_code: "HUM", faculty_name_th: "คณะศิลปศาสตร์", faculty_name_en: "Faculty of Liberal Arts", isced_broad_field_code: "02" },
  { university_code: "TU", faculty_code: "SOC", faculty_name_th: "คณะสังคมสงเคราะห์ศาสตร์", faculty_name_en: "Faculty of Social Administration", isced_broad_field_code: "03" },
  { university_code: "TU", faculty_code: "BBA", faculty_name_th: "คณะพาณิชยศาสตร์และการบัญชี", faculty_name_en: "Faculty of Commerce and Accountancy", isced_broad_field_code: "04" },
  { university_code: "TU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "TU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "TU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "TU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "TU", faculty_code: "PHT", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "Faculty of Public Health", isced_broad_field_code: "09" },

  // ================= MU =================
  { university_code: "MU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "MU", faculty_code: "ICT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", faculty_name_en: "Faculty of Information and Communication Technology", isced_broad_field_code: "06" },
  { university_code: "MU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "MU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์ศิริราชพยาบาล", faculty_name_en: "Faculty of Medicine Siriraj Hospital", isced_broad_field_code: "09" },
  { university_code: "MU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "MU", faculty_code: "PHA", faculty_name_th: "คณะเภสัชศาสตร์", faculty_name_en: "Faculty of Pharmacy", isced_broad_field_code: "09" },
  { university_code: "MU", faculty_code: "PHT", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "Faculty of Public Health", isced_broad_field_code: "09" },

  // ================= KU =================
  { university_code: "KU", faculty_code: "AGR", faculty_name_th: "คณะเกษตร", faculty_name_en: "Faculty of Agriculture", isced_broad_field_code: "08" },
  { university_code: "KU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "KU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "KU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "KU", faculty_code: "SOC", faculty_name_th: "คณะสังคมศาสตร์", faculty_name_en: "Faculty of Social Sciences", isced_broad_field_code: "03" },

  // ================= CMU =================
  { university_code: "CMU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์", faculty_name_en: "Faculty of Humanities", isced_broad_field_code: "02" },
  { university_code: "CMU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "CMU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "CMU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "CMU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },

  // ================= PSU =================
  { university_code: "PSU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "PSU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "PSU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "PSU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "PSU", faculty_code: "PHT", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "Faculty of Public Health", isced_broad_field_code: "09" },

  // ================= Rajabhat (template ใช้ร่วมกัน) =================
  { university_code: "SRRU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "SRRU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },
  { university_code: "SRRU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "SRRU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Science", isced_broad_field_code: "04" },

  // ================= BU (Bangkok University) =================
  { university_code: "BU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "BU", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },
  { university_code: "BU", faculty_code: "IT",  faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },
  { university_code: "BU", faculty_code: "ART", faculty_name_th: "คณะศิลปกรรมศาสตร์", faculty_name_en: "Faculty of Fine and Applied Arts", isced_broad_field_code: "02" },
  { university_code: "BU", faculty_code: "DIG", faculty_name_th: "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์", faculty_name_en: "Faculty of Digital Media and Cinematic Arts", isced_broad_field_code: "03" },
  { university_code: "BU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "BU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "BU", faculty_code: "INT", faculty_name_th: "คณะนานาชาติ", faculty_name_en: "International College", isced_broad_field_code: "10" },

  // ================= SPU =================
  { university_code: "SPU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "SPU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "SPU", faculty_code: "IT",  faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },
  { university_code: "SPU", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },
  { university_code: "SPU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },

  // ================= UTCC =================
  { university_code: "UTCC", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "UTCC", faculty_code: "ECO", faculty_name_th: "คณะเศรษฐศาสตร์", faculty_name_en: "Faculty of Economics", isced_broad_field_code: "04" },
  { university_code: "UTCC", faculty_code: "ACC", faculty_name_th: "คณะบัญชี", faculty_name_en: "Faculty of Accountancy", isced_broad_field_code: "04" },
  { university_code: "UTCC", faculty_code: "IT",  faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },
  { university_code: "UTCC", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },

  // ================= RSU =================
  { university_code: "RSU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "RSU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "RSU", faculty_code: "PHA", faculty_name_th: "คณะเภสัชศาสตร์", faculty_name_en: "Faculty of Pharmacy", isced_broad_field_code: "09" },
  { university_code: "RSU", faculty_code: "PHT", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "Faculty of Public Health", isced_broad_field_code: "09" },

  { university_code: "RSU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "RSU", faculty_code: "IT",  faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },
  { university_code: "RSU", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },

  // ================= ABAC — Assumption University =================
  { university_code: "ABAC", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "ABAC", faculty_code: "IT",  faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },
  { university_code: "ABAC", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },
  { university_code: "ABAC", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "ABAC", faculty_code: "ART", faculty_name_th: "คณะศิลปศาสตร์", faculty_name_en: "Faculty of Arts", isced_broad_field_code: "02" },


  // ================= SU =================
  { university_code: "SU", faculty_code: "ART", faculty_name_th: "คณะศิลปกรรมศาสตร์", faculty_name_en: "Faculty of Fine Arts", isced_broad_field_code: "02" },
  { university_code: "SU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "SU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Science", isced_broad_field_code: "04" },

  // ================= SWU =================
  { university_code: "SWU", faculty_code: "EDU", faculty_name_th: "คณะศึกษาศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "SWU", faculty_code: "SOC", faculty_name_th: "คณะสังคมศาสตร์", faculty_name_en: "Faculty of Social Sciences", isced_broad_field_code: "03" },
  { university_code: "SWU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "SWU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },

  // ================= RU =================
  { university_code: "RU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "Faculty of Law", isced_broad_field_code: "04" },
  { university_code: "RU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "RU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์", faculty_name_en: "Faculty of Humanities", isced_broad_field_code: "02" },
  { university_code: "RU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },

  // ================= NIDA =================
  { university_code: "NIDA", faculty_code: "PAD", faculty_name_th: "คณะรัฐประศาสนศาสตร์", faculty_name_en: "School of Public Administration", isced_broad_field_code: "03" },
  { university_code: "NIDA", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "School of Management", isced_broad_field_code: "04" },
  { university_code: "NIDA", faculty_code: "ECO", faculty_name_th: "คณะเศรษฐศาสตร์", faculty_name_en: "School of Development Economics", isced_broad_field_code: "04" },
  { university_code: "NIDA", faculty_code: "ICT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "School of Information Technology", isced_broad_field_code: "06" },

  // ================= KMUTT =================
  { university_code: "KMUTT", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "KMUTT", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "KMUTT", faculty_code: "IT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },

  // ================= KMITL =================
  { university_code: "KMITL", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "KMITL", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "KMITL", faculty_code: "IT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "Faculty of Information Technology", isced_broad_field_code: "06" },

  // ================= KMUTNB =================
  { university_code: "KMUTNB", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "KMUTNB", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },

  // ================= MFU =================
  { university_code: "MFU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "School of Science", isced_broad_field_code: "05" },
  { university_code: "MFU", faculty_code: "LAW", faculty_name_th: "คณะนิติศาสตร์", faculty_name_en: "School of Law", isced_broad_field_code: "04" },
  { university_code: "MFU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "School of Management", isced_broad_field_code: "04" },
  { university_code: "MFU", faculty_code: "PHT", faculty_name_th: "คณะสาธารณสุขศาสตร์", faculty_name_en: "School of Health Science", isced_broad_field_code: "09" },

  // ================= MJU =================
  { university_code: "MJU", faculty_code: "AGR", faculty_name_th: "คณะเกษตรศาสตร์", faculty_name_en: "Faculty of Agriculture", isced_broad_field_code: "08" },
  { university_code: "MJU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "MJU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },

  // ================= UP =================
  { university_code: "UP", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },
  { university_code: "UP", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "Faculty of Nursing", isced_broad_field_code: "09" },
  { university_code: "UP", faculty_code: "ICT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", faculty_name_en: "School of Information and Communication Technology", isced_broad_field_code: "06" },
  { university_code: "UP", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจและนิเทศศาสตร์", faculty_name_en: "School of Business and Communication", isced_broad_field_code: "04" },

  // ================= MSU =================
  { university_code: "MSU", faculty_code: "EDU", faculty_name_th: "คณะศึกษาศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "MSU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },
  { university_code: "MSU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "MSU", faculty_code: "BBA", faculty_name_th: "คณะการบัญชีและการจัดการ", faculty_name_en: "Faculty of Accountancy and Management", isced_broad_field_code: "04" },

  // ================= SURO =================
  { university_code: "SUT", faculty_code: "ENG", faculty_name_th: "สำนักวิชาวิศวกรรมศาสตร์", faculty_name_en: "Institute of Engineering", isced_broad_field_code: "07" },
  { university_code: "SUT", faculty_code: "SCI", faculty_name_th: "สำนักวิชาวิศวกรรมศาสตร์", faculty_name_en: "Institute of Science", isced_broad_field_code: "05" },
  { university_code: "SUT", faculty_code: "BBA", faculty_name_th: "สำนักวิชาการจัดการ", faculty_name_en: "Institute of Management", isced_broad_field_code: "04" },

  // ================= UBU =================
  { university_code: "UBU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "UBU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "UBU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "UBU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "Faculty of Medicine", isced_broad_field_code: "09" },

  // ================= NPU =================
  { university_code: "NPU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "NPU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "NPU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจและการจัดการ", faculty_name_en: "Faculty of Business and Management", isced_broad_field_code: "04" },
  { university_code: "NPU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },

  // ================= KSU =================
  { university_code: "KSU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "KSU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "KSU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "KSU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },

  // ================= BUU =================
  { university_code: "BUU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "BUU", faculty_code: "ENG", faculty_name_th: "คณะวิศวกรรมศาสตร์", faculty_name_en: "Faculty of Engineering", isced_broad_field_code: "07" },
  { university_code: "BUU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "Faculty of Business Administration", isced_broad_field_code: "04" },
  { university_code: "BUU", faculty_code: "COM", faculty_name_th: "คณะนิเทศศาสตร์", faculty_name_en: "Faculty of Communication Arts", isced_broad_field_code: "03" },

  // ================= WU =================
  { university_code: "WU", faculty_code: "MED", faculty_name_th: "คณะแพทยศาสตร์", faculty_name_en: "School of Medicine", isced_broad_field_code: "09" },
  { university_code: "WU", faculty_code: "NUR", faculty_name_th: "คณะพยาบาลศาสตร์", faculty_name_en: "School of Nursing", isced_broad_field_code: "09" },
  { university_code: "WU", faculty_code: "ICT", faculty_name_th: "คณะเทคโนโลยีสารสนเทศ", faculty_name_en: "School of Informatics", isced_broad_field_code: "06" },
  { university_code: "WU", faculty_code: "BBA", faculty_name_th: "คณะบริหารธุรกิจ", faculty_name_en: "School of Management", isced_broad_field_code: "04" },

  // ================= TSU =================
  { university_code: "TSU", faculty_code: "EDU", faculty_name_th: "คณะศึกษาศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "TSU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },
  { university_code: "TSU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์", faculty_name_en: "Faculty of Science", isced_broad_field_code: "05" },
  { university_code: "TSU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Sciences", isced_broad_field_code: "04" },

  // ================= Rajabhat เพิ่มเติม: BRU / CRRU / CMRU / KPRU =================
  // BRU
  { university_code: "BRU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "BRU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Science", isced_broad_field_code: "04" },
  { university_code: "BRU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "BRU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },

  // CRRU
  { university_code: "CRRU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "CRRU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Science", isced_broad_field_code: "04" },
  { university_code: "CRRU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "CRRU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },

  // CMRU
  { university_code: "CMRU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "CMRU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Science", isced_broad_field_code: "04" },
  { university_code: "CMRU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "CMRU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },

  // KPRU
  { university_code: "KPRU", faculty_code: "EDU", faculty_name_th: "คณะครุศาสตร์", faculty_name_en: "Faculty of Education", isced_broad_field_code: "01" },
  { university_code: "KPRU", faculty_code: "BBA", faculty_name_th: "คณะวิทยาการจัดการ", faculty_name_en: "Faculty of Management Science", isced_broad_field_code: "04" },
  { university_code: "KPRU", faculty_code: "SCI", faculty_name_th: "คณะวิทยาศาสตร์และเทคโนโลยี", faculty_name_en: "Faculty of Science and Technology", isced_broad_field_code: "05" },
  { university_code: "KPRU", faculty_code: "HUM", faculty_name_th: "คณะมนุษยศาสตร์และสังคมศาสตร์", faculty_name_en: "Faculty of Humanities and Social Sciences", isced_broad_field_code: "02" },
];