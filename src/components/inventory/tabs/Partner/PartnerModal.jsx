import React, { useState, useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';

const PartnerModal = ({
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Nhà cung cấp');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setType('Nhà cung cấp');
      setNote('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSuccess) {
        onSuccess({
          id: Date.now(),
          name,
          phone,
          email,
          address,
          type,
          note
        });
      }
      onClose();
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#ffffff',
          borderRadius: 10,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Thêm nhà cung cấp / đối tác mới</div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: 14 }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Tên nhà cung cấp / đối tác *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên công ty / cá nhân đối tác..."
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901..."
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@gmail.com"
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Phân loại đối tác
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="Nhà cung cấp">Nhà cung cấp</option>
                  <option value="Vận chuyển">Vận chuyển</option>
                  <option value="Đối tác dịch vụ">Đối tác dịch vụ</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Địa chỉ giao dịch..."
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm về đối tác..."
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justify: 'flex-end',
              gap: 8,
              background: '#f8fafc'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 32,
                padding: '0 14px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              style={{
                height: 32,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                background: loading || !name ? '#cbd5e1' : '#e8442a',
                color: '#ffffff',
                cursor: loading || !name ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang lưu...' : 'Lưu đối tác'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerModal;
