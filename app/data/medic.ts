export interface SubQuestion {
  id: string
  text: string
}

export interface MainQuestion {
  id: string
  title: string
  subQuestions: SubQuestion[]
}

export interface Section {
  title: string
  mainQuestions: MainQuestion[]
}

// Map of checklist IDs to their sections array
export const checklists: Record<string, Section[]> = {
  'tang-huyet-ap': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu (không dùng từ chuyên môn, nếu dùng phải giải thích rõ ràng)', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp, mỗi lần chỉ hỏi 1 câu', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Xác định bệnh nhân có tăng huyết áp',
          subQuestions: [
            { id: 'h7a', text: 'Trị số huyết áp lần này' },
            { id: 'h7b', text: 'Những lần đo trước đó' },
            { id: 'h7c', text: 'Đang điều trị thuốc tăng huyết áp' }
          ]
        },
        {
          id: 'h8',
          title: 'Triệu chứng tổn thương cơ quan đích',
          subQuestions: [
            { id: 'h8a', text: 'Não: đau đầu, chóng mặt, yếu tay chân?' },
            { id: 'h8b', text: 'Mắt: nhìn mờ?' },
            { id: 'h8c', text: 'Tim: đau ngực? khó thở?' },
            { id: 'h8d', text: 'Động mạch vành: khó thở' },
            { id: 'h8e', text: 'Thận: tiểu đêm, tiểu máu, tiểu bọt, phù' },
            { id: 'h8f', text: 'Mạch máu ngoại biên: đau cách hồi (đau khi đi lại, giảm khi ngồi), đau ngực, đau bụng' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't9a', text: 'Bệnh lý tim mạch: Bệnh mạch vành, tăng huyết áp, tim bẩm sinh, bệnh van tim, suy tim' },
            { id: 't9b', text: 'Tuổi' },
            { id: 't9c', text: 'Đái tháo đường' },
            { id: 't9d', text: 'Rối loạn lipid máu' },
            { id: 't9e', text: 'Béo phì, thừa cân (CC × CN)' },
            { id: 't9f', text: 'Thuốc làm tăng huyết áp : ngừa thai, cam thảo, corticoid,...' },
            { id: 't9g', text: 'Thuốc điều trị tăng huyết áp đang uống' }
          ]
        },
        {
          id: 't10',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [
            { id: 't10a', text: 'Phẫu thuật ? Đặt stent/mổ bắc cầu (bệnh mạch vành)' }
          ]
        },
        {
          id: 't11',
          title: 'Sản khoa',
          subQuestions: [
            { id: 't11a', text: 'PARA' }
          ]
        },
        {
          id: 't12',
          title: 'Thói quen - dị ứng',
          subQuestions: [
            { id: 't12a', text: 'Hút thuốc lá' },
            { id: 't12b', text: 'Uống rượu bia' },
            { id: 't12c', text: 'Chế độ ăn (ăn mặn), lối sống (tĩnh tại)' },
            { id: 't12d', text: 'Dị ứng' }
          ]
        },
        {
          id: 't13',
          title: 'Gia đình',
          subQuestions: [
            { id: 't13a', text: 'Bệnh tim mạch sớm (bệnh mạch vành, tăng huyết áp,...)' }
          ]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện (Tôn trọng người bệnh, ngữ điệu nhẹ nhàng, giải thích rõ ràng dễ hiểu)', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp (Quần áo sạch sẽ, tóc gọn gàng, móng tay cắt ngắn, không sơn móng tay,...)', subQuestions: [] }
      ]
    }
  ],
  'sot': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu (không dùng từ chuyên môn, nếu dùng phải giải thích rõ ràng)', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp, mỗi lần chỉ hỏi 1 câu', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Có thực sự là sốt không',
          subQuestions: [
            { id: 'h7a', text: 'Có đo nhiệt độ bằng nhiệt kế?' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất sốt',
          subQuestions: [
            { id: 'h8a', text: 'Hoàn cảnh khởi phát? Cách bao lâu?' },
            { id: 'h8b', text: 'Bao nhiêu độ? Tăng nhanh hay chậm? Đột ngột hay từ từ?' },
            { id: 'h8c', text: 'Từng cơn hay liên tục? (Hỏi thời gian mỗi cơn và khoảng cách giữa các cơn)' },
            { id: 'h8d', text: 'Có lạnh run? Vã mồ hôi? Co giật? Hôn mê?' },
            { id: 'h8e', text: 'Yếu tố tăng (sốt vào buổi nào nhiều?)' },
            { id: 'h8f', text: 'Yếu tố giảm (có dùng thuốc hạ sốt không?)' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Hệ Thần kinh: nhức đầu, nôn ói, yếu liệt tay chân, choáng váng, ngất' },
            { id: 'h9b', text: 'Tiêu hoá: đau bụng, vàng da, tiêu chảy' },
            { id: 'h9c', text: 'Tiết niệu-sinh dục: đau hông lưng? Đau hạ vị? Tiểu buốt? Mủ? Kinh nguyệt, xuất huyết âm đạo?' },
            { id: 'h9d', text: 'Cơ xương khớp: đau nhức khớp' },
            { id: 'h9e', text: 'Da: loét, mụn nhọt' },
            { id: 'h9f', text: 'Hô hấp: đau ngực, ho, sổ mũi, nghẹt mũi' },
            { id: 'h9g', text: 'Tim mạch: đau ngực, khó thở' },
            { id: 'h9h', text: 'Các nguyên nhân không do nhiễm trùng: Nội tiết- chuyển hoá, Ác tính, Thuốc, Chấn thương, Chuyển hoá, Tự miễn' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't10',
          title: 'Tiền căn sốt trước đây? Tính chất giống lần này? Chẩn đoán gì?',
          subQuestions: [{ id: 't10a', text: 'Mô tả' }]
        },
        {
          id: 't11',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't11a', text: 'Thủ thuật, đặt thông tiểu' },
            { id: 't11b', text: 'Đi du lịch? Nằm viện?' },
            { id: 't11c', text: 'Bệnh lý hô hấp: ho khạc đàm? Lao? Tiếp xúc với người nhiễm Lao? Covid?' },
            { id: 't11d', text: 'Tim mạch: Bệnh mạch vành, THA' },
            { id: 't11e', text: 'Tiêu hoá: viêm gan B, xơ gan' },
            { id: 't11f', text: 'Chuyển hóa: cường giáp, ĐTĐ' },
            { id: 't11g', text: 'Tự miễn: lupus, viêm khớp dạng thấp' },
            { id: 't11h', text: 'Bệnh ác tính' },
            { id: 't11i', text: 'Thuốc' }
          ]
        },
        {
          id: 't12',
          title: 'Bệnh lý ngoại khoa: Phẫu thuật',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't13a', text: 'Mô tả' }]
        },
        {
          id: 't14',
          title: 'Thói quen - dị ứng',
          subQuestions: [
            { id: 't14a', text: 'Hút thuốc lá' },
            { id: 't14b', text: 'Uống rượu bia' },
            { id: 't14c', text: 'Dị ứng ,tiếp xúc độc chất' }
          ]
        },
        {
          id: 't15',
          title: 'Gia đình',
          subQuestions: [{ id: 't15a', text: 'Lao, ung thư, viêm gan B,...' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c16', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c17', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'dau-nguc': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Tính chất của đau ngực',
          subQuestions: [
            { id: 'h7a', text: 'Hoàn cảnh khởi phát (đang làm gì? từ từ hay đột ngột? chấn thương?)' },
            { id: 'h7b', text: 'Vị trí - hướng lan' },
            { id: 'h7c', text: 'Kiểu đau (đè ép, nhói, nóng rát, dao đâm?)' },
            { id: 'h7d', text: 'Cường độ đau' },
            { id: 'h7e', text: 'Thời gian - nhịp độ đau (từng cơn hay liên tục, thời gian mỗi cơn, khoảng cách mỗi cơn?)' },
            { id: 'h7f', text: 'Yếu tố tăng giảm đau (Theo thời gian trong ngày, theo tư thế, bữa ăn, thuốc,...)' }
          ]
        },
        {
          id: 'h8',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h8a', text: 'Vã mồ hôi, da lạnh -> Nhồi máu cơ tim / TPE' },
            { id: 'h8b', text: 'Khó thở -> Suy tim T / Tràn dịch màng ngoài tim' },
            { id: 'h8c', text: 'Ngất, muốn ngất, choáng váng -> Bít ống động mạch vành' },
            { id: 'h8d', text: 'Hồi hộp -> Cung giáp, loạn nhịp' },
            { id: 'h8e', text: 'Sốt -> Viêm màng ngoài tim' },
            { id: 'h8f', text: 'Ho, ho ra máu (khai thác đủ tính chất nếu có) -> Lao' },
            { id: 'h8g', text: 'Ợ nóng, ợ chua, khó tiêu -> GERD / Dạ dày' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn đau ngực trước đây? Tính chất so với lần này? Chẩn đoán và điều trị?',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh lý tim mạch: Bệnh mạch vành, THA, tim bẩm sinh, bệnh van tim, suy tim' },
            { id: 't10b', text: 'Bệnh lý hô hấp: Lao, viêm phổi, COPD, hen,...' },
            { id: 't10c', text: 'Bệnh lý tiêu hóa: trào ngược dạ dày thực quản, viêm gan' },
            { id: 't10d', text: 'Đái tháo đường' },
            { id: 't10e', text: 'Rối loạn lipid máu' },
            { id: 't10f', text: 'Ác tính: ung thư' },
            { id: 't10g', text: 'YTNC thuyên tắc huyết khối tĩnh mạch: nằm lâu, bất động' },
            { id: 't10h', text: 'Thuốc: thuốc gây nghiện,...' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Phẫu thuật? Đặt stent/mổ bắc cầu (bệnh mạch vành)' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen - dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Chế độ ăn (ăn mặn), lối sống (tĩnh tại)' },
            { id: 't13d', text: 'Dị ứng' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Bệnh tim mạch sớm (bệnh mạch vành, tăng huyết áp,...)' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'kho-tho': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Hỏi đầy đủ các tính chất của khó thở',
          subQuestions: [
            { id: 'h7a', text: 'Khởi phát đột ngột hay từ từ?' },
            { id: 'h7b', text: 'Thời gian khó thở: từ bao giờ, kéo dài bao lâu...?' },
            { id: 'h7c', text: 'Có liên quan gắng sức không?' },
            { id: 'h7d', text: 'Có liên quan tư thế không?' },
            { id: 'h7e', text: 'Có cơn khó thở về đêm?' },
            { id: 'h7f', text: 'Các yếu tố tăng giảm?' }
          ]
        },
        {
          id: 'h8',
          title: 'Hỏi các triệu chứng khác đi kèm',
          subQuestions: [
            { id: 'h8a', text: 'Sốt' },
            { id: 'h8b', text: 'Ho, ho khạc đàm' },
            { id: 'h8c', text: 'Ho ra máu' },
            { id: 'h8d', text: 'Đau ngực' },
            { id: 'h8e', text: 'Khò khè, cò cử' }
          ]
        },
        {
          id: 'h9',
          title: 'Hỏi về tiền căn khó thở',
          subQuestions: [{ id: 'h9a', text: 'Mô tả' }]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't10',
          title: 'Hỏi bệnh lý trước đây của người bệnh',
          subQuestions: [
            { id: 't10a', text: 'Các bệnh lý về hô hấp' },
            { id: 't10b', text: 'Các bệnh lý về tim mạch' },
            { id: 't10c', text: 'Các bệnh lý thần kinh, cơ' },
            { id: 't10d', text: 'Hỏi về thuốc và các phương pháp điều trị hiện tại' }
          ]
        },
        {
          id: 't11',
          title: 'Hỏi tiền căn',
          subQuestions: [
            { id: 't11a', text: 'Dị ứng' },
            { id: 't11b', text: 'Hút thuốc lá' },
            { id: 't11c', text: 'Ăn mặn' },
            { id: 't11d', text: 'Khác' }
          ]
        },
        {
          id: 't12',
          title: 'Hỏi tiền căn bệnh lý của gia đình',
          subQuestions: [{ id: 't12a', text: 'Các bệnh lý di truyền, nghề nghiệp' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c13', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c14', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'ho-ra-mau': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Hỏi đầy đủ các tính chất của ho ra máu?',
          subQuestions: [
            { id: 'h7a', text: 'Hoàn cảnh khởi phát (sau ăn ? khi nằm ?)' },
            { id: 'h7b', text: 'Ới ra máu ? Khạc ra máu ?' },
            { id: 'h7c', text: 'Ngứa cổ, chảy máu chân răng, chảy máu mũi ?' },
            { id: 'h7d', text: 'Kèm đàm ? Thức ăn ? Bọt ? Loãng/đặc? Máu cục' },
            { id: 'h7e', text: 'Màu sắc' },
            { id: 'h7f', text: 'Lượng (số lần ? lượng mỗi lần ? đột ngột lượng lớn?)' },
            { id: 'h7g', text: 'Thể tích máu tăng/giảm ? Tần suất ho ra máu tăng/giảm ? Màu sắc thay đổi ?' }
          ]
        },
        {
          id: 'h8',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h8a', text: 'Ngất, muốn ngất, choáng váng' },
            { id: 'h8b', text: 'Vã mồ hôi' },
            { id: 'h8c', text: 'Khó thở' },
            { id: 'h8d', text: 'Đau ngực ? Vị trí ?' },
            { id: 'h8e', text: 'Sốt, lạnh run' },
            { id: 'h8f', text: 'Chán ăn, sụt cân ?' },
            { id: 'h8g', text: 'Lượng nước tiểu ? màu sắc ?' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn ho ra máu trước đây ? Ho đàm trước đây ? Khó thở trước đây ?',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh lý về đường hô hấp : Lao phổi, ung thư, dãn phế quản, hen, COPD' },
            { id: 't10b', text: 'Bệnh lý tim mạch : THA, suy tim, bệnh mạch vành, huyết khối tĩnh mạch sâu chi dưới' },
            { id: 't10c', text: 'Bệnh lý thận : Hội chứng Goodpastures, u hạt Wegener, Lupus' },
            { id: 't10d', text: 'Bệnh lý khác : Đái tháo đường' },
            { id: 't10e', text: 'Yếu tố nguy cơ : Thuyên tắc phổi (nằm lâu, bất động)' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Chấn thương, phẫu thuật' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen - dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Thuốc : kháng đông ?' },
            { id: 't13d', text: 'Dị ứng, tiếp xúc độc chất' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Lao, ung thư, hội chứng Goodpastures' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'non-ra-mau': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Có thực sự là nôn ra máu không',
          subQuestions: [
            { id: 'h7a', text: 'Phân biệt ho ra máu (ngứa họng, ho)' },
            { id: 'h7b', text: 'Phân biệt chảy máu hầu, miệng (máu mũi, máu răng, luồng dịch chảy xuống rồi nôn ra ?)' },
            { id: 'h7c', text: 'Thuốc, thực phẩm (nếu tiêu phân đen thì quan tâm Bismuth, thực phẩm bổ sung sắt, thực phẩm màu đỏ)' },
            { id: 'h7d', text: 'Chấn thương ? Dập nát cơ ?' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất nôn ra máu',
          subQuestions: [
            { id: 'h8a', text: 'Hoàn cảnh khởi phát (đột ngột, vận động mạnh, chấn thương,)? Cách đây bao lâu ?' },
            { id: 'h8b', text: 'Trước khi nôn ra máu có nôn nhiều lần ?' },
            { id: 'h8c', text: 'Màu sắc (đỏ tươi, đỏ bầm)' },
            { id: 'h8d', text: 'Lượng? Số lần ?' },
            { id: 'h8e', text: 'Kèm thức ăn ? Máu cục ? Dịch ? Đàm ?' },
            { id: 'h8f', text: 'Hiện tại còn ói ra máu không ? Số lần và lượng giảm hay tăng ?' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Lạnh run, vã mồ hôi, khát nước' },
            { id: 'h9b', text: 'Chóng mặt, choáng váng, ngất' },
            { id: 'h9c', text: 'Nước tiểu (đánh giá biến chứng suy thận cấp)' },
            { id: 'h9d', text: 'Phân (nếu tiêu phân đen phải hỏi đủ tính chất : màu sắc? Lượng ? Mùi ? Bóng ? Lỏng/đặc/sệt ? Toàn bãi ?)' },
            { id: 'h9e', text: 'Đau bụng ( thượng vị,... )' },
            { id: 'h9f', text: 'Mệt mỏi, chán ăn, sụt cân ?' },
            { id: 'h9g', text: 'Ợ hơi, ợ chua' },
            { id: 'h9h', text: 'Vàng da? Bụng to?' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn ói ra máu trước đây ? giống lần này ? (đi khám và chẩn đoán gì?)',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Tiền căn nội soi tiêu hoá' },
            { id: 't10b', text: 'Bệnh lý đường tiêu hoá : trào ngược dạ dày thực quản (nuốt khó, ợ nóng, ợ chua,buồn nôn ), nhiễm Hp,trĩ, loét dạ dày' },
            { id: 't10c', text: 'Viêm gan siêu vi , chích ngừa viêm gan, xơ gan, ung thư' },
            { id: 't10d', text: 'Bệnh lý khác : Đái tháo đường, THA, bệnh tim mạch, huyết học' },
            { id: 't10e', text: 'Thuốc : kháng đông, giảm đau, NSAIDs' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa - Phẫu thuật ?',
          subQuestions: [{ id: 't11a', text: 'Mô tả' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen – dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Chế độ ăn , lối sống (stress)' },
            { id: 't13d', text: 'Dị ứng ,tiếp xúc độc chất' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Lao, ung thư, viêm gan B,...' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'tieu-phan-den': [
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Có thực sự là tiêu phân đen',
          subQuestions: [
            { id: 'h7a', text: 'Có sử dụng thực phẩm: tiết canh, thức ăn màu đỏ?' },
            { id: 'h7b', text: 'Có dùng thuốc trị dạ dày (Bismuth), thực phẩm bổ sung sắt?' },
            { id: 'h7c', text: 'Chấn thương? Dập nát cơ?' },
          ],
        },
        {
          id: 'h8',
          title: 'Tính chất tiêu phân đen',
          subQuestions: [
            { id: 'h8a', text: 'Hoàn cảnh khởi phát? Cách đây bao lâu?' },
            { id: 'h8b', text: 'Lượng? Số lần?' },
            { id: 'h8c', text: 'Màu sắc? (Đen toàn bãi? Lẫn vàng?)' },
            { id: 'h8d', text: 'Kèm nhầy? Máu đỏ? Bóng?' },
            { id: 'h8e', text: 'Mùi? (hôi, tanh)' },
            { id: 'h8f', text: 'Lỏng / đặc / sệt' },
            { id: 'h8g', text: 'Tăng/giảm (độ lỏng, số lần, lượng)' },
          ],
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Lạnh run, vã mồ hôi, khát nước' },
            { id: 'h9b', text: 'Chóng mặt, choáng váng, ngất' },
            { id: 'h9c', text: 'Nước tiểu (đánh giá biến chứng suy thận cấp)' },
            { id: 'h9d', text: 'Nôn, nôn ra máu (khai thác đầy đủ tính chất nôn ra máu)' },
            { id: 'h9e', text: 'Đau bụng (thượng vị, …)' },
            { id: 'h9f', text: 'Mệt mỏi, chán ăn, sụt cân?' },
            { id: 'h9g', text: 'Ợ hơi, ợ chua' },
          ],
        },
      ],
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't10',
          title: 'Tiền căn tiêu phân đen? Giống lần này? (đi khám và chẩn đoán gì?)',
          subQuestions: [{ id: 't10a', text: 'Mô tả' }],
        },
        {
          id: 't11',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't11a', text: 'Tiền căn nội soi tiêu hoá' },
            { id: 't11b', text: 'Bệnh lý đường tiêu hoá: trào ngược dạ dày thực quản (nuốt khó, ợ nóng, ợ chua, buồn nôn), nhiễm Hp, trĩ' },
            { id: 't11c', text: 'Viêm gan siêu vi, chích ngừa viêm gan, xơ gan, ung thư' },
            { id: 't11d', text: 'Bệnh lý khác: Đái tháo đường, THA, bệnh tim mạch, huyết học' },
          ],
        },
        {
          id: 't12',
          title: 'Bệnh lý ngoại khoa: Phẫu thuật? Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }],
        },
      ],
    },
  ],
  'bang-bung': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Có thật sự là báng bụng?',
          subQuestions: [
            { id: 'h7a', text: 'Béo phì: trước đó to sẵn chưa?' },
            { id: 'h7b', text: 'Thai: Kinh nguyệt đều? Kỳ kinh cuối' },
            { id: 'h7c', text: 'Ứ phân: Đi tiêu? Táo bón?' },
            { id: 'h7d', text: 'U: có sờ thấy khối ở vùng bụng?' },
            { id: 'h7e', text: 'Trướng hơi, tắc đại tràng: xì hơi?' },
            { id: 'h7f', text: 'Căng bàng quang: Đi tiểu được? mắc tiểu?' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất của báng bụng',
          subQuestions: [
            { id: 'h8a', text: 'Hoàn cảnh khởi phát? Từ từ/đột ngột?' },
            { id: 'h8b', text: 'Thời gian (bao lâu rồi?)' },
            { id: 'h8c', text: 'Diễn tiến (thay đổi cân nặng, to dần, xẹp bớt,...)' },
            { id: 'h8d', text: 'Yếu tố tăng / giảm (tư thế, thời gian trong ngày, thuốc,...)' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Khó thở (nếu có khai thác đủ)' },
            { id: 'h9b', text: 'Thoát vị (khối phồng ở rốn, bẹn bìu,...)?' },
            { id: 'h9c', text: 'Khó tiêu, ợ hơi, ợ chua' },
            { id: 'h9d', text: 'Phù ? (nếu có phải hỏi đủ tính chất, thứ tự xuất hiện)' },
            { id: 'h9e', text: 'Nước tiểu ( hỏi đủ tính chất : màu sắc, lượng, diễn tiến, kèm bọt,...)' },
            { id: 'h9f', text: 'Đau ngực, đau bụng (hỏi đủ tính chất)' },
            { id: 'h9g', text: 'Vàng da ?' },
            { id: 'h9h', text: 'Phân ( bạc màu, đen,... ?), tiêu chảy, táo bón,...' },
            { id: 'h9i', text: 'Sốt, vã mồ hôi, lạnh run ?' },
            { id: 'h9j', text: 'Chán ăn, sụt cân, đổ mồ hôi đêm, ớn lạnh về chiều ?' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn bụng to? Tính chất so với lần này? Chẩn đoán và điều trị?',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh gan : viêm gan siêu vi B,C, xơ gan, viêm gan tự miễn ,gan nhiễm mỡ' },
            { id: 't10b', text: 'Nguy cơ lây nhiễm viêm gan : chích ngừa viêm gan? tiêm chích ma túy, chữa răng, xăm mình, truyền máu, quan hệ không an toàn, chạy thận nhân tạo,...?' },
            { id: 't10c', text: 'Bệnh thận : hội chứng thận hư? Phù/tiểu máu? Suy thận?' },
            { id: 't10d', text: 'Chuyển hóa : đái tháo đường, rối loạn lipid máu?' },
            { id: 't10e', text: 'Bệnh lý tim mạch : suy tim, tăng huyết áp,...' },
            { id: 't10f', text: 'Lao, tiếp xúc lao ?' },
            { id: 't10g', text: 'Ác tính : ung thư' },
            { id: 't10h', text: 'Thuốc ? Điều trị ?' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Phẫu thuật ? Hóa trị , xạ trị ?' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen - dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Chế độ ăn, lối sống (suy dinh dưỡng?)' },
            { id: 't13d', text: 'Dị ứng' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Bệnh gan mật (Viêm gan siêu vi B,C, xơ gan,...), Bệnh thận, Lao, ác tính' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'vang-da': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Bệnh nhân có thật sự vàng da do tăng bilirubin ?',
          subQuestions: [
            { id: 'h7a', text: 'Có thấy vàng da? Vàng mắt ?' },
            { id: 'h7b', text: 'Thức ăn : củ cải đỏ, đu đủ, cà chua' },
            { id: 'h7c', text: 'Thuốc : quinine, cloroquine, thuốc sốt rét' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất của vàng da',
          subQuestions: [
            { id: 'h8a', text: 'Hoàn cảnh khởi phát (sau truyền máu, nhiễm siêu vi hay đột ngột)' },
            { id: 'h8b', text: 'Thời gian vàng da (bao lâu rồi ?)' },
            { id: 'h8c', text: 'Diễn tiến vàng da (tăng dần, lúc tăng lúc giảm, tái phát nhiều?)' },
            { id: 'h8d', text: 'Mức độ vàng da (nhẹ từng đợt, vàng cam, vàng sậm ?)' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Sốt (nhiệt độ, cơn?, thời gian?, chu kỳ ?, trước hay sau vàng da?...)' },
            { id: 'h9b', text: 'Lạnh run, vã mồ hôi' },
            { id: 'h9c', text: 'Nước tiểu (màu xá xị, sậm màu,...)' },
            { id: 'h9d', text: 'Ngứa' },
            { id: 'h9e', text: 'Phân (phân bạc màu, phân đen,...), nôn (ra máu?)' },
            { id: 'h9f', text: 'Đau bụng (hỏi đủ tính chất)' },
            { id: 'h9g', text: 'Chán ăn, mệt mỏi, đau cơ?' },
            { id: 'h9h', text: 'Sụt cân?' },
            { id: 'h9i', text: 'Phù? Bụng to?' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn vàng da? Tính chất so với lần này? Chẩn đoán và điều trị?',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh gan: viêm gan siêu vi B,C, xơ gan, viêm gan tự miễn,...' },
            { id: 't10b', text: 'Nguy cơ lây nhiễm viêm gan: chích ngừa viêm gan? tiêm chích ma túy, chữa răng, xăm mình, truyền máu, quan hệ không an toàn, chạy thận nhân tạo,...?' },
            { id: 't10c', text: 'Bệnh đường mật: sỏi mật, nhiễm trùng đường mật,...' },
            { id: 't10d', text: 'Bệnh lý huyết học: tán huyết, thiếu máu, du lịch vùng sốt rét,...' },
            { id: 't10e', text: 'Chuyển hóa: đái tháo đường, rối loạn lipid máu?' },
            { id: 't10f', text: 'Bệnh lý tim mạch (suy tim, tăng huyết áp,...)' },
            { id: 't10g', text: 'Thuốc' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Phẫu thuật (đường mật, cắt túi mật,...)?' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen – dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Chế độ ăn, lối sống' },
            { id: 't13d', text: 'Dị ứng' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Bệnh gan mật (Viêm gan siêu vi B,C, xơ gan,...), Bệnh lý huyết học (thiếu máu tán huyết, bệnh Wilson), tăng Bilirubin bẩm sinh, Ác tính, lao,...' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'tieu-mau': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Có thực sự là tiểu máu không',
          subQuestions: [
            { id: 'h7a', text: 'Có dùng thực phẩm màu đỏ (củ cải đường, củ cải đỏ, mâm xôi, việt quất,...)' },
            { id: 'h7b', text: 'Có dùng thuốc (Rifamycin, Chloroquine, Methyldopa, Levodopa)' },
            { id: 'h7c', text: 'Có đang hành kinh (đối với nữ) ? Trĩ ?' },
            { id: 'h7d', text: 'Chấn thương ? Dập nát cơ ?' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất tiểu máu',
          subQuestions: [
            { id: 'h8a', text: 'Hoàn cảnh khởi phát (đột ngột, vận động mạnh, chấn thương,...)? Cách đây bao lâu ?' },
            { id: 'h8b', text: 'Xuất hiện lúc bắt đầu? kết thúc? Cả quá trình?' },
            { id: 'h8c', text: 'Lượng nước tiểu ? Số lần ?' },
            { id: 'h8d', text: 'Màu sắc (đỏ hồng, đỏ cam, xá xị, trà đậm,...)' },
            { id: 'h8e', text: 'Có lẫn máu cục ?' },
            { id: 'h8f', text: 'Có đục/trong ? có lẫn sỏi ? mủ ?' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Đau bụng ? (đủ tính chất nếu có)' },
            { id: 'h9b', text: 'Đau hông lưng ? (đủ tính chất nếu có)' },
            { id: 'h9c', text: 'Sốt' },
            { id: 'h9d', text: 'Tiểu rát? Tiểu buốt ?' },
            { id: 'h9e', text: 'Bệnh hệ thống (đau khớp, hồng ban, ho ra máu)' },
            { id: 'h9f', text: 'Phù' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn tiểu đỏ trước đây ? giống lần này ? (đi khám và chẩn đoán gì?)',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh lý về hệ tiết niệu : sỏi thận, u bướu, hội chứng Goodpasture, nhiễm trùng tiểu' },
            { id: 't10b', text: 'Viêm họng (2 tuần) ? Viêm da (6 tuần) ?' },
            { id: 't10c', text: 'Bệnh lý rối loạn đông máu (Thalassemia, HC hình liềm, thiếu G6PD,...)' },
            { id: 't10d', text: 'Bệnh lý khác : Đái tháo đường, THA' },
            { id: 't10e', text: 'Thủ thuật : đặt thông tiểu, soi bàng quang' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Phẫu thuật ?' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen - dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Thuốc : kháng đông ?' },
            { id: 't13d', text: 'Dị ứng, tiếp xúc độc chất' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Lao, ung thư, hội chứng Goodpastures, hội chứng Alport, bệnh thận màng đáy mỏng' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'tieu-it': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Xác định bệnh nhân có tiểu ít/vô niệu',
          subQuestions: [
            { id: 'h7a', text: 'Hoàn cảnh khởi phát ? Cách đây bao lâu ?' },
            { id: 'h7b', text: 'Xuất hiện đột ngột / từ từ ?' },
            { id: 'h7c', text: 'Lượng nước xuất : Số lần đi tiểu ? Lượng nước tiểu mỗi lần ? Nôn ói, tiêu chảy, xuất huyết, bỏng, ống dẫn lưu ( nếu có phải hỏi đủ tính chất)' },
            { id: 'h7d', text: 'Lượng nước nhập : Uống, Ăn (cháo, súp), dịch truyền ?' },
            { id: 'h7e', text: 'Bilan nước ? Tăng giảm cân nặng ?' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất của nước tiểu',
          subQuestions: [
            { id: 'h8a', text: 'Màu sắc (vàng, xá xị,...?) (đục/trong?)' },
            { id: 'h8b', text: 'Mùi' },
            { id: 'h8c', text: 'Kèm máu ? Cục máu? Bọt? Sỏi ? Mủ ? (khai thác đủ tính chất nếu có )' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Rối loạn đi tiểu : Đau, nóng, gắt buốt khi đi tiểu' },
            { id: 'h9b', text: 'Tiểu khó, tiểu đêm, tia nước tiểu yếu' },
            { id: 'h9c', text: 'Đau bụng, hạ vị, đau hông lưng ?' },
            { id: 'h9d', text: 'Sốt ? Lạnh run ? Vã mồ hôi ?' },
            { id: 'h9e', text: 'Khát nước ? Chóng mặt ?' },
            { id: 'h9f', text: 'Phù' },
            { id: 'h9g', text: 'Phát ban ? Đau khớp ? Loét miệng ? Nhạy cảm ánh sáng ?' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn tiểu ít ? Giống lần này ? Chẩn đoán và điều trị ?',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh lý hệ tiết niệu : bệnh tuyến tiền liệt ? Suy thận ? Nhiễm trùng tiểu? U bướu ?' },
            { id: 't10b', text: 'Bệnh lý tim mạch : THA ? Suy tim ?' },
            { id: 't10c', text: 'Viêm gan ? Xơ gan' },
            { id: 't10d', text: 'Đái tháo đường ?' },
            { id: 't10e', text: 'Bệnh hệ thống : Lupus, Amyloidosis, hội chứng Goodpasture' },
            { id: 't10f', text: 'Thuốc : Hạ HA (UCMD,UCTT), NSAIDs, cản quang, lợi tiểu, KS (aminoglycoside,vancomycin,…)' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Phẫu thuật ? Xạ trị ?' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen – dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá' },
            { id: 't13b', text: 'Uống rượu bia' },
            { id: 't13c', text: 'Dị ứng' },
            { id: 't13d', text: 'Tiếp xúc độc chất : KL nặng, thuốc gây mê, mật cá, mật gấu, ong đốt ,rắn cắn' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Lao, ung thư, bệnh tim mạch, bệnh thận (bệnh thận mạn, bệnh thận IgA, hội chứng Alport, thận đa nang,...)' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ],
  'phu': [
    {
      title: 'KỸ NĂNG GIAO TIẾP',
      mainQuestions: [
        { id: 'g1', title: 'Chào hỏi bệnh nhân, tự giới thiệu bản thân, rửa tay', subQuestions: [] },
        { id: 'g2', title: 'Sử dụng câu hỏi mở - đóng hợp lý', subQuestions: [] },
        { id: 'g3', title: 'Dùng từ đơn giản, dễ hiểu', subQuestions: [] },
        { id: 'g4', title: 'Ngôn ngữ nhẹ nhàng, tế nhị trong giao tiếp', subQuestions: [] },
        { id: 'g5', title: 'Khuyến khích và khen ngợi việc đúng của bệnh nhân', subQuestions: [] },
        { id: 'g6', title: 'Lắng nghe và đồng cảm', subQuestions: [] }
      ]
    },
    {
      title: 'HỎI BỆNH SỬ',
      mainQuestions: [
        {
          id: 'h7',
          title: 'Bệnh nhân có thật sự phù hay không ?',
          subQuestions: [
            { id: 'h7a', text: 'Có nặng mi mắt ?' },
            { id: 'h7b', text: 'Mặc quần áo thấy chật ? Nới dây nịt ?' },
            { id: 'h7c', text: 'Ngón tay đeo nhẫn thấy chật' },
            { id: 'h7d', text: 'Mang giày dép thấy chật ?' },
            { id: 'h7e', text: 'Bilan nước ? Tăng giảm cân nặng ?' }
          ]
        },
        {
          id: 'h8',
          title: 'Tính chất của phù',
          subQuestions: [
            { id: 'h8a', text: 'Phù cách đây bao lâu' },
            { id: 'h8b', text: 'Hoàn cảnh khởi phát (đột ngột, sau ăn một loại thức ăn, thuốc,...)' },
            { id: 'h8c', text: 'Vị trí ? Hướng lan ? (chỗ nào xuất hiện trước, chỗ nào sau ? Đối xứng ?' },
            { id: 'h8d', text: 'Diễn tiến (nhanh/chậm, tăng cân ?)' },
            { id: 'h8e', text: 'Yếu tố tăng / giảm ( thay đổi theo thời gian trong ngày, theo tư thế , thuốc ,...)' }
          ]
        },
        {
          id: 'h9',
          title: 'Triệu chứng kèm theo',
          subQuestions: [
            { id: 'h9a', text: 'Bilan nước (tăng/giảm) Diễn tiến thể tích nước tiểu trong các ngày phù ? (nôn ói, tiêu chảy,...) - Thể tích nước nhập (ăn uống, truyền dịch,...)' },
            { id: 'h9b', text: 'Tính chất nước tiểu : Màu sắc, Mùi, Kèm : bọt, máu,mủ, sỏi,...' },
            { id: 'h9c', text: 'Nóng, đỏ, đau vùng phù ?' },
            { id: 'h9d', text: 'Hạn chế sinh hoạt : đi lại khó khăn ?' },
            { id: 'h9e', text: 'Khó thở, đau ngực ? (khai thác đủ tính chất)' },
            { id: 'h9f', text: 'Sốt, sụt cân, chán ăn ?' },
            { id: 'h9g', text: 'Vàng da ? Nôn ra máu ? Tiêu phân đen ? Bụng to ?' },
            { id: 'h9h', text: 'Đau khớp, phát ban, loét miệng,... ?' }
          ]
        }
      ]
    },
    {
      title: 'TIỀN CĂN',
      mainQuestions: [
        {
          id: 't9',
          title: 'Tiền căn phù ? Giống lần này ? Chẩn đoán và điều trị ?',
          subQuestions: [{ id: 't9a', text: 'Mô tả' }]
        },
        {
          id: 't10',
          title: 'Bệnh lý nội khoa',
          subQuestions: [
            { id: 't10a', text: 'Bệnh lý tim mạch : Suy tim ? THA ?' },
            { id: 't10b', text: 'Bệnh lý thận : suy thận ? Viêm họng viêm da trước đó ?' },
            { id: 't10c', text: 'Các bệnh gây phù khu trú : suy van tĩnh mạch ? Chấn thương?' },
            { id: 't10d', text: 'Viêm gan B ?(chích ngừa ?), Xơ gan ?' },
            { id: 't10e', text: 'Đái tháo đường ?' },
            { id: 't10f', text: 'Bệnh hệ thống : Lupus, Amyloidosis, hội chứng Goodpasture' },
            { id: 't10g', text: 'Thuốc : NSAIDs, cyclosporine, dãn mạch, steroid,...' }
          ]
        },
        {
          id: 't11',
          title: 'Bệnh lý ngoại khoa',
          subQuestions: [{ id: 't11a', text: 'Phẫu thuật ? Xạ trị ?' }]
        },
        {
          id: 't12',
          title: 'Sản khoa - PARA',
          subQuestions: [{ id: 't12a', text: 'Mô tả' }]
        },
        {
          id: 't13',
          title: 'Thói quen – dị ứng',
          subQuestions: [
            { id: 't13a', text: 'Hút thuốc lá, uống rượu bia' },
            { id: 't13b', text: 'Chế độ ăn' },
            { id: 't13c', text: 'Dị ứng' },
            { id: 't13d', text: 'Tiếp xúc độc chất : mật gấu, ong đốt ,rắn cắn' }
          ]
        },
        {
          id: 't14',
          title: 'Gia đình',
          subQuestions: [{ id: 't14a', text: 'Lao, ung thư, bệnh tim mạch, bệnh thận (bệnh thận mạn, bệnh thận IgA, hội chứng Alport,thận đa nang,...)' }]
        }
      ]
    },
    {
      title: 'TÍNH CHUYÊN NGHIỆP',
      mainQuestions: [
        { id: 'c15', title: 'Thái độ tôn trọng người bệnh, ân cần thân thiện', subQuestions: [] },
        { id: 'c16', title: 'Tác phong chuyên nghiệp', subQuestions: [] }
      ]
    }
  ]
}