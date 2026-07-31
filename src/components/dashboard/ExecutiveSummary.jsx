import { Row, Col, Badge, Tooltip } from "antd";
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  PercentageOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import AlertsPanel from "./ExecutiveSummary/AlertsPanel";
import CashFlowList from "./ExecutiveSummary/CashFlowList";
import KPICard from "./KPICard";
import OrderSummaryBar from "./ExecutiveSummary/OrderSummaryBar";

const ExecutiveSummary = ({
  loading = false,
  todayStats = null,
  yesterdayStats = null,
  onRefresh,
}) => {
  const revenue = todayStats?.revenue ?? 0;
  const expenses = todayStats?.expenses ?? 0;
  const profit = todayStats?.profit ?? 0;
  const margin = revenue > 0 ? profit / revenue : 0;

  const prevRevenue = yesterdayStats?.revenue ?? null;
  const prevExpenses = yesterdayStats?.expenses ?? null;
  const prevProfit = yesterdayStats?.profit ?? null;
  const prevMargin =
    prevRevenue > 0 && prevProfit !== null ? prevProfit / prevRevenue : null;

  const completedBills = todayStats?.completedBills ?? 0;
  const totalItemsSold = todayStats?.totalItemsSold ?? 0;
  const avgOrderValue = todayStats?.avgOrderValue ?? 0;

  const prevCompletedBills = yesterdayStats?.completedBills ?? null;
  const prevTotalItemsSold = yesterdayStats?.totalItemsSold ?? null;
  const prevAvgOrderValue = yesterdayStats?.avgOrderValue ?? null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          padding: "16px 20px",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: 12,
          color: "white",
        }}
      >
        <div style={{ fontSize: 24 }}>⚡</div>
        <div>
          <div
            style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px" }}
          >
            <Tooltip title="Executive Summary">Tóm tắt điều hành</Tooltip>
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Tổng quan hoạt động hôm nay — dữ liệu thật từ hệ thống
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Badge
            status="processing"
            color="#22c55e"
            text={
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Live
              </span>
            }
          />
          {onRefresh && (
            <Tooltip title="Làm mới dữ liệu">
              <ReloadOutlined
                style={{
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
                onClick={onRefresh}
              />
            </Tooltip>
          )}
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Doanh thu hôm nay"
            value={revenue}
            prevValue={prevRevenue}
            icon={<RiseOutlined />}
            color="#3b82f6"
            compareLabel="So với hôm qua"
            loading={loading}
            fullFormat
            description={
              <>
                Tổng số tiền thu được từ các đơn hàng đã thanh toán trong ngày
                hôm nay.
              </>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Chi phí hôm nay"
            value={expenses}
            prevValue={prevExpenses}
            icon={<FallOutlined />}
            color="#ef4444"
            compareLabel="So với hôm qua"
            loading={loading}
            fullFormat
            inverseTrend
            description={
              <>
                Tổng chi phí phát sinh.
                <br />
                <strong>
                  Nếu chi phí tăng bất thường so với hôm qua, hãy kiểm tra lại
                  các khoản chi trong ngày.
                </strong>
              </>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Lợi nhuận hôm nay"
            value={profit}
            prevValue={prevProfit}
            icon={<DollarOutlined />}
            color="#22c55e"
            compareLabel="So với hôm qua"
            loading={loading}
            fullFormat
            description={<>Tổng lợi nhuận hôm nay kiếm được.</>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Tỷ suất lợi nhuận"
            value={margin}
            prevValue={prevMargin}
            icon={<PercentageOutlined />}
            color="#f59e0b"
            isPercent
            compareLabel="So với hôm qua"
            loading={loading}
            description={
              <>
                Phản ánh mức độ hiệu quả: <strong>càng cao càng tốt.</strong>
                <br />
                Trên 40% là tốt <br />
                dưới 20% cần kiểm soát lại cơ cấu chi phí."
              </>
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <KPICard
            title="Món đã bán hôm nay"
            value={totalItemsSold}
            prevValue={prevTotalItemsSold}
            icon={<ShoppingOutlined />}
            color="#8b5cf6"
            compareLabel="So với hôm qua"
            loading={loading}
            countFormat
            description={
              <>"Tổng số lượng món ăn / đồ uống đã được phục vụ trong ngày.</>
            }
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Giá trị đơn trung bình"
            value={avgOrderValue}
            prevValue={prevAvgOrderValue}
            icon={<DollarOutlined />}
            color="#0891b2"
            compareLabel="So với hôm qua"
            loading={loading}
            fullFormat
            description={
              <>
                Cho biết trung bình mỗi khách sẵn sàng chi ra bao nhiêu tiền cho
                mỗi lần gọi món.
                <br />
                <strong>
                  Giá trị gia tăng cho thấy khách sẵn sàng chi nhiều tiền hơn
                </strong>
                <br />( Giá trị đơn trung bình = Tổng doanh thu / Số hoá đơn. )
              </>
            }
          />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard
            title="Hoá đơn đã hoàn thành"
            value={completedBills}
            prevValue={prevCompletedBills}
            icon={<CheckCircleOutlined />}
            color="#16a34a"
            compareLabel="So với hôm qua"
            loading={loading}
            countFormat
            description={
              <>
                Số đơn hàng đã được thanh toán thành công.
                <br />
                <strong>
                  Có thể dùng để đánh giá lưu lượng khách trong ngày để biết mật
                  độ khách tăng giảm so với hôm qua như nào
                </strong>
              </>
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <OrderSummaryBar
              data={
                todayStats?.orderSummary || {
                  new: 0,
                  paid: 0,
                  unpaid: 0,
                  cancelled: 0,
                  total: 0,
                }
              }
              loading={loading}
            />
            <AlertsPanel alerts={todayStats?.alerts || []} loading={loading} />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <CashFlowList
            data={todayStats?.cashFlowList || []}
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ExecutiveSummary;
