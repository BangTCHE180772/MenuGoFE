import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  TimePicker,
  message,
  Spin,
} from "antd";
import dayjs from "dayjs";

import { getMainChain, updateChain } from "../api/chainApi";

const ChainPage = () => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [chain, setChain] = useState(null);

  //================ Load Chain ==================
  const loadChain = async () => {
    setLoading(true);

    try {
      const res = await getMainChain();

      const data = res.data;

      setChain(data);

      form.setFieldsValue({
        name: data.name,
        addressId: data.addressId,
        addressname: data.addressName,
        logoImage: data.logoImage,
        backgroundImage: data.backgroundImage,
        openTime: dayjs(data.openTime, "HH:mm:ss"),
        closeTime: dayjs(data.closeTime, "HH:mm:ss"),
      });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải thông tin chuỗi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChain();
  }, []);

  //================ Update ==================

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const dto = {
        id: chain.id,
        name: values.name,
        addressId: Number(values.addressId),
        addressname: values.addressName,
        logoImage: values.logoImage,
        backgroundImage: values.backgroundImage,
        openTime: values.openTime.format("HH:mm:ss"),
        closeTime: values.closeTime.format("HH:mm:ss"),
      };

      await updateChain(dto);

      message.success("Cập nhật thành công");

      loadChain();
    } catch (err) {
      console.error(err);

      const errors = err.response?.data?.errors;

      if (errors) {
        Object.values(errors).forEach((list) =>
          list.forEach((msg) => message.error(msg))
        );
      } else {
        message.error("Có lỗi xảy ra.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  //================ Cancel ==================

  const handleCancel = () => {
    if (!chain) return;

    form.setFieldsValue({
      name: chain.name,
      addressId: chain.addressId,
      addressname: chain.addressName,
      logoImage: chain.logoImage,
      backgroundImage: chain.backgroundImage,
      openTime: dayjs(chain.openTime, "HH:mm:ss"),
      closeTime: dayjs(chain.closeTime, "HH:mm:ss"),
    });
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );

  return (
    <Card title="Thông tin chuỗi cửa hàng">
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên chuỗi"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Nhập tên chuỗi",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Address ID"
              name="addressname"
            > 
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Logo Image"
              name="logoImage"
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Background Image"
              name="backgroundImage"
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Giờ mở cửa"
              name="openTime"
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Giờ đóng cửa"
              name="closeTime"
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Button onClick={handleCancel}>
            Hủy
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
          >
            Cập nhật
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default ChainPage;