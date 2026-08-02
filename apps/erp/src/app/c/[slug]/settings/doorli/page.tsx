'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyContextProvider'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormCheckbox } from '@/components/ui/form-elements'
import { PageLoading } from '@/components/ui/loading-spinner'
import { AlertModal } from '@/components/ui/alert-modal'
import {
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  Package,
  Users,
  Clock,
  ExternalLink,
} from 'lucide-react'

interface DoorliConfig {
  id: string
  tenantId: string
  erpProviderMode: 'none' | 'simple' | 'enterprise'
  syncStatus: 'connected' | 'disconnected' | 'error'
  lastSyncAt: string | null
  syncOrders: boolean
  syncInventory: boolean
  syncCustomers: boolean
  createdAt: string
  updatedAt: string
}

interface SyncLog {
  id: string
  type: string
  status: 'success' | 'error' | 'pending'
  message: string
  createdAt: string
}

interface SyncStats {
  totalOrdersSynced: number
  totalInventoryUpdated: number
  totalCustomersSynced: number
  lastSyncDuration: number | null
}

export default function DoorliSettingsPage() {
  const { tenantId, tenantSlug } = useCompany()
  const [config, setConfig] = useState<DoorliConfig | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alertModal, setAlertModal] = useState<{
    open: boolean
    title: string
    message: string
    variant: 'error' | 'success' | 'warning' | 'info'
  }>({ open: false, title: '', message: '', variant: 'error' })

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/erp/doorli/config?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setSyncLogs(data.syncLogs || [])
        setSyncStats(data.syncStats || null)
      }
    } catch (error) {
      console.error('Error fetching Doorli config:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  async function handleProvision() {
    setProvisioning(true)
    try {
      const res = await fetch(`/api/vendors/${tenantId}/erp/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'doorli' }),
      })
      if (res.ok) {
        const data = await res.json()
        setAlertModal({
          open: true,
          title: 'Connected to Doorli',
          message: `Successfully connected to Doorli marketplace. Provider mode: ${data.providerMode || 'simple'}`,
          variant: 'success',
        })
        await fetchConfig()
      } else {
        const error = await res.json()
        setAlertModal({
          open: true,
          title: 'Connection Failed',
          message: error.error || 'Failed to connect to Doorli marketplace',
          variant: 'error',
        })
      }
    } catch {
      setAlertModal({
        open: true,
        title: 'Connection Failed',
        message: 'Failed to connect to Doorli marketplace. Please try again.',
        variant: 'error',
      })
    } finally {
      setProvisioning(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/vendors/${tenantId}/erp/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setAlertModal({
          open: true,
          title: 'Disconnected',
          message: 'Successfully disconnected from Doorli marketplace.',
          variant: 'success',
        })
        await fetchConfig()
      } else {
        const error = await res.json()
        setAlertModal({
          open: true,
          title: 'Disconnect Failed',
          message: error.error || 'Failed to disconnect from Doorli marketplace',
          variant: 'error',
        })
      }
    } catch {
      setAlertModal({
        open: true,
        title: 'Disconnect Failed',
        message: 'Failed to disconnect from Doorli marketplace. Please try again.',
        variant: 'error',
      })
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSyncSettingsChange(settings: {
    syncOrders?: boolean
    syncInventory?: boolean
    syncCustomers?: boolean
  }) {
    setSaving(true)
    try {
      const res = await fetch(`/api/erp/doorli/config?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setConfig((prev) => (prev ? { ...prev, ...settings } : null))
      } else {
        setAlertModal({
          open: true,
          title: 'Save Failed',
          message: 'Failed to update sync settings',
          variant: 'error',
        })
      }
    } catch {
      setAlertModal({
        open: true,
        title: 'Save Failed',
        message: 'Failed to update sync settings. Please try again.',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'connected':
        return <Badge variant="success" dot>Connected</Badge>
      case 'disconnected':
        return <Badge variant="default" dot>Disconnected</Badge>
      case 'error':
        return <Badge variant="danger" dot>Error</Badge>
      default:
        return <Badge variant="default">Unknown</Badge>
    }
  }

  function getProviderModeLabel(mode: string) {
    switch (mode) {
      case 'none':
        return 'Not Connected'
      case 'simple':
        return 'Simple Mode'
      case 'enterprise':
        return 'Enterprise Mode'
      default:
        return 'Unknown'
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <PageLoading text="Loading Doorli settings..." />
  }

  const isConnected = config?.syncStatus === 'connected'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doorli Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your ERP to sync with the Doorli marketplace
          </p>
        </div>
        {config && getStatusBadge(config.syncStatus)}
      </div>

      {/* Connection Status */}
      <SectionCard
        title="Connection Status"
        icon={<Link2 size={18} />}
        actions={
          isConnected ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              loading={disconnecting}
              leftIcon={<Unlink size={14} />}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={handleProvision}
              loading={provisioning}
              leftIcon={<Link2 size={14} />}
            >
              Connect to Doorli
            </Button>
          )
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Provider Mode
            </div>
            <div className="mt-1 flex items-center gap-2">
              {isConnected ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-gray-400" />
              )}
              <span className="text-sm font-medium">
                {getProviderModeLabel(config?.erpProviderMode || 'none')}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Last Sync
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm font-medium">
                {config?.lastSyncAt ? formatDate(config.lastSyncAt) : 'Never'}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Connection
            </div>
            <div className="mt-1">
              {isConnected ? (
                <Badge variant="success" dot>Active</Badge>
              ) : (
                <Badge variant="default">Inactive</Badge>
              )}
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Not Connected
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Connect your ERP to Doorli marketplace to start receiving orders and syncing inventory.
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Sync Settings */}
      <SectionCard
        title="Sync Settings"
        icon={<RefreshCw size={18} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchConfig()}
            leftIcon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                  <ShoppingBag size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <FormCheckbox
                    label="Orders"
                    description="Sync marketplace orders to ERP"
                    checked={config?.syncOrders ?? true}
                    onChange={(e) => handleSyncSettingsChange({ syncOrders: e.target.checked })}
                    disabled={!isConnected || saving}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                  <Package size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <FormCheckbox
                    label="Inventory"
                    description="Push inventory updates to marketplace"
                    checked={config?.syncInventory ?? true}
                    onChange={(e) => handleSyncSettingsChange({ syncInventory: e.target.checked })}
                    disabled={!isConnected || saving}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                  <Users size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <FormCheckbox
                    label="Customers"
                    description="Sync customer data with marketplace"
                    checked={config?.syncCustomers ?? false}
                    onChange={(e) => handleSyncSettingsChange({ syncCustomers: e.target.checked })}
                    disabled={!isConnected || saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {!isConnected && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Connect to Doorli marketplace to configure sync settings
            </p>
          )}
        </div>
      </SectionCard>

      {/* Sync Statistics */}
      {syncStats && isConnected && (
        <SectionCard title="Sync Statistics" icon={<ExternalLink size={18} />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {syncStats.totalOrdersSynced}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Orders Synced
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {syncStats.totalInventoryUpdated}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Inventory Updates
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {syncStats.totalCustomersSynced}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Customers Synced
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {syncStats.lastSyncDuration ? `${syncStats.lastSyncDuration}s` : '-'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last Sync Duration
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Recent Sync Logs */}
      <SectionCard title="Recent Sync Logs" icon={<Clock size={18} />}>
        {syncLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No sync logs yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {log.status === 'success' ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : log.status === 'error' ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <Clock size={16} className="text-yellow-500" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.type}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {log.message}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">{formatDate(log.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  )
}
