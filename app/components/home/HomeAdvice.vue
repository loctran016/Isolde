<script setup lang="ts">
interface AdviceItem {
  text: string
  solution?: string
}

const items: AdviceItem[] = [
  {
    text: 'Ngừng chạy theo tâm lý thích danh tiếng do học giỏi: áp dụng cách học cũ ở trung học qua đại học. Chạy theo thành tích và kỳ vọng mong muốn tự thân => stress, lo âu, trầm cảm',
    solution:
      'chú trọng chất lượng, học mục tiêu để làm bác sỹ có kiến thức chữa bệnh chấm dứt khổ nơi thân. Động cơ học của người biết pháp',
  },
  {
    text: 'Mở rộng lòng kết bạn với bạn đồng trang lứa để chia sẻ các cảm xúc tự ti nơi bản thân nhằm giảm trầm cảm, rối loạn hành vi và cảm xúc.',
  },
  {
    text: 'Học cách quan sát, phản ứng tâm lý của người khác mà không gán nhãn cảm xúc của mình vô. Thấu hiểu và đồng cảm khi đứng ở vị trí họ thay vì đứng ở vị trí mình quan sát.',
  },
  {
    text: 'Học cách lắng nghe chia sẻ đồ ăn, thực phẩm, vé xem phim, nước uống...theo khả ý của những người mình muốn kết thân. Đừng cho những gì mình không cần. Cho những gì họ cần.',
  },
  {
    text: 'Dừng vọng tưởng khổ về hoàn cảnh gia đình và bế tắc bản thân. So với các chúng sinh ở cõi này và 6 cõi còn lại em đã thù thắng hơn họ',
  },
  {
    text: 'Chấm dứt khuynh hướng sợ hãi phòng vệ của người mẹ áp đặt qua tập khí của bản thân người nam như em. Sợ mất tài sản, sợ mua xe sang bị hỏng, sợ sau này k có việc làm, sợ khổ, sợ đói...vv',
  },
  {
    text: 'Dấn thân và trực tiếp trải nghiệm theo khuynh hướng sở thíc của mình có tuệ về pháp dẫn đầu',
  },
  {
    text: 'Hoạch định tương lai cho mình 1 cách tự do không áp đặt. Hãy hình dung viết ra giấy các mục đích của mình trong cuộc đời cụ thể là gì sau đó hoạch định từng bước đề đạt được',
  },
]

const tendencies = [
  'Thíc 1 mình',
  'Thíc chìm đắm trong điện thoại máy tính bảng',
  'Thích mày mò tương tác với thức tri của địa ngục vô gián nơi hình ảnh, âm thanh hiện lên trên màn hình thoả mãn các dục nơi tưởng sắc thanh hương vị xúc giác thành sắc thanh hương vị xúc giác nơi thân em',
]
</script>

<template>
  <details open class="card p-5 sm:p-6 group/advice">
    <summary
      class="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
    >
      <h2 class="card-title">
        <div class="i-mdi:lightbulb-on-outline" />
        Lời khuyên
      </h2>
      <div
        class="i-mdi:chevron-down text-xl opacity-50 transition-transform group-open/advice:rotate-180"
      />
    </summary>

    <p class="mt-3 text-sm opacity-60">Tóm lại giờ như vầy nha</p>

    <ol class="mt-3 flex flex-col gap-3">
      <li v-for="(item, i) in items" :key="i" class="flex gap-3 text-sm sm:text-base">
        <span
          class="shrink-0 w-6 h-6 rounded-full bg-purple-500/15 text-purple-500 text-xs font-medium flex items-center justify-center mt-0.5"
        >
          {{ i + 1 }}
        </span>
        <div class="min-w-0">
          <p class="break-words">{{ item.text }}</p>
          <p v-if="item.solution" class="mt-1 break-words">
            <span class="font-medium text-purple-500">Giải pháp:</span>
            {{ item.solution }}
          </p>
        </div>
      </li>
    </ol>

    <p class="mt-4 text-sm sm:text-base font-medium">
      8 key này nếu làm theo thì e sẽ trở thành 1 người trưởng thành trong suy nghĩ lẫn hành động
    </p>

    <p class="mt-3 text-sm sm:text-base opacity-80">
      Nếu mình chỉ nghe cho vui không tự rèn luyện 8 key này thì e sẽ bị khuynh hướng nghiệp tập khí
      chi phối Bức Bách sai xử không thể có năng lực chống trả hay cưỡng lại. Và tiêp tục trôi lăn
      làm theo như những gì kịch bản của nghiệp và khuynh hướng ưa thích của e với các cảnh em ưa
      thích
    </p>

    <ul class="mt-2 flex flex-col gap-1 text-sm sm:text-base opacity-80 list-disc pl-5">
      <li v-for="(t, i) in tendencies" :key="i" class="break-words">{{ t }}</li>
    </ul>
  </details>
</template>
