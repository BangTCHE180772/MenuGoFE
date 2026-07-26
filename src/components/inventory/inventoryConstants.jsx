import React from 'react';
import {
  ImportOutlined,
  ExportOutlined,
  SwapOutlined,
  AuditOutlined,
  BuildOutlined
} from '@ant-design/icons';

// ─── CONSTANTS & CONFIG ──────────────────────────────────────────────────────
export const DOC_TYPE_CONFIG = {
  1: { label: 'Nhập kho', color: 'blue', icon: <ImportOutlined /> },
  2: { label: 'Xuất hủy', color: 'red', icon: <ExportOutlined /> },
  3: { label: 'Chuyển hàng', color: 'cyan', icon: <SwapOutlined /> },
  4: { label: 'Trả hàng nhập', color: 'orange', icon: <ExportOutlined /> },
  5: { label: 'Kiểm kho', color: 'gold', icon: <AuditOutlined /> },
  6: { label: 'Sản xuất', color: 'purple', icon: <BuildOutlined /> }
};

export const SECTION_TITLES = {
  ALL: '📋 TÀI LIỆU',
  '1_4': '📋 NHẬP KHO / TRẢ HÀNG NHẬP',
  '6': '📋 SẢN XUẤT CHẾ BIẾN',
  '3': '📋 CHUYỂN HÀNG CHI NHÁNH',
  '5': '📋 KIỂM KHO & ĐIỀU CHỈNH',
  '2': '📋 XUẤT HỦY HÀNG HÓA',
  partners: '👥 QUẢN LÝ ĐỐI TÁC'
};

export const SIDEBAR_HEADER_TITLES = {
  overview: 'TỔNG QUAN',
  '1_4': 'NHẬP HÀNG',
  '4': 'TRẢ HÀNG NHẬP',
  '6': 'SẢN XUẤT',
  '3': 'CHUYỂN HÀNG',
  '5': 'KIỂM KHO',
  '2': 'XUẤT HỦY',
  partners: 'NHÀ CUNG CẤP / ĐỐI TÁC',
  dishes: 'MÓN',
  dish_groups: 'NHÓM MÓN',
  menu_list: 'THỰC ĐƠN',
  rooms_tables: 'PHÒNG / BÀN',
  invoices: 'HÓA ĐƠN',
  returns: 'TRẢ HÀNG',
  employees: 'NHÂN VIÊN',
  cashbook: 'SỔ QUỶ',
  reports: 'BÁO CÁO'
};

// ─── INITIAL MOCK DATASETS ───────────────────────────────────────────────────
export const INITIAL_DOCUMENTS = [
  { id: 101, code: 'IM202607261001', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T10:00:00Z', totalAmount: 15500000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
  { id: 102, code: 'EX202607261115', type: 2, typeLabel: 'Xuất hủy', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T11:15:00Z', totalAmount: 450000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
  { id: 103, code: 'TR202607261200', type: 3, typeLabel: 'Chuyển hàng', branchName: 'Chi nhánh Trung Tâm -> CN Quận 3', businessDate: '2026-07-26T12:00:00Z', totalAmount: 3200000, status: 'Completed', transferStatus: 'Pending', creator: 'Quản lý Kho' },
  { id: 104, code: 'AD202607261230', type: 5, typeLabel: 'Kiểm kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T12:30:00Z', totalAmount: 0, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
  { id: 105, code: 'PR202607261245', type: 6, typeLabel: 'Sản xuất', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T12:45:00Z', totalAmount: 2100000, status: 'Completed', transferStatus: 'None', creator: 'Đầu Bếp Trưởng' },
  { id: 106, code: 'IM202607261300', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T13:00:00Z', totalAmount: 8400000, status: 'Completed', transferStatus: 'None', creator: 'Nhân viên Nhập' },
  { id: 107, code: 'RT202607261330', type: 4, typeLabel: 'Trả hàng nhập', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T13:30:00Z', totalAmount: 1200000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
  { id: 108, code: 'TR202607261400', type: 3, typeLabel: 'Chuyển hàng', branchName: 'Chi nhánh Trung Tâm -> CN Gò Vấp', businessDate: '2026-07-26T14:00:00Z', totalAmount: 5100000, status: 'Completed', transferStatus: 'Completed', creator: 'Quản lý Kho' },
  { id: 109, code: 'EX202607261430', type: 2, typeLabel: 'Xuất hủy', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T14:30:00Z', totalAmount: 280000, status: 'Completed', transferStatus: 'None', creator: 'Bếp Phó' },
  { id: 110, code: 'AD202607261500', type: 5, typeLabel: 'Kiểm kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T15:00:00Z', totalAmount: 0, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
  { id: 111, code: 'IM202607261530', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T15:30:00Z', totalAmount: 19200000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' },
  { id: 112, code: 'PR202607261600', type: 6, typeLabel: 'Sản xuất', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T16:00:00Z', totalAmount: 3800000, status: 'Completed', transferStatus: 'None', creator: 'Đầu Bếp Trưởng' },
  { id: 113, code: 'TR202607261630', type: 3, typeLabel: 'Chuyển hàng', branchName: 'Chi nhánh Trung Tâm -> CN Tân Bình', businessDate: '2026-07-26T16:30:00Z', totalAmount: 4200000, status: 'Completed', transferStatus: 'Pending', creator: 'Quản lý Kho' },
  { id: 114, code: 'RT202607261700', type: 4, typeLabel: 'Trả hàng nhập', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T17:00:00Z', totalAmount: 850000, status: 'Completed', transferStatus: 'None', creator: 'Nhân viên Kho' },
  { id: 115, code: 'IM202607261730', type: 1, typeLabel: 'Nhập kho', branchName: 'Chi nhánh Trung Tâm', businessDate: '2026-07-26T17:30:00Z', totalAmount: 6700000, status: 'Completed', transferStatus: 'None', creator: 'Quản lý Kho' }
];

export const INITIAL_PARTNERS = [
  { id: 1, name: 'Công ty Thực Phẩm Sạch VIETFOOD', type: 'Nhà cung cấp', phone: '0901234567', totalDebt: 15500000 },
  { id: 2, name: 'Đơn Vị Vận Chuyển Nhanh 247', type: 'Vận chuyển', phone: '0988776655', totalDebt: 350000 },
  { id: 3, name: 'Nông Trại Rau Xanh Đà Lạt Sạch', type: 'Nhà cung cấp', phone: '0912345678', totalDebt: 0 },
  { id: 4, name: 'Nhà Phân Phối Đồ Uống Tân Hiệp', type: 'Nhà cung cấp', phone: '0933445566', totalDebt: 8200000 },
  { id: 5, name: 'Công Ty Hải Sản Biển Đông', type: 'Nhà cung cấp', phone: '0977889900', totalDebt: 24000000 },
  { id: 6, name: 'Xưởng Bao Bì & In Ấn Hoàng Nam', type: 'Nhà cung cấp', phone: '0944556677', totalDebt: 1200000 },
  { id: 7, name: 'Đội Vận Chuyển Hàng Đông Lạnh Express', type: 'Vận chuyển', phone: '0922334455', totalDebt: 650000 },
  { id: 8, name: 'Công Ty Thịt Bò Nhập Khẩu Mỹ-Úc', type: 'Nhà cung cấp', phone: '0966778899', totalDebt: 45000000 },
  { id: 9, name: 'Cơ Sở Gia Vị & Nước Chấm Truyền Thống', type: 'Nhà cung cấp', phone: '0911223344', totalDebt: 890000 },
  { id: 10, name: 'Đơn Vị Cung Cấp Gas Công Nghiệp Bình Minh', type: 'Nhà cung cấp', phone: '0955667788', totalDebt: 3400000 },
  { id: 11, name: 'Nông Trại Trứng Gà Sạch Ba Huân', type: 'Nhà cung cấp', phone: '0988990011', totalDebt: 1500000 },
  { id: 12, name: 'Công Ty Thiết Bị Bếp Công Nghiệp Inox', type: 'Đối tác dịch vụ', phone: '0933221100', totalDebt: 12500000 },
  { id: 13, name: 'Công Ty Khăn Lạnh & Vật Tư Tiêu Hao', type: 'Nhà cung cấp', phone: '0977665544', totalDebt: 420000 },
  { id: 14, name: 'Đơn Vị Thu Gom Rác Thải Sinh Hoạt MT', type: 'Đối tác dịch vụ', phone: '0944332211', totalDebt: 300000 },
  { id: 15, name: 'Nhà Phân Phối Bia & Nước Giải Khát SABECO', type: 'Nhà cung cấp', phone: '0911998877', totalDebt: 31000000 }
];

export const INITIAL_CASH_FLOWS = [
  { id: 1, code: 'CF-001', date: '2026-07-26T10:00:00Z', direction: 'Outflow', amount: 15500000, category: 'Thanh toán nhập kho NCC', partner: 'Công ty Thực Phẩm Sạch VIETFOOD' },
  { id: 2, code: 'CF-002', date: '2026-07-26T10:30:00Z', direction: 'Inflow', amount: 2450000, category: 'Thu tiền bán hàng ca sáng', partner: 'Khách lẻ' },
  { id: 3, code: 'CF-003', date: '2026-07-26T11:45:00Z', direction: 'Outflow', amount: 350000, category: 'Chi phí vận chuyển', partner: 'Đơn Vị Vận Chuyển Nhanh 247' },
  { id: 4, code: 'CF-004', date: '2026-07-26T12:15:00Z', direction: 'Inflow', amount: 8900000, category: 'Thu tiền đặt tiệc sinh nhật', partner: 'Anh Hoàng (Khách VIP)' },
  { id: 5, code: 'CF-005', date: '2026-07-26T13:00:00Z', direction: 'Outflow', amount: 8200000, category: 'Thanh toán tiền nước giải khát', partner: 'Nhà Phân Phối Đồ Uống Tân Hiệp' },
  { id: 6, code: 'CF-006', date: '2026-07-26T13:40:00Z', direction: 'Inflow', amount: 4150000, category: 'Thu tiền hóa đơn bán hàng', partner: 'Khách lẻ (Bàn 08)' },
  { id: 7, code: 'CF-007', date: '2026-07-26T14:10:00Z', direction: 'Outflow', amount: 1200000, category: 'Chi trả tiền in ấn menu & bao bì', partner: 'Xưởng Bao Bì & In Ấn Hoàng Nam' },
  { id: 8, code: 'CF-008', date: '2026-07-26T14:50:00Z', direction: 'Inflow', amount: 1250000, category: 'Thu tiền cọc đặt bàn trước', partner: 'Chị Lan' },
  { id: 9, code: 'CF-009', date: '2026-07-26T15:20:00Z', direction: 'Outflow', amount: 3400000, category: 'Chi đổi bình gas công nghiệp', partner: 'Gas Bình Minh' },
  { id: 10, code: 'CF-010', date: '2026-07-26T16:00:00Z', direction: 'Inflow', amount: 6700000, category: 'Thu tiền doanh thu bán lẻ ca chiều', partner: 'Khách lẻ' },
  { id: 11, code: 'CF-011', date: '2026-07-26T16:30:00Z', direction: 'Outflow', amount: 4500000, category: 'Tạm ứng lương nhân viên bếp', partner: 'Nguyễn Văn B (Đầu bếp)' },
  { id: 12, code: 'CF-012', date: '2026-07-26T17:00:00Z', direction: 'Inflow', amount: 3100000, category: 'Thu hoàn ứng tiền mua đồ lẻ', partner: 'Quản lý Kho' },
  { id: 13, code: 'CF-013', date: '2026-07-26T17:30:00Z', direction: 'Outflow', amount: 890000, category: 'Chi gia vị & phụ gia bếp', partner: 'Cơ Sở Gia Vị Truyền Thống' },
  { id: 14, code: 'CF-014', date: '2026-07-26T18:00:00Z', direction: 'Inflow', amount: 15400000, category: 'Thu tiền hóa đơn tiệc công ty', partner: 'Công ty Công Nghệ ABC' },
  { id: 15, code: 'CF-015', date: '2026-07-26T18:30:00Z', direction: 'Outflow', amount: 1500000, category: 'Chi phí vệ sinh & diệt khuẩn', partner: 'Dịch vụ Môi Trường MT' }
];

export const STATIC_INVOICES = [
  { id: 1, code: 'HD20260726001', date: '2026-07-26T10:15:00Z', customer: 'Anh Tuấn (Bàn 03)', total: 450000, status: 'Paid' },
  { id: 2, code: 'HD20260726002', date: '2026-07-26T11:00:00Z', customer: 'Chị Mai (VIP 1)', total: 1200000, status: 'Paid' },
  { id: 3, code: 'HD20260726003', date: '2026-07-26T11:30:00Z', customer: 'Anh Hoàng (Bàn 05)', total: 890000, status: 'Paid' },
  { id: 4, code: 'HD20260726004', date: '2026-07-26T12:15:00Z', customer: 'Chị Linh (Bàn 01)', total: 350000, status: 'Paid' },
  { id: 5, code: 'HD20260726005', date: '2026-07-26T12:45:00Z', customer: 'Anh Đức (VIP 2)', total: 2400000, status: 'Paid' },
  { id: 6, code: 'HD20260726006', date: '2026-07-26T13:20:00Z', customer: 'Khách lẻ (Bàn 08)', total: 670000, status: 'Paid' },
  { id: 7, code: 'HD20260726007', date: '2026-07-26T14:00:00Z', customer: 'Công ty FPT (Sảnh chính)', total: 5800000, status: 'Paid' },
  { id: 8, code: 'HD20260726008', date: '2026-07-26T14:40:00Z', customer: 'Chị Hải (Bàn 10)', total: 520000, status: 'Paid' },
  { id: 9, code: 'HD20260726009', date: '2026-07-26T15:15:00Z', customer: 'Anh Nam (Bàn 04)', total: 980000, status: 'Paid' },
  { id: 10, code: 'HD20260726010', date: '2026-07-26T16:00:00Z', customer: 'Chị Thảo (VIP 3)', total: 3100000, status: 'Paid' },
  { id: 11, code: 'HD20260726011', date: '2026-07-26T16:30:00Z', customer: 'Anh Hùng (Bàn 06)', total: 420000, status: 'Paid' },
  { id: 12, code: 'HD20260726012', date: '2026-07-26T17:10:00Z', customer: 'Khách lẻ (Bàn 02)', total: 760000, status: 'Paid' }
];

export const STATIC_RETURNS = [
  { id: 1, code: 'TH20260726001', date: '2026-07-26T14:20:00Z', customer: 'Khách lẻ (Bàn 05)', amount: 150000, reason: 'Đổi món ăn' },
  { id: 2, code: 'TH20260726002', date: '2026-07-26T15:10:00Z', customer: 'Anh Minh (VIP 1)', amount: 220000, reason: 'Khách đổi nước uống' },
  { id: 3, code: 'TH20260726003', date: '2026-07-26T16:05:00Z', customer: 'Chị Hồng (Bàn 02)', amount: 95000, reason: 'Hủy món gọi thừa' },
  { id: 4, code: 'TH20260726004', date: '2026-07-26T16:45:00Z', customer: 'Khách lẻ (Bàn 09)', amount: 180000, reason: 'Món ăn nguội khách đổi' },
  { id: 5, code: 'TH20260726005', date: '2026-07-26T17:30:00Z', customer: 'Anh Bảo (VIP 2)', amount: 450000, reason: 'Khách bớt suất tiệc' }
];

export const STATIC_DISHES = [
  { id: 1, code: 'M001', name: 'Lẩu Thái Hải Sản Đặc Biệt', group: 'Món Lẩu', price: 299000, status: 'Active' },
  { id: 2, code: 'M002', name: 'Bò Lúc Lắc Sốt Tiêu Đen', group: 'Món Xào', price: 155000, status: 'Active' },
  { id: 3, code: 'M003', name: 'Trà Đào Cam Sả Thạch', group: 'Đồ Uống', price: 45000, status: 'Active' },
  { id: 4, code: 'M004', name: 'Cơm Chiên Dương Châu Hải Sản', group: 'Món Cơm', price: 95000, status: 'Active' },
  { id: 5, code: 'M005', name: 'Gà Nướng Mật Ong Nguyên Con', group: 'Món Nướng', price: 240000, status: 'Active' },
  { id: 6, code: 'M006', name: 'Súp Hải Sản Tóc Tiên', group: 'Khai Vị', price: 65000, status: 'Active' },
  { id: 7, code: 'M007', name: 'Mì Ý Sốt Bò Bằm Bolognese', group: 'Món Mì', price: 120000, status: 'Active' },
  { id: 8, code: 'M008', name: 'Salad Cá Hồi Sốt Chanh Dây', group: 'Khai Vị', price: 135000, status: 'Active' },
  { id: 9, code: 'M009', name: 'Tôm Hùm Bỏ Lò Phô Mai', group: 'Hải Sản', price: 580000, status: 'Active' },
  { id: 10, code: 'M010', name: 'Sinh Tố Bơ Nước Cốt Dừa', group: 'Đồ Uống', price: 50000, status: 'Active' },
  { id: 11, code: 'M011', name: 'Mực Hấp Gừng Hành', group: 'Hải Sản', price: 175000, status: 'Active' },
  { id: 12, code: 'M012', name: 'Lẩu Nấm Chim Câu Trắng', group: 'Món Lẩu', price: 350000, status: 'Active' },
  { id: 13, code: 'M013', name: 'Rau Muống Xào Tỏi Hồng Bàng', group: 'Món Xào', price: 45000, status: 'Active' },
  { id: 14, code: 'M014', name: 'Bia Heineken Silver Cống', group: 'Đồ Uống', price: 35000, status: 'Active' },
  { id: 15, code: 'M015', name: 'Bánh Mì Tỏi Phô Mai Nướng', group: 'Tráng Miệng', price: 40000, status: 'Active' }
];

export const STATIC_DISH_GROUPS = [
  { id: 1, code: 'NG01', name: 'Món Lẩu', count: 12, note: 'Lẩu truyền thống & hiện đại' },
  { id: 2, code: 'NG02', name: 'Món Xào', count: 18, note: 'Các món xào nóng hổi' },
  { id: 3, code: 'NG03', name: 'Đồ Uống', count: 25, note: 'Trà, sinh tố, nước giải khát' },
  { id: 4, code: 'NG04', name: 'Món Nướng', count: 14, note: 'Nướng than hoa & bỏ lò' },
  { id: 5, code: 'NG05', name: 'Khai Vị & Salad', count: 10, note: 'Gỏi, salad, món súp' },
  { id: 6, code: 'NG06', name: 'Món Mì & Cơm', count: 16, note: 'Cơm chiên, mì xào, mỳ Ý' },
  { id: 7, code: 'NG07', name: 'Hải Sản Tươi Sống', count: 22, note: 'Tôm, cua, cá, mực hằng ngày' },
  { id: 8, code: 'NG08', name: 'Tráng Miệng & Chè', count: 8, note: 'Kem, chè, hoa quả tươi' },
  { id: 9, code: 'NG09', name: 'Món Hấp & Luộc', count: 15, note: 'Hấp thanh vị, giữ trọn dưỡng chất' },
  { id: 10, code: 'NG10', name: 'Món Chiên Rán', count: 20, note: 'Chiên giòn rụm đậm vị' },
  { id: 11, code: 'NG11', name: 'Đặc Sản Vùng Miền', count: 11, note: 'Hương vị truyền thống các vùng' },
  { id: 12, code: 'NG12', name: 'Cơm Niêu & Cơm Thố', count: 9, note: 'Cơm niêu nóng hổi cháy giòn' },
  { id: 13, code: 'NG13', name: 'Lẩu Hai Ngăn VIP', count: 7, note: 'Nước lẩu kép tùy chọn vị' },
  { id: 14, code: 'NG14', name: 'Rượu & Đồ Uống Cùng Cồn', count: 30, note: 'Rượu vang, bia craft cao cấp' },
  { id: 15, code: 'NG15', name: 'Nước Ép & Sinh Tố Tươi', count: 18, note: 'Trái cây tươi nguyên chất 100%' },
  { id: 16, code: 'NG16', name: 'Món Chay Thanh Đạm', count: 14, note: 'Chế biến từ nấm và rau củ tươi' },
  { id: 17, code: 'NG17', name: 'Món Trẻ Em (Kids Menu)', count: 6, note: 'Thiết kế riêng dinh dưỡng cho trẻ' },
  { id: 18, code: 'NG18', name: 'Combo Gia Đình 4-6 Người', count: 5, note: 'Tiết kiệm 15% so với gọi món lẻ' },
  { id: 19, code: 'NG19', name: 'Set Tiệc Công Ty', count: 4, note: 'Thực đơn tiệc trọn gói cao cấp' },
  { id: 20, code: 'NG20', name: 'Món Đi Kèm & Gia Vị Extra', count: 22, note: 'Sốt chấm, kim chi, dưa góp' },
  { id: 21, code: 'NG21', name: 'Bánh Ngọt & Soft Cake', count: 10, note: 'Bánh tráng miệng phong cách Âu' },
  { id: 22, code: 'NG22', name: 'Cà Phê & Trà Chiều', count: 16, note: 'Espresso, Matcha, trà hoa quả' },
  { id: 23, code: 'NG23', name: 'Súp & Chao Đêm', count: 8, note: 'Phục vụ ca đêm thanh nhẹ' },
  { id: 24, code: 'NG24', name: 'Hải Sản Cao Cấp (Order Trước)', count: 5, note: 'Cua Kingcrab, tôm hùm Alaska' },
  { id: 25, code: 'NG25', name: 'Món Nướng Hàn Quốc', count: 19, note: 'Dẻ sườn bò, ba chỉ ướp sốt' }
];

export const STATIC_MENU_LIST = [
  { id: 1, code: 'TD01', name: 'Thực đơn Bán Hàng Hằng Ngày', branch: 'Tất cả chi nhánh', status: 'Active' },
  { id: 2, code: 'TD02', name: 'Thực đơn Tiệc & Sự Kiện', branch: 'Chi nhánh Trung Tâm', status: 'Active' },
  { id: 3, code: 'TD03', name: 'Thực đơn Ăn Sáng & Coffee', branch: 'Tất cả chi nhánh', status: 'Active' },
  { id: 4, code: 'TD04', name: 'Thực đơn Buffet Lẩu Hải Sản', branch: 'Chi nhánh Quận 3', status: 'Active' },
  { id: 5, code: 'TD05', name: 'Thực đơn Khuyến Mãi Hè 2026', branch: 'Tất cả chi nhánh', status: 'Active' },
  { id: 6, code: 'TD06', name: 'Thực đơn Mang Về & GrabFood', branch: 'Tất cả chi nhánh', status: 'Active' }
];

export const STATIC_ROOMS_TABLES = [
  { id: 1, code: 'TB01', name: 'Bàn 01', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Trống' },
  { id: 2, code: 'TB02', name: 'Bàn 02', area: 'Tầng 1 - Sảnh chính', capacity: '6 người', status: 'Trống' },
  { id: 3, code: 'TB03', name: 'Bàn 03', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Đang phục vụ' },
  { id: 4, code: 'TB04', name: 'Bàn 04', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Trống' },
  { id: 5, code: 'TB05', name: 'Bàn 05', area: 'Tầng 1 - Sảnh chính', capacity: '8 người', status: 'Đang phục vụ' },
  { id: 6, code: 'TB06', name: 'Bàn 06', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Trống' },
  { id: 7, code: 'TB07', name: 'Bàn 07', area: 'Tầng 1 - Sảnh chính', capacity: '6 người', status: 'Trống' },
  { id: 8, code: 'TB08', name: 'Bàn 08', area: 'Tầng 1 - Sảnh chính', capacity: '4 người', status: 'Đang phục vụ' },
  { id: 9, code: 'TB09', name: 'Bàn 09', area: 'Tầng 2 - Ban công', capacity: '4 người', status: 'Trống' },
  { id: 10, code: 'TB10', name: 'Bàn 10', area: 'Tầng 2 - Ban công', capacity: '6 người', status: 'Trống' },
  { id: 11, code: 'VIP01', name: 'Phòng VIP 1', area: 'Tầng 2 - Phòng VIP', capacity: '12 người', status: 'Đang phục vụ' },
  { id: 12, code: 'VIP02', name: 'Phòng VIP 2', area: 'Tầng 2 - Phòng VIP', capacity: '16 người', status: 'Trống' },
  { id: 13, code: 'VIP03', name: 'Phòng VIP 3', area: 'Tầng 2 - Phòng VIP', capacity: '20 người', status: 'Đang phục vụ' },
  { id: 14, code: 'TB11', name: 'Bàn Sân Vườn 01', area: 'Khu Sân Vườn', capacity: '6 người', status: 'Trống' },
  { id: 15, code: 'TB12', name: 'Bàn Sân Vườn 02', area: 'Khu Sân Vườn', capacity: '8 người', status: 'Trống' }
];

export const STATIC_EMPLOYEES = [
  { id: 1, code: 'NV001', name: 'Nguyen Van A', role: 'Quản lý Kho', phone: '0901234567', status: 'Active' },
  { id: 2, code: 'NV002', name: 'Tran Thi B', role: 'Đầu Bếp Trưởng', phone: '0912345678', status: 'Active' },
  { id: 3, code: 'NV003', name: 'Le Van C', role: 'Nhân viên Phục vụ', phone: '0923456789', status: 'Active' },
  { id: 4, code: 'NV004', name: 'Pham Thi D', role: 'Thu Ngân Ca Sáng', phone: '0934567890', status: 'Active' },
  { id: 5, code: 'NV005', name: 'Hoang Van E', role: 'Pha Chế Barista', phone: '0945678901', status: 'Active' },
  { id: 6, code: 'NV006', name: 'Vu Thi F', role: 'Nhân viên Tiếp Tân', phone: '0956789012', status: 'Active' },
  { id: 7, code: 'NV007', name: 'Doan Van G', role: 'Bếp Phó Chuyên Món Lẩu', phone: '0967890123', status: 'Active' },
  { id: 8, code: 'NV008', name: 'Bui Thi H', role: 'Quản Lý Thu Ngân Ca Tối', phone: '0978901234', status: 'Active' },
  { id: 9, code: 'NV009', name: 'Ngo Van I', role: 'Nhân viên Giao Hàng', phone: '0989012345', status: 'Active' },
  { id: 10, code: 'NV010', name: 'Trinh Thi K', role: 'Tổ Trưởng Phục Vụ Tầng 2', phone: '0990123456', status: 'Active' },
  { id: 11, code: 'NV011', name: 'Phung Van L', role: 'Bảo Vệ & Giữ Xe', phone: '0909876543', status: 'Active' },
  { id: 12, code: 'NV012', name: 'Ly Thi M', role: 'Nhân viên Vệ Sinh', phone: '0918765432', status: 'Active' }
];

export const STATIC_REPORTS = [
  { id: 1, code: 'BC-KHO-01', name: 'Báo cáo tồn kho tổng hợp tháng 7', type: 'Kho hàng', period: 'Tháng 07/2026', date: '26/07/2026 14:00', creator: 'Quản lý Kho', dept: 'Bộ phận Kho', branch: 'Chi nhánh Trung Tâm', records: 1450, total: 450000000, format: 'PDF / Excel', status: 'Đã phê duyệt' },
  { id: 2, code: 'BC-TC-01', name: 'Báo cáo doanh thu & sổ quỹ chi nhánh', type: 'Tài chính', period: 'Tháng 07/2026', date: '26/07/2026 15:30', creator: 'Kế toán trưởng', dept: 'Phòng Tài chính', branch: 'Chi nhánh Trung Tâm', records: 890, total: 1250000000, format: 'Excel', status: 'Đã phê duyệt' },
  { id: 3, code: 'BC-BH-01', name: 'Báo cáo top món ăn bán chạy', type: 'Bán hàng', period: 'Tuần 30/2026', date: '26/07/2026 16:15', creator: 'Giám sát bán hàng', dept: 'Phòng Kinh doanh', branch: 'Tất cả chi nhánh', records: 120, total: 320000000, format: 'PDF', status: 'Đã phê duyệt' },
  { id: 4, code: 'BC-KHO-02', name: 'Báo cáo xuất hủy nguyên liệu quá hạn', type: 'Kho hàng', period: 'Tháng 07/2026', date: '25/07/2026 09:00', creator: 'Thủ kho chính', dept: 'Bộ phận Kho', branch: 'Chi nhánh Quận 3', records: 35, total: 12500000, format: 'Excel', status: 'Chờ duyệt' },
  { id: 5, code: 'BC-NV-01', name: 'Báo cáo công nợ nhà cung cấp chi tiết', type: 'Công nợ', period: 'Qúy II/2026', date: '25/07/2026 11:20', creator: 'Kế toán công nợ', dept: 'Phòng Tài chính', branch: 'Chi nhánh Trung Tâm', records: 48, total: 850000000, format: 'Excel', status: 'Đã phê duyệt' },
  { id: 6, code: 'BC-BH-02', name: 'Báo cáo hiệu suất phục vụ theo phòng/bàn', type: 'Bán hàng', period: 'Tháng 07/2026', date: '24/07/2026 17:45', creator: 'Quản lý vận hành', dept: 'Phòng Vận hành', branch: 'Chi nhánh Trung Tâm', records: 560, total: 680000000, format: 'PDF', status: 'Đã phê duyệt' },
  { id: 7, code: 'BC-NS-01', name: 'Báo cáo chấm công & bảng lương ca làm', type: 'Nhân sự', period: 'Tháng 07/2026', date: '24/07/2026 18:00', creator: 'Trưởng phòng Nhân sự', dept: 'Phòng Hành chính', branch: 'Tất cả chi nhánh', records: 85, total: 420000000, format: 'Excel', status: 'Đã phê duyệt' },
  { id: 8, code: 'BC-TC-02', name: 'Báo cáo thu chi quỹ tiền mặt theo hạng mục', type: 'Tài chính', period: 'Tháng 07/2026', date: '23/07/2026 16:30', creator: 'Thủ quỹ chi nhánh', dept: 'Phòng Tài chính', branch: 'Chi nhánh Trung Tâm', records: 210, total: 155000000, format: 'PDF / Excel', status: 'Đã phê duyệt' }
];
