"use client";

import { useCart } from "@/lib/cart-context";
import { ArrowLeft, MapPin, CreditCard, Clock, Minus, Plus, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const [isPlaced, setIsPlaced] = useState(false);

  const deliveryFee = 3.99;
  const taxes = totalPrice * 0.08;
  const finalTotal = totalPrice + deliveryFee + taxes;

  const handlePlaceOrder = () => {
    // In a real app, this would hit the API
    setIsPlaced(true);
    setTimeout(() => {
      clearCart();
    }, 2000);
  };

  if (isPlaced) {
    return (
      <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-neutral-900 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
          <p className="text-neutral-400 mb-8">Your local vendor has received your order and is preparing it now.</p>
          <Link href="/">
            <button className="w-full py-4 bg-white text-black rounded-xl font-semibold transition-transform hover:scale-105">
              Back to Home
            </button>
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to browsing</span>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <h2 className="text-xl font-medium text-neutral-300 mb-4">Your cart is empty</h2>
            <Link href="/">
              <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                Explore Local Vendors
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                </div>
                <div className="pl-13">
                  <p className="font-medium text-white mb-1">Home</p>
                  <p className="text-neutral-400 text-sm">123 Local Avenue, Tech District, CA 94103</p>
                  <button className="mt-4 text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">
                    Change Address
                  </button>
                </div>
              </div>

              {/* Delivery Time */}
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Delivery Time</h2>
                </div>
                <div className="pl-13 flex gap-4">
                  <button className="flex-1 py-3 border border-indigo-500 bg-indigo-500/10 rounded-xl font-medium text-indigo-400">
                    ASAP (15-25 min)
                  </button>
                  <button className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-medium text-neutral-400 transition-colors">
                    Schedule
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                <div className="pl-13">
                  <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold">VISA</div>
                      <span className="font-medium">•••• •••• •••• 4242</span>
                    </div>
                    <div className="w-5 h-5 rounded-full border-4 border-indigo-500" />
                  </div>
                  <button className="mt-4 text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">
                    Add new method
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <h4 className="font-medium text-white">{item.name}</h4>
                        <p className="text-sm text-neutral-400">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 py-6 border-t border-white/10 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Taxes</span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-6 border-t border-white/10">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-white">${finalTotal.toFixed(2)}</span>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-xl shadow-indigo-500/25"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
