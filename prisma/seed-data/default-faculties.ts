// prisma/seed-data/default-faculties.ts
// Default faculties based on 10 ISCED broad field categories
// These will be applied to ALL universities

export const defaultFaculties = [
  // 01 - Education
  {
    faculty_code: "EDU",
    faculty_name_th: "คณะครุศาสตร์",
    faculty_name_en: "Faculty of Education",
    isced_broad_field_code: "01",
  },
  
  // 02 - Arts and Humanities
  {
    faculty_code: "ART",
    faculty_name_th: "คณะศิลปศาสตร์",
    faculty_name_en: "Faculty of Liberal Arts",
    isced_broad_field_code: "02",
  },
  
  // 03 - Social Sciences, Journalism and Information
  {
    faculty_code: "SOC",
    faculty_name_th: "คณะสังคมศาสตร์",
    faculty_name_en: "Faculty of Social Sciences",
    isced_broad_field_code: "03",
  },
  
  // 04 - Business, Administration and Law
  {
    faculty_code: "BUS",
    faculty_name_th: "คณะบริหารธุรกิจ",
    faculty_name_en: "Faculty of Business Administration",
    isced_broad_field_code: "04",
  },
  
  {
    faculty_code: "LAW",
    faculty_name_th: "คณะนิติศาสตร์",
    faculty_name_en: "Faculty of Law",
    isced_broad_field_code: "04",
  },
  
  // 05 - Natural Sciences, Mathematics and Statistics
  {
    faculty_code: "SCI",
    faculty_name_th: "คณะวิทยาศาสตร์",
    faculty_name_en: "Faculty of Science",
    isced_broad_field_code: "05",
  },
  
  // 06 - Information and Communication Technologies
  {
    faculty_code: "ICT",
    faculty_name_th: "คณะเทคโนโลยีสารสนเทศ",
    faculty_name_en: "Faculty of Information Technology",
    isced_broad_field_code: "06",
  },
  
  // 07 - Engineering, Manufacturing and Construction
  {
    faculty_code: "ENG",
    faculty_name_th: "คณะวิศวกรรมศาสตร์",
    faculty_name_en: "Faculty of Engineering",
    isced_broad_field_code: "07",
  },
  
  {
    faculty_code: "ARC",
    faculty_name_th: "คณะสถาปัตยกรรมศาสตร์",
    faculty_name_en: "Faculty of Architecture",
    isced_broad_field_code: "07",
  },
  
  // 08 - Agriculture, Forestry, Fisheries and Veterinary
  {
    faculty_code: "AGR",
    faculty_name_th: "คณะเกษตรศาสตร์",
    faculty_name_en: "Faculty of Agriculture",
    isced_broad_field_code: "08",
  },
  
  {
    faculty_code: "VET",
    faculty_name_th: "คณะสัตวแพทยศาสตร์",
    faculty_name_en: "Faculty of Veterinary Medicine",
    isced_broad_field_code: "08",
  },
  
  // 09 - Health and Welfare
  {
    faculty_code: "MED",
    faculty_name_th: "คณะแพทยศาสตร์",
    faculty_name_en: "Faculty of Medicine",
    isced_broad_field_code: "09",
  },
  
  {
    faculty_code: "NUR",
    faculty_name_th: "คณะพยาบาลศาสตร์",
    faculty_name_en: "Faculty of Nursing",
    isced_broad_field_code: "09",
  },
  
  {
    faculty_code: "PHA",
    faculty_name_th: "คณะเภสัชศาสตร์",
    faculty_name_en: "Faculty of Pharmaceutical Sciences",
    isced_broad_field_code: "09",
  },
  
  {
    faculty_code: "DEN",
    faculty_name_th: "คณะทันตแพทยศาสตร์",
    faculty_name_en: "Faculty of Dentistry",
    isced_broad_field_code: "09",
  },
  
  {
    faculty_code: "AHS",
    faculty_name_th: "คณะสหเวชศาสตร์",
    faculty_name_en: "Faculty of Allied Health Sciences",
    isced_broad_field_code: "09",
  },
  
  // 10 - Services
  {
    faculty_code: "SPO",
    faculty_name_th: "คณะวิทยาศาสตร์การกีฬา",
    faculty_name_en: "Faculty of Sports Science",
    isced_broad_field_code: "10",
  },
  
  {
    faculty_code: "COM",
    faculty_name_th: "คณะนิเทศศาสตร์",
    faculty_name_en: "Faculty of Communication Arts",
    isced_broad_field_code: "10",
  },
  
  {
    faculty_code: "FNA",
    faculty_name_th: "คณะศิลปกรรมศาสตร์",
    faculty_name_en: "Faculty of Fine and Applied Arts",
    isced_broad_field_code: "10",
  },
];

// Default departments (Expanded list)
export const defaultDepartments = [
  // EDU - Education
  { faculty_code: "EDU", department_code: "EDU_ELE", department_name_th: "ภาควิชาการศึกษาประถมศึกษา", department_name_en: "Department of Elementary Education" },
  { faculty_code: "EDU", department_code: "EDU_SEC", department_name_th: "ภาควิชาการศึกษามัธยมศึกษา", department_name_en: "Department of Secondary Education" },
  { faculty_code: "EDU", department_code: "EDU_PSY", department_name_th: "ภาควิชาจิตวิทยาและการแนะแนว", department_name_en: "Department of Educational Psychology and Guidance" },
  { faculty_code: "EDU", department_code: "EDU_TEC", department_name_th: "ภาควิชาเทคโนโลยีการศึกษา", department_name_en: "Department of Educational Technology" },
  { faculty_code: "EDU", department_code: "EDU_EVA", department_name_th: "ภาควิชาการวัดและประเมินผล", department_name_en: "Department of Evaluation and Research" },

  // ART - Arts and Humanities
  { faculty_code: "ART", department_code: "ART_THA", department_name_th: "ภาควิชาภาษาไทย", department_name_en: "Department of Thai Language" },
  { faculty_code: "ART", department_code: "ART_ENG", department_name_th: "ภาควิชาภาษาอังกฤษ", department_name_en: "Department of English" },
  { faculty_code: "ART", department_code: "ART_JP", department_name_th: "ภาควิชาภาษาญี่ปุ่น", department_name_en: "Department of Japanese" },
  { faculty_code: "ART", department_code: "ART_CN", department_name_th: "ภาควิชาภาษาจีน", department_name_en: "Department of Chinese" },
  { faculty_code: "ART", department_code: "ART_HIS", department_name_th: "ภาควิชาประวัติศาสตร์", department_name_en: "Department of History" },
  { faculty_code: "ART", department_code: "ART_PHI", department_name_th: "ภาควิชาปรัชญา", department_name_en: "Department of Philosophy" },
  { faculty_code: "ART", department_code: "ART_GEO", department_name_th: "ภาควิชาภูมิศาสตร์", department_name_en: "Department of Geography" },
  { faculty_code: "ART", department_code: "ART_LIB", department_name_th: "ภาควิชาบรรณารักษศาสตร์", department_name_en: "Department of Library Science" },

  // SOC - Social Sciences
  { faculty_code: "SOC", department_code: "SOC_POL", department_name_th: "ภาควิชารัฐศาสตร์", department_name_en: "Department of Political Science" },
  { faculty_code: "SOC", department_code: "SOC_PUB", department_name_th: "ภาควิชารัฐประศาสนศาสตร์", department_name_en: "Department of Public Administration" },
  { faculty_code: "SOC", department_code: "SOC_ECO", department_name_th: "ภาควิชาเศรษฐศาสตร์", department_name_en: "Department of Economics" },
  { faculty_code: "SOC", department_code: "SOC_SOC", department_name_th: "ภาควิชาสังคมวิทยาและมานุษยวิทยา", department_name_en: "Department of Sociology and Anthropology" },
  { faculty_code: "SOC", department_code: "SOC_DEV", department_name_th: "ภาควิชาการพัฒนาสังคม", department_name_en: "Department of Social Development" },

  // BUS - Business Administration
  { faculty_code: "BUS", department_code: "BUS_MGT", department_name_th: "ภาควิชาการจัดการ", department_name_en: "Department of Management" },
  { faculty_code: "BUS", department_code: "BUS_MKT", department_name_th: "ภาควิชาการตลาด", department_name_en: "Department of Marketing" },
  { faculty_code: "BUS", department_code: "BUS_ACC", department_name_th: "ภาควิชาการบัญชี", department_name_en: "Department of Accounting" },
  { faculty_code: "BUS", department_code: "BUS_FIN", department_name_th: "ภาควิชาการเงินและการธนาคาร", department_name_en: "Department of Finance and Banking" },
  { faculty_code: "BUS", department_code: "BUS_INT", department_name_th: "ภาควิชาธุรกิจระหว่างประเทศ", department_name_en: "Department of International Business" },
  { faculty_code: "BUS", department_code: "BUS_LOG", department_name_th: "ภาควิชาการจัดการโลจิสติกส์", department_name_en: "Department of Logistics Management" },
  { faculty_code: "BUS", department_code: "BUS_TOU", department_name_th: "ภาควิชาการท่องเที่ยวและการโรงแรม", department_name_en: "Department of Tourism and Hospitality" },

  // LAW - Law
  { faculty_code: "LAW", department_code: "LAW_PRI", department_name_th: "ภาควิชากฎหมายเอกชน", department_name_en: "Department of Private Law" },
  { faculty_code: "LAW", department_code: "LAW_PUB", department_name_th: "ภาควิชากฎหมายมหาชน", department_name_en: "Department of Public Law" },
  { faculty_code: "LAW", department_code: "LAW_CRI", department_name_th: "ภาควิชากฎหมายอาญา", department_name_en: "Department of Criminal Law" },
  { faculty_code: "LAW", department_code: "LAW_INT", department_name_th: "ภาควิชากฎหมายระหว่างประเทศ", department_name_en: "Department of International Law" },

  // SCI - Science
  { faculty_code: "SCI", department_code: "SCI_MAT", department_name_th: "ภาควิชาคณิตศาสตร์", department_name_en: "Department of Mathematics" },
  { faculty_code: "SCI", department_code: "SCI_STA", department_name_th: "ภาควิชาสถิติ", department_name_en: "Department of Statistics" },
  { faculty_code: "SCI", department_code: "SCI_PHY", department_name_th: "ภาควิชาฟิสิกส์", department_name_en: "Department of Physics" },
  { faculty_code: "SCI", department_code: "SCI_CHE", department_name_th: "ภาควิชาเคมี", department_name_en: "Department of Chemistry" },
  { faculty_code: "SCI", department_code: "SCI_BIO", department_name_th: "ภาควิชาชีววิทยา", department_name_en: "Department of Biology" },
  { faculty_code: "SCI", department_code: "SCI_MIC", department_name_th: "ภาควิชาจุลชีววิทยา", department_name_en: "Department of Microbiology" },
  { faculty_code: "SCI", department_code: "SCI_ENV", department_name_th: "ภาควิชาวิทยาศาสตร์สิ่งแวดล้อม", department_name_en: "Department of Environmental Science" },

  // ICT - Information Technology
  { faculty_code: "ICT", department_code: "ICT_CSE", department_name_th: "ภาควิชาวิทยาการคอมพิวเตอร์", department_name_en: "Department of Computer Science" },
  { faculty_code: "ICT", department_code: "ICT_IT", department_name_th: "ภาควิชาเทคโนโลยีสารสนเทศ", department_name_en: "Department of Information Technology" },
  { faculty_code: "ICT", department_code: "ICT_SWE", department_name_th: "ภาควิชาวิศวกรรมซอฟต์แวร์", department_name_en: "Department of Software Engineering" },
  { faculty_code: "ICT", department_code: "ICT_DSI", department_name_th: "ภาควิชาวิทยาการข้อมูล", department_name_en: "Department of Data Science" },

  // ENG - Engineering
  { faculty_code: "ENG", department_code: "ENG_CIV", department_name_th: "ภาควิชาวิศวกรรมโยธา", department_name_en: "Department of Civil Engineering" },
  { faculty_code: "ENG", department_code: "ENG_ELE", department_name_th: "ภาควิชาวิศวกรรมไฟฟ้า", department_name_en: "Department of Electrical Engineering" },
  { faculty_code: "ENG", department_code: "ENG_MEC", department_name_th: "ภาควิชาวิศวกรรมเครื่องกล", department_name_en: "Department of Mechanical Engineering" },
  { faculty_code: "ENG", department_code: "ENG_IND", department_name_th: "ภาควิชาวิศวกรรมอุตสาหการ", department_name_en: "Department of Industrial Engineering" },
  { faculty_code: "ENG", department_code: "ENG_CHE", department_name_th: "ภาควิชาวิศวกรรมเคมี", department_name_en: "Department of Chemical Engineering" },
  { faculty_code: "ENG", department_code: "ENG_CPE", department_name_th: "ภาควิชาวิศวกรรมคอมพิวเตอร์", department_name_en: "Department of Computer Engineering" },
  { faculty_code: "ENG", department_code: "ENG_ENV", department_name_th: "ภาควิชาวิศวกรรมสิ่งแวดล้อม", department_name_en: "Department of Environmental Engineering" },

  // ARC - Architecture
  { faculty_code: "ARC", department_code: "ARC_ARC", department_name_th: "ภาควิชาสถาปัตยกรรม", department_name_en: "Department of Architecture" },
  { faculty_code: "ARC", department_code: "ARC_INT", department_name_th: "ภาควิชาสถาปัตยกรรมภายใน", department_name_en: "Department of Interior Architecture" },
  { faculty_code: "ARC", department_code: "ARC_LND", department_name_th: "ภาควิชาภูมิสถาปัตยกรรม", department_name_en: "Department of Landscape Architecture" },
  { faculty_code: "ARC", department_code: "ARC_PLN", department_name_th: "ภาควิชาการผังเมือง", department_name_en: "Department of Urban Planning" },
  { faculty_code: "ARC", department_code: "ARC_IDS", department_name_th: "ภาควิชาออกแบบอุตสาหกรรม", department_name_en: "Department of Industrial Design" },

  // AGR - Agriculture
  { faculty_code: "AGR", department_code: "AGR_AGR", department_name_th: "ภาควิชาพืชไร่", department_name_en: "Department of Agronomy" },
  { faculty_code: "AGR", department_code: "AGR_HOR", department_name_th: "ภาควิชาพืชสวน", department_name_en: "Department of Horticulture" },
  { faculty_code: "AGR", department_code: "AGR_ANI", department_name_th: "ภาควิชาสัตวบาล", department_name_en: "Department of Animal Science" },
  { faculty_code: "AGR", department_code: "AGR_SOI", department_name_th: "ภาควิชาปฐพีวิทยา", department_name_en: "Department of Soil Science" },
  { faculty_code: "AGR", department_code: "AGR_ENT", department_name_th: "ภาควิชากีฏวิทยา", department_name_en: "Department of Entomology" },
  { faculty_code: "AGR", department_code: "AGR_FIS", department_name_th: "ภาควิชาประมง", department_name_en: "Department of Fisheries" },
  { faculty_code: "AGR", department_code: "AGR_FOD", department_name_th: "ภาควิชาวิทยาศาสตร์การอาหาร", department_name_en: "Department of Food Science" },

  // VET - Veterinary Medicine
  { faculty_code: "VET", department_code: "VET_MED", department_name_th: "ภาควิชาอายุรศาสตร์สัตวแพทย์", department_name_en: "Department of Veterinary Medicine" },
  { faculty_code: "VET", department_code: "VET_SUR", department_name_th: "ภาควิชาศัลยศาสตร์สัตวแพทย์", department_name_en: "Department of Veterinary Surgery" },
  { faculty_code: "VET", department_code: "VET_ANT", department_name_th: "ภาควิชากายวิภาคศาสตร์", department_name_en: "Department of Veterinary Anatomy" },
  { faculty_code: "VET", department_code: "VET_PAT", department_name_th: "ภาควิชาพยาธิวิทยา", department_name_en: "Department of Veterinary Pathology" },
  { faculty_code: "VET", department_code: "VET_PUB", department_name_th: "ภาควิชาสัตวแพทย์สาธารณสุข", department_name_en: "Department of Veterinary Public Health" },

  // MED - Medicine
  { faculty_code: "MED", department_code: "MED_MED", department_name_th: "ภาควิชาอายุรศาสตร์", department_name_en: "Department of Internal Medicine" },
  { faculty_code: "MED", department_code: "MED_SUR", department_name_th: "ภาควิชาศัลยศาสตร์", department_name_en: "Department of Surgery" },
  { faculty_code: "MED", department_code: "MED_PED", department_name_th: "ภาควิชากุมารเวชศาสตร์", department_name_en: "Department of Pediatrics" },
  { faculty_code: "MED", department_code: "MED_OBG", department_name_th: "ภาควิชาสูติศาสตร์-นรีเวชวิทยา", department_name_en: "Department of Obstetrics and Gynecology" },
  { faculty_code: "MED", department_code: "MED_ORT", department_name_th: "ภาควิชาออร์โธปิดิกส์", department_name_en: "Department of Orthopedics" },
  { faculty_code: "MED", department_code: "MED_PSY", department_name_th: "ภาควิชาจิตเวชศาสตร์", department_name_en: "Department of Psychiatry" },
  { faculty_code: "MED", department_code: "MED_RAD", department_name_th: "ภาควิชารังสีวิทยา", department_name_en: "Department of Radiology" },
  { faculty_code: "MED", department_code: "MED_FML", department_name_th: "ภาควิชาเวชศาสตร์ครอบครัว", department_name_en: "Department of Family Medicine" },

  // NUR - Nursing
  { faculty_code: "NUR", department_code: "NUR_ADU", department_name_th: "ภาควิชาการพยาบาลผู้ใหญ่", department_name_en: "Department of Adult Nursing" },
  { faculty_code: "NUR", department_code: "NUR_CHI", department_name_th: "ภาควิชาการพยาบาลเด็ก", department_name_en: "Department of Pediatric Nursing" },
  { faculty_code: "NUR", department_code: "NUR_COM", department_name_th: "ภาควิชาการพยาบาลอนามัยชุมชน", department_name_en: "Department of Community Health Nursing" },
  { faculty_code: "NUR", department_code: "NUR_MEN", department_name_th: "ภาควิชาการพยาบาลสุขภาพจิต", department_name_en: "Department of Mental Health Nursing" },
  { faculty_code: "NUR", department_code: "NUR_MID", department_name_th: "ภาควิชาการพยาบาลสูติศาสตร์", department_name_en: "Department of Obstetric Nursing" },

  // PHA - Pharmaceutical Sciences
  { faculty_code: "PHA", department_code: "PHA_PRA", department_name_th: "ภาควิชาเภสัชกรรมปฏิบัติ", department_name_en: "Department of Pharmacy Practice" },
  { faculty_code: "PHA", department_code: "PHA_CHE", department_name_th: "ภาควิชาเภสัชเคมี", department_name_en: "Department of Pharmaceutical Chemistry" },
  { faculty_code: "PHA", department_code: "PHA_COG", department_name_th: "ภาควิชาเภสัชวินิจฉัย", department_name_en: "Department of Pharmacognosy" },
  { faculty_code: "PHA", department_code: "PHA_CEU", department_name_th: "ภาควิชาเภสัชอุตสาหกรรม", department_name_en: "Department of Industrial Pharmacy" },

  // DEN - Dentistry
  { faculty_code: "DEN", department_code: "DEN_OPE", department_name_th: "ภาควิชาทันตกรรมหัตถการ", department_name_en: "Department of Operative Dentistry" },
  { faculty_code: "DEN", department_code: "DEN_PRO", department_name_th: "ภาควิชาทันตกรรมประดิษฐ์", department_name_en: "Department of Prosthodontics" },
  { faculty_code: "DEN", department_code: "DEN_ORT", department_name_th: "ภาควิชาทันตกรรมจัดฟัน", department_name_en: "Department of Orthodontics" },
  { faculty_code: "DEN", department_code: "DEN_SUR", department_name_th: "ภาควิชาศัลยศาสตร์ช่องปาก", department_name_en: "Department of Oral Surgery" },
  { faculty_code: "DEN", department_code: "DEN_PED", department_name_th: "ภาควิชาทันตกรรมสำหรับเด็ก", department_name_en: "Department of Pediatric Dentistry" },

  // AHS - Allied Health Sciences
  { faculty_code: "AHS", department_code: "AHS_PHT", department_name_th: "ภาควิชากายภาพบำบัด", department_name_en: "Department of Physical Therapy" },
  { faculty_code: "AHS", department_code: "AHS_MED", department_name_th: "ภาควิชาเทคนิคการแพทย์", department_name_en: "Department of Medical Technology" },
  { faculty_code: "AHS", department_code: "AHS_RAD", department_name_th: "ภาควิชารังสีเทคนิค", department_name_en: "Department of Radiological Technology" },
  { faculty_code: "AHS", department_code: "AHS_NUT", department_name_th: "ภาควิชาโภชนาการและการกำหนดอาหาร", department_name_en: "Department of Nutrition and Dietetics" },

  // SPO - Sports Science
  { faculty_code: "SPO", department_code: "SPO_SCI", department_name_th: "ภาควิชาวิทยาศาสตร์การกีฬา", department_name_en: "Department of Sport Science" },
  { faculty_code: "SPO", department_code: "SPO_EDU", department_name_th: "ภาควิชาพลศึกษา", department_name_en: "Department of Physical Education" },
  { faculty_code: "SPO", department_code: "SPO_HEA", department_name_th: "ภาควิชาสุขศึกษา", department_name_en: "Department of Health Education" },
  { faculty_code: "SPO", department_code: "SPO_REC", department_name_th: "ภาควิชานันทนาการ", department_name_en: "Department of Recreation" },

  // COM - Communication Arts
  { faculty_code: "COM", department_code: "COM_JOU", department_name_th: "ภาควิชาวารสารสนเทศ", department_name_en: "Department of Journalism" },
  { faculty_code: "COM", department_code: "COM_BRO", department_name_th: "ภาควิชาวิทยุกระจายเสียงและวิทยุโทรทัศน์", department_name_en: "Department of Broadcasting" },
  { faculty_code: "COM", department_code: "COM_PUB", department_name_th: "ภาควิชาการประชาสัมพันธ์", department_name_en: "Department of Public Relations" },
  { faculty_code: "COM", department_code: "COM_AD", department_name_th: "ภาควิชาการโฆษณา", department_name_en: "Department of Advertising" },
  { faculty_code: "COM", department_code: "COM_PER", department_name_th: "ภาควิชาสื่อสารการแสดง", department_name_en: "Department of Performing Arts" },
  { faculty_code: "COM", department_code: "COM_FLM", department_name_th: "ภาควิชาภาพยนตร์และภาพนิ่ง", department_name_en: "Department of Film and Photography" },

  // FNA - Fine and Applied Arts
  { faculty_code: "FNA", department_code: "FNA_VIS", department_name_th: "ภาควิชาทัศนศิลป์", department_name_en: "Department of Visual Arts" },
  { faculty_code: "FNA", department_code: "FNA_MUS", department_name_th: "ภาควิชาดุริยางคศิลป์", department_name_en: "Department of Music" },
  { faculty_code: "FNA", department_code: "FNA_DAN", department_name_th: "ภาควิชานาฏยศิลป์", department_name_en: "Department of Dance" },
  { faculty_code: "FNA", department_code: "FNA_DES", department_name_th: "ภาควิชาการออกแบบ", department_name_en: "Department of Design" },
  { faculty_code: "FNA", department_code: "FNA_FAS", department_name_th: "ภาควิชาการออกแบบแฟชั่น", department_name_en: "Department of Fashion Design" },
];
