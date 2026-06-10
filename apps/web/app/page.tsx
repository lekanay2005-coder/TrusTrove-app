'use client';

import React from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/shared/PageLayout';
import { Layers, Landmark, ArrowRight, Shield, Activity, DollarSign } from 'lucide-react';

export default function Home() {
  return (
    <PageLayout>
      <div className="space-y-16 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Stellar Soroban Mainnet Beta</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight">
            Decentralized Trade Finance <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-400">
              Powered by Stellar
            </span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            SMEs tokenize unpaid invoices as Stellar assets for immediate USDC funding. Liquidity providers deposit USDC to earn yield from discount fees.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href="/sme"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-900/20"
            >
              Get Financing (SME) <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/lp"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              Provide Liquidity (LP)
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent hover:bg-slate-900/30 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all duration-300"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-sm p-8 rounded-2xl hover:border-slate-700/80 transition-all duration-300 group">
            <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl w-fit text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Invoice Tokenization</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tokenize outstanding commercial invoices as on-chain Stellar assets. Fully secure and cryptographically verifiable.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-sm p-8 rounded-2xl hover:border-slate-700/80 transition-all duration-300 group">
            <div className="bg-emerald-600/10 border border-emerald-500/20 p-3 rounded-xl w-fit text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Liquidity</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Skip 30-90 day payment terms. Get funded instantly in USDC at a small discount directly from our decentralized liquidity pool.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-sm p-8 rounded-2xl hover:border-slate-700/80 transition-all duration-300 group">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-xl w-fit text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Contract Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Soroban smart contracts handle listing validation, escrow management, and repayment settlement without intermediaries.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
