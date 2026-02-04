import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CostTrackingProvider, useCostTracking } from '@/contexts/CostTrackingContext';

const mockUser = { id: 'test-user' };

vi.mock('@/contexts/UserContext', () => ({
  useUser: () => ({ user: mockUser }),
}));

describe('CostTrackingContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => (
    <CostTrackingProvider>{children}</CostTrackingProvider>
  );

  describe('trackToolCost', () => {
    it('should track tool execution and update costs', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker', {
          executionTimeMs: 150,
          userId: 'test-user'
        });
      });

      expect(result.current.costData.totalCost).toBeGreaterThan(0);
      expect(result.current.costData.executions).toHaveLength(1);
      expect(result.current.costData.executions[0].toolId).toBe('drug-checker');
    });

    it('should accumulate costs for multiple executions', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
        result.current.trackToolCost('lab-interpreter');
        result.current.trackToolCost('calculator');
      });

      expect(result.current.costData.executions).toHaveLength(3);
      expect(result.current.costData.totalCost).toBeGreaterThan(0);
    });

    it('should categorize costs correctly', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
      });

      const categoryCosts = result.current.costData.categoryCosts;
      expect(categoryCosts.MEDICATION_MANAGEMENT).toBeGreaterThan(0);
    });
  });

  describe('getROIMetrics', () => {
    it('should calculate ROI metrics correctly', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
        result.current.trackToolCost('lab-interpreter');
      });

      const roi = result.current.getROIMetrics();

      expect(parseFloat(roi.totalCost)).toBeGreaterThan(0);
      expect(roi.timeSavedMinutes).toBeGreaterThan(0);
      expect(parseFloat(roi.valueSaved)).toBeGreaterThan(0);
      expect(roi.netValue).toBeDefined();
      expect(roi.roi).toBeDefined();
    });

    it('should calculate positive ROI when value exceeds cost', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      // Typical scenario: multiple tool uses create value
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackToolCost('drug-checker');
        }
      });

      const roi = result.current.getROIMetrics();
      expect(parseFloat(roi.roi)).toBeGreaterThan(0);
      expect(parseFloat(roi.netValue)).toBeGreaterThan(0);
    });
  });

  describe('getCostTrends', () => {
    it('should return daily cost aggregates', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
        result.current.trackToolCost('lab-interpreter');
      });

      const trends = result.current.getCostTrends();
      expect(trends).toBeInstanceOf(Array);
      expect(trends.length).toBeGreaterThan(0);
      
      const todayTrend = trends[trends.length - 1];
      expect(todayTrend).toHaveProperty('date');
      expect(todayTrend).toHaveProperty('cost');
      expect(todayTrend.cost).toBeGreaterThan(0);
    });

    it('should return 30 days of trend data', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      const trends = result.current.getCostTrends();
      expect(trends).toHaveLength(30);
    });
  });

  describe('getTopSpendingTools', () => {
    it('should return top spending tools sorted by cost', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        // Execute different tools different numbers of times
        for (let i = 0; i < 5; i++) result.current.trackToolCost('drug-checker');
        for (let i = 0; i < 2; i++) result.current.trackToolCost('lab-interpreter');
        result.current.trackToolCost('calculator');
      });

      const topTools = result.current.getTopSpendingTools(3);
      
      expect(topTools).toHaveLength(3);
      expect(topTools[0].toolId).toBe('drug-checker'); // Most executions
      
      // Verify descending order by cost
      for (let i = 0; i < topTools.length - 1; i++) {
        expect(topTools[i].cost).toBeGreaterThanOrEqual(topTools[i + 1].cost);
      }
    });

    it('should limit results based on limit parameter', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
        result.current.trackToolCost('lab-interpreter');
        result.current.trackToolCost('calculator');
        result.current.trackToolCost('diagnosis-assistant');
      });

      const top2 = result.current.getTopSpendingTools(2);
      expect(top2).toHaveLength(2);
    });
  });

  describe('Budget Limits', () => {
    it('should detect when approaching cost limit (80%)', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.updateCostLimit(1.0); // $1.00 limit
      });

      // Spend 85 cents (85%)
      act(() => {
        for (let i = 0; i < 17; i++) {
          result.current.trackToolCost('drug-checker'); // $0.05 each
        }
      });

      expect(result.current.isCostLimitApproaching).toBe(true);
      expect(result.current.isCostLimitExceeded).toBe(false);
    });

    it('should detect when cost limit is exceeded (100%)', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.updateCostLimit(0.50); // $0.50 limit
      });

      // Spend 60 cents (120%)
      act(() => {
        for (let i = 0; i < 12; i++) {
          result.current.trackToolCost('drug-checker'); // $0.05 each
        }
      });

      expect(result.current.isCostLimitExceeded).toBe(true);
      expect(result.current.isCostLimitApproaching).toBe(true);
    });

    it('should allow updating cost limit', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.updateCostLimit(10.0);
      });

      expect(result.current.costLimit).toBe(10.0);

      act(() => {
        result.current.updateCostLimit(20.0);
      });

      expect(result.current.costLimit).toBe(20.0);
    });
  });

  describe('resetCostData', () => {
    it('should clear all cost tracking data', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
        result.current.trackToolCost('lab-interpreter');
      });

      expect(result.current.costData.totalCost).toBeGreaterThan(0);
      expect(result.current.costData.executions).toHaveLength(2);

      act(() => {
        result.current.resetCostData();
      });

      expect(result.current.costData.totalCost).toBe(0);
      expect(result.current.costData.executions).toHaveLength(0);
      expect(result.current.costData.monthlyCost).toBe(0);
    });

    it('should preserve cost limit after reset', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.updateCostLimit(15.0);
        result.current.trackToolCost('drug-checker');
      });

      const limitBefore = result.current.costLimit;

      act(() => {
        result.current.resetCostData();
      });

      expect(result.current.costLimit).toBe(limitBefore);
    });
  });

  describe('persistence', () => {
    it('should persist cost data to localStorage', () => {
      const { result } = renderHook(() => useCostTracking(), { wrapper });

      act(() => {
        result.current.trackToolCost('drug-checker');
      });

      // Check that data was saved
      const saved = localStorage.getItem('careDroid.costs.test-user');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved);
      expect(parsed.executions).toHaveLength(1);
      expect(parsed.totalCost).toBeGreaterThan(0);
    });

    it('should load persisted data on mount', () => {
      // Pre-populate localStorage
      const initialData = {
        totalCost: 1.5,
        monthlyCost: 1.5,
        executions: [
          {
            toolId: 'drug-checker',
            cost: 0.05,
            timestamp: new Date().toISOString(),
            userId: 'test-user'
          }
        ],
        toolCosts: { 'drug-checker': 0.05 },
        categoryCosts: { MEDICATION_MANAGEMENT: 0.05 },
        costLimit: 100
      };

      localStorage.setItem('careDroid.costs.test-user', JSON.stringify(initialData));

      const { result } = renderHook(() => useCostTracking(), { wrapper });

      // Should load the persisted data
      expect(result.current.costData.totalCost).toBe(1.5);
      expect(result.current.costData.executions).toHaveLength(1);
    });
  });
});
