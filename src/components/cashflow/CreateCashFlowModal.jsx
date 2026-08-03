import React, { useState, useEffect } from 'react';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CloseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createCashFlow } from '../../api/cashFlowApi';
import { getPartnersByBranch } from '../../api/partnerApi';

const PAYMENT_METHODS = [
  { value: 1, label: 'Tiền mặt' },
  { value: 2, label: 'Thẻ' },
  { value: 3, label: 'Chuyển khoản' },
];

const CreateCashFlowModal = ({ open, onClose, onSuccess, branchId, defaultDirection }) => {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    direction: 2,
    totalAmount: '',
    paymentMethod: 1,
    partnerId: '',
    businessDate: dayjs().format('YYYY-MM-DDTHH:mm'),
    note: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        direction: defaultDirection ?? 2,
        totalAmount: '',
        paymentMethod: 1,
        partnerId: '',
        businessDate: dayjs().format('YYYY-MM-DDTHH:mm'),
        note: '',
      });
      setErrors({});
      setLoading(false);

      getPartnersByBranch(branchId)
        .then((res) => {
          const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          setPartners(arr);
        })
        .catch(() => setPartners([]));
    }
  }, [open, branchId, defaultDirection]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.totalAmount || Number(form.totalAmount) <= 0)
      errs.totalAmount = 'Số tiền phải lớn hơn 0';
    if (Number(form.totalAmount) > 10_000_000_000)
      errs.totalAmount = 'Số tiền không được vượt quá 10 tỷ VNĐ';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createCashFlow({
        branchId,
        direction: form.direction,
        totalAmount: Number(form.totalAmount),
        partnerId: form.partnerId ? Number(form.partnerId) : null,
        paymentMethod: form.paymentMethod,
        businessDate: form.businessDate
          ? new Date(form.businessDate).toISOString()
          : new Date().toISOString(),
        note: form.note,
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      setErrors((prev) => ({ ...prev, submit: msg }));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isInflow = form.direction === 1;
  const accentColor = isInflow ? '#16a34a' : '#dc2626';
  const accentBg = isInflow ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #dc2626, #ef4444)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, zIndex: 1001,
        background: '#fff', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: accentBg,
          padding: '18px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#fff',
            }}>
              {isInflow ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                {isInflow ? 'Tạo Phiếu Thu' : 'Tạo Phiếu Chi'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
                {isInflow ? 'Ghi nhận khoản tiền nhận vào quỹ' : 'Ghi nhận khoản tiền chi ra từ quỹ'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 6,
              width: 28, height: 28, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14,
            }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Direction Toggle */}
          <div>
            <label style={labelStyle}>Loại phiếu</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {[
                { val: 1, label: 'Phiếu Thu', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { val: 2, label: 'Phiếu Chi', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              ].map(({ val, label, color, bg, border }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('direction', val)}
                  style={{
                    flex: 1, height: 36, border: `2px solid ${form.direction === val ? color : '#e2e8f0'}`,
                    borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    background: form.direction === val ? bg : '#fff',
                    color: form.direction === val ? color : '#64748b',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {val === 1 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={labelStyle}>Số tiền <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative', marginTop: 4 }}>
              <input
                type="number"
                min="1"
                max="10000000000"
                placeholder="Nhập số tiền..."
                value={form.totalAmount}
                onChange={(e) => set('totalAmount', e.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: 44,
                  borderColor: errors.totalAmount ? '#ef4444' : '#cbd5e1',
                }}
              />
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, fontWeight: 700, color: accentColor,
              }}>₫</span>
            </div>
            {errors.totalAmount && <div style={errorStyle}>{errors.totalAmount}</div>}
            {form.totalAmount && !errors.totalAmount && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                = {Number(form.totalAmount).toLocaleString('vi-VN')} VNĐ
              </div>
            )}
          </div>

          {/* Payment Method + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Phương thức</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', Number(e.target.value))}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ngày thực hiện</label>
              <input
                type="datetime-local"
                value={form.businessDate}
                onChange={(e) => set('businessDate', e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              />
            </div>
          </div>

          {/* Partner */}
          <div>
            <label style={labelStyle}>Đối tác (tuỳ chọn)</label>
            <select
              value={form.partnerId}
              onChange={(e) => set('partnerId', e.target.value)}
              style={{ ...inputStyle, marginTop: 4 }}
            >
              <option value="">— Không chọn đối tác —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle}>Ghi chú</label>
            <textarea
              rows={2}
              maxLength={255}
              placeholder="Nhập nội dung ghi chú..."
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              style={{
                ...inputStyle, marginTop: 4, resize: 'vertical', minHeight: 56,
              }}
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#dc2626',
            }}>
              {errors.submit}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0' }} />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} disabled={loading} style={cancelBtnStyle}>
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                height: 36, padding: '0 20px', border: 'none', borderRadius: 7,
                background: loading ? '#94a3b8' : accentBg,
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                minWidth: 130, justifyContent: 'center',
                transition: 'opacity 0.15s ease',
              }}
            >
              {loading ? 'Đang lưu...' : isInflow ? 'Tạo phiếu thu' : 'Tạo phiếu chi'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Shared style helpers ── */
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#374151', display: 'block',
};
const inputStyle = {
  width: '100%', height: 34, padding: '0 10px',
  fontSize: 13, color: '#1e293b',
  border: '1px solid #cbd5e1', borderRadius: 7,
  outline: 'none', boxSizing: 'border-box',
  background: '#fff', transition: 'border 0.15s ease',
};
const errorStyle = {
  fontSize: 11, color: '#ef4444', marginTop: 3,
};
const cancelBtnStyle = {
  height: 36, padding: '0 16px', border: '1px solid #cbd5e1',
  borderRadius: 7, background: '#fff', color: '#475569',
  fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

export default CreateCashFlowModal;
