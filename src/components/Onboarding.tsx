import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, Check } from 'lucide-react';
import type { DigitalTwin } from '../types';

interface Props {
  initialTwin: DigitalTwin;
  onComplete: (twin: DigitalTwin) => void;
}

export default function Onboarding({ initialTwin, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [twin, setTwin] = useState<DigitalTwin>(initialTwin);

  const steps = [
    {
      title: "Welcome to LifePilot",
      desc: "I'm your proactive AI schedule assistant. Let's create your Digital Twin so I can predict conflicts before they happen.",
      content: null
    },
    {
      title: "Base Routine",
      desc: "When do you typically wake up and go to sleep?",
      content: (
        <div className="space-y-4 text-left mt-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wake Time</label>
            <input 
              type="time" 
              value={twin.baseWakeTime}
              onChange={e => setTwin({...twin, baseWakeTime: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sleep Time</label>
            <input 
              type="time" 
              value={twin.baseSleepTime}
              onChange={e => setTwin({...twin, baseSleepTime: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold mt-1"
            />
          </div>
        </div>
      )
    },
    {
      title: "Commute Habits",
      desc: "Be honest: how many minutes late do you usually leave for travel events?",
      content: (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-center text-5xl font-black text-blue-400 font-mono mb-4">
            +{twin.commuteHabitDelay}m
          </div>
          <input 
            type="range" min={0} max={30} step={1}
            value={twin.commuteHabitDelay}
            onChange={e => setTwin({...twin, commuteHabitDelay: parseInt(e.target.value)})}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      )
    },
    {
      title: "Stress Threshold",
      desc: "How much buffer do you prefer between intense events (like exams or meetings)?",
      content: (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-center text-4xl font-black text-purple-400 font-mono mb-4">
            {twin.learningMetrics.preferredBuffer} mins
          </div>
          <input 
            type="range" min={0} max={60} step={5}
            value={twin.learningMetrics.preferredBuffer}
            onChange={e => setTwin({...twin, learningMetrics: {...twin.learningMetrics, preferredBuffer: parseInt(e.target.value)}})}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete({ ...twin, onboarded: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#020204', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.1) 0%, transparent 70%)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel p-8 rounded-[3rem] text-center relative overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 80px rgba(0,0,0,0.8)' }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain size={32} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[200px] flex flex-col justify-center"
          >
            <h2 className="text-2xl font-black text-white mb-2">{steps[step].title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{steps[step].desc}</p>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          <button 
            onClick={handleNext}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
          >
            {step === steps.length - 1 ? <><Check size={20} /> Complete Setup</> : <>Next <ArrowRight size={20} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
