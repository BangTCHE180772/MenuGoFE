import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

/**
 * Trang 403 - Không có quyền truy cập
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page">
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập trang này."
        extra={
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/home')}
            className="unauthorized-btn"
          >
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
};

export default UnauthorizedPage;
