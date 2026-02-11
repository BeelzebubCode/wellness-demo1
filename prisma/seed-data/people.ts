// prisma/seed-data/people.ts
// Expanded name pools for full-scale seed (~1.8M students)
// 300 first names × 300 last names = 90,000 unique combos
// Combined with 154 universities → effectively unlimited uniqueness

export type Bilingual = { th: string; en: string };

// -------------------------
// Raw lists (TH / EN) — 300 entries each
// -------------------------

export const firstNamesTh = [
  // === ชาย (Male names) ===
  "สมชาย","สมศักดิ์","วิชัย","อาทิตย์","เดชา","พิชัย","ณรงค์","ทองชัย","อุดม","ชัยวัฒน์",
  "เอกชัย","อิสระ","ศุภชัย","ธีรพงษ์","วสันต์","มานพ","ศักดา","พงศักดิ์","ณัฐพงษ์","จิรวัฒน์",
  "ธนวัฒน์","อนันต์","ดำรง","ภาณุมัส","กฤษฎา","สิทธิชัย","ประเสริฐ","สุรชัย","วีรพงษ์","เฉลิมชัย",
  "นิรันดร์","ทวีศักดิ์","พิพัฒน์","สมบูรณ์","ปรีชา","สมหมาย","วิโรจน์","กิตติ","ถาวร","บุญเลิศ",
  "อำนาจ","ประสิทธิ์","พิทักษ์","อดิศร","สราวุธ","ชาตรี","ประยุทธ์","ณัฐวุฒิ","กิตติศักดิ์","ชัยพร",
  "วรพจน์","นพดล","ภูวดล","ไพบูลย์","ไพรัช","เกรียงศักดิ์","พิศาล","สุริยา","อภิชาติ","จักรี",
  "พีรพัฒน์","ธนกร","ภาคิน","ณัฐกร","ปณิธาน","พัสกร","สิรวิชญ์","กฤตเมธ","ธีรเดช","ศิวกร",
  "พชร","จิรภัทร","ภัทรพล","ศุภวิชญ์","กันตพัฒน์","ธนดล","พิชญะ","อรรถพล","ปิยะ","วัชรพล",
  "วรเมธ","ศรัณย์","กรวิชญ์","จิรายุ","สรวิชญ์","ณัฐนันท์","สุรพงษ์","ชำนาญ","วีระ","ปราโมทย์",
  "ไกรสร","ทรงพล","ภานุพงศ์","ชนาธิป","ปรมัตถ์","ภูมิพัฒน์","ณฐพร","กิตตินันท์","ธนภัทร","เมธัส",
  // === หญิง (Female names) ===
  "มาลี","มณี","ปราณี","สุดา","นารี","กัญญา","รัตนา","สุนีย์","วิภา","ศิริพร",
  "วนิดา","ชลิดา","พิมพ์ชนก","ณิชา","ศิริน","อภิญญา","ชนลดา","ดรุณี","หทัยรัตน์","จุฑามาศ",
  "กนกวรรณ","กรกนก","ลลิตา","นพรัตน์","อรทัย","พัชรินทร์","รัชนี","ศศิธร","สุพรรษา","ธัญญารัตน์",
  "อุไร","ญาดา","พิมพ์ลดา","สุภาพร","จันทิมา","นิภา","ศิราณี","อำภา","เบญจมาศ","ดวงใจ",
  "สุวรรณา","กาญจนา","วิไล","สมจิตร","ประทุม","ลำยอง","บุญยง","ถนอม","อุษา","พรรณี",
  "วไลลักษณ์","พนิดา","วลัยพร","นงเยาว์","ศรีวิไล","พรทิพย์","มลิวัลย์","อัมพร","จรรยา","สุมาลี",
  "กุลวดี","ชมพูนุช","ดาริกา","ศิริวรรณ","อารียา","พิชญา","นลินี","ปิยธิดา","ภรรพี","สุชานันท์",
  "ณัฐธิดา","พิมพ์มาดา","ชนิดา","ธิดารัตน์","อังศนา","ปาริฉัตร","สาวิตรี","มนัสนันท์","ขวัญใจ","น้ำผึ้ง",
  "ปวีณา","วรรณวิสา","บุษบา","พจมาน","ผกามาศ","อนงค์นาถ","เกศินี","กัลยา","ภัทราพร","ตวงรัตน์",
  "สิริมา","ชนิกานต์","ธัญลักษณ์","พัชราภรณ์","อาภัสรา","พนมวรรณ","อมรา","ธนพร","มัณฑนา","รุ่งนภา",
  // === Unisex / Modern names ===
  "กมล","วรรณ","พร","อ้อม","ใจ","สิริ","ศรี","ธนา","วิทย์","รัตน์",
  "นัท","บุญ","เพชร","พลอย","ภาส","ทิพย์","ธาร","วุฒิ","ชล","ปราง",
  "ฝน","เนตร","ไผ่","เต้า","กลม","เจน","ลม","ลิน","มิว","นิว",
  "ปอ","ทราย","ตะวัน","ปุณณ์","ศุภณัฐ","ชญาน์","กานต์","จรัส","ชุติ","ทักษ์",
  "ธีร์","นิธิ","ปภา","พฤกษ์","ภควัน","มธุ","วทัญ","ศิลป์","สรัล","อนุช",
  "โชติ","ไกร","ฤทธิ์","ยศ","ดนัย","กลวัชร","ชยพัทธ์","ณภัทร","ธีรภัทร","พิริยะ",
  "สิปปกร","อัครา","จุลจักร","ชินวัตร","ฐิติกร","ดนุพล","ปริญญ์","ลาภิศ","วิษณุ","สุขเกษม",
  "จิราพัชร","ณัฐริกา","ปุณยนุช","พัทธนันท์","วริษฐา","สิรินดา","อริสรา","จุฬาลักษณ์","ณัฐวดี","ปิยาภรณ์",
  "ภัทรวดี","มนัญชยา","วรรณพร","ศศิกาญจน์","สุธีพร","อภิสรา","จันทร์จิรา","ณิชาภัทร","ปรียาภรณ์","พิมพ์วิมล",
  "มณฑาทิพย์","รวิสรา","ศิริลักษณ์","สุประวีณ์","อัจฉรา","กานต์ธิดา","ชลธิชา","ณัฐชยา","ธนัญญา","อินทิรา",
];

export const firstNamesEn = [
  // === Male ===
  "Somchai","Somsak","Wichai","Arthit","Decha","Pichai","Narong","Thongchai","Udom","Chaiwat",
  "Ekachai","Isara","Supachai","Thirapong","Wasan","Manop","Sakda","Pongsak","Nattapong","Jirawat",
  "Thanawat","Anan","Damrong","Phanumas","Kritsada","Sittichai","Prasert","Surachai","Wirapong","Chalermchai",
  "Nirun","Thawisak","Pipat","Somboon","Preecha","Sommai","Wiroj","Kitti","Thaworn","Bunlert",
  "Amnat","Prasit","Pitak","Adisorn","Sarawut","Chatri","Prayut","Natthawut","Kittisak","Chaiyaporn",
  "Worapoj","Noppadol","Phuwadol","Phaiboon","Phairat","Kriangsak","Phisan","Suriya","Apichat","Chakri",
  "Pirapat","Thanakorn","Phakin","Natthakorn","Panitan","Patsakorn","Sirawit","Kritmet","Thiradech","Siwakorn",
  "Potchara","Jiraphat","Phatthrapol","Supawit","Kantapat","Thanadon","Pitchaya","Attapol","Piya","Watcharapol",
  "Woramet","Sarun","Kornwit","Jirayu","Sorawit","Nattanan","Surapong","Chamnan","Wira","Pramot",
  "Kraison","Songpol","Phanupong","Chanathip","Poramat","Phumipat","Nataporn","Kittinan","Thanaphat","Methus",
  // === Female ===
  "Malee","Manee","Pranee","Suda","Naree","Kanya","Ratana","Sunee","Vipa","Siriporn",
  "Wanida","Chanida","Pimchanok","Nicha","Sirin","Apinya","Chonlada","Darunee","Hathairat","Jutamas",
  "Kanokwan","Kornkanok","Lalita","Noppharat","Orathai","Phatcharin","Ratchanee","Sasithorn","Suphansa","Thanyarat",
  "Urai","Yada","Pimlada","Supaporn","Jantima","Nipa","Siranee","Ampha","Benchamat","Duangjai",
  "Suwanna","Kanjana","Wilai","Somjit","Pratum","Lamyong","Boonyong","Thanom","Usa","Pannee",
  "Walailak","Panida","Walaiporn","Nongyao","Sriwilai","Pornthip","Maliwan","Amphon","Janya","Sumalee",
  "Kulwadee","Chompunuj","Darika","Siriwan","Ariya","Pitchaya","Nalinee","Piyatida","Paranpee","Suchanan",
  "Nattida","Pimmada","Chanida","Tidarat","Angsana","Parichat","Sawitree","Manasanan","Kwanjai","Nampeung",
  "Paweena","Wanwisa","Butsaba","Pojaman","Pakamas","Anongnart","Kesinee","Kanlaya","Pattraporn","Tuangrat",
  "Sirima","Chanikan","Thanyalak","Patcharaporn","Arphatsara","Panomwan","Amara","Thanaporn","Manthana","Rungnapa",
  // === Unisex / Modern ===
  "Kamol","Wan","Porn","Aom","Jai","Siri","Sri","Thana","Wit","Rat",
  "Nat","Boon","Petch","Ploy","Phat","Thip","Than","Wut","Chon","Prang",
  "Fon","Net","Phai","Tao","Klom","Jane","Lom","Lin","Mew","New",
  "Por","Sai","Tawan","Pun","Supanat","Chayan","Kan","Jarat","Chuti","Thak",
  "Thee","Niti","Papha","Pruek","Phakawan","Mathu","Wathan","Silp","Sarun","Anut",
  "Chot","Krai","Rit","Yot","Danai","Konwat","Chayapat","Naphat","Thiraphat","Piriya",
  "Sippakorn","Akkara","Julajak","Chinawat","Thitikorn","Danuphol","Parin","Laphis","Witsanu","Sukkasem",
  "Jiraphat","Nattarika","Punnyanut","Phattanan","Waritsara","Sirinda","Arisara","Julalak","Natthawadee","Piyaporn",
  "Phattrawadee","Mananchaya","Wannaporn","Sasikan","Sutheeporn","Apisara","Janjira","Nichaphat","Preeyaporn","Pimwimon",
  "Montathip","Rawisara","Sirilak","Suprawin","Atchara","Kantida","Chontitcha","Natchaya","Thananya","Intira",
];

export const lastNamesTh = [
  "ใจดี","มีวงศ์","รักชาติ","สุขใจ","มั่นใจ","คงทอง","ศรีสุข","วงศา","ปัญญา","แก้วตา",
  "โรจนะ","แซ่ตั้ง","แซ่ลี","ใจรัก","บุญมี","ชัยศรี","วงศ์สุวรรณ","อินทรา","พรหมา","ศรีเทพ",
  "คงแก้ว","สุวรรณ","ทองดี","รัตนาภรณ์","จันทรา","ศรีสวัสดิ์","เพชรมณี","พรหม","แก้วใส","ยิ้มแย้ม",
  "สุขประเสริฐ","วัฒนกุล","พงศ์ผล","กาญจนกุล","รุ่งโรจน์","ศิริกุล","จันทร","ภาสุข","สุขุม","รักษากุล",
  "ทองหล่อ","อุดมศรี","วิจิตรสกุล","สมศรี","บุญญรัตน์","ชื่นชม","สังข์อาน","สวัสดี","รัตนากร","มหาศิริ",
  "ประเสริฐสุข","โชคชัย","ศรีสมาย","พันธุ์ทอง","พงษธร","โชคนาน","ยินดี","สุขสันต์","ทวีสุข","ภิรมย์",
  "พูนศิริ","อัศวเดช","กุลพร","เจริญสุข","วรรณรัตน์","ไชยสุวรรณ","พิทักษ์ธรรม","เกษมศรี","บุญเรือง","มงคลชัย",
  "ทรัพย์สิน","ภูมิพัฒน์","สิริอร","ธนะภูมิ","ลิ้มไพศาล","ตันติเวชกุล","จิตรประสงค์","ธรรมวงศ์","วิจิตรพงษ์","ศรีสุนทร",
  "เพียรธรรม","กิจเจริญ","ชวนสุข","เอื้ออำนวย","ดิลกธรรม","กังวานเลิศ","สมานรักษ์","ธนารักษ์","กิตติพิทยา","วรดิตถ์",
  "บุณยเกียรติ","ธีรวัฒน์","จรรยวงศ์","ศรีนวล","สุขเกษม","พิบูลสุข","นิธิกุล","วรวุฒิ","พฤทธิ์พันธุ์","เตชะสุข",
  // --- ชื่อสกุลใหม่เพิ่ม ---
  "พานิช","สุทธิ","ชัยเจริญ","ศรีธัญญา","จินดามณี","ศิริโชติ","วังนาค","สมบัติ","อินทร์แปลง","นิลเขต",
  "บุญตา","มณีจันทร์","ศรีรัตน์","วรวรรณ","สุขเพ็ง","งามสวัสดิ์","เกิดดี","เรืองศรี","ถาวรกุล","จำเริญ",
  "สมบุญ","เอี่ยมงาม","จงรักษ์","มีสุข","จิตตะ","กรุณา","ทะเลทอง","ดอกไม้","พรายทอง","สดใส",
  "คำสิงห์","แสงจันทร์","ชื่นบาน","ราชวงศ์","แก้วมณี","พิมสาร","เขียวอ่อน","ภูมิรัตน์","มหาชน","สุขมาก",
  "ธรรมรัตน์","เฟื่องฟู","ชมจันทร์","สายลม","ดาวเรือง","ภูเขา","ไพรินทร์","ชาติชาย","ณ นคร","ปิ่นทอง",
  "จันทิมา","วิลัยวรรณ","มงคลสวัสดิ์","สุนทรเดช","เสรีรักษ์","บุญอำพร","ทองสมบัติ","ใหม่เอี่ยม","นามดี","ดวงชัย",
  "บัวทอง","กองแก้ว","แสงทอง","ผาสุก","แสนสุข","งามสะอาด","สร้อยทอง","ดาวรุ่ง","เดือนเพ็ญ","รุ่งเรือง",
  "ทองอินทร์","ผลิตผล","ศิลาเพชร","กระจ่าง","แก้วสว่าง","ดวงดาว","ประสานทอง","เจิมศรี","พวงมาลี","เวียงไชย",
  "ธนวณิชย์","มาลัย","ลำเจียก","ชมรักษ์","ศิริธร","สารัตน์","ทิพวัฒน์","พฤกษาสวรรณ์","หิรัญ","พลศรี",
  "พิทักษ์ศิลป์","กำธร","จรุงเดช","ชยานันท์","สิงห์ทอง","นรินทร์","ธารทอง","อภิรุจ","สี่หมื่น","เพิ่มสุข",
  // --- Modern / สกุลพยางค์สั้น ---
  "ตัน","ลี","ชัง","หลิว","สว่าง","มาก","น้อย","ดี","งาม","สุข",
  "ชัย","ศรี","ทอง","แก้ว","บุญ","พร","กุล","ชม","เพ็ญ","รัก",
  "ไทย","เพ็ชร","มี","ดวง","สม","สิริ","ผล","วัฒน์","พูล","ชาญ",
  "รอด","เรือง","จิตร","ลาภ","หมั่น","หาญ","เงิน","มั่ง","คง","แสง",
  "พลับ","ปลอด","ปิ่น","น้ำ","ฟ้า","ดิน","ลม","ไฟ","หมอก","ฝน",
];

export const lastNamesEn = [
  "Jaidee","Meewong","Rakchart","Sukjai","Munjai","Kongthong","Srisuk","Wongsa","Panya","Kaewta",
  "Rojjana","Saetang","Saelee","Jairak","Boonmee","Chaisri","Wongsuwan","Intara","Promma","Srithep",
  "Kongkaew","Suwan","Thongdee","Rattanaporn","Chantara","Srisawat","Petchmanee","Phrom","Kaewsai","Yimyam",
  "Sukprasert","Wattanakul","Phongphol","Kanchanakul","Rungroj","Sirikul","Chantorn","Phasuk","Sukhum","Raksakul",
  "Thonglor","Udomsri","Wichitsakul","Somsri","Bunyarat","Chuenchom","Sanguan","Sawatdee","Rattanakorn","Mahasiri",
  "Prasertsuk","Chokchai","Srisamai","Phanthong","Pongsathon","Chokanan","Yindee","Suksan","Thawisuk","Pirom",
  "Punsiri","Atsawadech","Kulporn","Jaroensuk","Wannarat","Chaisuwan","Pitakham","Kasemsri","Boonruang","Mongkolchai",
  "Sapsin","Phumipat","Siri-on","Thanapoom","Limpaisarn","Tantiwetchakul","Jitprasong","Thamwong","Wichitpong","Srisuntorn",
  "Pientham","Kitcharoen","Chuansuk","Uea-amnuay","Diloktham","Kangwanlert","Samanrak","Thanarak","Kittipitaya","Woradit",
  "Bunyakiat","Theerawat","Janyawong","Srinual","Sukkasem","Pibulsuk","Nithikul","Worawut","Prutpan","Techasuk",
  "Panich","Sutthi","Chaicharoen","Srithanya","Jindamanee","Sirichot","Wangnak","Sombat","Inplaeng","Nilkhet",
  "Boonta","Maneechan","Srirat","Worawan","Sukpeng","Ngamsawat","Kertdee","Ruangsri","Thawornkul","Jamroen",
  "Somboon","Iam-ngam","Jongrak","Meesuk","Jitta","Karuna","Talaethong","Dokmai","Phraithong","Sodsai",
  "Khamsing","Saengjun","Chuenban","Rachawong","Kaewmanee","Pimsan","Khiao-on","Phumirat","Mahachon","Sukmak",
  "Thamrat","Fuengfu","Chomjan","Sailom","Daoreung","Phukhao","Phairin","Chatchai","Na-nakorn","Pinthong",
  "Jantima","Wilaivan","Mongkolsawat","Sunthorndech","Sereeruk","Boonamporn","Thongsombat","Maieiam","Namdee","Duangchai",
  "Buathong","Kongkaew","Saengthong","Phasuk","Saensuk","Ngamsa-at","Soithong","Daorung","Dueanpen","Rungruang",
  "Thong-in","Palitphon","Silaphet","Krajang","Kaewsawang","Duangdao","Prasarnthong","Jermsri","Puangmalee","Wiangchai",
  "Thanavanich","Malai","Lamjiak","Chomrak","Sirithorn","Sarat","Thipawat","Prueksasawan","Hirun","Polsri",
  "Pitaksilp","Kamthorn","Jarungdech","Chayanun","Singthong","Narinthorn","Thanthong","Apiruj","Seemuean","Permsuk",
  "Tan","Lee","Chang","Liu","Sawang","Mak","Noi","Dee","Ngam","Suk",
  "Chai","Sri","Thong","Kaew","Boon","Porn","Kul","Chom","Pen","Rak",
  "Thai","Petch","Mee","Duang","Som","Siri","Phon","Wat","Phool","Chan",
  "Rod","Rueang","Jit","Lap","Man","Han","Ngern","Mang","Khong","Saeng",
  "Plap","Plod","Pin","Nam","Fah","Din","Lom","Fai","Mok","Fon",
];

export const nicknamesTh = [
  "มด","ไก่","หมู","หนู","เล็ก","ใหญ่","ต้น","ส้ม","โอ๊ต","พิม","แนน","เมย์","เบส","เก่ง","พลอย","มิว","นิว","แบม","มิ้น","ตี๋",
  "ไอซ์","ฟิล์ม","อาร์ม","บอส","เกม","โน้ต","สกาย","เรน","บีม","กอล์ฟ","วิว","ป๊อกป๊อง","ทัช","ก้อง","แบงค์","มาร์ค","ไบรท์","เอิร์ธ","ซัน","มูน",
  "เจ","โจ","พีท","เคน","แม็กซ์","อเล็กซ์","นิค","ลุค","ลีโอ","คริส","แซม","ทอม","ไมค์","เบน","ฝน","ฟ้า","ข้าว","น้ำ","โอ","เอ",
  "พี","เค","จี","ไอ","เอ็ม","วี","ที","ดี","บี","อาร์","เจมส์","แจ็ค","ไทเกอร์","แพน","โดม","แพท","กัน","เฟิร์ส","ออฟ","กัส",
  "ต้า","ก้า","ปิ๊ง","เฟิร์น","ปอ","ตาล","อ๋อง","อิ๊ง","มุก","ปูน","พิ้ง","ครีม","เน้ง","ปาล์ม","เดีย","มาย","อิ่ม","อิ้ง","ปุ๋ย","ตุ้ม",
];

export const nicknamesEn = [
  "Mod","Kai","Moo","Nu","Lek","Yai","Ton","Som","Oat","Pim","Nan","May","Best","Keng","Ploy","Mew","New","Bam","Mint","Tee",
  "Ice","Film","Arm","Boss","Game","Note","Sky","Rain","Beam","Golf","View","Pokpong","Touch","Kong","Bank","Mark","Bright","Earth","Sun","Moon",
  "Jay","Joe","Pete","Ken","Max","Alex","Nick","Luke","Leo","Chris","Sam","Tom","Mike","Ben","Fon","Fah","Khao","Nam","Oh","Ae",
  "Pee","Kay","Gee","Eye","Em","Vee","Tee","Dee","Bee","Ar","James","Jack","Tiger","Pan","Dome","Pat","Kan","First","Off","Gus",
  "Ta","Ka","Ping","Fern","Por","Tarn","Ong","Ing","Mook","Poon","Pink","Cream","Neng","Palm","Dear","My","Im","Eing","Pui","Tum",
];

// -------------------------
// Pair by index (TH <-> EN)
// -------------------------
function zipBilingual(th: string[], en: string[]): Bilingual[] {
  const n = Math.max(th.length, en.length);
  const out: Bilingual[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      th: th[i] ?? en[i] ?? `th_${i}`,
      en: en[i] ?? th[i] ?? `en_${i}`,
    });
  }
  return out;
}

export const firstNamePairs = zipBilingual(firstNamesTh, firstNamesEn);
export const lastNamePairs = zipBilingual(lastNamesTh, lastNamesEn);
export const nicknamePairs = zipBilingual(nicknamesTh, nicknamesEn);

export function randomBilingual(list: Bilingual[]): Bilingual {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomPerson() {
  return {
    first: randomBilingual(firstNamePairs),
    last: randomBilingual(lastNamePairs),
    nickname: randomBilingual(nicknamePairs),
  };
}

// -------------------------
// Backward compatible exports
// (ถ้าโค้ดเก่ายัง import firstNames/lastNames/nicknames)
// -------------------------
export const firstNames = firstNamesTh;
export const lastNames = lastNamesTh;
export const nicknames = nicknamesTh;

export const firstNamesEN = firstNamesEn;
export const lastNamesEN = lastNamesEn;
export const nicknamesEN = nicknamesEn;
