'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck, Factory, Landmark, Recycle, Truck, Users } from 'lucide-react';

const layers = [
  {
    title: 'Institution Layer',
    text: 'Teachers and admins create rooms, register paper batches, upload proofs, and track every handoff.',
    icon: Landmark,
    color: 'bg-[var(--yellow)]',
  },
  {
    title: 'Recycling Layer',
    text: 'Verified recyclers accept nearby batches, update pickup and plant milestones, and mark paper as recycled.',
    icon: Factory,
    color: 'bg-[var(--cyan)]',
  },
  {
    title: 'NGO Layer',
    text: 'NGOs accept notebook stock, confirm distribution, and publish measurable student impact reports.',
    icon: BookOpenCheck,
    color: 'bg-[var(--green)]',
  },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="grid min-h-[calc(100vh-190px)] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-lg border-[3px] border-black bg-white px-3 py-2 font-black uppercase shadow-[4px_4px_0_#111]">
            <Users size={18} />
            Real-time collaborative recycling workflow
          </div>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.98] md:text-7xl">
            Paperloop
          </h1>
          <p className="max-w-2xl text-xl font-extrabold leading-relaxed">
            A room-based educational paper recycling ecosystem connecting institutions, recyclers, and NGOs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="neo-button bg-[var(--yellow)]">
              Start as Institution
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="neo-button bg-white">
              Login
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ rotate: -2, scale: 0.96, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          className="neo-card relative min-h-[430px] overflow-hidden bg-[var(--paper)] p-6"
        >
          <div className="absolute right-5 top-5 rounded-lg border-[3px] border-black bg-[var(--coral)] px-3 py-2 text-sm font-black uppercase">
            Live workflow
          </div>
          <div className="grid h-full place-items-center">
            <div className="relative h-72 w-72">
              <div className="absolute left-1/2 top-0 grid h-24 w-24 -translate-x-1/2 place-items-center rounded-lg border-[3px] border-black bg-[var(--yellow)] shadow-[6px_6px_0_#111]">
                <Landmark size={44} strokeWidth={3} />
              </div>
              <div className="absolute bottom-0 left-0 grid h-24 w-24 place-items-center rounded-lg border-[3px] border-black bg-[var(--cyan)] shadow-[6px_6px_0_#111]">
                <Truck size={44} strokeWidth={3} />
              </div>
              <div className="absolute bottom-0 right-0 grid h-24 w-24 place-items-center rounded-lg border-[3px] border-black bg-[var(--green)] shadow-[6px_6px_0_#111]">
                <BookOpenCheck size={44} strokeWidth={3} />
              </div>
              <Recycle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" size={72} strokeWidth={3} />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {layers.map((layer, index) => (
          <motion.div
            key={layer.title}
            initial={{ y: 18, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className={`neo-card ${layer.color} p-6`}
          >
            <layer.icon size={42} strokeWidth={3} />
            <h2 className="mt-5 text-2xl font-black uppercase">{layer.title}</h2>
            <p className="mt-3 font-bold leading-relaxed">{layer.text}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
