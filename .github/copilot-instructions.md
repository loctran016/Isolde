# Isolde - Copilot Agent Instructions

## Project Identity

- `Isolde` là web app cá nhân (PWA) gồm: kho tri thức y khoa (`/notes`), luyện đề trắc nghiệm y khoa (PMT EMS), theo dõi thể chất (Fitness), nhật ký lâm sàng/kỹ năng (Medic), thiền định và thói quen.
- Stack thực tế: **Nuxt 4.6.2**, **Vue 3.5.44**, **TypeScript 7**, **UnoCSS 66.11 / `@unocss/nuxt`**, **Reka UI 2.11**, **`@nuxtjs/supabase` 2.1**, **comark-content 0.4.1** và **`@comark/nuxt` 0.9**. Các thư viện khác gồm: ECharts 6 / `nuxt-echarts`, TanStack Vue Table 8, ExcelJS 4, abcjs 6, `@nuxtjs/cloudinary` 4 và Motion, Regle, VueUse.
- Dùng **Bun** cho cài đặt và dev/build tùy package script: `bun install`, `bun run dev`, `bun run build`. Package scripts hiện dùng `node` để chạy phần lớn script mjs/CLI; không thay bằng `npm`/`yarn`/`pnpm`.
- Chạy được trên Linux/WSL/macOS/Windows: dùng Node `path` trong JS và `pathlib.Path` trong Python, không hardcode dấu `/` hay `\`.
- Người dùng là sinh viên y; nội dung học thuật chủ yếu bằng **tiếng Việt**. Comment và UI text giữ tiếng Việt nhất quán với code hiện có.
- Dự án **không dùng `@nuxt/content`**. Comark-content là nguồn Markdown thực tế; không import `@nuxt/content`, không dùng `queryContent` hay `queryCollection`.

## Quy tắc làm việc với người dùng (QUAN TRỌNG)

- **Trả về TOÀN BỘ file sau khi sửa**, không dùng diff/patch hay "...phần còn lại giữ nguyên". Diff không dùng được với quy trình của người dùng.
- Làm việc theo từng yêu cầu một. Không tự mở rộng phạm vi, không refactor ngoài yêu cầu.
- **Không sửa code mà người dùng đã chủ động chỉnh tay.** Khi người dùng đánh dấu một đoạn là "đã sửa local", giữ nguyên nó và chỉ sửa phần được yêu cầu.
- Nếu chẩn đoán lỗi của người dùng có vẻ sai, hoặc người phản bác chẩn đoán của bạn: kiểm tra lại từ code thực tế, không đoán và không xuôi theo.
- Trước khi đổi tên/xóa thứ có thể phá vỡ dữ liệu (cột Supabase, key localStorage, đường dẫn JSON, slug note), nêu rõ tác động trước khi làm.

## Cấu trúc thư mục (Nuxt 4)

```text
/
|-- app/
|   |-- app.vue
|   |-- assets/            # data/tunes/*.abc, svg/body-front.svg, body-back.svg
|   |-- components/
|   |   |-- exams/         # ExamCheckInDialog, ExamQuestionCard, ExamPaletteDrawer, ExamNoteRefDrawer
|   |   |-- fitness/       # MuscleHeatmap, BodyMetricForm, StrengthForm, CardioForm, chart/table
|   |   |-- home/          # PomodoroTimer, HomeAdvice, MusicPlayer, TibetanHolyDays
|   |   |-- music/         # ABCRenderer, MetronomeButton
|   |   |-- notes/         # NoteDetails, NoteSearch, NoteMarkmap, NoteSpeech
|   |   `-- prose/         # ProseImg và renderer Markdown
|   |-- composables/       # useExamSession, useMeditationExport, useNotesNav, useNoteLanding, useTheme, useWorkoutStats
|   |-- data/              # fitness.js, medic.ts, meditationPractices.ts, noteSubject.ts
|   |-- layouts/           # default.vue, note.vue
|   |-- pages/
|   |   |-- index, login, confirm, gallery, habit, learn, musical
|   |   |-- fitness/, medic/, meditate/, notes/
|   |   `-- exams/[id].vue # route phòng thi toàn màn hình
|   |-- plugins/           # pwa-idle-register.client.ts, theme.client.ts
|   |-- types/             # database.types.ts, quiz.types.ts
|   `-- utils/             # client-content.ts, islands.ts
|-- content/               # submodule/nguồn Obsidian; scripts không quét thư mục đề thi
|-- dictionary/medical_term.txt
|-- public/
|   |-- graph.json         # Sinh bởi build-graph.mjs
|   |-- audios/            # Sinh bởi workflow TTS
|   `-- data/exams/        # File đề đồng bộ từ content/exams/
|-- scripts/               # build-graph, format-md, sync-exams, extract-tts, tts-text, generate_tts
|-- server/
|   |-- api/               # Catch-all Comark, gallery, Tibetan week, debug
|   |-- plugins/           # content-watch
|   `-- utils/             # content.ts, pdf-plugin.ts
|-- .github/workflows/     # markdownlint, pagespeed, tts
|-- nuxt.config.ts / uno.config.js / package.json / bun.lock
```

> Tin vào cấu trúc repo thực tế. Khi tên folder/route thay đổi, cập nhật hướng dẫn thay vì giữ tên cũ.

## Quy tắc bắt buộc

### Nuxt 4 và Vue

- Mọi component/page/layout/composable/util/plugin nằm trong `app/`. Tận dụng auto-import của Nuxt/Vue; không import thừa `ref`, `computed`, `useFetch` và các auto-import khác.
- Component dùng `<script setup lang="ts">`. Khai báo type cho props/emits, không dùng `any` nếu có thể tránh.
- Không thêm `future.compatibilityVersion` vào `nuxt.config.ts`; giữ `compatibilityDate: '2025-07-15'`.
- Nuxt cấu hình Supabase SSR bằng `useSsrCookies: true`, PWA đăng ký thủ công qua plugin và PWA toast, không bật đăng ký tự động PWA.
- `nuxt.config.ts` có route rules: `/manifest.webmanifest`, `/dev-sw.js`, `/sw.js` không SSR/prerender; `/musical`, `/gallery`, `/` và `/notes` được prerender. Các trang khác mặc định dynamic SSR.
- UI phải responsive, ưu tiên mobile + iPad + Mobile Safari (PWA). Kiểm tra tràn ngang dưới `sm`, dùng `min-w-0`, `truncate`, `flex-wrap`, `overflow-hidden`, `safe-area`/`dvh` khi phù hợp.
- Giữ `components` với `path: '~/components'` và `pathPrefix: false`.

### Styling

- Dùng UnoCSS theo `uno.config.js`, preset `presetWind4` (đã reset), `presetIcons`, `presetScrollbar`, `presetTypography`.
- Font sẵn có: `Inter` và `Space Grotesk`, với preflight `--font-sans`/`--font-head`.
- Có shortcut UnoCSS `card` và `card-title`; dùng lại trước khi tạo class/CSS trùng.
- Không viết CSS thuần lặp lại. Chỉ dùng `<style>` cho animation phức tạp hoặc selector UnoCSS không biểu diễn được.
- Hỗ trợ dark/light qua `useTheme`; không hardcode màu ngoài theme/preset nếu pattern hiện có đã có token tương ứng.

### Reka UI và SSR

- Component portal (Dialog, Popover, Select, Tooltip, Drawer) dễ gây hydration mismatch. Bọc bằng `ClientOnly` hoặc giữ trạng thái ban đầu giống nhau giữa server và client.
- Truy cập `window`, `document`, `localStorage` trong `onMounted`, `watch` client hoặc guard `import.meta.client`; không đọc trong lúc render SSR.
- Với dữ liệu ngày giờ/locale hoặc browser-only state, khởi tạo rỗng rồi gán trong `onMounted` như trang `/exams/[id].vue`.
- PWA/client-only state và lịch sử thi cần xử lý best-effort, đặc biệt storage có thể bị chặn.

### Hiệu năng

- Thư viện nặng (`ExcelJS`, `abcjs`, ECharts, Cloudinary) chỉ import động khi tính năng thực sự dùng. Ví dụ pattern hiện có: ECharts qua `nuxt-echarts/vue-echarts`, ExcelJS trong `useMeditationExport`, abcjs trong `ABCRenderer`.
- Giữ `manualChunks` trong `nuxt.config.ts`: `vendor-echarts`, `vendor-excel`, `vendor-cloudinary`, `vendor-reka`. Không đổi chunking/PWA service worker khi chưa cần.
- Workbox: cache `js/css/html/png/svg/ico`, `navigateFallback: '/'`, deny `/api/**`, giới hạn file 3 MB. PWA registry dùng chế độ thủ công, deferred.
- Ảnh dùng Cloudinary/định dạng tối ưu, khai báo `width`/`height` khi có thể để tránh layout shift.

### Comark-content, Supabase và dữ liệu

- Không có `content.config.ts`; cấu hình thực tế nằm trong `server/utils/content.ts`:
  - `comarkContent({ source: withSnapshot(fs('./content', { prefix: '/notes' }), ...) })`
  - nguồn Markdown được mount bằng filesystem/prefix `/notes`.
  - plugin Markdown gồm `toc`, `mermaid`, bảng đa dòng; plugin content gồm media, SQLite FTS và PDF.
  - PDF được tạo qua route `/api/content/[...path].ts`, handler Comark.
- Khi thay cấu hình Comark, đọc API thực tế của package hiện cài; không suy API từ `@nuxt/content`.
- `app/utils/client-content.ts` tạo client Comark dùng `$fetch` và SQLite FTS client; `useNotesNav.ts` dùng `navigation()` của client này.
- `server/plugins/content-watch.ts` chỉ chạy `content.watch()` trong `import.meta.dev`.
- Route catch-all ghi chú nằm ở `server/api/content/[...path].ts`.
- **Không sửa `app/types/database.types.ts`** trừ khi có schema migration Supabase tương ứng.
- Quy ước đặt tên bài tập Technogym theo dạng **"TNG ..."** là dữ liệu hiện hữu; đổi tên cần migration.
- Không tự ý đổi key `localStorage`; lịch sử đề dùng `isolde_exam_history`, ghim ghi chú dùng `notes-pinned`.
- Không ghi đè file trong `public/audios/`.
- Không log dữ liệu y khoa của người dùng (nhật ký lâm sàng) ra console hoặc gửi ngoài Supabase đã cấu hình.

## Hệ thống ghi chú y khoa (`/notes`)

- `app/pages/notes/index.vue`: danh sách ghi chú, lọc môn, tìm kiếm, ghim “Chưa ôn”, phân trang và đọc query `?subject=`.
- `app/pages/notes/[...slug].vue`: trang chi tiết dùng `layouts/note.vue`; lấy nội dung bằng Comark, có TOC/toolbars, Markmap và speech.
- `app/pages/notes/graph.vue`: đọc `public/graph.json`.
- `app/components/notes/NoteSearch.vue`: tìm kiếm toàn văn qua Comark client và dictionary y khoa.
- `app/components/notes/NoteMarkmap.vue`: dựng mindmap từ heading.
- `app/components/notes/NoteSpeech.vue`: dùng audio dựng sẵn trong `public/audios/`, fallback Web Speech API và logic chunk dùng chung `scripts/tts-text.mjs`.
- `app/components/prose/ProseImg.vue`: renderer ảnh; media note được public qua `/media` từ thư mục `content/`.
- Giữ cú pháp Obsidian: wiki-link `[[...]]`, callout `[!NOTE]`/`[!WARNING]`, frontmatter `title`, `description`, `subject`, `tags`.

### Quy trình script

- `bun run dev`: chạy `predev` → `bun scripts/sync-exams.mjs --quiet`, rồi `node scripts/build-graph.mjs` và `nuxt dev`.
- `bun run build`: `node scripts/format-md.mjs --cites`, `node scripts/build-graph.mjs`, `comark-content snapshot`, rồi `nuxt build`; `prebuild` đồng bộ đề trước build.
- `bun run generate`: `node scripts/build-graph.mjs && nuxt generate`.
- `bun run graph`: `node scripts/build-graph.mjs`.
- `bun run format:md`: `node scripts/format-md.mjs`.
- `bun run analyze`: `nuxt analyze --no-serve`.
- `bun scripts/sync-exams.mjs [--dry-run] [--prune] [--quiet]`: đồng bộ `content/exams/` sang `public/data/exams/`; `--prune` mới xóa file thừa ở đích.
- `bun scripts/build-graph.mjs`: quét `.md` trong `content/`, bỏ thư mục/entry bắt đầu `.`, đọc wiki-link và tính backlink ra `public/graph.json`.
- `bun scripts/format-md.mjs [--dry] [--plain] [--cites]`: chuẩn hóa Markdown note; script đặt `TARGET_DIR='content/'` và không đọc đề bằng đuôi `.md`.
- `bun scripts/extract-tts.mjs && python scripts/generate_tts.py`: trích text từ HTML note đã prerender rồi sinh audio. Tránh ghi đè `public/audios/` ngoài workflow TTS.
- Xuất PDF: `server/utils/pdf-plugin.ts`, `server/api/content/[...path].ts`, font BeVietnamPro trong `server/assets/fonts/`.

## Module Luyện đề PMT EMS (Exam Simulator)

- **Tách biệt khỏi Comark**: `content/exams/` là nguồn đề JSON/assets, không phải ghi chú. Không tạo collection Comark cho đề, không để đề xuất hiện trong danh sách/tìm kiếm/graph/sitemap; build note không xem đề là note.
- `public/data/exams/exams-manifest.json`, `public/data/exams/<subject>/bank.json` và `<exam_id>.json` là dữ liệu sinh tự động; chỉ đọc phía client.
- Thư mục thực tế:
  - `app/components/exams/ExamCheckInDialog.vue`
  - `app/components/exams/ExamLaunchBubble.vue`
  - `app/components/exams/ExamQuestionCard.vue`
  - `app/components/exams/ExamPaletteDrawer.vue`
  - `app/components/exams/ExamNoteRefDrawer.vue`
  - `app/composables/useExamSession.ts`
  - `app/pages/exams/[id].vue`, đặt `layout: false`
  - `app/types/quiz.types.ts`
- Route phòng thi là `/exams/<subject>`; `ExamCheckInDialog.vue` điều hướng đến route này với config trong query.
- `ExamLaunchBubble.vue` là bubble tròn fixed trên trang `/notes`; bubble mở `ExamCheckInDialog` qua `v-model:open` trong `ClientOnly`; `app/pages/notes/index.vue` chỉ mount `ExamLaunchBubble`.
- `ExamFilterQuery` là hợp đồng query giữa dialog và trang thi `/exams/[id].vue`. Route dùng `subject` làm `id`, còn `exam` trong query là `exam_id` hoặc `all`. Các type data/session nằm trong `app/types/quiz.types.ts`, không phải `app/types/quiz.ts`.
- `useExamSession` xác thực subject/bộ đề qua manifest, tải `bank.json` theo subject, lọc theo `exam_id`/nhóm/conflict; trộn câu; dùng timer timestamp chống trôi đồng hồ; lưu điểm lịch sử.
- Luồng check-in: `/notes` → bubble → dialog chọn học phần/bộ đề/config → `/exams/<subject>?mode=...&exam=...&group=...&conflict=...&shuffle=...&time=...&name=...&mssv=...`.
- Lịch sử làm bài dùng localStorage key `isolde_exam_history`; đọc/ghi chỉ trong client, giới hạn 100 bản ghi, chuẩn hóa bản ghi cũ thiếu trường, xử lý storage full/private mode. Trạng thái thi đang làm có bản ghi client-only để F5 khôi phục bài làm, không đổi key lịch sử hiện hữu.
- Câu có ảnh lấy `/data/exams/${subject}/${image}`. Hiển thị rõ `verified`/`conflict`/`ai_only`. Giữ canonical answer key khi trộn đáp án.
- Hình ảnh đề nằm trong `assets/` của bundle đề được sync; không sửa trực tiếp `public/data/exams/`.
- Khi schema docmint thay đổi, cập nhật `app/types/quiz.types.ts` trước, rồi mới sửa composable/component.
- Đề dài cần giữ mobile mượt, tránh render/chạy tác vụ nặng ngoài câu cần hiển thị.

## Các module khác

- **Fitness**: `app/pages/fitness.vue`, `app/pages/fitness/index.vue`, `app/pages/fitness/analytics.vue`; component trong `app/components/fitness/`. Biểu đồ ECharts/heatmap và form strength/cardio. Kiểm tra layout set-row dưới `sm`.
- **Medic**: `app/pages/medic.vue`, `app/pages/medic/index.vue`, `app/pages/medic/record.vue`; dữ liệu danh mục ở `app/data/medic.ts`.
- **Meditate & Habit**: `app/pages/meditate/index.vue`, `app/pages/habit.vue`; export Excel qua `useMeditationExport.ts`, lịch Tây Tạng qua `TibetanHolyDays.vue` và `/api/tibetan-week`.
- **Gallery**: `app/pages/gallery.vue`, Cloudinary và `server/api/gallery.get.ts`.
- **Music**: `app/components/music/ABCRenderer.vue` và `MetronomeButton.vue`; abcjs nên tải động/chỉ khi renderer mở.

## An toàn dữ liệu

- Không đọc, grep hoặc index: `public/data/exams/**`, `public/audios/**`, `public/graph.json`, `.nuxt/`, `.output/`, `node_modules/`, `.cache/`, trừ khi người dùng đính kèm file cụ thể.
- Không commit secret. Biến môi trường ở `.env` đã gitignore; repo hiện không có `.env.example` trong workspace, nên không tự tạo/suy tên khóa.
- Dữ liệu y khoa của người dùng không được log ra console hoặc gửi ra dịch vụ ngoài ngoài Supabase đã cấu hình.
- Cổng xuất PDF sử dụng Nitro asset `comark`, `notes-raw`, `pdf-fonts` và không được thay đổi đường dẫn font ngẫu nhiên.

## Kiểm tra sau khi sửa

- `bun run build` phải qua. Package build đã chạy format cites, build graph, snapshot Comark và Nuxt build.
- Chạy `bunx nuxi typecheck` khi đổi type/composable/page.
- Khi đổi UI: kiểm tra mobile dưới `sm`, dark mode và console không có hydration warning.
- Khi đổi dependency/bundle: chạy `bun run analyze` và so sánh chunk.
- Khi đổi script/workflow exam: chạy `bun scripts/sync-exams.mjs --dry-run`, sau đó dùng `--quiet` nếu cần sync thực.
- Nếu đổi nội dung hoặc script note: chạy `bun scripts/format-md.mjs` và `bun scripts/build-graph.mjs`.

## Lệnh nhanh

```bash
bun install
bun run dev
bun run build
bun run generate
bun run analyze
bunx nuxi typecheck
bun scripts/build-graph.mjs
bun scripts/format-md.mjs
bun scripts/sync-exams.mjs --dry-run
bun scripts/sync-exams.mjs --quiet
bun scripts/extract-tts.mjs && python scripts/generate_tts.py
```
