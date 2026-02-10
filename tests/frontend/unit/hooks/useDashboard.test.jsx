import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
const mockService = vi.hoisted(() => ({
  getStats: vi.fn(),
  getRecentActivity: vi.fn(),
  getActiveAlerts: vi.fn(),
  getCriticalPatients: vi.fn(),
  acknowledgeAlert: vi.fn(),
  trackToolAccess: vi.fn(),
  subscribeToActivity: vi.fn(),
  subscribeToAlerts: vi.fn(),
  subscribeToStats: vi.fn(),
  subscribeToAlertAcknowledged: vi.fn(),
  subscribeToWorkload: vi.fn(),
  subscribeToConnection: vi.fn(),
  getWorkload: vi.fn(),
  getMARPreview: vi.fn(),
  getOnCallRoster: vi.fn(),
  getBedBoard: vi.fn(),
  getLabTimeline: vi.fn(),
  getCDSReminders: vi.fn(),
  toggleTask: vi.fn(),
  placeOrder: vi.fn(),
}));

vi.mock('@/services/dashboardService', () => ({
  default: mockService,
}));

import { useDashboard } from '@/hooks/useDashboard';


describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mockService.getStats.mockResolvedValue({
      criticalPatients: 2,
      activePatients: 10,
      stablePatients: 5,
      pendingLabs: 1,
      trends: {},
    });
    mockService.getRecentActivity.mockResolvedValue([
      { id: 'activity-1', type: 'lab', message: 'Lab results', patientName: 'Sarah', timestamp: new Date() },
    ]);
    mockService.getActiveAlerts.mockResolvedValue([
      { id: 'alert-1', severity: 'critical', message: 'Alert', patientName: 'Sarah', timestamp: new Date(), acknowledged: false },
    ]);
    mockService.getCriticalPatients.mockResolvedValue([
      { id: 'patient-1', name: 'Sarah Johnson', status: 'critical' },
    ]);
    mockService.getWorkload.mockResolvedValue({ tasks: [], completedCount: 0, totalCount: 0 });
    mockService.getMARPreview.mockResolvedValue([]);
    mockService.getOnCallRoster.mockResolvedValue([]);
    mockService.getBedBoard.mockResolvedValue({ beds: [], occupancy: 0, total: 0 });
    mockService.getLabTimeline.mockResolvedValue([]);
    mockService.getCDSReminders.mockResolvedValue([]);
    mockService.acknowledgeAlert.mockResolvedValue(true);
    mockService.toggleTask.mockResolvedValue(true);
    mockService.placeOrder.mockResolvedValue({ success: true });
    mockService.subscribeToActivity.mockImplementation((cb) => {
      mockService._activityCallback = cb;
      return vi.fn();
    });
    mockService.subscribeToAlerts.mockImplementation((cb) => {
      mockService._alertCallback = cb;
      return vi.fn();
    });
    mockService.subscribeToStats.mockImplementation(() => vi.fn());
    mockService.subscribeToAlertAcknowledged.mockImplementation(() => vi.fn());
    mockService.subscribeToWorkload.mockImplementation(() => vi.fn());
    mockService.subscribeToConnection.mockImplementation((cb) => {
      cb('connected');
      return vi.fn();
    });
  });

  it('loads dashboard data on mount', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.stats).toBeTruthy();
      expect(result.current.activities.length).toBe(1);
      expect(result.current.alerts.length).toBe(1);
      expect(result.current.criticalPatients.length).toBe(1);
    });
  });

  it('handles real-time activity updates', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.activities.length).toBe(1);
    });

    act(() => {
      mockService._activityCallback({
        id: 'activity-2',
        type: 'vital',
        message: 'Vitals recorded',
        patientName: 'Mike',
        timestamp: new Date(),
      });
    });

    expect(result.current.activities[0].id).toBe('activity-2');
  });

  it('acknowledges alerts', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.alerts.length).toBe(1);
    });

    await act(async () => {
      await result.current.acknowledgeAlert('alert-1');
    });

    expect(mockService.acknowledgeAlert).toHaveBeenCalledWith('alert-1');
  });
});
