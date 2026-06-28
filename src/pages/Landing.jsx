import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Cpu, Rss, ArrowRight, Shield, Zap, Clock, Users, ArrowUpRight } from 'lucide-react';
import { MOCK_INCIDENTS } from '../data/mockIncidents';

export default function Landing() {
  // Take top 2 high-priority incidents for the preview
  const recentIncidents = MOCK_INCIDENTS.slice(0, 2);

  const stats = [
    { label: 'Incidents Analyzed', value: '1,842', icon: Shield, color: 'text-primary-accent' },
    { label: 'Avg Dispatch Time', value: '8.4m', icon: Clock, color: 'text-secondary-accent' },
    { label: 'AI Classification Accuracy', value: '99.1%', icon: Zap, color: 'text-amber-500' },
    { label: 'Community Verifications', value: '12,451', icon: Users, color: 'text-emerald-500' }
  ];

  const steps = [
    {
      num: '01',
      title: 'Citizen Upload',
      desc: 'Simply snap a photo of the infrastructure issue. No long forms or technical knowledge required.'
    },
    {
      num: '02',
      title: 'AI Intel Extraction',
      desc: 'Gemini visual AI instantly extracts the category, severity level, safety risks, and precise geolocation.'
    },
    {
      num: '03',
      title: 'Priority Routing',
      desc: 'AI scores the issue priority and formats a professional work order dispatched to the appropriate department.'
    }
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 text-left">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-4 md:pt-10">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-accent/8 border border-primary-accent/15 text-xs font-semibold text-primary-accent mb-6"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Smart City Operating System v1.0</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary-text leading-[1.1] mb-6 font-display"
          >
            The AI-First Operations Center for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-accent to-secondary-accent">Smart Cities</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-secondary-text leading-relaxed max-w-2xl mb-10"
          >
            Empower citizens to report public infrastructure issues with zero friction. Let AI analyze, categorize, evaluate safety risks, and recommend instant dispatch workflows for municipal teams.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          >
            <NavLink to="/analyzer" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md" icon={Cpu} iconPosition="left">
                Analyze Incident
              </Button>
            </NavLink>
            <NavLink to="/feed" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto" icon={Rss} iconPosition="left">
                Explore Feed
              </Button>
            </NavLink>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Dashboard Grid */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-borders/60 pb-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary-text">
            Civic Operations Pulse
          </h2>
          <span className="text-xs font-semibold text-primary-accent bg-primary-accent/8 border border-primary-accent/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            Live City Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="flex flex-col justify-between p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-secondary-text">{stat.label}</span>
                <div className={`p-2 rounded-lg bg-secondary-surface ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <span className="text-3xl font-extrabold text-primary-text tracking-tight font-display">
                {stat.value}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="flex flex-col gap-10 md:gap-14 bg-secondary-surface/40 border border-borders/60 rounded-3xl p-8 md:p-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary-text mb-3">
            Zero-Friction Intelligent Pipeline
          </h2>
          <p className="text-sm md:text-base text-secondary-text">
            How CivicPulse AI converts raw citizen uploads into structural dispatch directives in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col gap-4 relative">
              {/* Step counter */}
              <span className="font-display font-black text-6xl md:text-7xl text-primary-accent select-none">
                {step.num}
              </span>
              <h3 className="text-lg font-bold text-primary-text">{step.title}</h3>
              <p className="text-sm text-secondary-text leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Alerts Feed Preview */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borders/60 pb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary-text">
              Critical Operations Feed
            </h2>
            <p className="text-xs md:text-sm text-secondary-text mt-1">
              Active high-priority incidents analyzed by AI and pending response dispatch.
            </p>
          </div>
          <NavLink to="/feed" className="shrink-0">
            <Button variant="ghost" size="sm" className="group text-primary-accent hover:bg-transparent">
              <span className="flex items-center gap-1">
                View Full Feed <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </NavLink>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {recentIncidents.map((incident) => (
            <Card key={incident.id} className="flex flex-col sm:flex-row gap-6 p-0! h-full items-stretch">
              {/* Image side */}
              <div className="w-full sm:w-2/5 min-h-[160px] sm:min-h-auto relative overflow-hidden bg-secondary-surface border-b sm:border-b-0 sm:border-r border-borders">
                <img
                  src={incident.imageUrl}
                  alt={incident.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1 font-bold">
                  <span>Priority {incident.priorityScore}</span>
                </div>
              </div>

              {/* Text side */}
              <div className="flex flex-col justify-between p-6 flex-1 text-left min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={incident.severity === 'critical' ? 'danger' : 'warning'} size="xs">
                      {incident.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-text uppercase font-bold tracking-wide">
                      {incident.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-primary-text line-clamp-1 mb-2">
                    {incident.title}
                  </h3>
                  <p className="text-xs text-secondary-text leading-relaxed line-clamp-2">
                    {incident.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-borders/60 flex items-center justify-between text-[11px] text-muted-text">
                  <span className="truncate max-w-[150px]">{incident.location.address}</span>
                  <NavLink to="/feed" className="text-primary-accent hover:underline flex items-center gap-0.5 font-semibold shrink-0">
                    View <ArrowUpRight className="w-3 h-3" />
                  </NavLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
