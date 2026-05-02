'use client';

import { motion } from 'framer-motion';
import { MapPin, Package, CheckCircle, Navigation } from 'lucide-react';

export default function RecyclerDashboard() {
  const availableBatches = [
    { id: '#B004', institution: 'Green High School', distance: '2.5 km', weight: '80kg' },
    { id: '#B005', institution: 'City College', distance: '4.1 km', weight: '200kg' },
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-black uppercase tracking-tighter">Recycler Dashboard</h1>
        <p className="text-xl font-bold opacity-70">Nearby Pickup Requests</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Map Placeholder */}
        <div className="lg:col-span-2 neo-card bg-gray-200 h-[500px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.google.com/maps/d/u/0/thumbnail?mid=1_f4pY4f_z4w_0x0')] bg-cover opacity-30" />
          <div className="z-10 text-center space-y-4">
            <MapPin size={64} className="mx-auto text-secondary" />
            <p className="text-2xl font-black uppercase">Google Maps Integration</p>
            <p className="font-bold">Showing 5 active batches in your area</p>
          </div>
        </div>

        {/* Pickup List */}
        <div className="space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Available</h2>
          {availableBatches.map((batch, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="neo-card bg-white space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-black">{batch.id}</p>
                  <p className="font-bold opacity-70">{batch.institution}</p>
                </div>
                <span className="neo-button bg-primary py-1 px-3 text-xs">{batch.weight}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-secondary">
                <Navigation size={18} />
                <span>{batch.distance} away</span>
              </div>
              <button className="neo-button w-full bg-accent">
                Accept Pickup
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Work */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Active Tasks</h2>
        <div className="neo-card border-secondary border-dashed bg-secondary/5">
           <div className="flex justify-between items-center">
              <div className="flex gap-6 items-center">
                <Package size={40} />
                <div>
                   <p className="text-2xl font-black">#B001 - In Transit</p>
                   <p className="font-bold">Picking up from Green High School</p>
                </div>
              </div>
              <button className="neo-button bg-success">
                 <CheckCircle className="inline mr-2" /> Mark Received
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}
