"use client";

import { useState } from "react";
import { Star, Clock, MapPin, Search, Plus, ShoppingBag, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

// Mock Data
const VENDOR = {
  id: "1",
  name: "Joe's Pizza",
  type: "Food Delivery",
  rating: 4.8,
  reviews: 342,
  distance: "0.5 mi",
  time: "15-25 min",
  coverImage: "bg-gradient-to-r from-red-500 to-orange-500",
  description: "Authentic New York style pizza baked in traditional brick ovens."
};

const MENU = [
  { id: "p1", category: "Pizzas", name: "Pepperoni Passion", price: 18.99, desc: "Double pepperoni, mozzarella, signature tomato sauce" },
  { id: "p2", category: "Pizzas", name: "Margherita", price: 14.99, desc: "Fresh basil, fresh mozzarella, olive oil" },
  { id: "p3", category: "Sides", name: "Garlic Knots", price: 5.99, desc: "6 pieces served with marinara dipping sauce" },
  { id: "p4", category: "Drinks", name: "Craft Soda", price: 2.99, desc: "Locally brewed cola" },
];

export default function VendorStorefront() {
  const params = useParams();
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const categories = Array.from(new Set(MENU.map(item => item.category)));
  
  const { addItem, items, totalItems, totalPrice } = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      vendorId: VENDOR.id,
      name: item.name,
      price: item.price
    });
    
    // Show quick checkmark animation
    setAddedItems(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-24">
      {/* Hero Header */}
      <div className={`h-64 md:h-80 w-full ${VENDOR.coverImage} relative`}>
        <div className="absolute inset-0 bg-black/40" />
        <Link href="/search">
          <button className="absolute top-6 left-6 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full font-medium transition-colors">
            ← Back
          </button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative -mt-24">
        {/* Vendor Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{VENDOR.name}</h1>
              <p className="text-neutral-400 text-lg mb-4">{VENDOR.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  {VENDOR.rating} ({VENDOR.reviews})
                </div>
                <div className="flex items-center gap-1 text-neutral-300">
                  <Clock className="w-4 h-4" />
                  {VENDOR.time}
                </div>
                <div className="flex items-center gap-1 text-neutral-300">
                  <MapPin className="w-4 h-4" />
                  {VENDOR.distance}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu Section */}
        <div className="mt-12">
          {/* Categories Sticky Nav */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-10 pt-4 border-b border-white/5">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full font-medium transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MENU.filter(item => item.category === activeCategory).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex justify-between items-center"
              >
                <div className="pr-4">
                  <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                  <p className="text-neutral-400 text-sm mb-3 line-clamp-2">{item.desc}</p>
                  <p className="font-medium text-emerald-400">${item.price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => handleAddToCart(item)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    addedItems[item.id] ? "bg-emerald-500 text-white" : "bg-white/10 group-hover:bg-indigo-500 group-hover:text-white"
                  )}
                >
                  {addedItems[item.id] ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6"
          >
            <Link href="/checkout">
              <button className="w-full px-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-semibold shadow-2xl shadow-indigo-500/25 flex items-center justify-between transition-transform hover:scale-105">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5" />
                  <span>View Cart ({totalItems})</span>
                </div>
                <span>${totalPrice.toFixed(2)}</span>
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
