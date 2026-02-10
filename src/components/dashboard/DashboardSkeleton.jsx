import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * DashboardSkeleton — Per-widget skeleton loaders for the clinical command center.
 * Shows shimmer placeholders while data loads, replacing the single "⏳" spinner.
 */

/* ─── Stat Card skeleton ─── */
export const SkeletonStatCard = () => {
  const { t } = useLanguage();
  return (
  <div
    role="status"
    aria-label={t('widgets.dashboardSkeleton.loadingStatistic')}
    style={{
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-color-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width="60%" height={14} />
      <Skeleton variant="avatar" width={28} height={28} />
    </div>
    <Skeleton variant="title" width="40%" height={32} />
    <Skeleton variant="rect" width="100%" height={32} />
  </div>
  );
};

/* ─── Wide card skeleton (CommandFeed, TriageQueue) ─── */
export const SkeletonFeedCard = () => {
  const { t } = useLanguage();
  return (
  <div
    role="status"
    aria-label={t('widgets.dashboardSkeleton.loadingFeed')}
    style={{
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-color-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}
  >
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-color-subtle)' }}>
      <Skeleton variant="title" width="45%" height={20} />
      <Skeleton variant="text" width="20%" height={14} />
    </div>
    {/* Tabs */}
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {[60, 40, 50, 45].map((w, i) => (
        <Skeleton key={i} variant="rect" width={w} height={26} className="skeleton-pill" />
      ))}
    </div>
    {/* Items */}
    {[1, 2, 3, 4].map((i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
        <Skeleton variant="avatar" width={24} height={24} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <Skeleton variant="text" width={`${70 + (i % 3) * 10}%`} height={13} />
          <Skeleton variant="text" width="40%" height={11} />
        </div>
      </div>
    ))}
  </div>
  );
};

/* ─── Compact card skeleton (Workload, QuickOrders, MAR, Roster) ─── */
export const SkeletonCompactCard = ({ lines = 4 }) => {
  const { t } = useLanguage();
  return (
  <div
    role="status"
    aria-label={t('widgets.dashboardSkeleton.loadingWidget')}
    style={{
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-color-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-color-subtle)' }}>
      <Skeleton variant="title" width="50%" height={20} />
      <Skeleton variant="rect" width={60} height={22} />
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Skeleton variant="rect" width={16} height={16} />
        <Skeleton variant="text" width={`${60 + (i % 3) * 15}%`} height={13} />
      </div>
    ))}
    <Skeleton variant="rect" width="100%" height={8} />
  </div>
  );
};

/* ─── Bed board skeleton (grid) ─── */
export const SkeletonBedBoard = () => {
  const { t } = useLanguage();
  return (
  <div
    role="status"
    aria-label={t('widgets.dashboardSkeleton.loadingBedBoard')}
    style={{
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-color-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-color-subtle)' }}>
      <Skeleton variant="title" width="40%" height={20} />
      <Skeleton variant="text" width="30%" height={14} />
    </div>
    <Skeleton variant="rect" width="100%" height={12} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} variant="rect" width="100%" height={36} />
      ))}
    </div>
  </div>
  );
};

/* ─── Banner skeleton ─── */
export const SkeletonBanner = () => {
  const { t } = useLanguage();
  return (
  <div
    role="status"
    aria-label={t('widgets.dashboardSkeleton.loadingBanner')}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '12px 16px',
      borderRadius: 'var(--radius-lg)',
      borderLeft: '4px solid var(--border-color-subtle)',
      background: 'var(--surface-secondary)',
    }}
  >
    <Skeleton variant="avatar" width={24} height={24} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <Skeleton variant="text" width="70%" height={13} />
      <Skeleton variant="text" width="30%" height={11} />
    </div>
    <Skeleton variant="rect" width={65} height={26} />
    <Skeleton variant="rect" width={55} height={26} />
  </div>
  );
};

/* ─── Full dashboard skeleton layout ─── */
export const DashboardSkeletonLayout = () => {
  const { t } = useLanguage();
  return (
  <div
    aria-busy="true"
    aria-label={t('widgets.dashboardSkeleton.dashboardLoading')}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      animation: 'fadeIn 0.3s var(--ease-smooth)',
    }}
  >
    {/* Banner */}
    <SkeletonBanner />

    {/* Stats row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>

    {/* Feed row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
      <SkeletonFeedCard />
      <SkeletonFeedCard />
    </div>

    {/* Compact widgets row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
      <SkeletonCompactCard lines={5} />
      <SkeletonCompactCard lines={3} />
      <SkeletonCompactCard lines={4} />
    </div>

    {/* Bottom row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
      <SkeletonCompactCard lines={4} />
      <SkeletonCompactCard lines={5} />
      <SkeletonBedBoard />
    </div>
  </div>
  );
};

export default DashboardSkeletonLayout;
