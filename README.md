# 🛒 FamFetch

FamFetch คือแอปพลิเคชันจัดการของใช้และรายการซื้อของภายในครอบครัว ที่ออกแบบมาเพื่อแก้ปัญหาความขี้เกียจและลดขั้นตอนการทำงานที่ซ้ำซ้อน โดยเน้นความเร็วในการใช้งาน (Context Switching) และความแม่นยำของข้อมูลราคาเป็นหลัก

---

## 📸 Screenshots

| 🏠 Home | 👑 Family Management | 📦 Master Inventory |
| :---: | :---: | :---: |
| <img width="250" alt="auth-home" src="https://github.com/user-attachments/assets/d8bc3928-2d96-41ce-9f8e-bcc458252542" /> | <img width="250" src="https://github.com/user-attachments/assets/885baac4-8fab-4a81-89d6-cbab9da2bf5a" /> | <img width="250" src="https://github.com/user-attachments/assets/ee887747-174d-4d12-92eb-ea7b4ab825f3" /> |
| *ด่านแรกและการเข้าถึง* | *จัดการคนในบ้าน* | *คลังของใช้ส่วนกลาง* |

| 🛒 Shopping Trip | 📈 Price Analytics | ⚙️ Quick Settings |
| :---: | :---: | :---: |
| <img width="250" src="https://github.com/user-attachments/assets/d1dff458-664b-49b3-8e40-ba026fcb3b0e" /> | <img width="250" src="https://github.com/user-attachments/assets/98bb12a3-01d2-4dfd-9b1a-567680572e4c" /> | <img width="250" src="https://github.com/user-attachments/assets/9b54361d-e94a-4f89-be19-1a37046f93a5" />|
| *เปิดบิลจดของ* | *วิเคราะห์ราคาย้อนหลัง* | *การตั้งค่าที่เข้าถึงง่าย* |

---

## ✨ Key Features
* **👑 Family Management (RLS Powered):** ระบบจัดการสมาชิกครอบครัวที่ปลอดภัยด้วย Row Level Security (RLS) รองรับการโอนสิทธิ์หัวหน้าครอบครัว, การเตะสมาชิกออก และการจัดการรหัสเข้าร่วมบ้านที่แม่นยำ
* **📦 Master Inventory:** คลังสินค้าส่วนกลางประจำบ้าน ทำหน้าที่เป็นฐานข้อมูล (Master Data) ของใช้ที่ซื้อบ่อย ช่วยให้การเปิดบิลใหม่ทำได้รวดเร็วเพียงไม่กี่คลิก
* **🛒 Smart Shopping Lists:** ระบบเปิดทริปซื้อของที่ดึงข้อมูลจากคลังสินค้ามาใช้ได้ทันที รองรับการทำงานแบบเรียลไทม์ บันทึกสถานะการซื้อและผู้จ่ายเงินได้เป๊ะๆ
* **📈 Price Analytics (The Killer Feature):** ระบบติดตามราคาย้อนหลัง จับผิดราคาตลาด และวิเคราะห์เทรนด์ราคา (Trending Up/Down) เพื่อช่วยให้ครอบครัวประหยัดค่าใช้จ่ายได้จริง
* **🎨 Modern UI/UX:** นำทางด้วย Bottom Tab Navigation

---

## 🛠️ Tech Stack
* **Frontend:** React Native (Expo)
* **Navigation:** Expo Router (Tabs & Stacks)
* **Styling:** NativeWind (TailwindCSS)
* **Database & Auth:** Supabase (PostgreSQL, Auth, RLS Policies)
* **Icons:** Lucide React Native

---
