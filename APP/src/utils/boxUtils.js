// src/utils/boxUtils.js

export function getStatusMeta(status) {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: '可預約',
        tone: 'success',
      };
    case 'IN_USE':
      return {
        label: '使用中',
        tone: 'primary',
      };
    case 'ALERT':
      return {
        label: '異常',
        tone: 'danger',
      };
    default:
      return {
        label: '未知',
        tone: 'neutral',
      };
  }
}
