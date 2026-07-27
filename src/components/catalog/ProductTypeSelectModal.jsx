import { Modal, Row, Col, Card, Typography, Space } from 'antd';
import {
  ExperimentOutlined,
  BuildOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const PRODUCT_TYPE_OPTIONS = [
  {
    type: 'Processed',
    title: 'Hàng Chế Biến',
    subtitle: 'Pha chế / Nấu tại chỗ',
    desc: 'Món ăn, đồ uống được chế biến trực tiếp tại cửa hàng có công thức định lượng (vd: Cà phê sữa, Trà đào, Phở bò).',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    icon: <ExperimentOutlined style={{ fontSize: 28, color: '#8b5cf6' }} />,
  },
  {
    type: 'Manufactured',
    title: 'Hàng Thành Phẩm',
    subtitle: 'Làm sẵn / Đóng gói',
    desc: 'Món ăn làm sẵn thành phẩm đóng gói/bán buôn có công thức định lượng (vd: Bánh mì đóng gói, Nước sốt chai).',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    icon: <BuildOutlined style={{ fontSize: 28, color: '#2563eb' }} />,
  },
  {
    type: 'Regular',
    title: 'Hàng Thường',
    subtitle: 'Hàng hóa đóng gói bán lẻ',
    desc: 'Sản phẩm mua vào bán ra trực tiếp không cần công thức (vd: Lon Coca, Nước suối, Thuốc lá).',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    icon: <ShoppingOutlined style={{ fontSize: 28, color: '#16a34a' }} />,
  },
  {
    type: 'Ingredient',
    title: 'Nguyên Vật Liệu',
    subtitle: 'Nguyên liệu kho / bếp',
    desc: 'Nguyên liệu dùng để pha chế và nấu nướng, không bán trực tiếp cho khách (vd: Hạt cà phê, Sữa tươi, Thịt bò).',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#ffedd5',
    icon: <AppstoreOutlined style={{ fontSize: 28, color: '#ea580c' }} />,
  },
  {
    type: 'Tool',
    title: 'Công Cụ Dụng Cụ',
    subtitle: 'Vật tư / Tài sản kho',
    desc: 'Dụng cụ phục vụ tại kho hoặc bếp, không có công thức và không bán lẻ (vd: Ly thủy tinh, Muỗng, Dao).',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#cff4fc',
    icon: <SettingOutlined style={{ fontSize: 28, color: '#0891b2' }} />,
  },
];

const ProductTypeSelectModal = ({ open, onCancel, onSelectType }) => {
  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', paddingBottom: 6 }}>
          <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
            Chọn loại hàng hóa / sản phẩm mới
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Vui lòng chọn loại sản phẩm bạn muốn tạo để hiển thị form cài đặt phù hợp
          </Text>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={780}
      destroyOnHidden
      style={{ top: 30 }}
    >
      <Row gutter={[14, 14]} style={{ marginTop: 12 }}>
        {PRODUCT_TYPE_OPTIONS.map((opt) => (
          <Col xs={24} sm={12} key={opt.type}>
            <Card
              hoverable
              onClick={() => onSelectType(opt.type)}
              style={{
                borderRadius: 12,
                border: `1.5px solid ${opt.borderColor}`,
                background: '#ffffff',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                height: '100%',
              }}
              bodyStyle={{ padding: 16 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = opt.color;
                e.currentTarget.style.boxShadow = `0 4px 14px ${opt.color}25`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = opt.borderColor;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Space align="start" size={14}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: opt.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {opt.icon}
                </div>

                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {opt.title}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: opt.color, marginBottom: 4 }}>
                    {opt.subtitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: '1.4' }}>
                    {opt.desc}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

export default ProductTypeSelectModal;
