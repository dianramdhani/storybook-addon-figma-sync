---
name: slicing-it
description: 'Melakukan iterasi layout komponen UI secara bertahap agar sesuai dengan spesifikasi desain Figma menggunakan API REST screenshot dev server untuk memastikan progres menuju kesempurnaan pixel.'
license: MIT
allowed-tools: Bash, FileSystem
---

# Skill Slicing IT

Skill ini memandu AI agent melalui alur kerja regresi visual iteratif untuk menyempurnakan komponen React, HTML, dan CSS yang telah di-slice agar cocok dengan desain Figma dengan tingkat kemiripan di atas 90%.

---

## Peran & Batasan Anda (Hanya Slicing & Memanggil API)

Sebagai AI agent, tugas Anda **murni hanya terbatas pada**:

1. **Slicing**: Mengubah kode (HTML, React, CSS, atau Tailwind) di dalam folder komponen yang ditentukan untuk meningkatkan kecocokan desain.
2. **Memanggil API**: Menjalankan perintah pemanggilan (hit) URL endpoint API perbandingan untuk mendapatkan skor kemiripan.

> [!IMPORTANT]
> **ATURAN UTAMA & LARANGAN KERAS:**
>
> 1. **DILARANG KERAS** menulis skrip screenshot sendiri, mengotomasi browser menggunakan Playwright/Puppeteer, atau menjalankan browser headless.
> 2. **DILARANG KERAS menggunakan tool `view_file` atau perintah bash untuk membaca/membuka file gambar** (seperti `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`) di dalam folder `.storybook/.storybook-addon-figma-sync/` atau folder lainnya. Membaca data gambar binary akan menghabiskan batas token context Anda secara drastis!
> 3. **Fokus Anda adalah membandingkan kode menggunakan**:
>    - **Sumber Desain**: Output teks terstruktur (Markdown) dari tool MCP `figma/get_figma_data`.
>    - **Alat Pembanding**: Nilai persentase skor `similarity` yang dikembalikan dari API `/api/figma-sync/screenshot?storyId=<STORY_ID>`.
> 4. Gambar perbedaan (diff image) hanya ditujukan untuk dilihat oleh pengguna manusia secara visual melalui browser mereka, bukan untuk dibaca oleh AI Agent.
> 5. **GAYA KOMUNIKASI MINIMAL (Silent Mode)**: Jangan terlalu banyak bicara atau menjelaskan detail perubahan teknis ke pengguna. Cukup beri tahu pengguna nomor iterasi Anda saat ini (misal: "Iterasi 1...", "Iterasi 2...") dan nilai similarity score terbaru. Jangan mencetak output verbose/panjang di chat atau terminal.
> 6. **DESAIN KODE MINIMALIS (YAGNI/Minimum Code)**: Tulis kode sesederhana dan seminim mungkin yang penting berfungsi (mencapai target kemiripan). Sebelum menulis kode, pastikan setiap baris atau blok kode benar-benar diperlukan. Gunakan native platform feature atau CSS/Tailwind bawaan tanpa membuat abstraksi baru yang rumit. Hindari dependensi tambahan dan boilerplate. Tandai penyederhanaan sengaja dengan komentar singkat di kode.
> 7. **SISTEM DESAIN & UI KIT PROYEK (NO INLINE STYLES)**: Sebelum melakukan slicing pada komponen, baca berkas `package.json` dan `components.json` (jika ada) untuk mengidentifikasi UI kit yang dipakai proyek (misalnya **Shadcn UI** dengan path `@/stories/ui` atau `src/stories/ui`). **DILARANG KERAS menggunakan inline styles** (`style={{ ... }}`) untuk layouting, padding, margin, warna, atau font. Gunakan utility classes Tailwind CSS (v4/v3 sesuai konfigurasi) dan reuse komponen Shadcn UI yang sudah terpasang alih-alih merangkai elemen HTML dasar secara manual.
> 8. **DILARANG KERAS MENULIS / MENJALANKAN SKRIP MANIPULASI GAMBAR**: Dilarang keras menulis atau mengeksekusi skrip pemrograman kustom (Python menggunakan PIL/Pillow, Node.js, zx, bash, OpenCV, dll.) untuk membandingkan pixel, membaca ukuran gambar, atau menganalisis perbedaan gambar secara mandiri. Gunakan **hanya** respons JSON resmi dari API `/api/figma-sync/screenshot` untuk mendapatkan nilai persentase similarity. Jangan membuang-buang token dan langkah eksekusi dengan membuat skrip/alat analisis visual sendiri.
> 9. **ALUR STRUKTUR & LAYOUTING (NO EXTRA WRAPPERS)**: Gunakan sesedikit mungkin elemen pembungkus (DOM nodes/flat structure). Jangan pernah membungkus satu elemen tunggal dengan `div` hanya untuk menerapkan padding/margin jika padding/margin tersebut bisa diterapkan langsung pada elemen target itu sendiri. Terapkan alur kerja penyusunan layout berikut:
>    - **Langkah 1 (Padding First)**: Tentukan padding kontainer utama/target terlebih dahulu untuk menetapkan batas wilayah terluar secara akurat.
>    - **Langkah 2 (Layout & Spacing)**: Tentukan layout yang paling cocok (CSS Grid atau Flexbox) beserta nilai `gap` (jarak antar elemen anak) yang sesuai, alih-alih memberikan margin individual pada masing-masing elemen anak secara acak.

---

## Cara Memulai & Input Pengguna (Perintah `/slice-it`)

AI Agent diaktifkan menggunakan perintah dengan format berikut:

```bash
/slice-it <TARGET_FILE> [FIGMA_PNG_PATH_OR_URL]
```

_Contoh:_

- `/slice-it src/stories/hero-about/index.tsx` (Metode Deteksi Otomatis)
- `/slice-it src/stories/benefits/index.tsx .storybook/.storybook-addon-figma-sync/figma-sentri-benefits--tablet.png`

Sebagai AI Agent, ketika Anda menerima perintah ini, lakukan langkah deteksi data berikut secara otomatis:

1. **Target File & Folder**: Jadikan `<TARGET_FILE>` sebagai file utama untuk menulis perbaikan layout/slicing. Folder komponen adalah folder tempat file tersebut berada.
2. **Auto-Discovery Story ID**:
   - Jika `[FIGMA_PNG_PATH_OR_URL]` tidak diberikan:
     - Cari file `.stories.tsx` atau `.stories.jsx` di direktori yang sama dengan `<TARGET_FILE>`.
     - Baca isinya untuk mendapatkan Storybook `title` (misal: `'Sentri/HeroAbout'`) dan nama Story yang diekspor (misal: `Default`, `Tablet`, `Mobile`).
     - Bentuk **Story ID** berdasarkan aturan penamaan Storybook. Contoh: `title: 'Sentri/HeroAbout'` dan story `Default` -> ID: `sentri-heroabout--default` (gunakan default story terlebih dahulu kecuali ada instruksi lain).
   - Jika `[FIGMA_PNG_PATH_OR_URL]` diberikan sebagai path gambar:
     - Ekstrak **Story ID** secara otomatis dari nama file pada `[FIGMA_PNG_PATH_OR_URL]`. File figma overlay selalu mengikuti pola nama `figma-<storyId>.png` atau sejenisnya.
3. **Auto-Discovery Figma URL / Node ID**:
   - Cari di file `.stories.tsx` apakah terdapat parameter Figma Link (misalnya `parameters: { figma: '...' }`).
   - Baca `.storybook/.storybook-addon-figma-sync/registry.json`. Cari entri dengan `storyId` yang sesuai untuk melihat apakah terdapat properti `figmaUrl`.
   - Jika `figmaUrl` sama sekali tidak ditemukan dan Anda membutuhkan spesifikasi desain Figma terstruktur untuk Langkah 0, minta pengguna untuk menyediakannya.

> [!IMPORTANT]
> Jika target file tidak ditemukan atau argumen perintah `/slice-it` di atas tidak valid, Anda **wajib menanyakan konfirmasi atau informasi tambahan kepada pengguna**.

---

## Prasyarat Sebelum Memulai

Sebelum menjalankan proses iterasi, pastikan bahwa:

1. **Server Storybook berjalan** (biasanya di `http://localhost:6006`).
2. **Halaman preview Storybook sudah terbuka** di salah satu tab browser pengguna.
3. **`FIGMA_TOKEN` telah di-set** di dalam file `.env` di root proyek.
4. **Figma Overlay Sudah Diunduh**: Pengguna (user) harus sudah mengunduh Figma overlay secara manual terlebih dahulu melalui UI Storybook, sehingga file gambar Figma overlay lokal telah ter-cache di local disk. Jika belum ada, perintahkan pengguna untuk mengunduh Figma overlay tersebut terlebih dahulu.

Jika ada prasyarat di atas yang belum terpenuhi:

- Hentikan pekerjaan Anda dan perintahkan pengguna untuk menyalakan/melengkapi prasyarat tersebut terlebih dahulu sebelum Anda melanjutkan.

---

## Langkah 0: Ambil Spesifikasi Desain Terstruktur (Figma-Context-MCP)

Sebelum melakukan perubahan kode pertama kali, Anda **wajib** mengambil spesifikasi tata letak, warna, typography, dan padding terstruktur dari Figma agar perubahan pertama memiliki tingkat akurasi yang tinggi:

1. **Cari Figma URL**:
   - Baca file `.storybook/.storybook-addon-figma-sync/registry.json`. Cari entri dengan `storyId` yang sesuai untuk mendapatkan nilai `figmaUrl`.
   - Jika `figmaUrl` tidak ditemukan di registry, minta pengguna untuk menyediakannya: _"Please provide the Figma URL for this story so I can fetch its layout data."_
2. **Ekstrak File Key & Node ID**:
   - Dari `figmaUrl` (misal: `https://www.figma.com/design/AbCd/My-Component?node-id=102-345`), ambil:
     - **File Key**: `AbCd` (bagian setelah `/design/` atau `/file/`).
     - **Node ID**: `102:345` (parameter query `node-id`, ganti karakter `-` dengan `:` jika ada).
3. **Panggil Tool MCP `get_figma_data`**:
   - Jalankan tool `get_figma_data` dari server MCP `figma` dengan parameter:
     ```json
     {
       "fileKey": "<FILE_KEY>",
       "nodeId": "<NODE_ID>"
     }
     ```
4. **Gunakan Data Spesifikasi**:
   - Gunakan data CSS/layout (padding, margin, gap, alignment, typography, warna hex, dll.) hasil keluaran tool tersebut sebagai panduan utama dalam menulis kode komponen React/HTML/CSS target.

---

## Alur Kerja Iterasi

Lakukan iterasi perbaikan secara bertahap. Hentikan iterasi jika skor kemiripan telah mencapai atau melebihi 90%, atau jika Anda merasa perubahan otomatis lebih lanjut memerlukan intervensi manual dari pengguna.

### Langkah 1: Panggil API Perbandingan

Picu endpoint dev server perbandingan untuk mengambil screenshot story dan menghitung persentase kemiripan pixelmatch menggunakan salah satu metode di bawah ini. Ganti `<STORY_ID>` dengan ID story Storybook. **Jangan mengirimkan parameter figmaUrl** agar AI tidak melakukan request figma berulang-ulang yang bisa menyebabkan pemblokiran.

#### Opsi A: Menggunakan curl (Linux / macOS / Git Bash)

```bash
curl -s "http://localhost:6006/api/figma-sync/screenshot?storyId=<STORY_ID>"
```

#### Opsi B: Menggunakan Node.js (Lintas Platform - Direkomendasikan jika curl tidak ada)

```bash
node -e "fetch('http://localhost:6006/api/figma-sync/screenshot?storyId=<STORY_ID>').then(r => r.json()).then(console.log)"
```

#### Opsi C: Menggunakan Python

```bash
python3 -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://localhost:6006/api/figma-sync/screenshot?storyId=<STORY_ID>').read().decode()))"
```

#### Opsi D: Menggunakan PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "http://localhost:6006/api/figma-sync/screenshot?storyId=<STORY_ID>"
```

### Langkah 2: Evaluasi Skor Kemiripan

Respon API akan mengembalikan payload JSON seperti berikut:

```json
{
  "success": true,
  "figmaSrc": "/absolute/path/to/figma-*.png",
  "screenshotSrc": "/absolute/path/to/ss-*.png",
  "diffSrc": "/absolute/path/to/diff-*.png",
  "similarity": 94.25
}
```

- Ekstrak skor `similarity`.
- Jika tingkat kemiripan bernilai `>= 90.00` atau jika Anda mendeteksi bahwa penyesuaian lebih lanjut memerlukan intervensi manual dari pengguna, hentikan proses dan buat laporan akhir.

### Langkah 3: Analisis Perbedaan Visual

Jika tingkat kemiripan berada di bawah target:

1. **JANGAN SEKALI-KALI mencoba membuka atau membaca file gambar diff** menggunakan tool file system apa pun (ini memboroskan token).
2. Lakukan evaluasi secara logis dengan membandingkan kode saat ini dengan data spesifikasi desain terstruktur dari **Langkah 0** (Figma-Context-MCP).
3. Bandingkan secara mandiri nilai CSS/styling antara kode saat ini dengan data spesifikasi Figma (misal: penamaan variabel warna, ketebalan font, ukuran font, line-height, dll.) untuk mendeteksi perbedaan visual.

### Langkah 4: Perbarui Kode Komponen

Ubah utility classes Tailwind, atau struktur JSX di dalam **Folder Komponen** untuk memperbaiki perbedaan visual tersebut. Pastikan menggunakan utility classes Tailwind CSS dan mengimpor komponen Shadcn UI yang sudah tersedia di proyek (dari folder `@/stories/ui` atau path alias `@/ui`). **DILARANG KERAS** menggunakan inline styles (`style={{ ... }}`).

### Langkah 5: Ulangi Proses

Ulangi proses mulai dari **Langkah 1** setelah kode komponen diperbarui (pastikan dev server Storybook telah memuat ulang perubahan terbaru).

---

## Laporan Output

Di akhir iterasi, tampilkan laporan ringkasan dalam format berikut:

### Laporan Hasil Slicing Iterasi

- **Story ID**: `sentri-benefits--default`
- **Folder Komponen**: `src/components/Benefits`
- **Figma Node URL**: `https://www.figma.com/design/...`

#### Riwayat Iterasi

- **Langkah 0 (Figma Spec)**: Berhasil mendapatkan spesifikasi desain terstruktur dari Figma-Context-MCP.
- **Iterasi 1**:
  - Skor: `85.15%`
  - Tindakan: Mengubah padding dari `p-4` menjadi `p-6` dan font size dari `text-sm` ke `text-base` berdasarkan data spec Figma.
- **Iterasi 2**:
  - Skor Akhir: `92.80%`
  - Tindakan: Mengubah font weight judul dari `font-medium` menjadi `font-semibold` sesuai style Figma.

#### Hasil Akhir

- **Tingkat Kemiripan Akhir**: **`92.80%`**
