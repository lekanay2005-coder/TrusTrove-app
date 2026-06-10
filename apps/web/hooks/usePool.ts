import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPoolStats, getLPPosition } from '@/lib/api';
import { PoolClient } from '@trusttrove/sdk';
import { useWalletStore } from '@/store/wallet';

const poolContractID = process.env.NEXT_PUBLIC_POOL_CONTRACT_ID || '';

export function usePool() {
  const queryClient = useQueryClient();
  const { address } = useWalletStore();

  const statsQuery = useQuery({
    queryKey: ['poolStats'],
    queryFn: () => getPoolStats(),
  });

  const positionQuery = useQuery({
    queryKey: ['lpPosition', address],
    queryFn: () => getLPPosition(address!),
    enabled: !!address,
  });

  const depositMutation = useMutation({
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const poolClient = new PoolClient(poolContractID);
      return poolClient.deposit(address, amount, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolStats'] });
      queryClient.invalidateQueries({ queryKey: ['lpPosition', address] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ shares }: { shares: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const poolClient = new PoolClient(poolContractID);
      return poolClient.withdraw(address, shares, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolStats'] });
      queryClient.invalidateQueries({ queryKey: ['lpPosition', address] });
    },
  });

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
    refetchStats: statsQuery.refetch,

    position: positionQuery.data,
    isPositionLoading: positionQuery.isLoading,
    positionError: positionQuery.error,
    refetchPosition: positionQuery.refetch,

    deposit: depositMutation.mutateAsync,
    isDepositing: depositMutation.isPending,
    depositError: depositMutation.error,

    withdraw: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
    withdrawError: withdrawMutation.error,
  };
}
