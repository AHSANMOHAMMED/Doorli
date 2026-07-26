"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (id) {
      superAdminFetch(`/admin/orders/${id}`).then((res) => {
        if (res.success) setOrder(res.data);
      }).catch(console.error);
    }
  }, [id]);

  if (!order) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><p className="text-white">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Top App Bar (Shared Component)  */}
<header className="bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant w-full top-0 sticky flex justify-between items-center px-margin-mobile h-16 w-full z-50">
<div className="flex items-center gap-4">
<button onClick={() => window.history.back()} className="text-on-surface-variant p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-full transition-colors duration-200">
<span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Order #{order.orderNumber}</h1>
</div>
<div className="flex items-center gap-2">
<span className="bg-tertiary-container/20 text-tertiary font-caption text-caption px-3 py-1 rounded-full uppercase">{order.status}</span>
<button className="text-on-surface-variant p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-full transition-colors duration-200">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</div>
</header>
<main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
{/*  Top Status & Force Actions Bar  */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container p-md rounded-xl border border-surface-variant shadow-md">
<div>
<p className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">Transaction ID</p>
<p className="font-section-header text-section-header font-mono">{order.id.substring(0, 18).toUpperCase()}</p>
</div>
<div className="flex flex-wrap gap-sm">
<button className="flex items-center gap-2 bg-surface-container-high border border-surface-variant text-on-surface font-label-medium text-label-medium px-4 py-2 rounded-xl hover:bg-surface-variant transition-colors">
<span className="material-symbols-outlined text-sm" data-icon="hub">hub</span>
                    Reassign Hub
                </button>
<button className="flex items-center gap-2 bg-surface-container-high border border-surface-variant text-on-surface font-label-medium text-label-medium px-4 py-2 rounded-xl hover:bg-surface-variant transition-colors">
<span className="material-symbols-outlined text-sm" data-icon="payments">payments</span>
                    Manual Refund
                </button>
<button className="flex items-center gap-2 bg-primary-container text-on-primary-container font-label-medium text-label-medium px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all">
<span className="material-symbols-outlined text-sm" data-icon="cancel">cancel</span>
                    Cancel Order
                </button>
</div>
</div>
{/*  Main Content Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
{/*  Left Column: Timeline & Order Items (8 Cols)  */}
<div className="lg:col-span-8 space-y-lg">
{/*  Timeline Section  */}
<section className="bg-surface-container-low border border-surface-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header text-primary mb-lg">Order Lifecycle</h3>
<div className="relative flex justify-between items-start px-2">
{/*  Connecting Line  */}
<div className="absolute top-4 left-4 right-4 h-0.5 bg-surface-variant"></div>
<div className="absolute top-4 left-4 w-1/2 h-0.5 bg-tertiary"></div>
{/*  Timeline Step 1: Placed  */}
<div className="relative z-10 flex flex-col items-center text-center w-1/4">
<div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary mb-2">
<span className="material-symbols-outlined text-base" data-icon="check">check</span>
</div>
<p className="font-label-medium text-label-medium text-on-surface">Placed</p>
<p className="font-caption text-caption text-on-surface-variant">Oct 24, 09:12 AM</p>
</div>
{/*  Timeline Step 2: Processed  */}
<div className="relative z-10 flex flex-col items-center text-center w-1/4">
<div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary mb-2">
<span className="material-symbols-outlined text-base" data-icon="check">check</span>
</div>
<p className="font-label-medium text-label-medium text-on-surface">Processed</p>
<p className="font-caption text-caption text-on-surface-variant">Oct 24, 09:45 AM</p>
</div>
{/*  Timeline Step 3: Dispatched  */}
<div className="relative z-10 flex flex-col items-center text-center w-1/4">
<div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-tertiary flex items-center justify-center text-tertiary mb-2">
<span className="material-symbols-outlined text-base" data-icon="local_shipping">local_shipping</span>
</div>
<p className="font-label-medium text-label-medium text-on-surface">Dispatched</p>
<p className="font-caption text-caption text-on-surface-variant">In Progress</p>
</div>
{/*  Timeline Step 4: Delivered  */}
<div className="relative z-10 flex flex-col items-center text-center w-1/4">
<div className="w-8 h-8 rounded-full bg-surface-container-highest border border-surface-variant flex items-center justify-center text-on-surface-variant mb-2">
<span className="material-symbols-outlined text-base" data-icon="home">home</span>
</div>
<p className="font-label-medium text-label-medium text-on-surface-variant">Delivered</p>
<p className="font-caption text-caption text-on-surface-variant">Pending</p>
</div>
</div>
</section>
{/*  Order Items Table  */}
<section className="bg-surface-container p-0 border border-surface-variant rounded-xl overflow-hidden">
<div className="p-md border-b border-surface-variant flex justify-between items-center">
<h3 className="font-section-header text-section-header">Line Items</h3>
<span className="font-caption text-caption text-on-surface-variant">{order.items?.length || 0} Items total</span>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-high">
<th className="px-md py-sm font-caption text-caption text-on-surface-variant uppercase">Product Details</th>
<th className="px-md py-sm font-caption text-caption text-on-surface-variant uppercase text-center">Qty</th>
<th className="px-md py-sm font-caption text-caption text-on-surface-variant uppercase text-right">Unit Price</th>
<th className="px-md py-sm font-caption text-caption text-on-surface-variant uppercase text-right">Total</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-variant">
{order.items?.map((item: any) => (
<tr key={item.id}>
<td className="px-md py-md flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-variant overflow-hidden flex-shrink-0">
  <div className="w-full h-full bg-surface-container flex items-center justify-center">
    <span className="material-symbols-outlined text-on-surface-variant text-sm">inventory_2</span>
  </div>
</div>
<div>
<p className="font-body-compact text-body-compact font-semibold">{item.productName || 'Unknown Product'}</p>
<p className="font-caption text-caption text-on-surface-variant">SKU: {item.productId?.substring(0,8)}</p>
</div>
</td>
<td className="px-md py-md font-body-compact text-body-compact text-center">{item.quantity}</td>
<td className="px-md py-md font-body-compact text-body-compact text-right">${Number(item.unitPrice).toFixed(2)}</td>
<td className="px-md py-md font-body-compact text-body-compact text-right font-bold">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</td>
</tr>
))}
<tr>
<td className="px-md py-md flex items-center gap-3">
</td><td className="p-0" colSpan={4}>
<div className="bg-surface-container-low px-md py-sm flex justify-end gap-xl border-t border-surface-variant">
<div className="text-right space-y-1">
<p className="font-caption text-caption text-on-surface-variant">Subtotal</p>
<p className="font-caption text-caption text-on-surface-variant">Platform Fee</p>
<p className="font-caption text-caption text-on-surface-variant">VAT (12%)</p>
<p className="font-section-header text-section-header text-primary pt-2">Total Amount</p>
</div>
<div className="text-right space-y-1">
<p className="font-caption text-caption">${Number(order.subtotal).toFixed(2)}</p>
<p className="font-caption text-caption">${Number(order.deliveryFee).toFixed(2)}</p>
<p className="font-caption text-caption">${Number(order.discountAmount).toFixed(2)}</p>
<p className="font-section-header text-section-header text-primary pt-2">${Number(order.totalAmount).toFixed(2)}</p>
</div>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
{/*  Right Column: Customer & Map (4 Cols)  */}
<div className="lg:col-span-4 space-y-lg">
{/*  Customer Details  */}
<section className="bg-surface-container p-md border border-surface-variant rounded-xl shadow-md">
<h3 className="font-section-header text-section-header text-primary mb-md">Customer Contact</h3>
<div className="flex items-center gap-4 mb-lg">
<div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xl">
                            {order.customer?.fullName?.substring(0, 2).toUpperCase() || 'CU'}
                        </div>
<div>
<p className="font-body-main text-body-main font-bold">{order.customer?.fullName || 'Guest Customer'}</p>
<p className="font-caption text-caption text-on-surface-variant">Joined {new Date(order.customer?.createdAt || order.createdAt).toLocaleDateString()}</p>
</div>
</div>
<div className="space-y-4">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-secondary" data-icon="mail">mail</span>
<div>
<p className="font-caption text-caption text-on-surface-variant">Email Address</p>
<p className="font-body-compact text-body-compact">{order.customer?.email || 'N/A'}</p>
</div>
</div>
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-secondary" data-icon="call">call</span>
<div>
<p className="font-caption text-caption text-on-surface-variant">Phone Number</p>
<p className="font-body-compact text-body-compact">{order.customer?.phone || 'N/A'}</p>
</div>
</div>
<div className="pt-4 flex gap-2">
<button className="flex-1 bg-surface-variant text-on-surface py-2 rounded-lg font-label-medium text-label-medium hover:bg-surface-container-highest transition-colors">Chat</button>
<button className="flex-1 bg-surface-variant text-on-surface py-2 rounded-lg font-label-medium text-label-medium hover:bg-surface-container-highest transition-colors">Call</button>
</div>
</div>
</section>
{/*  Delivery & Map  */}
<section className="bg-surface-container border border-surface-variant rounded-xl overflow-hidden shadow-md">
<div className="p-md">
<h3 className="font-section-header text-section-header text-primary mb-2">Delivery Address</h3>
<p className="font-body-compact text-body-compact">Suite 405, Tech Plaza Tower B</p>
<p className="font-body-compact text-body-compact">Downtown, New York, NY 10001</p>
</div>
{/*  Map Thumbnail  */}
<div className="h-48 w-full bg-surface-dim relative group cursor-crosshair">
<div className="w-full h-full bg-cover bg-center filter grayscale contrast-125 opacity-70" data-location="New York City" ></div>
{/*  UI Overlay on Map  */}
<div className="absolute inset-0 bg-gradient-to-t from-surface-container/80 to-transparent"></div>
<div className="absolute bottom-3 left-3 flex items-center gap-2 bg-surface-container px-2 py-1 rounded border border-surface-variant">
<span className="material-symbols-outlined text-xs text-primary" data-icon="location_on" >location_on</span>
<span className="font-caption text-caption">Pin: 40.7128° N, 74.0060° W</span>
</div>
<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
<button className="bg-primary text-on-primary px-4 py-2 rounded-full font-label-medium text-label-medium shadow-lg">Open in Satellite</button>
</div>
</div>
<div className="p-md">
<div className="flex justify-between items-center bg-surface-container-high p-sm rounded-lg border border-surface-variant">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-tertiary" data-icon="directions_bike">directions_bike</span>
<div>
<p className="font-caption text-caption text-on-surface-variant">Assigned Courier</p>
<p className="font-label-medium text-label-medium">Marco Velasquez</p>
</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant" data-icon="open_in_new">open_in_new</span>
</div>
</div>
</section>
{/*  Admin Notes  */}
<section className="bg-surface-container-low border border-dashed border-surface-variant p-md rounded-xl">
<div className="flex items-center gap-2 mb-2 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="sticky_note_2">sticky_note_2</span>
<h4 className="font-label-medium text-label-medium uppercase tracking-tight">Internal Admin Notes</h4>
</div>
<p className="font-caption text-caption italic text-on-surface-variant">"Customer requested contactless delivery at the service entrance. High-value item, signature verification disabled per admin override #44."</p>
<button className="mt-4 text-secondary font-label-medium text-label-medium flex items-center gap-1 hover:underline">
<span className="material-symbols-outlined text-sm" data-icon="edit">edit</span> Edit Notes
                    </button>
</section>
</div>
</div>
</main>
{/*  Bottom Navigation (Shared Component Shell)  */}
<nav className="bg-surface-container dark:bg-surface-container fixed bottom-0 w-full z-50 border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 w-full px-2 pb-safe md:hidden">
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1" href="#">
<span className="material-symbols-outlined" data-icon="store">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1" href="#">
<span className="material-symbols-outlined" data-icon="shopping_cart" >shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1" href="#">
<span className="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>


    </div>
  );
}
