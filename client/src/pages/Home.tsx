import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  MapPin,
  TrendingUp,
  Shield,
  Sparkles,
  IndianRupee,
  Globe,
  BarChart3,
  Users,
  Clock,
  Leaf,
  Heart,
  Smartphone,
  Award,
  Lock,
  RotateCcw,
  MessageCircle,
  Wifi,
  Banknote,
  ChevronDown,
} from "lucide-react";
import { CITY_LIST } from "@shared/cities";

interface HomeProps {
  onGetStarted?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,  // Minimal stagger for instant feel
      delayChildren: 0         // No delay for immediate start
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },  // Reduced movement for speed
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }  // Fast and snappy
  }
};

export default function Home({ onGetStarted }: HomeProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [, navigate] = useLocation();
  
  const handleGetStarted = () => {
    if (onGetStarted) onGetStarted();
    else navigate("/login");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-background via-background to-primary/5">
      
      {/* Animated Background Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Logo with Glow Effect */}
            <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 mb-8">
              <motion.div 
                className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(16,185,129,0.3)",
                    "0 0 60px rgba(16,185,129,0.5)",
                    "0 0 30px rgba(16,185,129,0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="text-black w-10 h-10 fill-current" />
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight bg-gradient-to-r from-foreground via-primary to-emerald-500 bg-clip-text text-transparent">
                SmartRide<span className="text-primary">.ai</span>
              </h1>
            </motion.div>

            {/* Animated Tagline */}
            <motion.div variants={itemVariants}>
              <p className="text-2xl md:text-4xl text-foreground/80 mb-4 max-w-4xl mx-auto">
                AI-Powered Ride Management Across{" "}
                <motion.span 
                  className="text-primary font-semibold"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  7 Indian Cities
                </motion.span>
              </p>
              
              <p className="text-base md:text-xl text-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed">
                <span className="text-emerald-500 font-medium">Predictive pricing</span> •{" "}
                <span className="text-blue-500 font-medium">Real-time demand</span> •{" "}
                <span className="text-amber-500 font-medium">Smart zones</span>
              </p>
            </motion.div>

            {/* CTA Button with Pulse */}
            <motion.div variants={itemVariants}>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="relative bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 hover:from-primary/90 hover:via-emerald-400/90 hover:to-cyan-400/90 text-black font-bold text-xl h-16 px-12 shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-shadow duration-150 overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ x: "-100%", opacity: 0.2 }}
                  whileHover={{ x: "100%", opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                />
                <Sparkles className="w-6 h-6 mr-3 relative z-10" />
                <span className="relative z-10">Launch Dashboard</span>
              </Button>
            </motion.div>

            {/* Live Badge - Positioned Below Button */}
            <motion.div 
              variants={itemVariants}
              className="mt-10"
            >
              <motion.div 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-400/30 backdrop-blur-sm"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span 
                  className="h-3 w-3 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Live in {CITY_LIST.length} Major Cities</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
          >
            <motion.div variants={itemVariants}>
              <Card className="glass-panel border-0 hover:scale-[1.02] hover:border-primary/30 transition-transform duration-150 group">
                <CardContent className="pt-6">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.4 }}
                  >
                    <IndianRupee className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">Dynamic Pricing</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI-powered fare estimation with real-time surge pricing based on demand, traffic, and peak hours
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-panel border-0 hover:scale-[1.02] hover:border-emerald-400/30 transition-transform duration-150 group">
                <CardContent className="pt-6">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200"
                    whileHover={{ y: [-5, 0, -5] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    <MapPin className="w-7 h-7 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">Zone Intelligence</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Real-time demand heatmaps across {CITY_LIST.length} cities with 40+ strategic zones across India
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-panel border-0 hover:scale-[1.02] hover:border-amber-400/30 transition-transform duration-150 group">
                <CardContent className="pt-6">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200"
                    whileHover={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    <TrendingUp className="w-7 h-7 text-amber-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">Predictive Analytics</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Wait time, cancellation probability, and carbon emission predictions using ML models
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cities Showcase */}
      <section className="relative py-24 px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Available in <span className="text-primary">{CITY_LIST.length}</span> Major Cities
            </h2>
            <p className="text-muted-foreground text-lg">Expanding across India's metropolitan areas</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {CITY_LIST.map((city, index) => (
              <motion.div
                key={city.key}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="glass-panel p-6 text-center hover:border-primary/30 transition-transform duration-150 cursor-pointer"
              >
                <div className="text-4xl mb-3">{city.emoji}</div>
                <div className="text-sm font-semibold">{city.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Platform <span className="text-primary">Statistics</span>
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Globe, value: "7", label: "Live Cities", color: "text-primary" },
              { icon: MapPin, value: "40+", label: "Active Zones", color: "text-emerald-400" },
              { icon: Users, value: "₹22-35", label: "Base Fare Range", color: "text-amber-400" },
              { icon: BarChart3, value: "1.5x", label: "Peak Surge", color: "text-blue-400" },
              { icon: Clock, value: "<5min", label: "Avg Wait Time", color: "text-purple-400" },
              { icon: Leaf, value: "0.12kg", label: "CO₂ per km", color: "text-green-400" },
              { icon: TrendingUp, value: "95%", label: "Prediction Accuracy", color: "text-pink-400" },
              { icon: Shield, value: "24/7", label: "Live Tracking", color: "text-cyan-400" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 glass-panel hover:border-primary/20 transition-colors duration-150"
              >
                <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                <div className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why Choose SmartRide Section */}
      <section className="relative py-24 px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Why Choose <span className="text-primary">SmartRide.ai?</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Fair & Transparent Pricing",
                description: "AI calculates fares based on real distance, traffic, and demand. No hidden charges. See final price before booking.",
                color: "from-amber-500/20",
                iconColor: "text-amber-400"
              },
              {
                icon: Smartphone,
                title: "Instant Booking",
                description: "Get a ride in seconds. Smart algorithms match you with nearest driver within 5 minutes on average.",
                color: "from-blue-500/20",
                iconColor: "text-blue-400"
              },
              {
                icon: Leaf,
                title: "Eco-Friendly Rides",
                description: "We prioritize EV and CNG vehicles. Every ride reduces carbon footprint. Track your environmental impact.",
                color: "from-green-500/20",
                iconColor: "text-green-400"
              },
              {
                icon: Award,
                title: "Verified Drivers",
                description: "All drivers verified with background checks. Average rating 4.8★ across Indian cities.",
                color: "from-pink-500/20",
                iconColor: "text-pink-400"
              },
              {
                icon: Lock,
                title: "Privacy & Security",
                description: "End-to-end encrypted trips. Your data is never shared. Complete privacy controls.",
                color: "from-purple-500/20",
                iconColor: "text-purple-400"
              },
              {
                icon: Heart,
                title: "Community Focus",
                description: "Support local drivers. Every ride strengthens India's gig economy. Fair compensation guaranteed.",
                color: "from-red-500/20",
                iconColor: "text-red-400"
              }
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className={`glass-panel p-8 border border-white/10 hover:border-primary/30 transition-colors duration-150 bg-gradient-to-br ${item.color} to-transparent`}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.3 }}
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${item.color.split('/')[0]} to-${item.color.split('/')[0]}/5 flex items-center justify-center mb-4 ${item.iconColor}`}
                >
                  <item.icon className="w-7 h-7" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Safety Features Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-4"
          >
            <Heart className="inline-block text-red-500 mr-3 mb-1" />
            Your Safety, Our Priority
          </motion.h2>
          <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">
            Built for India. Safety features designed specifically for Indian commuters, especially women travelers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Women's Safety",
                features: ["Women-only rides", "Share trip with contacts", "Fear Button - alerts police", "Verified driver data"],
                color: "text-pink-400"
              },
              {
                icon: Wifi,
                title: "Real-Time Tracking",
                features: ["Live location sharing", "Family alerts", "Emergency SOS button", "Video recording option"],
                color: "text-blue-400"
              },
              {
                icon: MessageCircle,
                title: "24/7 Support",
                features: ["Hindi & regional language support", "24/7 customer service", "Emergency contact database", "Local police integration"],
                color: "text-emerald-400"
              }
            ].map((section) => (
              <motion.div
                key={section.title}
                variants={itemVariants}
                className="glass-panel p-8 border border-white/10 hover:border-primary/30 transition-colors duration-150"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 ${section.color}`}
                >
                  <section.icon className="w-6 h-6" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.features.map((feature, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${section.color}`}></span>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Payment Methods Section */}
      <section className="relative py-24 px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-4"
          >
            <IndianRupee className="inline-block text-primary mr-3 mb-1" />
            Payment Methods
          </motion.h2>
          <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">
            All popular Indian payment methods supported. Cashless, secure, and instant.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Google Pay", emoji: "💳" },
              { name: "PhonePe", emoji: "📱" },
              { name: "Paytm", emoji: "🏪" },
              { name: "Credit/Debit Cards", emoji: "💰" },
              { name: "BHIM UPI", emoji: "🔐" },
              { name: "RazorPay", emoji: "🎯" },
              { name: "Amazon Pay", emoji: "📦" },
              { name: "Wallet (In-App)", emoji: "👛" }
            ].map((method) => (
              <motion.div
                key={method.name}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-panel p-6 text-center border border-white/10 hover:border-primary/30 transition-colors duration-150"
              >
                <div className="text-5xl mb-3">{method.emoji}</div>
                <p className="font-semibold text-sm">{method.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Environmental Impact Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-green-500/5 to-transparent">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-4"
          >
            <Leaf className="inline-block text-green-500 mr-3 mb-1" />
            Environmental Impact
          </motion.h2>
          <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">
            Every SmartRide is a step towards a cleaner, greener India.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                metric: "2.5M+",
                title: "Kg CO₂ Saved",
                description: "Compared to individual car usage in 2025 alone",
                icon: Leaf
              },
              {
                metric: "₹50Cr+",
                title: "Fuel Cost Saved",
                description: "For passengers who chose eco-friendly rides",
                icon: IndianRupee
              },
              {
                metric: "40%",
                title: "EV Fleet Growth",
                description: "Increasing EV availability across all 7 cities",
                icon: Zap
              }
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="glass-panel p-8 border border-green-500/20 hover:border-green-400/40 transition-colors duration-150 text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mb-4 mx-auto text-green-400"
                >
                  <item.icon className="w-8 h-8" />
                </motion.div>
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">{item.metric}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-4"
          >
            Loved by <span className="text-primary">Indians</span>
          </motion.h2>
          <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">
            Join thousands of happy passengers and drivers across India
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Priya Sharma",
                role: "Passenger, Delhi",
                text: "Finally a platform where I feel safe commuting alone. The women's safety features are amazing!",
                avatar: "👩‍💼"
              },
              {
                name: "Rajesh Kumar",
                role: "Driver, Bangalore",
                text: "SmartRide pays fair rates. I earn 40% more than other platforms. Highly recommended!",
                avatar: "👨‍💼"
              },
              {
                name: "Anjali Patel",
                role: "Passenger, Mumbai",
                text: "Love the EV rides. Transparent pricing with no surprises. Every ride matters now.",
                avatar: "👩"
              }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass-panel p-8 border border-white/10 hover:border-primary/30 transition-colors duration-150"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{testimonial.avatar}</div>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">"{testimonial.text}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-center mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <p className="text-center text-muted-foreground text-lg mb-16">
            Everything you need to know about SmartRide.ai
          </p>

          <div className="space-y-4">
            {[
              {
                q: "How are fares calculated in SmartRide?",
                a: "Fares are calculated using our AI algorithm that considers: base fare (₹40-60 depending on city), per-kilometer charge (₹12-15/km), per-minute charge (₹2-3/min), real-time traffic conditions, and demand-based pricing during peak hours. The app shows transparent fare estimates before you confirm your booking."
              },
              {
                q: "Is SmartRide available 24/7?",
                a: "Yes! SmartRide operates round-the-clock across all 7 cities. Surge pricing may apply during high-demand periods including morning rush (8-11 AM), evening rush (5-9 PM), and late-night hours (11 PM - 6 AM) as per standard industry practice."
              },
              {
                q: "How do I become a SmartRide driver?",
                a: "Register through our driver app with valid documents: driving license (minimum 1 year old), vehicle RC, insurance, and PUC certificate. Background verification typically takes 3-7 working days. Once approved, you can go online instantly and set your own working hours with complete flexibility."
              },
              {
                q: "What if I have an issue with my ride?",
                a: "Our support team is available 24/7 through in-app chat, email (support@smartride.ai), and phone support in Hindi and 10+ regional languages. Most queries are resolved within 48 hours. For critical safety issues, we provide immediate assistance and appropriate action."
              },
              {
                q: "Are electric/eco-friendly rides more expensive?",
                a: "Electric vehicle (EV) rides are typically 10-15% cheaper than petrol/diesel rides due to lower fuel costs. You also earn green reward points for every eco-friendly ride, which can be redeemed for discounts. It's better for both your wallet and the environment!"
              },
              {
                q: "How is my payment information protected?",
                a: "We use industry-standard 256-bit SSL encryption and PCI-DSS compliant payment gateways for all transactions. Your payment data is tokenized and never stored on our servers. We're fully compliant with RBI guidelines and India's Personal Data Protection regulations."
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="glass-panel border border-white/10 overflow-hidden"
              >
                <motion.button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors duration-150"
                >
                  <h3 className="text-lg font-semibold text-left">{faq.q}</h3>
                  <motion.div
                    animate={{ rotate: expandedFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </motion.button>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: expandedFaq === idx ? "auto" : 0,
                    opacity: expandedFaq === idx ? 1 : 0
                  }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <p className="px-6 py-4 text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Ready to <span className="text-primary">Transform</span> Your Commute?
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Join thousands of Indians who are already experiencing smarter, safer, and eco-friendly rides.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="relative bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 hover:from-primary/90 hover:via-emerald-400/90 hover:to-cyan-400/90 text-black font-bold text-lg h-14 px-10 shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-shadow duration-150"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Your Journey
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-bold text-base h-14 px-10 border-primary/30 hover:border-primary/60"
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Zap className="text-black w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-bold">
                SmartRide<span className="text-primary">.ai</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>AI-Powered Mobility Platform</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground/70">
              {CITY_LIST.map((city, index) => (
                <span key={city.key}>
                  {city.emoji} {city.name}
                  {index < CITY_LIST.length - 1 && " •"}
                </span>
              ))}
            </div>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <p className="text-xs text-primary font-semibold">Powered by Advanced ML & Real-Time Analytics</p>
            </motion.div>

            <p className="text-xs text-muted-foreground/50">
              © 2026 SmartRide.ai • All Rights Reserved
            </p>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
