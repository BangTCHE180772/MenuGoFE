import React, { useEffect, useState } from 'react';
import { notification, Button } from 'antd';
import { useSignalR } from '../../context/SignalRContext';
import ChangeTableModal from './ChangeTableModal';

const GlobalReservationListener = () => {
  const connection = useSignalR();
  const [conflictData, setConflictData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (!connection) return;

    const handleConflict = (data) => {
      // data: { ReservationId, TableId, TableName, BranchId, ReservationTime, Message }
      // Play a simple alert sound
      const audio = new Audio('/sounds/alert.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));

      // Show notification
      const key = `conflict-${data.ReservationId}`;
      notification.warning({
        key,
        message: 'Cảnh Báo Xung Đột Bàn',
        description: data.Message,
        duration: 0, // Don't auto close
        placement: 'topRight',
        btn: (
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => {
              notification.destroy(key);
              setConflictData(data);
              setIsModalVisible(true);
            }}
          >
            Xử lý ngay
          </Button>
        ),
      });
    };

    connection.on('TableConflictWarning', handleConflict);

    return () => {
      connection.off('TableConflictWarning', handleConflict);
    };
  }, [connection]);

  return (
    <>
      <ChangeTableModal
        visible={isModalVisible}
        conflictData={conflictData}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => {
          // If you need to trigger a global refresh, you can do it here
          // e.g., triggering a custom event or relying on SignalR updates
        }}
      />
    </>
  );
};

export default GlobalReservationListener;
