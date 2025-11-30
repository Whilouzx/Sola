import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface FuturisticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'neon' | 'gradient'
  hover?: boolean
  glow?: boolean
}

const FuturisticCard = React.forwardRef<HTMLDivElement, FuturisticCardProps>(
  ({ className, variant = 'default', hover = true, glow = false, children, ...props }, ref) => {
    const baseClasses = "rounded-xl border transition-all duration-300 relative overflow-hidden"
    
    const variants = {
      default: "bg-card text-card-foreground border-border shadow-lg",
      glass: "bg-white/5 backdrop-blur-xl border-white/10 text-white shadow-2xl",
      neon: "bg-gray-900/50 border-cyan-500/50 text-cyan-100 shadow-lg shadow-cyan-500/20",
      gradient: "bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30 text-white"
    }

    const hoverClasses = hover ? "hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]" : ""
    const glowClasses = glow ? "shadow-lg shadow-cyan-500/25 animate-pulse" : ""

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border transition-all duration-300 relative overflow-hidden border-white/10 shadow-2xl hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] p-8 backdrop-blur-xl bg-[#FFFFFF0D] rounded-[12px] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[32px] pr-[32px] pb-[32px] pl-[32px] font-normal opacity-100 text-[#FFFFFF]"
        {...props}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#020817]" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
)

FuturisticCard.displayName = "FuturisticCard"

export { FuturisticCard }

