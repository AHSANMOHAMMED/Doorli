'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCompanyOptional } from '@/components/providers/CompanyContextProvider'
import { useRealtimeData, useCurrency } from '@/hooks'
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface MarketplaceOrder {
  id: string
  invoiceNo: string
  total: string
  createdAt: string
  customerName: string | null
}

interface MarketplaceStats {
  todayOrders: number
  todayRevenue: number
  recentOrders: MarketplaceOrder[]
  syncStatus: 'connected' | 'disconnected' | 'error'
}

export function MarketplaceWidget() {
  const params = useParams()
  const { currency: currencyCode } = useCurrency()
  const company = useCompanyOptional()
  const slug = params.slug as string
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/erp/doorli/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching marketplace stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useRealtimeData(fetchStats, { entityType: 'sale', refreshOnMount: false })

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={18} className="text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Marketplace</h3>
        </div>
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    )
  }

  // Don't render if no marketplace connection or no data
  if (!stats || (stats.syncStatus !== 'connected' && stats.todayOrders === 0)) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Marketplace</h3>
          {stats.syncStatus === 'connected' ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 size={12} />
              Synced
            </span>
          ) : stats.syncStatus === 'error' ? (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <XCircle size={12} />
              Error
            </span>
          ) : null}
        </div>
        <Link
          href={`/c/${slug}/sales?marketplace=true`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View all
          <ExternalLink size={10} />
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400">Today&apos;s Orders</span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            {stats.todayOrders}
          </div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-600 dark:text-green-400">Today&apos;s Revenue</span>
          </div>
          <div className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
            {currencyCode} {stats.todayRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {stats.recentOrders.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Recent Marketplace Orders
          </h4>
          <div className="space-y-2">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/c/${slug}/sales?search=${encodeURIComponent(order.invoiceNo)}`}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={12} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {order.invoiceNo}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(order.createdAt)}
                      {order.customerName && ` • ${order.customerName}`}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2">
                  {currencyCode} {parseFloat(order.total).toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats.recentOrders.length === 0 && stats.todayOrders === 0 && (
        <div className="text-center py-4">
          <ShoppingBag size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No marketplace orders yet</p>
        </div>
      )}
    </div>
  )
}
