import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, LayoutDashboard, Boxes, Zap, Shield, Users2, BarChart3, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              <Zap className="mr-2 h-4 w-4" /> Introducing Taskky 2.0
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl mx-auto leading-[1.1]">
              Manage your team's work, <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">effortlessly.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The modern standard for product teams. Plan, build, and ship faster with a beautifully designed workspace that adapts to your workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                  Start for free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Book a demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-6xl px-4"
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50"></div>
              <img 
                src="/dashboard.png" 
                alt="Taskky Dashboard Preview" 
                className="rounded-xl w-full object-cover h-[500px] md:h-[600px] transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/40 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything you need to ship</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Carefully crafted tools to help your team perform at their best, without the clutter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: LayoutDashboard, title: 'Custom Dashboards', desc: 'Build views that make sense for your team.' },
              { icon: Boxes, title: 'Project Portfolios', desc: 'Manage multiple streams of work in one place.' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption and SOC2 compliance.' },
              { icon: Users2, title: 'Team Collaboration', desc: 'Real-time updates and seamless communication.' },
              { icon: BarChart3, title: 'Advanced Analytics', desc: 'Understand your velocity and bottlenecks.' },
              { icon: CheckCircle2, title: 'Automated Workflows', desc: 'Let the system do the repetitive work.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Choose the plan that's right for your team. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: 'Starter', 
                price: '$0', 
                desc: 'For individuals and small teams.', 
                features: ['Up to 5 projects', 'Basic task tracking', 'Community support', 'Core integrations'] 
              },
              { 
                name: 'Pro', 
                price: '$29', 
                desc: 'For growing teams that need more.', 
                popular: true,
                features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Custom workflows', 'Admin controls'] 
              },
              { 
                name: 'Max', 
                price: '$79', 
                desc: 'For large organizations.', 
                features: ['SAML SSO', 'Dedicated account manager', '99.9% uptime SLA', 'Advanced security', 'Custom contracts'] 
              },
            ].map((plan, i) => (
              <Link 
                key={i} 
                to="/signup"
                className="block group"
              >
                <div 
                  className={`h-full relative p-8 rounded-2xl border transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2 ${plan.popular ? 'border-primary bg-primary/5 shadow-xl scale-105 z-10' : 'border-border bg-card hover:border-primary/30'}`}
                >
                  {plan.popular && (
                    <span className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-8">{plan.desc}</p>
                  <div className="space-y-4 mb-8">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant={plan.popular ? 'default' : 'outline'} className="w-full h-11 rounded-xl font-semibold pointer-events-none">
                    Get Started
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-slate-900 text-white px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-primary via-slate-900 to-slate-900 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">We're on a mission to simplify teamwork.</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Taskky was built on the belief that software should work for you, not the other way around. 
                We created a platform that's fast, beautiful, and disappears when you're focused, yet empowers 
                you when you need to coordinate.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">50k+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">200+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Countries</div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop" 
                alt="Our Team" 
                className="rounded-2xl relative shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-primary rounded-3xl p-10 md:p-16 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
            <div className="w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to transform your work?</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-10 text-lg">
              Join thousands of teams already using Taskky to do their best work. Setup takes less than 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="h-12 px-8 w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Layers className="w-3 h-3" />
            </div>
            <span className="font-semibold text-lg">Taskky</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Twitter</Link>
            <Link to="#" className="hover:text-foreground transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
