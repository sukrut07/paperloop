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

const workflowNodes = [
  {
    title: 'Institution',
    caption: 'Creates batch',
    icon: Landmark,
    color: 'bg-[var(--yellow)]',
    position: 'left-1/2 top-0 -translate-x-1/2',
    pulseDelay: 0,
  },
  {
    title: 'Recycler',
    caption: 'Processes pickup',
    icon: Truck,
    color: 'bg-[var(--cyan)]',
    position: 'bottom-0 left-0',
    pulseDelay: 0.6,
  },
  {
    title: 'NGO',
    caption: 'Confirms impact',
    icon: BookOpenCheck,
    color: 'bg-[var(--green)]',
    position: 'bottom-0 right-0',
    pulseDelay: 1.2,
  },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="grid min-h-[calc(100vh-190px)] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
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
          className="neo-card relative min-h-[500px] overflow-hidden bg-[var(--paper)] p-5 sm:min-h-[560px] sm:p-8"
        >
          <div className="absolute right-5 top-5 rounded-lg border-[3px] border-black bg-[var(--coral)] px-3 py-2 text-sm font-black uppercase">
            Live workflow
          </div>
          <div className="grid h-full place-items-center">
            <div className="relative h-[360px] w-[min(100%,360px)] sm:h-[440px] sm:w-[440px]">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 430 430" aria-hidden="true">
                <motion.path
                  d="M215 92 C128 130 86 208 94 296"
                  fill="none"
                  stroke="#111"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="18 18"
                  animate={{ strokeDashoffset: [0, -72] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                />
                <motion.path
                  d="M120 330 C190 382 282 382 346 330"
                  fill="none"
                  stroke="#111"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="18 18"
                  animate={{ strokeDashoffset: [0, -72] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 0.2 }}
                />
                <motion.path
                  d="M336 296 C344 208 302 130 215 92"
                  fill="none"
                  stroke="#111"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="18 18"
                  animate={{ strokeDashoffset: [0, -72] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 0.4 }}
                />
              </svg>

              {workflowNodes.map((node) => (
                <motion.button
                  key={node.title}
                  type="button"
                  title={`${node.title}: ${node.caption}`}
                  className={`absolute ${node.position} z-10 grid h-32 w-32 grid-rows-[1fr_auto] place-items-center rounded-lg border-[3px] border-black ${node.color} p-4 shadow-[8px_8px_0_#111] transition-colors sm:h-36 sm:w-36`}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: node.pulseDelay }}
                  whileHover={{ scale: 1.08, rotate: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <node.icon className="self-end" size={52} strokeWidth={3} />
                  <span className="text-center text-sm font-black uppercase leading-tight">{node.title}</span>
                </motion.button>
              ))}

              <div className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-black bg-white shadow-[6px_6px_0_#111]">
                <motion.div
                  className="grid h-full w-full place-items-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  whileHover={{ scale: 1.12 }}
                >
                  <Recycle size={76} strokeWidth={3} />
                </motion.div>
              </div>
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
