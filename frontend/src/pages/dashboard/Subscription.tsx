import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Shield, Zap, Receipt, Download, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const PLANS = [
  { 
    id: 'starter',
    name: 'Starter', 
    price: '$0', 
    priceNum: 0,
    desc: 'For individuals and small teams.', 
    features: ['Up to 5 projects', 'Basic task tracking', 'Community support', 'Core integrations'] 
  },
  { 
    id: 'pro',
    name: 'Pro', 
    price: '$29', 
    priceNum: 29,
    desc: 'For growing teams that need more.', 
    popular: true,
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Custom workflows', 'Admin controls'] 
  },
  { 
    id: 'max',
    name: 'Max', 
    price: '$79', 
    priceNum: 79,
    desc: 'For large organizations.', 
    features: ['SAML SSO', 'Dedicated account manager', '99.9% uptime SLA', 'Advanced security', 'Custom contracts'] 
  },
];

export default function Subscription() {
  const [currentPlanId] = useState('starter');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const handleUpgrade = (plan: any) => {
    if (plan.id === currentPlanId) {
      toast.info("You are already on this plan");
      return;
    }
    setSelectedPlan(plan);
    setShowInvoice(true);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowInvoice(false);
      toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
    }, 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto min-h-full flex flex-col px-6 py-8 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
            Billing & Plans
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground">Subscription</h1>
          <p className="text-muted-foreground text-sm font-medium max-w-md">
            Manage your subscription, billing history, and upgrade to unlock premium features.
          </p>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/40 shadow-xl shadow-black/5 relative overflow-hidden group min-w-[200px]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative z-10">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Active Plan</div>
            <div className="text-xl font-black text-primary leading-none mt-1">{PLANS.find(p => p.id === currentPlanId)?.name}</div>
          </div>
        </div>
      </motion.div>

      {/* Plans Section */}
      <div className="grid lg:grid-cols-3 gap-8 mb-20 w-full">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex"
          >
            <Card 
              className={`flex-1 flex flex-col relative border-2 transition-all duration-500 overflow-hidden group ${
                plan.id === currentPlanId 
                  ? 'border-primary/20 bg-primary/[0.01]' 
                  : plan.popular 
                    ? 'border-primary shadow-[0_20px_60px_-12px_rgba(250,147,131,0.25)] bg-primary/[0.03] lg:scale-[1.05] z-10' 
                    : 'border-border/40 hover:border-primary/30 shadow-md hover:shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full z-20 shadow-lg shadow-primary/20">
                  Best Value
                </div>
              )}
              
              <CardHeader className="p-8 pb-6">
                <div className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-bold opacity-60">/month</span>
                </div>
                <p className="text-muted-foreground text-xs mt-4 font-medium leading-relaxed italic opacity-80">
                  {plan.desc}
                </p>
              </CardHeader>

              <CardContent className="flex-1 p-8 pt-0">
                <div className="space-y-4">
                  <div className="h-px bg-border/40 w-full my-6" />
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm font-medium group/item">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 transition-colors group-hover/item:bg-primary/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-muted-foreground group-hover/item:text-foreground transition-colors leading-snug">{feature}</span>
                    </li>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Button 
                  className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
                    plan.id === currentPlanId 
                      ? 'bg-muted text-muted-foreground cursor-default border-border/40 shadow-none' 
                      : (plan.popular ? 'premium-gradient shadow-xl shadow-primary/30 hover:shadow-primary/50' : 'border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30')
                  }`}
                  variant={plan.id === currentPlanId ? 'secondary' : (plan.popular ? 'default' : 'outline')}
                  disabled={plan.id === currentPlanId}
                  onClick={() => handleUpgrade(plan)}
                >
                  {plan.id === currentPlanId ? 'Active Plan' : 'Select Plan'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Billing History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-black/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Billing History</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Past Transactions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 hover:bg-muted group">
            <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
            Download Statements
          </Button>
        </div>

        <div className="bg-card rounded-[2rem] border border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground border-b border-border/40 font-black uppercase tracking-[0.2em] text-[10px]">
                  <th className="px-8 py-5">Invoice ID</th>
                  <th className="px-8 py-5">Plan</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                <tr className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-8 py-6 font-bold text-foreground">#INV-001-2025</td>
                  <td className="px-8 py-6">
                    <Badge variant="secondary" className="bg-muted text-[10px] font-black uppercase px-3 py-1 rounded-lg">Starter</Badge>
                  </td>
                  <td className="px-8 py-6 text-muted-foreground font-bold tracking-tight">October 01, 2025</td>
                  <td className="px-8 py-6 font-black text-foreground text-base">$0.00</td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                      <Download className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showInvoice && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border/40 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-[400px] overflow-hidden"
            >
              <div className="p-8 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-primary/40">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl tracking-tighter leading-none">Checkout</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2 opacity-60">Verified Transaction</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 hover:bg-muted" 
                  onClick={() => setShowInvoice(false)}
                  disabled={isProcessing}
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Upgrade To</span>
                    <span className="text-primary uppercase tracking-widest text-[10px]">{selectedPlan.name} Plan</span>
                  </div>
                  
                  <div className="p-8 bg-muted/50 rounded-[2rem] space-y-4 border border-border/20">
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      <span>Monthly Recurring</span>
                      <span>{selectedPlan.price}</span>
                    </div>
                    <div className="pt-6 border-t border-dashed border-border/60 flex justify-between items-center">
                      <span className="font-black text-lg uppercase tracking-tighter">Total Due</span>
                      <span className="text-4xl font-black text-primary tracking-tighter">{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-primary/5 rounded-2xl flex gap-4 border border-primary/10">
                  <div className="mt-1">
                    <Zap className="w-5 h-5 text-primary shrink-0 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-primary/80 leading-relaxed font-bold">
                    Unlock all {selectedPlan.name} features instantly. Secured by Taskky Billing Service.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="ghost" 
                    className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted" 
                    onClick={() => setShowInvoice(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest premium-gradient shadow-2xl shadow-primary/30" 
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Pay Now'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
