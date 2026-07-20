import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  TimePicker,
  message,
} from "antd";
import dayjs from "dayjs";
import { createBranch, updateBranch } from "../api/branchApi";

const CreateUpdateBranchFormPopup = ({
  open,
  onClose,
  branchObject,
  mainChainId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (branchObject) {
      form.setFieldsValue({
        id: branchObject.id,
        addressId: branchObject.addressId,
        name: branchObject.name,
        type: branchObject.type ? branchObject.type : "Main",
        openTime: dayjs(branchObject.openTime, "HH:mm:ss"),
        closeTime: dayjs(branchObject.closeTime, "HH:mm:ss"),
      });
    } else {
      form.resetFields();
    }
  }, [branchObject, form]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const dto = {
        id: branchObject?.id ?? 0,
        chainId: mainChainId,
        addressId: Number(values.addressId),
        name: values.name,
        type: values.type ? values.type : "Main",
        openTime: values.openTime.format("HH:mm:ss"),
        closeTime: values.closeTime.format("HH:mm:ss"),
      };

      if (branchObject) {
        await updateBranch(dto);
        message.success("Cập nhật chi nhánh thành công");
      } else {
        await createBranch(dto);
        message.success("Tạo chi nhánh thành công");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;

      if (errors) {
        Object.values(errors).forEach((messages) => {
          messages.forEach((msg) => message.error(msg));
        });
        return;
      }
      
      console.error(err);
      message.error(err.response?.data?.message ?? "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      //   width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          disabled={!branchObject && !mainChainId}
          onClick={() => form.submit()}
        >
          {branchObject ? "Cập nhật" : "Tạo mới"}
        </Button>,
      ]}
      onCancel={onClose}
      destroyOnClose
      title={branchObject ? "Cập nhật chi nhánh" : "Tạo chi nhánh"}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên chi nhánh"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Nhập tên chi nhánh",
                },
                {
                  whitespace: true,
                  message: "Tên không được để trống",
                },
                {
                  max: 100,
                  message: "Tên tối đa 100 ký tự",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* <Col span={12}>
            <Form.Item
              label="Loại hình"
              name="type"
              rules={[
                {
                  required: true,
                  message: "Nhập loại hình",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col> */}

          <Col span={12}>
            <Form.Item
              label="Address ID"
              name="addressId"
              rules={[
                {
                  required: true,
                  message: "Nhập Address ID",
                },
              ]}
            >
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Giờ mở cửa"
              name="openTime"
              rules={[
                {
                  required: true,
                  message: "Chọn giờ mở cửa",
                },
              ]}
            >
              <TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                needConfirm={false}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Giờ đóng cửa"
              name="closeTime"
              rules={[
                {
                  required: true,
                  message: "Chọn giờ đóng cửa",
                },
              ]}
            >
              <TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                needConfirm={false}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateUpdateBranchFormPopup;
