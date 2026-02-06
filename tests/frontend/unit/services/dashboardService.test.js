import { vi } from 'vitest';
import dashboardService from '@/services/dashboardService';
import { apiFetch } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiFetch: vi.fn(),
  buildApiUrl: vi.fn(),
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds patient query with filters', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await dashboardService.getCriticalPatients({
      status: 'critical',
      search: 'sarah',
      limit: 5,
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/patients?status=critical&search=sarah&limit=5');
  });

  it('returns array payload when API responds with list', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'patient-1' }],
    });

    const result = await dashboardService.getCriticalPatients();

    expect(result).toEqual([{ id: 'patient-1' }]);
  });

  it('falls back to mock patients on error', async () => {
    apiFetch.mockRejectedValue(new Error('Network error'));

    const result = await dashboardService.getCriticalPatients({ search: 'sarah' });

    expect(result.length).toBeGreaterThan(0);
  });
});
