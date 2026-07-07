/**
 * Màn hình Thu Ngân / Điểm Danh
 *
 * Trang này chỉ truy cập được từ thiết bị đã được Manager cấp quyền.
 * (DeviceRoute kiểm tra device_token trong localStorage)
 *
 * TODO: Team sẽ thêm nội dung thực tế vào đây
 */
const CashierPage = () => {
  return (
    <div className="cashier-page">
      <div className="cashier-placeholder">
        <div className="cashier-placeholder-icon">🖥️</div>
        <h2>Màn Thu Ngân / Điểm Danh</h2>
        <p>
          Tính năng đang được phát triển.
          <br />
          Team sẽ thêm giao diện thu ngân và điểm danh tại đây.
        </p>
        <div className="cashier-placeholder-badges">
          <span className="badge badge-green">✅ Thiết bị được cấp quyền</span>
          <span className="badge badge-blue">🔒 Không yêu cầu đăng nhập</span>
        </div>
      </div>
    </div>
  );
};

export default CashierPage;
