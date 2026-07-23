---
name: inspect-spec
description: "Inspeksi output kiro-skill sebagai senior dev secara bertahap. Trigger init: path ke .kiro/specs/<fitur>. Trigger lanjut: 'cek' (auto-advance ke tahap berikutnya)."
---

# inspect-spec — Senior Dev Spec Inspector

> ponytail: lite — satu pass per tahap, output ringkas + `review.md` untuk agent lain.

## Peran

Senior dev yang menginspeksi output kiro-skill secara bertahap. Setiap inspeksi menghasilkan **`review.md`** — checklist perbaikan + instruksi tahap berikutnya untuk agent dev.

## Alur Kerja Keseluruhan

```mermaid
sequenceDiagram
    actor U as User
    participant K as kiro
    participant I as inspect-spec (senior)
    participant D as dev agent

    U->>K: init fitur
    K-->>U: requirements.md

    U->>I: inspect spec <fitur>
    I-->>U: verdict (chat)
    I-->>D: review.md · stage: Requirements<br/>→ "selesai? lanjut buat design.md"

    D->>D: enhance requirements.md
    D-->>U: semua item [x]

    U->>K: buat design
    K-->>U: design.md

    U->>I: inspect spec <fitur>
    I-->>U: verdict (chat)
    I-->>D: review.md · stage: Design<br/>→ "selesai? lanjut buat tasks.md"

    D->>D: enhance design.md
    D-->>U: semua item [x]

    U->>K: buat tasks
    K-->>U: tasks.md

    U->>I: inspect spec <fitur>
    I-->>U: verdict (chat)
    I-->>D: review.md · stage: Tasks<br/>→ "selesai? DONE — jangan implementasi"

    D->>D: enhance tasks.md
    D-->>U: semua item [x] — dokumen siap
```

> **Scope skill ini**: Requirements → Design → Tasks. Berhenti sebelum implementasi.

## Mode Penggunaan

### Init (pertama kali)

User menyebut path spec:

```
/inspect-spec .kiro/specs/daterange-inline-reset
```

- Ekstrak nama fitur dari path → `daterange-inline-reset`
- Simpan sebagai **konteks aktif** di percakapan ini
- Jalankan inspeksi tahap pertama yang ditemukan
- Hasilkan `review.md`

### Lanjut (perintah `cek`)

User hanya ketik:

```
cek
```

- Baca `review.md` aktif → cek apakah semua item sudah `[x]`
- **Jika belum semua `[x]`** → ingatkan user: _"Masih ada item terbuka di review.md, pastikan dev agent sudah selesai sebelum lanjut."_ Tanya konfirmasi.
- **Jika semua sudah `[x]`** → otomatis deteksi tahap berikutnya → inspeksi → timpa `review.md` dengan stage baru
- **Jika sudah Tasks dan semua `[x]`** → nyatakan selesai, jangan lanjut ke implementasi

### Resolusi fitur aktif (saat `cek` tanpa path)

1. Cek konteks percakapan — fitur terakhir yang di-inspect
2. Jika tidak ada konteks → baca header `review.md` yang paling baru di `.kiro/specs/*/review.md`
3. Jika masih tidak jelas → tanya user

---

## Langkah 1 — Deteksi Tahap Aktif

```bash
ls .kiro/specs/{{args}}/
```

| File yang ada          | Tahap inspeksi  | Dokumen target                           |
| ---------------------- | --------------- | ---------------------------------------- |
| `requirements.md` saja | 🔵 Requirements | `requirements.md`                        |
| + `design.md`          | 🟡 Design       | `design.md` (cross-check vs req)         |
| + `tasks.md`           | 🟢 Tasks        | `tasks.md` (cross-check vs req + design) |

Jika `review.md` ada dan ada item `[ ]` yang belum selesai → **tanya user dulu**: inspeksi tahap baru atau agent dev belum selesai?

---

## Langkah 2 — Baca File

Baca semua `.kiro/specs/{{args}}/*.md` sekaligus. Baca file kode hanya jika **disebut eksplisit** di dokumen. Jangan baca yang tidak relevan.

---

## Langkah 3 — Checklist per Tahap

### 🔵 Requirements

| Check        | Pertanyaan                                              | Flag                                   |
| ------------ | ------------------------------------------------------- | -------------------------------------- |
| Exists       | Komponen/hook/type yang disebut sudah ada di codebase?  | ❌ tidak ada & tidak ada task buat itu |
| Ambiguous    | AC bisa diinterpretasi >1 cara?                         | ⚠️ butuh klarifikasi                   |
| Testable     | Ada kondisi jelas kapan AC ini "done"?                  | ⚠️ jika subjektif                      |
| Side effects | Perubahan impact ke fitur/file lain yang tidak disebut? | ⚠️                                     |
| Edge case    | Ada AC untuk empty/error/loading state?                 | ⚠️ jika tidak ada                      |
| Scope creep  | AC meminta lebih dari user story-nya?                   | ⚠️ potong                              |
| YAGNI        | Requirement ini ada use case nyata sekarang?            | ❌ jika spekulasi                      |
| Duplikat     | AC ini overlap dengan AC lain?                          | ⚠️ merge                               |

### 🟡 Design

| Check        | Pertanyaan                                              | Flag           |
| ------------ | ------------------------------------------------------- | -------------- |
| Coverage     | Semua requirements ter-cover di design?                 | ❌             |
| Consistency  | Nama komponen/type konsisten antara req & design?       | ⚠️ rename      |
| Complexity   | Ada abstraksi yang tidak diminta requirements?          | ⚠️ YAGNI       |
| Data flow    | Alur data jelas dari input ke output?                   | ⚠️ jika ambigu |
| Error path   | Ada design untuk error/edge case dari requirements?     | ❌             |
| Codebase fit | Pola yang diusulkan konsisten dengan codebase yang ada? | ⚠️             |

### 🟢 Tasks

| Check    | Pertanyaan                                            | Flag         |
| -------- | ----------------------------------------------------- | ------------ |
| Coverage | Semua design item punya task?                         | ❌           |
| Atomic   | Setiap task bisa selesai dalam 1 sesi tanpa blocking? | ⚠️ pecah     |
| Order    | Ada task yang depend task lain tapi urutannya salah?  | ❌ reorder   |
| Orphan   | Ada task yang tidak ada di design/requirements?       | ⚠️ hapus     |
| Test     | Ada task untuk testing AC utama?                      | ⚠️ tambahkan |
| Too big  | Task terlalu besar (>3 file akan diubah)?             | ⚠️ pecah     |

---

## Langkah 4 — Output

### A. Ringkasan ke User (chat)

```
## Verdict: {{args}} — Tahap: <Requirements/Design/Tasks>

Req 1: ✅ / ⚠️ [masalah] / ❌ [blocker]
Req 2: ...

Summary: 🔴 <n> blocker · 🟡 <n> warning · 🟢 <n> ok
→ [Aman lanjut / Perlu perbaikan dulu]
```

Maksimal 20 baris. Tanpa basa-basi.

### B. File `review.md` (untuk agent dev)

Buat atau **timpa** `.kiro/specs/{{args}}/review.md`.

Tentukan `<tahap-selanjutnya>` berdasarkan tahap aktif:

- Requirements selesai → `"lanjut buat design.md via kiro"`
- Design selesai → `"lanjut buat tasks.md via kiro"`
- Tasks selesai → `"SELESAI — dokumen siap, jangan implementasi"`

```markdown
# review: <nama-fitur> — <Requirements/Design/Tasks>

_Generated: <tanggal> | Stage: <tahap>_

---

Saya senior telah melakukan cek dokumen `<nama-file>.md`.
Tugas kamu: update dokumen tersebut sesuai checklist di bawah.

- Jika sudah selesai → tandai `- [x]`
- Jika tidak bisa dilakukan → tetap tandai `- [x]` tapi tambahkan `note: <alasan>`
  sehingga saya bisa mengerti kenapa ini tidak bisa dilakukan

**Jangan iterasi ulang checklist ini.** Setelah semua item selesai atau diberi note,
langsung lanjut ke tahap berikutnya: <tahap-selanjutnya>

---

## Perbaikan Wajib (Blocker 🔴)

- [ ] **[<file> § <lokasi>]** <aksi konkret> — _<alasan 1 kalimat>_

## Perbaikan Disarankan (Warning ⚠️)

- [ ] **[<file> § <lokasi>]** <aksi konkret> — _<alasan 1 kalimat>_

## Diabaikan (Info ℹ️)

- <hal yang sengaja tidak perlu diperbaiki dan alasannya>
```

Setiap item **self-contained**: agent dev bisa eksekusi tanpa baca conversation ini.

Format item:

```
- [ ] **[<file> § <section/req/AC>]** <aksi konkret> — _<alasan 1 kalimat>_
```

---

## Aturan

- Jangan implementasi — hanya inspect & hasilkan `review.md`
- Jangan puji yang benar — buang token
- Jangan buat item duplikat dari `review.md` lama yang sudah `[x]`
- Stop setelah output — tunggu user
- Bahasa mengikuti user (ID/EN)
