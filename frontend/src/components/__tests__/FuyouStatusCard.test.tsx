import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FuyouStatusCard } from '../FuyouStatusCard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getEnhancedCalculation: vi.fn().mockResolvedValue({
      success: true,
      data: {
        currentIncome: 800000,
        monthlyTarget: 67000,
        remainingAmount: 430000,
        usageRate: 0.65,
        projectedYearEndIncome: 960000,
        riskLevel: 'safe',
        alerts: [],
        recommendedLimit: {
          type: 'fuyou_123',
          amount: 1230000,
          description: '新・配偶者控除（123万円）',
        },
      },
    }),
  },
}));

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('FuyouStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    renderWithAuth(<FuyouStatusCard />);

    expect(screen.getByText('扶養ステータス')).toBeInTheDocument();
  });

  it('should display fuyou status after loading', async () => {
    const mockCallback = vi.fn();
    renderWithAuth(<FuyouStatusCard onStatusUpdate={mockCallback} />);

    await waitFor(() => {
      expect(screen.getByText('¥800,000')).toBeInTheDocument();
    });

    // Should show current year income
    expect(screen.getByText('今年の収入')).toBeInTheDocument();

    // Should show percentage
    expect(screen.getByText('65%')).toBeInTheDocument();

    // Should call callback with status
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should show safe status color for low usage', async () => {
    renderWithAuth(<FuyouStatusCard />);

    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('should display remaining capacity', async () => {
    renderWithAuth(<FuyouStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('¥430,000')).toBeInTheDocument();
      expect(screen.getByText('残り使用可能額')).toBeInTheDocument();
    });
  });

  it('should show projected year-end income', async () => {
    renderWithAuth(<FuyouStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('¥960,000')).toBeInTheDocument();
      expect(screen.getByText('年末予想収入')).toBeInTheDocument();
    });
  });
});
