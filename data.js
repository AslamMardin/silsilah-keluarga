/* ==========================================================
   DATA SILSILAH — edit file ini saja, kode lain tidak perlu diubah.
   - Letakkan gambar hasil ekspor CorelDRAW di folder images/
   - Tulis path gambar sesuai nama file Anda (.webp / .jpg / .png)
   ========================================================== */

const SITE = {
  title: "Silsilah Keluarga Besar",
  subtitle: "Yoke",                 // ubah sesuai nama keluarga besar
  fullImage: "img/ABIDIN.jpg"                // ganti dengan path gambar silsilah lengkap
};

const FAMILIES = [
  {
    id: 1,                              // unik, tanpa spasi
    name: "Keluarga Abidin",
    image: "img/ABIDIN.jpg",
    description: "Cabang keturunan Bapak H. Cica",
    members: ["aslam", "mardin", "asriah", "asma", "anjung", "ado", "ardi"]
  },
  {
    id: 2,
    name: "Keluarga Hasan",
    image: "images/keluarga/hasan.webp",
    description: "Cabang keturunan Bapak Hasan",
    members: ["Hasan", "Fatimah", "Andi Hasan", "Nur Hasan"]
  },
  {
    id: 3,
    name: "Keluarga Umar",
    image: "images/keluarga/umar.webp",
    description: "Cabang keturunan Bapak Umar",
    members: ["Umar", "Khadijah", "Yusuf Umar", "Aisyah Umar", "Rahmat Umar"]
  }
  // Tambah keluarga baru: salin satu blok di atas, ubah isinya.
];
