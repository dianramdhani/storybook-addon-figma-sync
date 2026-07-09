---
name: slicing-it
description: 'Melakukan iterasi layout komponen UI secara bertahap agar sesuai dengan spesifikasi desain Figma menggunakan API REST screenshot dev server, dibatasi maksimal 3 siklus validasi untuk memastikan progres menuju kesempurnaan pixel.'
license: MIT
allowed-tools: Bash, FileSystem
---

# Skill Slicing IT

Skill ini memandu AI agent melalui alur kerja regresi visual iteratif untuk menyempurnakan komponen React, HTML, dan CSS yang telah di-slice agar cocok dengan desain Figma dengan tingkat kemiripan mendekati 100%.

---

## Peran & Batasan Anda (Hanya Slicing & Memanggil API)

Sebagai AI agent, tugas Anda **murni hanya terbatas pada**:

1. **Slicing**: Mengubah kode (HTML, React, CSS, atau Tailwind) di dalam folder komponen yang ditentukan untuk meningkatkan kecocokan desain.
2. **Memanggil API**: Menjalankan perintah pemanggilan (hit) URL endpoint API perbandingan untuk mendapatkan skor kemiripan dan memperbarui file diff di local disk.

**DILARANG KERAS** menulis skrip screenshot sendiri, mengotomasi browser menggunakan Playwright/Puppeteer, atau menjalankan browser headless. **Satu-satunya metode** bagi Anda untuk memvalidasi hasil slicing adalah dengan memanggil URL `/api/figma-sync/screenshot` dan memeriksa nilai skor kemiripan serta gambar diff yang dihasilkan di local disk.

---

## Cara Memulai & Input Pengguna (Perintah `/slice-it`)

AI Agent diaktifkan menggunakan perintah dengan format berikut:

```bash
/slice-it <TARGET_FILE> <FIGMA_PNG_PATH>
```

_Contoh:_ `/slice-it src/stories/benefits/index.tsx .storybook/.storybook-addon-sync-figma/figma-sentri-benefits--tablet.png`

Sebagai AI Agent, ketika Anda menerima perintah ini, lakukan langkah ekstraksi data berikut secara otomatis:

1. **Target File & Folder**: Jadikan `<TARGET_FILE>` sebagai file utama untuk menulis perbaikan layout/slicing. Folder komponen adalah folder tempat file tersebut berada.
2. **Ekstraksi Story ID**: Ekstrak **Story ID** secara otomatis dari nama file pada `<FIGMA_PNG_PATH>`. File figma overlay selalu mengikuti pola nama `figma-<storyId>.png`.
   - _Contoh:_ Dari `.storybook/.storybook-addon-sync-figma/figma-sentri-benefits--tablet.png`, maka **Story ID** Anda adalah `sentri-benefits--tablet`.

> [!IMPORTANT]
> Jika argumen perintah `/slice-it` di atas belum lengkap diberikan oleh pengguna, Anda **wajib menanyakan informasi tersebut dalam Bahasa Inggris**.
>
> _Contoh:_ "Please provide the target code file path and the figma overlay PNG path."

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

## Alur Kerja Iterasi (Maksimal 3 Siklus)

Anda wajib membatasi proses iterasi **maksimal 3 siklus** untuk mencegah loop tak terbatas. Hentikan iterasi lebih awal jika skor kemiripan telah mencapai 100% atau memenuhi target tinggi (misalnya >=98%).

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
- Jika tingkat kemiripan bernilai `100.00` atau Anda telah menyelesaikan iterasi ke-3, hentikan proses dan buat laporan akhir.

### Langkah 3: Analisis Perbedaan Visual

Jika tingkat kemiripan berada di bawah target:

1. Temukan file gambar perbedaan (diff image) yang tertera di `diffSrc` (berlokasi di `.storybook/.storybook-addon-sync-figma/diff-<story-id>.png`).
2. Identifikasi perbedaan pixel yang ditandai warna merah pada gambar diff. Periksa hal-hal berikut:
   - Jarak margin atau padding yang kurang sesuai.
   - Ukuran font (font size), ketebalan (weight), atau tipe font yang salah.
   - Posisi alignment Flexbox atau CSS Grid.
   - Ketidaksesuaian warna, border, atau bayangan (shadow).

### Langkah 4: Perbarui Kode Komponen

Ubah CSS, utility classes Tailwind, atau struktur JSX di dalam **Folder Komponen** untuk memperbaiki perbedaan visual tersebut.

### Langkah 5: Tunggu dan Ulangi

Tunggu 1–2 detik agar dev server Storybook mendeteksi perubahan dan melakukan compile ulang, lalu ulangi proses mulai dari **Langkah 1**.

---

## Laporan Output

Di akhir iterasi, tampilkan laporan ringkasan dalam format berikut:

### Laporan Hasil Slicing Iterasi

- **Story ID**: `sentri-benefits--default`
- **Folder Komponen**: `src/components/Benefits`

#### Riwayat Iterasi

- **Iterasi 1**:
  - Skor: `90.15%`
  - Tindakan: Mengubah padding dari `p-4` menjadi `p-6` pada container utama untuk menyamakan jarak dengan Figma.
- **Iterasi 2**:
  - Skor: `96.80%`
  - Tindakan: Mengubah font weight judul dari `font-medium` menjadi `font-semibold` dan ukuran teks dari `text-sm` menjadi `text-base`.
- **Iterasi 3**:
  - Skor Akhir: `99.12%`
  - Tindakan: Mengubah warna background ikon dari `bg-blue-500` menjadi `bg-blue-600` agar sesuai dengan warna Figma.

#### Hasil Akhir

- **Tingkat Kemiripan Akhir**: **`99.12%`**
- **Link Diff Image**: [diff-sentri-benefits--default.png](file:///.storybook/.storybook-addon-sync-figma/diff-sentri-benefits--default.png)
