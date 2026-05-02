'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-24">
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-8"
        >
          <h1 className="text-6xl md:text-8xl font-black uppercase leading-tight tracking-tighter">
            Recycle <br />
            <span className="text-secondary underline decoration-8 underline-offset-8">Paper</span> <br />
            Save <span className="bg-success px-2 text-black">Future</span>
          </h1>
          <p className="text-xl font-bold leading-relaxed">
            A blockchain-powered ecosystem connecting institutions, recyclers, and NGOs 
             to turn waste paper into educational resources for underprivileged students.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard/institution" className="neo-button text-lg">
              Get Started
            </Link>
            <button className="neo-button bg-white text-lg">
              Learn More
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="neo-card bg-primary h-[400px] flex items-center justify-center">
            <span className="text-9xl">♻️</span>
          </div>
          <div className="absolute -bottom-6 -right-6 neo-card bg-accent p-4 font-black text-xl">
            10,000+ KG RECYCLED
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          { title: "Institutions", text: "Donate unused paper waste and earn impact tokens.", color: "bg-white" },
          { title: "Recyclers", text: "Collect waste and process it into high-quality books.", color: "bg-secondary text-white" },
          { title: "NGOs", text: "Distribute notebooks to students in need.", color: "bg-accent" }
        ].map((feat, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className={`neo-card ${feat.color} space-y-4`}
          >
            <h3 className="text-3xl font-black uppercase">{feat.title}</h3>
            <p className="font-bold">{feat.text}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
